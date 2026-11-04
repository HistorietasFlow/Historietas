begin;

drop policy if exists "avatars_select_publico" on storage.objects;
drop policy if exists "storage_capas_select_publico" on storage.objects;

create policy "avatars_select_proprio"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "storage_capas_select_proprio"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'capas-obras'
  and (storage.foldername(name))[1] = auth.uid()::text
);

commit;
