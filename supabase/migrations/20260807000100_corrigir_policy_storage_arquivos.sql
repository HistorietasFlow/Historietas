-- Corrige o isolamento de leitura do bucket privado arquivos-obras.
-- Mantém acesso do próprio dono e leitura de arquivos vinculados a obras publicadas,
-- mas exige que o arquivo também pertença ao autor da obra.

drop policy if exists storage_arquivos_select_publicado_ou_proprio
on storage.objects;

create policy storage_arquivos_select_publicado_ou_proprio
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
      from public.obras obra
      where obra.publicado is true
        and nullif(btrim(obra.arquivo_url), '') is not null
        and (storage.foldername(name))[1] = obra.user_id::text
        and (
          btrim(obra.arquivo_url) = storage.objects.name
          or btrim(obra.arquivo_url) = 'arquivos-obras/' || storage.objects.name
          or right(
            split_part(btrim(obra.arquivo_url), '?', 1),
            char_length('/arquivos-obras/' || storage.objects.name)
          ) = '/arquivos-obras/' || storage.objects.name
        )
    )
  )
);