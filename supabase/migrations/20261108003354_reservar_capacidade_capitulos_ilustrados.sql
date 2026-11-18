-- Fase 2B: reserva de capacidade, sem conceder upload ou finalizacao.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

alter table historietas_privado.capitulo_uploads_pendentes
  add column chave_requisicao uuid not null default gen_random_uuid(),
  add column tamanho_reservado bigint not null default 2097152
    constraint capitulo_reserva_tamanho_fixo check (tamanho_reservado = 2097152),
  add column liberado_em timestamptz,
  add constraint capitulo_reserva_requisicao_key unique (user_id, chave_requisicao);

-- Uma reserva pode preceder a conversao de um draft de texto. Isso NAO muda
-- tipo_conteudo nem habilita paginas no manifesto de um capitulo de texto.
create or replace function historietas_privado.validar_referencia_pagina_capitulo()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  v_autor uuid;
  v_tipo text;
  v_prefixo text;
begin
  select user_id, tipo_conteudo into v_autor, v_tipo
  from public.capitulos where id = new.capitulo_id for update;
  if not found then raise exception 'Capitulo inexistente.' using errcode = '23503'; end if;
  v_prefixo := v_autor::text || '/capitulos/' || new.capitulo_id::text || '/' || new.id::text;
  if tg_table_name = 'capitulo_paginas' then
    if v_tipo <> 'imagens' then
      raise exception 'Paginas exigem capitulo do tipo imagens.' using errcode = '23514';
    end if;
    if new.storage_path <> v_prefixo || (case new.mime_type
      when 'image/jpeg' then '.jpg' when 'image/png' then '.png' else '.webp' end) then
      raise exception 'Caminho privado invalido.' using errcode = '23514';
    end if;
    if tg_op = 'UPDATE' and
      (new.id, new.capitulo_id, new.storage_path, new.largura, new.altura,
        new.tamanho_bytes, new.mime_type, new.criado_em)
      is distinct from (old.id, old.capitulo_id, old.storage_path, old.largura, old.altura,
        old.tamanho_bytes, old.mime_type, old.criado_em) then
      raise exception 'Identidade e arquivo da pagina sao imutaveis.' using errcode = '23514';
    end if;
  else
    if new.user_id <> v_autor or new.storage_path not in
      (v_prefixo || '.jpg', v_prefixo || '.png', v_prefixo || '.webp') then
      raise exception 'Reserva fora do prefixo do autor.' using errcode = '23514';
    end if;
    if tg_op = 'UPDATE' and (new.id, new.capitulo_id, new.user_id, new.storage_path,
      new.criado_em, new.chave_requisicao, new.tamanho_reservado, new.versao_esperada, new.expira_em)
      is distinct from (old.id, old.capitulo_id, old.user_id, old.storage_path,
      old.criado_em, old.chave_requisicao, old.tamanho_reservado, old.versao_esperada, old.expira_em) then
      raise exception 'A identidade da reserva e imutavel.' using errcode = '23514';
    end if;
    if tg_op = 'UPDATE' and old.liberado_em is not null
      and new.liberado_em is distinct from old.liberado_em then
      raise exception 'Reserva liberada nao pode ser reativada.' using errcode = '23514';
    end if;
  end if;
  if exists (select 1 from historietas_privado.capitulo_arquivos_limpeza
    where storage_path = new.storage_path) then
    raise exception 'Caminho ja destinado a limpeza.' using errcode = '23514';
  end if;
  return new;
end;
$$;

-- Ledger privado: objetos sem metadata continuam reservando o maximo do bucket.
-- No mesmo caminho, cobra o MAIOR tamanho (objeto/reserva), mas so UM objeto.
-- Expirar/liberar nao subtrai arquivos fisicos; eles permanecem no ledger.
create function historietas_privado.objetos_storage_com_reservas()
returns table(id uuid, bucket_id text, name text, metadata jsonb)
language sql volatile security invoker set search_path = '' as $$
  with reservas as (
    select storage_path, tamanho_reservado
    from historietas_privado.capitulo_uploads_pendentes
    where liberado_em is null and expira_em > statement_timestamp()
  )
  select o.id, o.bucket_id, o.name,
    jsonb_build_object('size', greatest(
      case when pg_catalog.pg_input_is_valid(coalesce(o.metadata->>'size', ''), 'pg_catalog.int8')
        and coalesce(o.metadata->>'size', '') not like '-%'
        then (o.metadata->>'size')::bigint
        else case o.bucket_id when 'avatars' then 1048576 when 'capas-obras' then 2097152 else 5242880 end
      end, coalesce(r.tamanho_reservado, 0)))
  from storage.objects o left join reservas r
    on o.bucket_id = 'arquivos-obras' and r.storage_path = o.name
  where o.bucket_id in ('avatars', 'capas-obras', 'arquivos-obras')
  union all
  select null::uuid, 'arquivos-obras', r.storage_path,
    jsonb_build_object('size', r.tamanho_reservado)
  from reservas r where not exists (select 1 from storage.objects o
    where o.bucket_id = 'arquivos-obras' and o.name = r.storage_path);
$$;
revoke all on function historietas_privado.objetos_storage_com_reservas()
  from public, anon, authenticated, service_role;

-- Nucleo privilegiado privado: nunca recebe user_id, caminho ou tamanho do cliente.
-- O JWT autenticado define a identidade; a propriedade vem das tabelas reais.
create function historietas_privado.reservar_pagina_capitulo(
  p_capitulo_id uuid, p_versao_esperada bigint, p_chave_requisicao uuid, p_mime_type text
)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_cap public.capitulos;
  v_obra_id uuid;
  v_reserva historietas_privado.capitulo_uploads_pendentes;
  v_id uuid := gen_random_uuid();
  v_ext text;
begin
  if v_uid is null then raise exception 'Autenticacao necessaria.' using errcode = '42501'; end if;
  v_ext := case p_mime_type when 'image/jpeg' then '.jpg' when 'image/png' then '.png'
    when 'image/webp' then '.webp' end;
  if p_chave_requisicao is null or p_versao_esperada is null or p_versao_esperada < 0 or v_ext is null then
    raise exception 'Reserva invalida.' using errcode = '22023';
  end if;
  -- Mesmo lock das policies legadas; SELECTs seguintes usam snapshots novos.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('historietas:storage:cota:v1', 0));
  -- Pai antes do filho, mesma ordem da exclusao em cascata da obra.
  select obra_id into v_obra_id from public.capitulos where id = p_capitulo_id and user_id = v_uid;
  perform 1 from public.obras where id = v_obra_id and user_id = v_uid for share;
  if not found then raise exception 'Capitulo indisponivel para esta conta.' using errcode = '42501'; end if;
  select * into v_cap from public.capitulos
    where id = p_capitulo_id and user_id = v_uid and obra_id = v_obra_id for update;
  if not found then raise exception 'Capitulo indisponivel para esta conta.' using errcode = '42501'; end if;
  if v_cap.versao_paginas <> p_versao_esperada then
    -- Conflito de versao da aplicacao, NAO falha de serializacao 40001:
    -- PostgREST pode repetir automaticamente 40001 sem que o cliente intervenha.
    raise exception 'Versao do manifesto desatualizada.' using errcode = 'PT409';
  end if;
  if v_cap.tipo_conteudo = 'texto' and v_cap.publicado then
    raise exception 'Reserva ilustrada exige draft ou capitulo ilustrado.' using errcode = '22023';
  end if;
  select * into v_reserva from historietas_privado.capitulo_uploads_pendentes
    where user_id = v_uid and chave_requisicao = p_chave_requisicao;
  if found then
    if v_reserva.capitulo_id <> p_capitulo_id or v_reserva.versao_esperada <> p_versao_esperada
      or right(v_reserva.storage_path, length(v_ext)) <> v_ext then
      raise exception 'Chave de requisicao reutilizada com outros parametros.' using errcode = '22023';
    end if;
    if v_reserva.liberado_em is not null or v_reserva.expira_em <= statement_timestamp() then
      raise exception 'Reserva encerrada; use uma nova chave.' using errcode = '55000';
    end if;
  else
    -- Limite de pendencias por capitulo; substituicoes continuam contando junto
    -- com os arquivos antigos ate a futura limpeza efetiva via Storage API.
    if (select count(*) from historietas_privado.capitulo_uploads_pendentes
      where capitulo_id = p_capitulo_id and liberado_em is null and expira_em > statement_timestamp()) >= 10 then
      raise exception 'Limite de reservas do capitulo atingido.' using errcode = '54000';
    end if;
    -- Limita tambem o churn de tombstones sem criar infraestrutura de rate limit.
    if (select count(*) from historietas_privado.capitulo_uploads_pendentes
      where user_id = v_uid and criado_em > statement_timestamp() - interval '24 hours') >= 100 then
      raise exception 'Limite diario de reservas atingido.' using errcode = '54000';
    end if;
    if not historietas_privado.upload_storage_dentro_cota('arquivos-obras',
      v_uid::text || '/capitulos/' || p_capitulo_id::text || '/' || v_id::text || v_ext,
      '2097152', null) then
      raise exception 'Capacidade de Storage indisponivel.' using errcode = '54000';
    end if;
    insert into historietas_privado.capitulo_uploads_pendentes
      (id, capitulo_id, user_id, storage_path, versao_esperada, chave_requisicao, expira_em)
    values (v_id, p_capitulo_id, v_uid,
      v_uid::text || '/capitulos/' || p_capitulo_id::text || '/' || v_id::text || v_ext,
      p_versao_esperada, p_chave_requisicao, now() + interval '15 minutes')
    returning * into v_reserva;
  end if;
  -- Nao retorna URL, caminho ou capacidade de upload. MIME e apenas intencao:
  -- o servidor futuro ainda devera validar os bytes com o validador da fase 2A.
  return jsonb_build_object('reservaId', v_reserva.id, 'expiraEm', v_reserva.expira_em,
    'tamanhoReservado', v_reserva.tamanho_reservado, 'versaoEsperada', v_reserva.versao_esperada);
end;
$$;

create function historietas_privado.liberar_reserva_pagina_capitulo(p_reserva_id uuid)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'Autenticacao necessaria.' using errcode = '42501'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('historietas:storage:cota:v1', 0));
  perform 1 from public.capitulos c where c.id = (
    select r.capitulo_id from historietas_privado.capitulo_uploads_pendentes r
    where r.id = p_reserva_id and r.user_id = v_uid
  ) for update;
  -- Ausente/terceiro ja e no-op, sem informar se a reserva de outra conta existe.
  update historietas_privado.capitulo_uploads_pendentes set liberado_em = statement_timestamp()
    where id = p_reserva_id and user_id = v_uid and liberado_em is null;
  -- Guarda somente o caminho para uma futura limpeza, nunca remove objetos.
  insert into historietas_privado.capitulo_arquivos_limpeza(storage_path, motivo)
    select r.storage_path, 'upload_descartado'
    from historietas_privado.capitulo_uploads_pendentes r
    where r.id = p_reserva_id and r.user_id = v_uid
      and not exists (select 1 from public.capitulo_paginas p where p.storage_path = r.storage_path)
    on conflict (storage_path) do nothing;
end;
$$;

create function public.reservar_pagina_capitulo(
  p_capitulo_id uuid, p_versao_esperada bigint, p_chave_requisicao uuid, p_mime_type text
)
returns jsonb language sql volatile security invoker set search_path = '' as $$
  select historietas_privado.reservar_pagina_capitulo(p_capitulo_id, p_versao_esperada, p_chave_requisicao, p_mime_type);
$$;
create function public.liberar_reserva_pagina_capitulo(p_reserva_id uuid)
returns void language sql volatile security invoker set search_path = '' as $$
  select historietas_privado.liberar_reserva_pagina_capitulo(p_reserva_id);
$$;

alter function historietas_privado.reservar_pagina_capitulo(uuid,bigint,uuid,text) owner to postgres;
alter function historietas_privado.liberar_reserva_pagina_capitulo(uuid) owner to postgres;
revoke all on function historietas_privado.reservar_pagina_capitulo(uuid,bigint,uuid,text) from public, anon, authenticated, service_role;
revoke all on function historietas_privado.liberar_reserva_pagina_capitulo(uuid) from public, anon, authenticated, service_role;
revoke all on function public.reservar_pagina_capitulo(uuid,bigint,uuid,text) from public, anon, authenticated, service_role;
revoke all on function public.liberar_reserva_pagina_capitulo(uuid) from public, anon, authenticated, service_role;
grant execute on function historietas_privado.reservar_pagina_capitulo(uuid,bigint,uuid,text) to authenticated;
grant execute on function historietas_privado.liberar_reserva_pagina_capitulo(uuid) to authenticated;
grant execute on function public.reservar_pagina_capitulo(uuid,bigint,uuid,text) to authenticated;
grant execute on function public.liberar_reserva_pagina_capitulo(uuid) to authenticated;

comment on table historietas_privado.capitulo_uploads_pendentes is
  'Fase 2B: reserva conservadora de 2 MiB/objeto por 15 min; ledger ignora expiradas/liberadas, mas sempre conta arquivos existentes. Sem upload/finalizacao. Tombstones preservam idempotencia; futura retencao deve preservar caminhos na outbox.';

-- Atualizacao do helper legado abaixo: apenas sua fonte de contabilizacao muda.
create or replace function historietas_privado.upload_storage_dentro_cota(
  p_bucket_id text,
  p_nome text,
  p_tamanho_texto text,
  p_objeto_id uuid
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid := (select auth.uid());
  v_prefixo_usuario text;
  v_tamanho_novo bigint;
  v_limite_arquivo bigint;
  v_limite_objetos_bucket bigint;
  v_objeto_anterior_encontrado boolean := false;
  v_bucket_anterior text;
  v_tamanho_anterior bigint := 0;
  v_bytes_globais bigint := 0;
  v_objetos_globais bigint := 0;
  v_bytes_usuario bigint := 0;
  v_objetos_usuario bigint := 0;
  v_objetos_bucket_usuario bigint := 0;
  v_bytes_globais_projetados bigint;
  v_objetos_globais_projetados bigint;
  v_bytes_usuario_projetados bigint;
  v_objetos_usuario_projetados bigint;
  v_objetos_bucket_projetados bigint;
  v_limite_bytes_global constant bigint := 700 * 1024 * 1024;
  v_limite_objetos_global constant bigint := 5000;
  v_limite_bytes_usuario constant bigint := 100 * 1024 * 1024;
  v_limite_objetos_usuario constant bigint := 100;
begin
  if v_usuario_id is null
    or p_bucket_id is null
    or p_bucket_id <> all (
      array['avatars', 'capas-obras', 'arquivos-obras']::text[]
    )
    or nullif(p_nome, '') is null
    or char_length(p_nome) > 1024
    or (storage.foldername(p_nome))[1] is distinct from v_usuario_id::text
  then
    return false;
  end if;

  select
    limites.limite_arquivo,
    limites.limite_objetos
  into
    v_limite_arquivo,
    v_limite_objetos_bucket
  from (
    values
      ('avatars'::text, 1::bigint * 1024 * 1024, 5::bigint),
      ('capas-obras'::text, 2::bigint * 1024 * 1024, 60::bigint),
      ('arquivos-obras'::text, 5::bigint * 1024 * 1024, 30::bigint)
  ) as limites(bucket_id, limite_arquivo, limite_objetos)
  where limites.bucket_id = p_bucket_id;

  -- O Storage reserva o nome antes de concluir a transferência e pode fazer o
  -- primeiro INSERT com metadata nula. Nesse estágio reservamos o tamanho
  -- máximo do bucket; quando a metadata real chega, a UPDATE reduz a reserva.
  if pg_catalog.pg_input_is_valid(
    coalesce(p_tamanho_texto, ''),
    'pg_catalog.int8'
  ) then
    v_tamanho_novo := p_tamanho_texto::bigint;
  else
    v_tamanho_novo := v_limite_arquivo;
  end if;

  if v_tamanho_novo < 0 or v_tamanho_novo > v_limite_arquivo then
    return false;
  end if;

  v_prefixo_usuario := v_usuario_id::text || '/%';

  -- Uma única trava curta serializa a decisão global. Ela cobre apenas a
  -- transação de metadados feita pelo Storage, não a transferência do arquivo.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('historietas:storage:cota:v1', 0)
  );

  -- Uma eventual escrita no caminho reservado nao pode diminuir a capacidade
  -- ainda comprometida antes da finalizacao. O namespace segue bloqueado.
  select greatest(v_tamanho_novo, coalesce(max(r.tamanho_reservado), 0))
    into v_tamanho_novo from historietas_privado.capitulo_uploads_pendentes r
    where p_bucket_id = 'arquivos-obras' and r.storage_path = p_nome
      and r.liberado_em is null and r.expira_em > statement_timestamp();

  if p_objeto_id is not null then
    select
      objeto.bucket_id,
      case
        when pg_catalog.pg_input_is_valid(
          coalesce(objeto.metadata->>'size', ''),
          'pg_catalog.int8'
        )
        then (objeto.metadata->>'size')::bigint
        else case objeto.bucket_id
          when 'avatars' then 1::bigint * 1024 * 1024
          when 'capas-obras' then 2::bigint * 1024 * 1024
          when 'arquivos-obras' then 5::bigint * 1024 * 1024
        end
      end
    into v_bucket_anterior, v_tamanho_anterior
    from historietas_privado.objetos_storage_com_reservas() as objeto
    where objeto.id = p_objeto_id
      and objeto.bucket_id = any (
        array['avatars', 'capas-obras', 'arquivos-obras']::text[]
      )
      and objeto.name like v_prefixo_usuario
    limit 1;
  else
    -- O upsert do Storage começa como INSERT. Procurar também por bucket/nome
    -- permite contabilizar a substituição sem tratá-la como um objeto novo.
    select
      objeto.bucket_id,
      case
        when pg_catalog.pg_input_is_valid(
          coalesce(objeto.metadata->>'size', ''),
          'pg_catalog.int8'
        )
        then (objeto.metadata->>'size')::bigint
        else case objeto.bucket_id
          when 'avatars' then 1::bigint * 1024 * 1024
          when 'capas-obras' then 2::bigint * 1024 * 1024
          when 'arquivos-obras' then 5::bigint * 1024 * 1024
        end
      end
    into v_bucket_anterior, v_tamanho_anterior
    from historietas_privado.objetos_storage_com_reservas() as objeto
    where objeto.bucket_id = p_bucket_id
      and objeto.name = p_nome
      and objeto.name like v_prefixo_usuario
    limit 1;
  end if;

  v_objeto_anterior_encontrado := found;

  select
    count(*)::bigint,
    coalesce(sum(
      case
        when pg_catalog.pg_input_is_valid(
          coalesce(objeto.metadata->>'size', ''),
          'pg_catalog.int8'
        )
        then (objeto.metadata->>'size')::bigint
        else case objeto.bucket_id
          when 'avatars' then 1::bigint * 1024 * 1024
          when 'capas-obras' then 2::bigint * 1024 * 1024
          when 'arquivos-obras' then 5::bigint * 1024 * 1024
        end
      end
    ), 0)::bigint
  into v_objetos_globais, v_bytes_globais
  from historietas_privado.objetos_storage_com_reservas() as objeto
  where objeto.bucket_id = any (
    array['avatars', 'capas-obras', 'arquivos-obras']::text[]
  );

  select
    count(*)::bigint,
    coalesce(sum(
      case
        when pg_catalog.pg_input_is_valid(
          coalesce(objeto.metadata->>'size', ''),
          'pg_catalog.int8'
        )
        then (objeto.metadata->>'size')::bigint
        else case objeto.bucket_id
          when 'avatars' then 1::bigint * 1024 * 1024
          when 'capas-obras' then 2::bigint * 1024 * 1024
          when 'arquivos-obras' then 5::bigint * 1024 * 1024
        end
      end
    ), 0)::bigint
  into v_objetos_usuario, v_bytes_usuario
  from historietas_privado.objetos_storage_com_reservas() as objeto
  where objeto.bucket_id = any (
      array['avatars', 'capas-obras', 'arquivos-obras']::text[]
    )
    and objeto.name like v_prefixo_usuario;

  select count(*)::bigint
  into v_objetos_bucket_usuario
  from historietas_privado.objetos_storage_com_reservas() as objeto
  where objeto.bucket_id = p_bucket_id
    and objeto.name like v_prefixo_usuario;

  v_bytes_globais_projetados :=
    v_bytes_globais
    - case when v_objeto_anterior_encontrado then v_tamanho_anterior else 0 end
    + v_tamanho_novo;
  v_objetos_globais_projetados :=
    v_objetos_globais
    + case when v_objeto_anterior_encontrado then 0 else 1 end;

  v_bytes_usuario_projetados :=
    v_bytes_usuario
    - case when v_objeto_anterior_encontrado then v_tamanho_anterior else 0 end
    + v_tamanho_novo;
  v_objetos_usuario_projetados :=
    v_objetos_usuario
    + case when v_objeto_anterior_encontrado then 0 else 1 end;

  v_objetos_bucket_projetados :=
    v_objetos_bucket_usuario
    - case
        when v_objeto_anterior_encontrado
          and v_bucket_anterior = p_bucket_id
        then 1
        else 0
      end
    + 1;

  -- Se uma instalação já estiver acima de um teto, ainda permitimos apenas
  -- substituições que não aumentem o uso. Assim o usuário pode reduzir dados.
  if v_bytes_globais_projetados > v_limite_bytes_global
    and not (
      v_objeto_anterior_encontrado
      and v_bytes_globais_projetados <= v_bytes_globais
    )
  then
    return false;
  end if;

  if v_objetos_globais_projetados > v_limite_objetos_global
    and not (
      v_objeto_anterior_encontrado
      and v_objetos_globais_projetados <= v_objetos_globais
    )
  then
    return false;
  end if;

  if v_bytes_usuario_projetados > v_limite_bytes_usuario
    and not (
      v_objeto_anterior_encontrado
      and v_bytes_usuario_projetados <= v_bytes_usuario
    )
  then
    return false;
  end if;

  if v_objetos_usuario_projetados > v_limite_objetos_usuario
    and not (
      v_objeto_anterior_encontrado
      and v_objetos_usuario_projetados <= v_objetos_usuario
    )
  then
    return false;
  end if;

  if v_objetos_bucket_projetados > v_limite_objetos_bucket
    and not (
      v_objeto_anterior_encontrado
      and v_bucket_anterior = p_bucket_id
      and v_objetos_bucket_projetados <= v_objetos_bucket_usuario
    )
  then
    return false;
  end if;

  return true;
end;
$$;

notify pgrst, 'reload schema';
commit;
