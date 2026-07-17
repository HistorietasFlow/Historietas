-- 20260709_storage_obras_policies.sql
-- Mantém capas públicas.
-- Mantém o bucket de arquivos completos privado.
-- Permite leitura de arquivos completos somente:
-- 1. ao proprietário do arquivo; ou
-- 2. quando o arquivo pertence a uma obra publicada.
-- Restringe uploads, updates e deletes ao diretório do próprio usuário.

begin;

-- Capas continuam públicas para uso direto no catálogo e nas páginas.
update storage.buckets
set public = true
where id = 'capas-obras';

-- Arquivos completos nunca ficam públicos diretamente pelo bucket.
update storage.buckets
set public = false
where id = 'arquivos-obras';

-- Remove qualquer policy antiga que mencione estes buckets. Policies
-- permissivas são combinadas com OR e uma regra esquecida poderia reabrir
-- acesso indevido.
do $$
declare
  v_policy record;
begin
  for v_policy in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and (
        coalesce(qual, '') ilike '%capas-obras%'
        or coalesce(with_check, '') ilike '%capas-obras%'
        or coalesce(qual, '') ilike '%arquivos-obras%'
        or coalesce(with_check, '') ilike '%arquivos-obras%'
      )
  loop
    execute format(
      'drop policy if exists %I on storage.objects',
      v_policy.policyname
    );
  end loop;
end
$$;

create policy "storage_capas_select_publico"
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id = 'capas-obras'
  );

-- Cria a regra com acesso público a arquivos de obras publicadas somente
-- quando a estrutura esperada da tabela public.obras estiver disponível.
do $$
begin
  if to_regclass('public.obras') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'obras'
        and column_name = 'publicado'
    )
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'obras'
        and column_name = 'arquivo_url'
    )
  then
    execute $policy$
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
                and nullif(btrim(obra.arquivo_url::text), '') is not null
                and (
                  btrim(obra.arquivo_url::text) = name
                  or btrim(obra.arquivo_url::text) = 'arquivos-obras/' || name
                  or right(
                    split_part(btrim(obra.arquivo_url::text), '?', 1),
                    char_length('/arquivos-obras/' || name)
                  ) = '/arquivos-obras/' || name
                )
            )
          )
        )
    $policy$;
  else
    execute $policy$
      create policy "storage_arquivos_select_publicado_ou_proprio"
        on storage.objects
        for select
        to authenticated
        using (
          bucket_id = 'arquivos-obras'
          and auth.uid() is not null
          and (storage.foldername(name))[1] = auth.uid()::text
        )
    $policy$;
  end if;
end
$$;

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