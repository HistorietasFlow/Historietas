-- Protege os buckets usados pelo aplicativo contra esgotamento da cota do
-- projeto gratuito sem modificar diretamente o schema interno do Storage.
--
-- Camadas de proteção:
--   * limite e MIME nativos por arquivo;
--   * teto de 100 MiB e 100 objetos por usuário;
--   * teto global de 700 MiB e 5.000 objetos nos três buckets do app;
--   * limites adicionais de quantidade por bucket;
--   * advisory lock transacional para impedir estouro por uploads concorrentes.

begin;

update storage.buckets
set
  file_size_limit = 5 * 1024 * 1024,
  allowed_mime_types = array[
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/x-markdown',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif'
  ]::text[]
where id = 'arquivos-obras';

-- Reafirma os contratos já usados pelo cliente. Isso também corrige eventual
-- drift manual no Dashboard antes de ativar as policies restritivas.
update storage.buckets
set
  file_size_limit = 1 * 1024 * 1024,
  allowed_mime_types = array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif'
  ]::text[]
where id = 'avatars';

update storage.buckets
set
  file_size_limit = 2 * 1024 * 1024,
  allowed_mime_types = array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif'
  ]::text[]
where id = 'capas-obras';

create schema if not exists historietas_privado authorization postgres;

grant usage on schema historietas_privado to authenticated;

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
    from storage.objects as objeto
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
    from storage.objects as objeto
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
  from storage.objects as objeto
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
  from storage.objects as objeto
  where objeto.bucket_id = any (
      array['avatars', 'capas-obras', 'arquivos-obras']::text[]
    )
    and objeto.name like v_prefixo_usuario;

  select count(*)::bigint
  into v_objetos_bucket_usuario
  from storage.objects as objeto
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

alter function historietas_privado.upload_storage_dentro_cota(
  text,
  text,
  text,
  uuid
) owner to postgres;

revoke all on function historietas_privado.upload_storage_dentro_cota(
  text,
  text,
  text,
  uuid
) from public, anon, authenticated, service_role;

grant execute on function historietas_privado.upload_storage_dentro_cota(
  text,
  text,
  text,
  uuid
) to authenticated;

comment on function historietas_privado.upload_storage_dentro_cota(
  text,
  text,
  text,
  uuid
) is
  'Helper privado das policies do Storage. Serializa e valida cotas por arquivo, usuário, bucket e projeto.';

drop policy if exists storage_cota_insert_restritiva on storage.objects;

create policy storage_cota_insert_restritiva
on storage.objects
as restrictive
for insert
to authenticated
with check (
  bucket_id <> all (
    array['avatars', 'capas-obras', 'arquivos-obras']::text[]
  )
  or historietas_privado.upload_storage_dentro_cota(
    bucket_id,
    name,
    metadata->>'size',
    null
  )
);

drop policy if exists storage_cota_update_restritiva on storage.objects;

create policy storage_cota_update_restritiva
on storage.objects
as restrictive
for update
to authenticated
using (true)
with check (
  bucket_id <> all (
    array['avatars', 'capas-obras', 'arquivos-obras']::text[]
  )
  or historietas_privado.upload_storage_dentro_cota(
    bucket_id,
    name,
    metadata->>'size',
    id
  )
);

do $$
declare
  v_buckets_configurados integer;
  v_policies_restritivas integer;
begin
  select count(*)::integer
  into v_buckets_configurados
  from storage.buckets as bucket
  where (
      bucket.id = 'avatars'
      and bucket.file_size_limit = 1 * 1024 * 1024
      and bucket.allowed_mime_types @> array[
        'image/png', 'image/jpeg', 'image/webp', 'image/gif'
      ]::text[]
    )
    or (
      bucket.id = 'capas-obras'
      and bucket.file_size_limit = 2 * 1024 * 1024
      and bucket.allowed_mime_types @> array[
        'image/png', 'image/jpeg', 'image/webp', 'image/gif'
      ]::text[]
    )
    or (
      bucket.id = 'arquivos-obras'
      and bucket.file_size_limit = 5 * 1024 * 1024
      and bucket.allowed_mime_types @> array[
        'application/pdf',
        'text/plain',
        'text/markdown',
        'text/x-markdown',
        'image/png',
        'image/jpeg',
        'image/webp',
        'image/gif'
      ]::text[]
    );

  if v_buckets_configurados <> 3 then
    raise exception 'A configuração dos três buckets não foi confirmada.';
  end if;

  if not has_function_privilege(
    'authenticated',
    'historietas_privado.upload_storage_dentro_cota(text,text,text,uuid)',
    'EXECUTE'
  ) or has_function_privilege(
    'anon',
    'historietas_privado.upload_storage_dentro_cota(text,text,text,uuid)',
    'EXECUTE'
  ) then
    raise exception 'Os privilégios do helper de cota não ficaram restritos ao papel autenticado.';
  end if;

  select count(*)::integer
  into v_policies_restritivas
  from pg_catalog.pg_policy as policy
  where policy.polrelid = 'storage.objects'::regclass
    and policy.polname = any (
      array[
        'storage_cota_insert_restritiva',
        'storage_cota_update_restritiva'
      ]::name[]
    )
    and policy.polpermissive is false
    and policy.polroles = array['authenticated'::regrole]::oid[];

  if v_policies_restritivas <> 2 then
    raise exception 'As policies restritivas de cota não foram confirmadas.';
  end if;
end;
$$;

commit;
