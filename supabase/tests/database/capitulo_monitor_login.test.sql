begin;
select plan(22);
select ok(strpos(pg_get_functiondef('historietas_privado.snapshot_monitor_capitulos()'::regprocedure),
  'from pg_catalog.pg_extension')>0,'snapshot nao consulta catalogo sombreavel por TEMP');
select ok(strpos(pg_get_functiondef('historietas_privado.fonte_monitor_capitulos(bigint)'::regprocedure),
  'from pg_catalog.pg_extension')>0,'verificacao invoker da fonte tambem qualifica catalogo');
select ok((select rolcanlogin and not rolinherit and not rolsuper and not rolcreatedb
  and not rolcreaterole and not rolreplication and not rolbypassrls
  from pg_roles where rolname='historietas_agendamento_monitor_login'),'LOGIN dedicado sem privilegios administrativos');
select ok((select rolpassword is null from pg_authid
  where rolname='historietas_agendamento_monitor_login'),'migration nao cria credencial');
select ok((select not rolcanlogin from pg_roles where rolname='historietas_agendamento_monitor'),'grupo continua NOLOGIN');
select ok((select rolconfig @> array['statement_timeout=5s','lock_timeout=500ms',
  'idle_in_transaction_session_timeout=5s','default_transaction_read_only=on']
  from pg_roles where rolname='historietas_agendamento_monitor_login'),'defaults pertencem tambem a identidade de conexao');
select ok((select not admin_option and not inherit_option and set_option from pg_auth_members
  where member='historietas_agendamento_monitor_login'::regrole
    and roleid='historietas_agendamento_monitor'::regrole),'somente SET explicito, sem heranca nem administracao');
select is((select count(*)::integer from pg_auth_members
  where member='historietas_agendamento_monitor_login'::regrole),1,'nao recebe outros papeis');
select ok(not pg_has_role('historietas_agendamento_monitor_login','historietas_agendamento_monitor','USAGE'),
  'nao herda privilegios do snapshot');
select ok(pg_has_role('historietas_agendamento_monitor_login','historietas_agendamento_monitor','SET'),
  'pode assumir apenas o leitor restrito');
select ok(not has_schema_privilege('historietas_agendamento_monitor_login','historietas_privado','USAGE'),
  'LOGIN nao tem grant direto do schema privado');
select ok(not has_function_privilege('historietas_agendamento_monitor_login',
  'historietas_privado.snapshot_monitor_capitulos()','EXECUTE'),'snapshot exige SET ROLE');
select ok(not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace,
  unnest(array['historietas_agendamento_monitor_login','historietas_agendamento_monitor']) r
  where n.nspname in ('public','auth','storage','historietas_privado') and c.relkind in ('r','p','v','m')
  and (has_table_privilege(r,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
    or has_any_column_privilege(r,c.oid,'SELECT,INSERT,UPDATE,REFERENCES'))),
  'sem acesso geral ou direto as tabelas da aplicacao');
select ok(not exists(select 1 from unnest(array['anon','authenticated','service_role']) r
  where pg_has_role(r,'historietas_agendamento_monitor_login','SET')
    or pg_has_role(r,'historietas_agendamento_monitor','SET')),'API nao assume nenhuma identidade do monitor');
select ok(not pg_has_role('historietas_agendamento_monitor_login','postgres','SET')
  and not pg_has_role('historietas_agendamento_monitor_login','service_role','SET'),'nao assume identidades privilegiadas');
select ok(not (select habilitado from historietas_privado.capitulo_runner_controle),'runner continua desativado');

grant historietas_agendamento_monitor_login to postgres with set true;
create function pg_temp.consultar_como_login(p_sql text) returns text language plpgsql as $$
begin
  execute 'set local role historietas_agendamento_monitor_login';
  execute p_sql;
  execute 'reset role';
  return 'ok';
exception when others then return sqlstate;
end $$;
select is(pg_temp.consultar_como_login('select historietas_privado.snapshot_monitor_capitulos()'),
  '42501','sem SET ROLE nao consulta schema privado');
select is(pg_temp.consultar_como_login('select * from public.profiles'),'42501','nao le perfis diretamente');
-- SET ROLE usa session_user, que neste harness ainda e postgres. A negacao
-- real de escalada e exercitada pela conexao LOGIN/TCP na integracao, alem
-- de pg_has_role acima; nao simular autenticacao com este helper.
select is(pg_temp.consultar_como_login('select * from auth.users'),'42501','nao le Auth diretamente');
select is(pg_temp.consultar_como_login('select * from historietas_privado.capitulo_cache_outbox'),
  '42501','nao le eventos privados diretamente');
select is(pg_temp.consultar_como_login('set local role historietas_agendamento_monitor'),
  'ok','SET ROLE do contrato funciona');
select is(pg_temp.consultar_como_login('update historietas_privado.capitulo_runner_controle set habilitado=true'),
  '42501','nao abre gates');
select * from finish();
rollback;
