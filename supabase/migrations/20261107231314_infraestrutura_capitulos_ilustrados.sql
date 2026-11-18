-- Fase 1: somente contrato. Nenhum endpoint, upload ou finalizador é habilitado.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $$
begin
  if not exists (select 1 from storage.buckets where id = 'arquivos-obras' and not public) then
    raise exception 'O bucket arquivos-obras deve continuar privado.';
  end if;
  if exists (select 1 from storage.objects where bucket_id = 'arquivos-obras'
    and (storage.foldername(name))[2] = 'capitulos') then
    raise exception 'Namespace capitulos ja ocupado; revisar anexos antes de aplicar.';
  end if;
end;
$$;

-- Policies permissivas legadas continuam intactas. O namespace novo fica
-- fechado ate existir upload/finalizacao controlados; nao libera listagem.
create policy capitulo_paginas_storage_insert_bloqueado on storage.objects
as restrictive for insert to authenticated with check (
  bucket_id <> 'arquivos-obras' or (storage.foldername(name))[2] is distinct from 'capitulos'
);
create policy capitulo_paginas_storage_update_bloqueado on storage.objects
as restrictive for update to authenticated using (
  bucket_id <> 'arquivos-obras' or (storage.foldername(name))[2] is distinct from 'capitulos'
) with check (
  bucket_id <> 'arquivos-obras' or (storage.foldername(name))[2] is distinct from 'capitulos'
);
create policy capitulo_paginas_storage_delete_bloqueado on storage.objects
as restrictive for delete to authenticated using (
  bucket_id <> 'arquivos-obras' or (storage.foldername(name))[2] is distinct from 'capitulos'
);

alter table public.capitulos
  add column tipo_conteudo text not null default 'texto'
    constraint capitulos_tipo_conteudo_check check (tipo_conteudo in ('texto', 'imagens')),
  add column versao_paginas bigint not null default 0
    constraint capitulos_versao_paginas_check check (versao_paginas >= 0);

create table public.capitulo_paginas (
  id uuid primary key default gen_random_uuid(),
  capitulo_id uuid not null references public.capitulos(id) on delete cascade,
  ordem integer not null check (ordem between 1 and 10),
  storage_path text not null unique check (char_length(storage_path) <= 200),
  largura integer not null check (largura between 1 and 2048),
  altura integer not null check (altura between 1 and 4096),
  tamanho_bytes bigint not null check (tamanho_bytes between 1 and 2097152),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  descricao text not null check (char_length(btrim(descricao)) between 1 and 2000),
  criado_em timestamptz not null default now(),
  constraint capitulo_paginas_pixels_check check (largura::bigint * altura <= 8000000),
  constraint capitulo_paginas_ordem_key unique (capitulo_id, ordem) deferrable initially deferred
);

alter table public.capitulo_paginas enable row level security;
revoke all on table public.capitulo_paginas from public, anon, authenticated, service_role;
-- Caminhos privados não fazem parte da projeção pública da Data API.
grant select (id, capitulo_id, ordem, largura, altura, tamanho_bytes, mime_type, descricao, criado_em)
  on table public.capitulo_paginas to anon, authenticated;
grant select on table public.capitulo_paginas to service_role;

create policy capitulo_paginas_select_capitulo_visivel on public.capitulo_paginas
for select to anon, authenticated using (
  exists (
    select 1 from public.capitulos capitulo
    join public.obras obra on obra.id = capitulo.obra_id
    where capitulo.id = capitulo_paginas.capitulo_id
      and capitulo.tipo_conteudo = 'imagens'
      and capitulo.user_id = obra.user_id
      and (
        obra.user_id = (select auth.uid())
        or (capitulo.publicado is true and obra.publicado is true
          and obra.classificacao_indicativa in ('Livre', '10+', '12+', '14+', '16+'))
      )
  )
);

-- Reservas e outbox não são expostos pela Data API nem operáveis por service_role
-- nesta fase. A futura finalização deverá conferir bytes, quotas e identidade.
create table historietas_privado.capitulo_uploads_pendentes (
  id uuid primary key default gen_random_uuid(),
  capitulo_id uuid not null references public.capitulos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique check (char_length(storage_path) <= 200),
  versao_esperada bigint not null check (versao_esperada >= 0),
  estado text not null default 'reservado' check (estado in ('reservado', 'recebido', 'validado')),
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null default (now() + interval '24 hours'),
  check (expira_em > criado_em and expira_em <= criado_em + interval '24 hours')
);
create index capitulo_uploads_pendentes_capitulo_idx
  on historietas_privado.capitulo_uploads_pendentes(capitulo_id);
create index capitulo_uploads_pendentes_usuario_idx
  on historietas_privado.capitulo_uploads_pendentes(user_id);
create index capitulo_uploads_pendentes_expiracao_idx
  on historietas_privado.capitulo_uploads_pendentes(expira_em);

-- Sem FK para capítulo/usuário: a referência precisa sobreviver à exclusão deles.
create table historietas_privado.capitulo_arquivos_limpeza (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null default 'arquivos-obras' check (bucket_id = 'arquivos-obras'),
  storage_path text not null unique check (
    storage_path ~ '^[0-9a-f-]{36}/capitulos/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'
  ),
  motivo text not null check (motivo in ('pagina_removida', 'upload_descartado')),
  estado text not null default 'pendente' check (estado in ('pendente', 'processando', 'concluido')),
  tentativas integer not null default 0 check (tentativas >= 0),
  proxima_tentativa_em timestamptz not null default now(),
  bloqueado_ate timestamptz,
  ultimo_erro_codigo text check (char_length(ultimo_erro_codigo) <= 80),
  criado_em timestamptz not null default now(),
  concluido_em timestamptz,
  check ((estado = 'concluido') = (concluido_em is not null))
);
create index capitulo_arquivos_limpeza_pendente_idx
  on historietas_privado.capitulo_arquivos_limpeza(proxima_tentativa_em)
  where estado <> 'concluido';

alter table historietas_privado.capitulo_uploads_pendentes enable row level security;
alter table historietas_privado.capitulo_arquivos_limpeza enable row level security;
revoke all on table historietas_privado.capitulo_uploads_pendentes
  from public, anon, authenticated, service_role;
revoke all on table historietas_privado.capitulo_arquivos_limpeza
  from public, anon, authenticated, service_role;

create function historietas_privado.proteger_contrato_capitulo_ilustrado()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if current_user not in ('postgres', 'service_role')
      and (new.tipo_conteudo <> 'texto' or new.versao_paginas <> 0) then
      raise exception 'Finalizacao ilustrada ainda nao habilitada.' using errcode = '42501';
    end if;
  else
    if current_user not in ('postgres', 'service_role')
      and (new.tipo_conteudo is distinct from old.tipo_conteudo
        or new.versao_paginas is distinct from old.versao_paginas) then
      raise exception 'Finalizacao ilustrada ainda nao habilitada.' using errcode = '42501';
    end if;
    if new.versao_paginas < old.versao_paginas then
      raise exception 'A versao do manifesto nao pode regredir.' using errcode = '23514';
    end if;
    if new.tipo_conteudo is distinct from old.tipo_conteudo then
      new.versao_paginas := greatest(new.versao_paginas, old.versao_paginas + 1);
    end if;
    if (new.id, new.obra_id, new.user_id, new.tipo_conteudo)
      is distinct from (old.id, old.obra_id, old.user_id, old.tipo_conteudo)
      and exists (select 1 from public.capitulo_paginas where capitulo_id = old.id) then
      raise exception 'Remova o manifesto antes de alterar a identidade ou o tipo.' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;
create trigger capitulos_proteger_contrato_ilustrado before insert or update on public.capitulos
for each row execute function historietas_privado.proteger_contrato_capitulo_ilustrado();

create function historietas_privado.validar_referencia_pagina_capitulo()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  v_autor uuid;
  v_tipo text;
  v_prefixo text;
begin
  -- Serializa alterações de um mesmo capítulo, inclusive contagem e versão.
  select user_id, tipo_conteudo into v_autor, v_tipo
  from public.capitulos where id = new.capitulo_id for update;
  if not found then
    raise exception 'Capitulo inexistente.' using errcode = '23503';
  end if;
  if v_tipo <> 'imagens' then
    raise exception 'Paginas exigem capitulo do tipo imagens.' using errcode = '23514';
  end if;
  v_prefixo := v_autor::text || '/capitulos/' || new.capitulo_id::text || '/' || new.id::text;
  if tg_table_name = 'capitulo_paginas' then
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
    if tg_op = 'UPDATE' and (new.id, new.capitulo_id, new.user_id, new.storage_path, new.criado_em)
      is distinct from (old.id, old.capitulo_id, old.user_id, old.storage_path, old.criado_em) then
      raise exception 'A identidade da reserva e imutavel.' using errcode = '23514';
    end if;
  end if;
  if exists (select 1 from historietas_privado.capitulo_arquivos_limpeza
    where storage_path = new.storage_path) then
    raise exception 'Caminho ja destinado a limpeza.' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger capitulo_paginas_validar_referencia before insert or update on public.capitulo_paginas
for each row execute function historietas_privado.validar_referencia_pagina_capitulo();
create trigger capitulo_uploads_validar_referencia before insert or update on historietas_privado.capitulo_uploads_pendentes
for each row execute function historietas_privado.validar_referencia_pagina_capitulo();

create function historietas_privado.incrementar_versao_paginas_capitulo()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new is not distinct from old then return null; end if;
  update public.capitulos set versao_paginas = versao_paginas + 1
    where id = case when tg_op = 'DELETE' then old.capitulo_id else new.capitulo_id end;
  return null;
end;
$$;
create trigger capitulo_paginas_incrementar_versao after insert or update or delete on public.capitulo_paginas
for each row execute function historietas_privado.incrementar_versao_paginas_capitulo();

create function historietas_privado.validar_manifesto_capitulo()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid;
  v_tipo text;
  v_publicado boolean;
  v_total integer;
  v_max integer;
begin
  if tg_table_name = 'capitulos' then v_id := new.id;
  elsif tg_op = 'DELETE' then v_id := old.capitulo_id;
  else v_id := new.capitulo_id;
  end if;
  select tipo_conteudo, publicado into v_tipo, v_publicado from public.capitulos where id = v_id;
  if not found or v_tipo = 'texto' then return null; end if;
  select count(*)::integer, coalesce(max(ordem), 0) into v_total, v_max
    from public.capitulo_paginas where capitulo_id = v_id;
  if v_total <> v_max or v_total > 10 or (v_publicado and v_total = 0) then
    raise exception 'Manifesto deve ser contiguo; publicado exige paginas.' using errcode = '23514';
  end if;
  return null;
end;
$$;
create constraint trigger capitulo_paginas_manifesto_integro after insert or update or delete on public.capitulo_paginas
deferrable initially deferred for each row execute function historietas_privado.validar_manifesto_capitulo();
create constraint trigger capitulos_manifesto_integro after insert or update on public.capitulos
deferrable initially deferred for each row execute function historietas_privado.validar_manifesto_capitulo();

-- Único definer novo: exclusivamente trigger, sem RPC ou EXECUTE para clientes.
-- Preserva a outbox mesmo em cascatas autenticadas de capítulo/obra/conta.
create function historietas_privado.enfileirar_arquivo_capitulo_removido()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'capitulo_uploads_pendentes' and exists (
    select 1 from public.capitulo_paginas where storage_path = old.storage_path
  ) then return old; end if;
  insert into historietas_privado.capitulo_arquivos_limpeza(storage_path, motivo)
  values (old.storage_path, case when tg_table_name = 'capitulo_paginas'
    then 'pagina_removida' else 'upload_descartado' end)
  on conflict (storage_path) do nothing;
  return old;
end;
$$;
alter function historietas_privado.enfileirar_arquivo_capitulo_removido() owner to postgres;
create trigger capitulo_paginas_enfileirar_limpeza after delete on public.capitulo_paginas
for each row execute function historietas_privado.enfileirar_arquivo_capitulo_removido();
create trigger capitulo_uploads_enfileirar_limpeza after delete on historietas_privado.capitulo_uploads_pendentes
for each row execute function historietas_privado.enfileirar_arquivo_capitulo_removido();

revoke all on function historietas_privado.proteger_contrato_capitulo_ilustrado() from public, anon, authenticated, service_role;
revoke all on function historietas_privado.validar_referencia_pagina_capitulo() from public, anon, authenticated, service_role;
revoke all on function historietas_privado.incrementar_versao_paginas_capitulo() from public, anon, authenticated, service_role;
revoke all on function historietas_privado.validar_manifesto_capitulo() from public, anon, authenticated, service_role;
revoke all on function historietas_privado.enfileirar_arquivo_capitulo_removido() from public, anon, authenticated, service_role;

comment on table public.capitulo_paginas is
  'Fase 1: metadados de manifesto; sem escrita pela Data API. Validacao binaria/finalizacao e leitor ilustrado ainda indisponiveis. Ate 10 paginas de 2 MiB, sem ampliar quotas existentes.';
comment on table historietas_privado.capitulo_uploads_pendentes is
  'Contrato inativo de reservas de 24h. Nenhum upload, validacao de bytes ou reserva real de quota e habilitado nesta fase.';
comment on table historietas_privado.capitulo_arquivos_limpeza is
  'Outbox duravel sem executor nesta fase. Futuro worker deve revalidar referencias/reservas e usar Storage API; nunca DELETE SQL em storage.objects.';

notify pgrst, 'reload schema';
commit;
