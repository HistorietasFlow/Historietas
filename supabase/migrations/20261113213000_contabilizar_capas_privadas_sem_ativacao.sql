-- Projecao conservadora do quarto bucket, sem criar bucket ou habilitar IO.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
set local search_path = '';

-- Sem produtor ou permissao externa nesta fase. Reservas incertas nao expiram.
create table historietas_privado.capa_upload_retencoes (
  id uuid primary key,
  obra_id uuid not null,
  usuario_id uuid not null,
  geracao uuid not null,
  asset_id uuid not null unique,
  storage_path text not null unique,
  tamanho_reservado bigint not null default 2097152 check(tamanho_reservado = 2097152),
  estado text not null check(estado in ('reservada','transferindo','incerta','confirmada')),
  criada_em timestamptz not null default clock_timestamp(),
  check(storage_path ~ ('^' || usuario_id::text || '/' || geracao::text || '/' ||
    asset_id::text || '\.(jpg|png|webp)$'))
);
alter table historietas_privado.capa_upload_retencoes enable row level security;
revoke all on table historietas_privado.capa_upload_retencoes from public, anon, authenticated, service_role;
comment on table historietas_privado.capa_upload_retencoes is
  'Retencao conservadora sem produtor ou grants externos; nao liberar por logout, lease ou resposta perdida.';

-- Visao do ledger: objeto + retencao no mesmo caminho cobra apenas o maior valor.
create or replace function historietas_privado.objetos_storage_com_reservas()
returns table(id uuid, bucket_id text, name text, metadata jsonb)
language sql volatile security invoker set search_path = '' as $$
  with compromissos as (
    select storage_path, max(tamanho_reservado) tamanho_reservado from (
      select storage_path, tamanho_reservado from historietas_privado.capitulo_uploads_pendentes
      where liberado_em is null and expira_em > statement_timestamp()
      union all
      select storage_path, tamanho_reservado from historietas_privado.capitulo_upload_tentativas
      where estado <> 'cancelada_sem_envio'
    ) capacidade group by storage_path
  ), capas as (
    select storage_path, max(tamanho_reservado) tamanho_reservado
    from historietas_privado.capa_upload_retencoes group by storage_path
  )
  select o.id, o.bucket_id, o.name, jsonb_build_object('size', greatest(
    case when pg_catalog.pg_input_is_valid(coalesce(o.metadata->>'size',''), 'pg_catalog.int8')
      and coalesce(o.metadata->>'size','') not like '-%' then (o.metadata->>'size')::bigint
      else case o.bucket_id when 'avatars' then 1048576 when 'capas-obras' then 2097152 when 'capas-obras-privadas' then 2097152 else 5242880 end
    end, coalesce(c.tamanho_reservado,0), coalesce(p.tamanho_reservado,0)))
  from storage.objects o left join compromissos c on o.bucket_id='arquivos-obras' and c.storage_path=o.name
  left join capas p on o.bucket_id='capas-obras-privadas' and p.storage_path=o.name
  where o.bucket_id in ('avatars','capas-obras','capas-obras-privadas','arquivos-obras')
  union all
  select null::uuid, 'arquivos-obras', c.storage_path, jsonb_build_object('size',c.tamanho_reservado)
  from compromissos c where not exists (select 1 from storage.objects o
    where o.bucket_id='arquivos-obras' and o.name=c.storage_path)
  union all
  select null::uuid, 'capas-obras-privadas', p.storage_path,
    jsonb_build_object('size',p.tamanho_reservado)
  from capas p where not exists (select 1 from storage.objects o
    where o.bucket_id='capas-obras-privadas' and o.name=p.storage_path);
$$;

-- O helper existente conserva a admissao dos 3 buckets; contas globais e
-- teto compartilhado de 60 capas agora consideram tambem o bucket privado.
-- A trava historietas:storage:cota:v1 e todas as demais policies permanecem.
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
          when 'capas-obras-privadas' then 2::bigint * 1024 * 1024
          when 'arquivos-obras' then 5::bigint * 1024 * 1024
        end
      end
    into v_bucket_anterior, v_tamanho_anterior
    from historietas_privado.objetos_storage_com_reservas() as objeto
    where objeto.id = p_objeto_id
      and objeto.bucket_id = any (
        array['avatars', 'capas-obras', 'capas-obras-privadas', 'arquivos-obras']::text[]
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
          when 'capas-obras-privadas' then 2::bigint * 1024 * 1024
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
          when 'capas-obras-privadas' then 2::bigint * 1024 * 1024
          when 'arquivos-obras' then 5::bigint * 1024 * 1024
        end
      end
    ), 0)::bigint
  into v_objetos_globais, v_bytes_globais
  from historietas_privado.objetos_storage_com_reservas() as objeto
  where objeto.bucket_id = any (
    array['avatars', 'capas-obras', 'capas-obras-privadas', 'arquivos-obras']::text[]
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
          when 'capas-obras-privadas' then 2::bigint * 1024 * 1024
          when 'arquivos-obras' then 5::bigint * 1024 * 1024
        end
      end
    ), 0)::bigint
  into v_objetos_usuario, v_bytes_usuario
  from historietas_privado.objetos_storage_com_reservas() as objeto
  where objeto.bucket_id = any (
      array['avatars', 'capas-obras', 'capas-obras-privadas', 'arquivos-obras']::text[]
    )
    and objeto.name like v_prefixo_usuario;

  select count(*)::bigint
  into v_objetos_bucket_usuario
  from historietas_privado.objetos_storage_com_reservas() as objeto
  where (objeto.bucket_id = p_bucket_id
    or (p_bucket_id = 'capas-obras' and objeto.bucket_id = 'capas-obras-privadas'))
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
