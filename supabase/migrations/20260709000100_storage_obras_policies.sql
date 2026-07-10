-- 20260709_storage_obras_policies.sql
-- Restringe uploads/updates/deletes dos buckets de obras ao próprio usuário.
-- Mantém leitura pública porque as capas/arquivos usam getPublicUrl no app.

begin;

drop policy if exists "storage_obras_select_publico" on storage.objects;
drop policy if exists "storage_obras_insert_proprio" on storage.objects;
drop policy if exists "storage_obras_update_proprio" on storage.objects;
drop policy if exists "storage_obras_delete_proprio" on storage.objects;

create policy "storage_obras_select_publico"
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id in ('capas-obras', 'arquivos-obras')
  );

create policy "storage_obras_insert_proprio"
  on storage.objects
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and bucket_id in ('capas-obras', 'arquivos-obras')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "storage_obras_update_proprio"
  on storage.objects
  for update
  to authenticated
  using (
    auth.uid() is not null
    and bucket_id in ('capas-obras', 'arquivos-obras')
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    auth.uid() is not null
    and bucket_id in ('capas-obras', 'arquivos-obras')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "storage_obras_delete_proprio"
  on storage.objects
  for delete
  to authenticated
  using (
    auth.uid() is not null
    and bucket_id in ('capas-obras', 'arquivos-obras')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

commit;