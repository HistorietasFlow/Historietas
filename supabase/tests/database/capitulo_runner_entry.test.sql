begin;
select no_plan();
select ok(not (select habilitado from historietas_privado.capitulo_runner_controle),'gate permanece fechado');
select ok((select not rolcanlogin and not rolinherit and not rolsuper and not rolcreatedb
  and not rolcreaterole and not rolreplication and not rolbypassrls
  from pg_roles where rolname='historietas_capitulo_runner'),'papel sem login ou privilegios amplos');
select ok(not exists(select 1 from pg_auth_members where
  (roleid='historietas_capitulo_runner'::regrole and
    (member<>'postgres'::regrole or inherit_option or set_option))
  or member='historietas_capitulo_runner'::regrole),'somente ADMIN do criador, sem SET/heranca ou membros de API');
select ok((select rolconfig @> array['statement_timeout=10s','lock_timeout=500ms',
  'idle_in_transaction_session_timeout=5s'] from pg_roles where rolname='historietas_capitulo_runner'),'timeouts apenas no papel dedicado');
select ok((select prosecdef and proowner='postgres'::regrole and proconfig=array['search_path=""']
  from pg_proc where oid='historietas_privado.acionar_runner_capitulos()'::regprocedure),'entrada definer restrita e qualificada');
select ok(has_function_privilege('historietas_capitulo_runner','historietas_privado.acionar_runner_capitulos()','execute'),'entrada unica permitida');
select ok(not exists(select 1 from unnest(array['anon','authenticated','service_role']) r
  where has_function_privilege(r,'historietas_privado.acionar_runner_capitulos()','execute')),'API nao executa entrada');
select ok(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace,
  lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
  where n.nspname='historietas_privado' and a.grantee='historietas_capitulo_runner'::regrole
    and p.oid<>'historietas_privado.acionar_runner_capitulos()'::regprocedure),'nenhum outro grant privado ao papel');
select ok(not has_function_privilege('historietas_capitulo_runner',
  'historietas_privado.executar_runner_capitulos(integer,integer)','execute'),'nao chama runner parametrizado');
select ok(not has_function_privilege('historietas_capitulo_runner',
  'historietas_privado.executar_agendamento_capitulo(uuid,bigint)','execute'),'nao contorna runner pelo executor');
select ok(not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname in ('historietas_privado','auth') and c.relkind in ('r','p')
    and has_table_privilege('historietas_capitulo_runner',c.oid,'SELECT,INSERT,UPDATE,DELETE')),'sem dados privados/Auth ou alteracao do gate');
select throws_ok($$select historietas_privado.acionar_runner_capitulos()$$,'42501',null,'admin nao impersona sessao operacional');
-- Somente na transacao descartavel: simular impersonacao administrativa.
grant historietas_capitulo_runner to postgres with set true;
create function pg_temp.testar_impersonacao_runner() returns text language plpgsql as $$
begin
  execute 'set local role historietas_capitulo_runner';
  perform historietas_privado.acionar_runner_capitulos();
  return 'nao rejeitado';
exception when others then return sqlstate;
end $$;
select is(pg_temp.testar_impersonacao_runner(),'42501','SET ROLE nao substitui login dedicado');
select ok(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='acionar_runner_capitulos'),'sem wrapper publico');
select * from finish();
rollback;
