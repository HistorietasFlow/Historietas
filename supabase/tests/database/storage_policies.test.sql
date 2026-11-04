begin;

select plan(9);

select is(
  (
    select count(*)::integer
    from storage.buckets
    where id in ('avatars', 'capas-obras')
      and public is true
  ),
  2,
  'avatars e capas-obras continuam publicos'
);

select ok(
  not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'avatars_select_publico'
  ),
  'policy publica antiga de avatars foi removida'
);

select ok(
  not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'storage_capas_select_publico'
  ),
  'policy publica antiga de capas-obras foi removida'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'avatars_select_proprio'
      and cmd = 'SELECT'
      and roles = array['authenticated'::name]
      and qual like '%bucket_id = ''avatars''%'
      and qual like '%auth.uid()%'
      and qual like '%storage.foldername(name)%'
  ),
  'avatars permite SELECT somente do prefixo do usuario autenticado'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'storage_capas_select_proprio'
      and cmd = 'SELECT'
      and roles = array['authenticated'::name]
      and qual like '%bucket_id = ''capas-obras''%'
      and qual like '%auth.uid()%'
      and qual like '%storage.foldername(name)%'
  ),
  'capas-obras permite SELECT somente do prefixo do usuario autenticado'
);

select ok(
  not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and cmd = 'SELECT'
      and roles && array['public'::name, 'anon'::name]
      and (
        qual like '%bucket_id = ''avatars''%'
        or qual like '%bucket_id = ''capas-obras''%'
      )
  ),
  'nao existe SELECT amplo para anon ou public nos buckets auditados'
);

select is(
  (
    select count(*)::integer
    from storage.buckets
    where (
        id = 'avatars'
        and file_size_limit = 1 * 1024 * 1024
        and allowed_mime_types @> array[
          'image/png', 'image/jpeg', 'image/webp', 'image/gif'
        ]::text[]
      )
      or (
        id = 'capas-obras'
        and file_size_limit = 2 * 1024 * 1024
        and allowed_mime_types @> array[
          'image/png', 'image/jpeg', 'image/webp', 'image/gif'
        ]::text[]
      )
  ),
  2,
  'limites de tamanho e MIME dos buckets permanecem configurados'
);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname in (
        'avatars_insert_proprio',
        'avatars_update_proprio',
        'avatars_delete_proprio',
        'storage_obras_insert_proprio',
        'storage_obras_update_proprio',
        'storage_obras_delete_proprio'
      )
  ),
  6,
  'policies de escrita permanecem instaladas'
);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname in (
        'storage_cota_insert_restritiva',
        'storage_cota_update_restritiva'
      )
      and permissive = 'RESTRICTIVE'
      and roles = array['authenticated'::name]
  ),
  2,
  'policies restritivas de quota permanecem instaladas'
);

select * from finish();

rollback;
