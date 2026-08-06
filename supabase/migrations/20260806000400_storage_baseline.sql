-- HISTORIETAS — BASELINE CANDIDATA DO STORAGE
-- Reproduz os buckets e as 9 policies encontradas no Supabase em 2026-08-06.
-- NÃO EXECUTAR NO PROJETO REMOTO ATUAL durante a fase de teste local.

begin;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  ('arquivos-obras', 'arquivos-obras', false, null, null),
  ('avatars', 'avatars', true, null, null),
  ('capas-obras', 'capas-obras', true, null, null)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars_delete_proprio" on storage.objects;
drop policy if exists "avatars_insert_proprio" on storage.objects;
drop policy if exists "avatars_select_publico" on storage.objects;
drop policy if exists "avatars_update_proprio" on storage.objects;
drop policy if exists "storage_arquivos_select_publicado_ou_proprio" on storage.objects;
drop policy if exists "storage_capas_select_publico" on storage.objects;
drop policy if exists "storage_obras_delete_proprio" on storage.objects;
drop policy if exists "storage_obras_insert_proprio" on storage.objects;
drop policy if exists "storage_obras_update_proprio" on storage.objects;

create policy "avatars_delete_proprio"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars_insert_proprio"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars_select_publico"
on storage.objects
for select
to public
using (bucket_id = 'avatars');

create policy "avatars_update_proprio"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "storage_arquivos_select_publicado_ou_proprio"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'arquivos-obras'
  and (
    (
      auth.uid() is not null
      and (storage.foldername(name))[1] = auth.uid()::text
    )
    or exists (
      select 1
      from public.obras as obra
      where obra.publicado is true
        and nullif(btrim(obra.arquivo_url), '') is not null
        and (
          btrim(obra.arquivo_url) = objects.name
          or btrim(obra.arquivo_url) = 'arquivos-obras/' || objects.name
          or right(
            split_part(btrim(obra.arquivo_url), '?', 1),
            char_length('/arquivos-obras/' || objects.name)
          ) = '/arquivos-obras/' || objects.name
        )
    )
  )
);

create policy "storage_capas_select_publico"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'capas-obras');

create policy "storage_obras_delete_proprio"
on storage.objects
for delete
to authenticated
using (
  auth.uid() is not null
  and bucket_id = any (array['capas-obras', 'arquivos-obras']::text[])
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "storage_obras_insert_proprio"
on storage.objects
for insert
to authenticated
with check (
  auth.uid() is not null
  and bucket_id = any (array['capas-obras', 'arquivos-obras']::text[])
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "storage_obras_update_proprio"
on storage.objects
for update
to authenticated
using (
  auth.uid() is not null
  and bucket_id = any (array['capas-obras', 'arquivos-obras']::text[])
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  auth.uid() is not null
  and bucket_id = any (array['capas-obras', 'arquivos-obras']::text[])
  and (storage.foldername(name))[1] = auth.uid()::text
);

notify pgrst, 'reload schema';

commit;
