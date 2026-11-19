begin;
select plan(8);

select is((select proowner::regrole::text from pg_proc where oid =
  'public.qa5_recomendar_obras_autorizadas(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text)'::regprocedure),
  'postgres', 'O catálogo pertence ao papel da migration');

select ok((select not prosecdef and provolatile = 's' and proretset
  and proconfig = array['search_path=""'] from pg_proc where oid =
  'public.qa5_recomendar_obras_autorizadas(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text)'::regprocedure),
  'O catálogo executa como invocador com caminho de busca fixo');

select is((select proargnames[12:17] from pg_proc where oid =
  'public.qa5_recomendar_obras_autorizadas(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text)'::regprocedure),
  array['obra_id','cursor_valor','cursor_data','cursor_id','tem_mais','metadados'],
  'A projeção e o cursor preservam o contrato do piloto');

select ok(not exists (
  select from pg_proc f
  cross join lateral aclexplode(coalesce(f.proacl,acldefault('f',f.proowner))) acl
  where f.oid = 'public.qa5_recomendar_obras_autorizadas(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text)'::regprocedure
    and acl.grantee <> f.proowner
), 'A lista de privilégios da função contém somente o proprietário');

select ok(not exists (
  select from unnest(array['anon','authenticated','service_role','authenticator']) papel
  where has_function_privilege(papel,
    'public.qa5_recomendar_obras_autorizadas(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text)', 'EXECUTE')
), 'Os papéis da API não podem executar o catálogo após instalar');

select ok(has_schema_privilege('authenticated','previa_interno','USAGE')
  and has_function_privilege('authenticated','previa_interno.sessao_atual_ativa()','EXECUTE'),
  'A dependência que valida a sessão está disponível para o leitor');

set local role anon;
select throws_ok($$select * from public.qa5_recomendar_obras_autorizadas('','','','','todos','recentes',7,null,null,null,'')$$,
  '42501', null, 'Consulta direta como visitante é recusada na instalação');
reset role;
set local role authenticated;
select throws_ok($$select * from public.qa5_recomendar_obras_autorizadas('','','','','todos','recentes',7,null,null,null,'')$$,
  '42501', null, 'Consulta direta como leitor é recusada na instalação');
reset role;

select * from finish();
rollback;
