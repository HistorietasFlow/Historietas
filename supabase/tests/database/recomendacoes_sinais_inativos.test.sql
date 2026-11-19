begin;
select plan(9);

select is((select nspowner::regrole::text from pg_namespace
  where oid = 'qa5_sinais_interno'::regnamespace), 'postgres', 'schema privado pertence a postgres');
select ok((select proowner = 'postgres'::regrole and not prosecdef and provolatile = 's'
  and proconfig = array['search_path=""'] and prorettype = 'text[]'::regtype
  from pg_proc where oid = 'public.qa5_generos_interacoes_autorizadas()'::regprocedure),
  'consulta executa sob RLS e retorna os gêneros do leitor atual');
select ok((select proowner = 'postgres'::regrole and prosecdef and provolatile = 's'
  and proconfig = array['search_path=""'] and proretset
  from pg_proc where oid = 'qa5_sinais_interno.autores_visiveis(uuid[])'::regprocedure),
  'auxiliar privilegiada pertence a postgres e tem caminho de busca fixo');
select is((select count(*)::int from pg_proc where pronamespace = 'qa5_sinais_interno'::regnamespace),
  1, 'schema só contém a auxiliar revisada');
select ok(not exists (
  select from pg_namespace n
  cross join lateral aclexplode(coalesce(n.nspacl, acldefault('n', n.nspowner))) a
  where n.oid = 'qa5_sinais_interno'::regnamespace and a.grantee <> n.nspowner
), 'somente o proprietário aparece na ACL do schema');
select ok(not exists (
  select from pg_proc f
  cross join lateral aclexplode(coalesce(f.proacl, acldefault('f', f.proowner))) a
  where f.oid in ('public.qa5_generos_interacoes_autorizadas()'::regprocedure,
    'qa5_sinais_interno.autores_visiveis(uuid[])'::regprocedure) and a.grantee <> f.proowner
), 'somente o proprietário aparece na ACL das funções');
select ok(not exists (
  select from unnest(array['anon', 'authenticated', 'service_role', 'authenticator']) papel
  where has_schema_privilege(papel, 'qa5_sinais_interno', 'USAGE, CREATE')
    or has_function_privilege(papel, 'qa5_sinais_interno.autores_visiveis(uuid[])', 'EXECUTE')
    or has_function_privilege(papel, 'public.qa5_generos_interacoes_autorizadas()', 'EXECUTE')
), 'papéis da API sem acesso efetivo após instalação');
select ok(not exists (
  select from unnest(array['anon','authenticated','service_role','authenticator']) papel
  where has_function_privilege(papel,
    to_regprocedure('public.qa5_recomendar_obras_autorizadas(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text)'),
    'EXECUTE')
), 'consulta de catálogo permanece fechada quando instalada');

set local role authenticated;
select throws_ok('select public.qa5_generos_interacoes_autorizadas()', '42501', null,
  'o banco recusa a execução direta como leitor');
reset role;

select * from finish();
rollback;
