-- Versão registrada pelo Supabase em produção: 20260826173441.
-- Remove a emissão direta de URLs assinadas pelo navegador. O bucket continua
-- privado e o acesso passa por um Route Handler server-only, com autorização,
-- rate limit persistente e assinatura de curta duração.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $$
begin
  if not exists (
    select 1
    from storage.buckets as bucket
    where bucket.id = 'arquivos-obras'
      and bucket.public is false
  ) then
    raise exception
      'Precondição falhou: o bucket arquivos-obras deve existir e ser privado.';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_policy as policy
    where policy.polrelid = 'storage.objects'::regclass
      and policy.polname = 'storage_arquivos_select_publicado_ou_proprio'
      and policy.polcmd = 'r'
      and policy.polpermissive
      and 'anon'::regrole::oid = any (policy.polroles)
      and 'authenticated'::regrole::oid = any (policy.polroles)
  ) then
    raise exception
      'Precondição falhou: a policy direta de leitura de arquivos divergiu.';
  end if;

  if to_regprocedure('storage.allow_only_operation(text)') is null then
    raise exception
      'Precondição falhou: o helper de operações do Storage não existe.';
  end if;
end;
$$;

drop policy storage_arquivos_select_publicado_ou_proprio
on storage.objects;

-- O upload padrão precisa ler a linha recém-criada para devolver os metadados.
-- Esta policy permite somente essa operação técnica; download, listagem e
-- criação de URLs assinadas continuam negados aos clientes.
create policy storage_arquivos_select_upload_proprio
on storage.objects
for select
to authenticated
using (
  bucket_id = 'arquivos-obras'
  and storage.allow_only_operation('object.upload')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_policy as policy
    where policy.polrelid = 'storage.objects'::regclass
      and policy.polname = 'storage_arquivos_select_upload_proprio'
      and policy.polcmd = 'r'
      and policy.polpermissive
      and policy.polroles = array['authenticated'::regrole::oid]
      and pg_catalog.pg_get_expr(policy.polqual, policy.polrelid)
        like '%allow_only_operation%object.upload%'
  ) then
    raise exception
      'A leitura técnica necessária ao upload não ficou restrita corretamente.';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_policy as policy
    where policy.polrelid = 'storage.objects'::regclass
      and policy.polcmd = 'r'
      and policy.polname <> 'storage_arquivos_select_upload_proprio'
      and pg_catalog.pg_get_expr(policy.polqual, policy.polrelid)
        like '%arquivos-obras%'
  ) then
    raise exception
      'Ainda existe outra policy de leitura para o bucket arquivos-obras.';
  end if;

  if not exists (
    select 1
    from storage.buckets as bucket
    where bucket.id = 'arquivos-obras'
      and bucket.public is false
  ) then
    raise exception 'O bucket arquivos-obras deixou de ser privado.';
  end if;
end;
$$;

commit;
