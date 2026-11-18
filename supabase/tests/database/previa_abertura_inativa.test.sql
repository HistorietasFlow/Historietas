begin;
select plan(17);

select is((select proowner::regrole::text from pg_proc
  where oid = 'previa_interno.abertura_obra(text)'::regprocedure), 'postgres', 'proprietário da prévia');
select is((select proowner::regrole::text from pg_proc
  where oid = 'previa_interno.sessao_atual_ativa()'::regprocedure), 'postgres', 'proprietário da auxiliar');
select ok((select not prosecdef and provolatile = 's' and 'search_path=""' = any(proconfig)
  from pg_proc where oid = 'previa_interno.abertura_obra(text)'::regprocedure), 'leitura invoker com caminho fixo');
select ok((select prosecdef and provolatile = 's' and 'search_path=""' = any(proconfig)
  and pronargs = 0 and not proretset and prorettype = 'boolean'::regtype from pg_proc
  where oid = 'previa_interno.sessao_atual_ativa()'::regprocedure), 'auxiliar sem argumentos só retorna booleano');
select is((select count(*)::int from pg_proc where pronamespace = 'previa_interno'::regnamespace), 2,
  'schema dedicado tem apenas as duas assinaturas homologadas');
select ok(not exists (select from unnest(array['anon','authenticated','service_role','authenticator']) papel
  where has_function_privilege(papel,'previa_interno.abertura_obra(text)','EXECUTE')),
  'papéis da API não executam a prévia instalada');
select ok(not exists (select from unnest(array['anon','authenticated','service_role','authenticator']) papel
  where has_function_privilege(papel,'previa_interno.sessao_atual_ativa()','EXECUTE') <> (papel = 'authenticated')),
  'entre os papéis da API somente authenticated executa a auxiliar');
select ok(not exists (select from unnest(array['anon','authenticated','service_role','authenticator']) papel
  where has_schema_privilege(papel,'previa_interno','CREATE')
     or has_schema_privilege(papel,'previa_interno','USAGE') <> (papel = 'authenticated')),
  'schema sem escrita para clientes');
select ok(not exists (select from unnest(array['anon','authenticated']) papel
  where has_any_column_privilege(papel,'auth.sessions','SELECT')), 'tabela de sessões sem leitura direta');
select is((select array_agg(d.refobjsubid order by d.refobjsubid)
  from pg_depend d where d.classid = 'pg_proc'::regclass
    and d.objid = 'previa_interno.sessao_atual_ativa()'::regprocedure
    and d.refclassid = 'pg_class'::regclass and d.refobjid = 'auth.sessions'::regclass),
  (select array_agg(attnum::integer order by attnum) from pg_attribute
   where attrelid = 'auth.sessions'::regclass and attname in ('id','not_after','user_id')),
  'consulta vinculada às três colunas homologadas');
select ok((select bool_and(relrowsecurity) from pg_class
  where oid in ('auth.sessions'::regclass,'public.obras'::regclass,'public.capitulos'::regclass)),
  'RLS ativa nas tabelas envolvidas');
select ok(to_regprocedure('public.previa_abertura_local(text)') is null,
  'adaptador de QA ausente da instalação');

-- Fixtures de unidade restritas a esta transação. A integração usa logins reais.
insert into auth.users(id) values ('ae100000-0000-4000-8000-000000000001'), ('ae100000-0000-4000-8000-000000000002');
insert into auth.sessions(id,user_id,not_after) values
  ('ae200000-0000-4000-8000-000000000001','ae100000-0000-4000-8000-000000000001',null),
  ('ae200000-0000-4000-8000-000000000002','ae100000-0000-4000-8000-000000000002',null),
  ('ae200000-0000-4000-8000-000000000003','ae100000-0000-4000-8000-000000000001',now() - interval '1 minute');
grant execute on function previa_interno.abertura_obra(text) to authenticated;
set local role authenticated;
set local request.jwt.claim.sub = 'ae100000-0000-4000-8000-000000000001';
set local request.jwt.claims = '{"session_id":"ae200000-0000-4000-8000-000000000001","exp":1}';
select ok(previa_interno.sessao_atual_ativa(), 'sessão ativa pertence ao solicitante');
select throws_ok($$select * from previa_interno.abertura_obra('teste')$$,
  'PT401','Sessão inválida.','JWT vencido recusado inclusive com a sessão presente');
set local request.jwt.claims = '{"session_id":"ae200000-0000-4000-8000-000000000002"}';
select ok(not previa_interno.sessao_atual_ativa(), 'sessão de outra conta não autoriza');
set local request.jwt.claims = '{"session_id":"ae200000-0000-4000-8000-000000000003"}';
select ok(not previa_interno.sessao_atual_ativa(), 'prazo not_after respeitado');
set local request.jwt.claims = '{}';
select ok(not previa_interno.sessao_atual_ativa(), 'falta de session_id falha fechada');
reset role;
select * from finish();
rollback;
