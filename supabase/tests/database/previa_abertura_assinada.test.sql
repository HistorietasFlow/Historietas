begin;
select plan(10);

select ok((select proowner='postgres'::regrole and not prosecdef
  and provolatile='s' and 'search_path=""'=any(proconfig) from pg_proc
  where oid='public.previa_abertura_assinada(text)'::regprocedure),
  'RPC invoker de postgres com caminho fixo');
select ok((select proowner='postgres'::regrole and prosecdef
  and provolatile='s' and 'search_path=""'=any(proconfig)
  and pronargs=1 and not proretset and prorettype='boolean'::regtype from pg_proc
  where oid='previa_assinatura.prova_confere(text)'::regprocedure),
  'auxiliar privada somente devolve booleano');
select ok((select nspowner='postgres'::regrole from pg_namespace
  where oid='previa_assinatura'::regnamespace), 'schema pertence a postgres');
select ok((select relowner='postgres'::regrole and relrowsecurity from pg_class
  where oid='previa_assinatura.chave_ativa'::regclass), 'referencia privada com RLS');
select is((select count(*)::int from previa_assinatura.chave_ativa), 0,
  'instalacao sem chave ativa');
select ok(not exists(select 1 from unnest(array['anon','authenticated','service_role','authenticator']) r
  where has_function_privilege(r,'public.previa_abertura_assinada(text)','EXECUTE')
     or has_function_privilege(r,'previa_assinatura.prova_confere(text)','EXECUTE')
     or has_schema_privilege(r,'previa_assinatura','USAGE')
     or has_any_column_privilege(r,'previa_assinatura.chave_ativa','SELECT')),
  'papeis da API sem acesso apos instalacao');
select ok(not exists(select 1 from unnest(array['anon','authenticated']) r
  where has_any_column_privilege(r,'auth.sessions','SELECT')
     or has_any_column_privilege(r,'vault.decrypted_secrets','SELECT')),
  'sessoes e segredos sem leitura direta pelos clientes');
select is((select split_part(prosrc,'return query',2) from pg_proc
  where oid='public.previa_abertura_assinada(text)'::regprocedure),
  (select split_part(prosrc,'return query',2) from pg_proc
  where oid='previa_interno.abertura_obra(text)'::regprocedure),
  'consulta do trecho preserva o contrato homologado');
select ok(not exists(select 1 from unnest(array['anon','authenticated']) r
  where has_function_privilege(r,'previa_interno.abertura_obra(text)','EXECUTE')),
  'contrato anterior permanece inacessivel aos leitores');
select ok(to_regprocedure('public.previa_abertura_local(text)') is null
  and to_regprocedure('public.previa_abertura_atestada_local(text)') is null,
  'adaptadores experimentais ausentes');
select * from finish();
rollback;
