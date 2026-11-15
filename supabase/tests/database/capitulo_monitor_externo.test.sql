begin;
select plan(18);
select ok((select not rolcanlogin and not rolinherit and not rolsuper and not rolcreaterole
  and not rolcreatedb and not rolbypassrls from pg_roles where rolname='historietas_agendamento_monitor'),'papel nasce restrito e NOLOGIN');
select ok((select rolconfig @> array['statement_timeout=5s','lock_timeout=500ms',
  'idle_in_transaction_session_timeout=5s','default_transaction_read_only=on']
  from pg_roles where rolname='historietas_agendamento_monitor'),'timeouts e read only previos');
select ok((select prosecdef and proowner='postgres'::regrole and proconfig=array['search_path=""']
  from pg_proc where oid='historietas_privado.snapshot_monitor_capitulos()'::regprocedure),'definer privado qualificado');
select ok(not exists(select 1 from unnest(array['anon','authenticated','service_role','historietas_capitulo_runner']) r
  where has_function_privilege(r,'historietas_privado.snapshot_monitor_capitulos()','execute')),'API e executor sem acesso');
select ok(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='snapshot_monitor_capitulos'),'nenhum endpoint publico');
select ok(has_function_privilege('historietas_agendamento_monitor','historietas_privado.snapshot_monitor_capitulos()','execute'),'somente leitura agregada permitida');
select ok(not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname in ('historietas_privado','auth') and c.relkind in ('r','p')
  and has_table_privilege('historietas_agendamento_monitor',c.oid,'SELECT,INSERT,UPDATE,DELETE')),'sem acesso direto a dados privados');
select ok(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace,
  lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
  where n.nspname='historietas_privado' and a.grantee='historietas_agendamento_monitor'::regrole
  and p.oid<>'historietas_privado.snapshot_monitor_capitulos()'::regprocedure),'nenhum outro grant privado');
select is((historietas_privado.snapshot_monitor_capitulos()->>'versao')::int,1,'contrato versionado');
select ok(historietas_privado.snapshot_monitor_capitulos() ?& array['agora','saude','capacidade','fonteValida','ultimaExecucaoCron'],'reutiliza saude/capacidade e fonte existente');
select ok(not (select habilitado from historietas_privado.capitulo_runner_controle),'nao habilita runner');
select ok(not exists(select 1 from jsonb_object_keys(historietas_privado.snapshot_monitor_capitulos()) k
  where k not in ('versao','agora','saude','capacidade','recursos','operacoesCache','fonteValida','ultimaExecucaoCron')),'retorno superior limitado');
grant historietas_agendamento_monitor to postgres with set true;
-- pgTAP fica com a sessao administrativa; a operacao testada usa o papel real.
-- Nao conceder USAGE de extensions ou acesso aos caches de pgTAP ao monitor.
create function pg_temp.consultar_como_monitor(p_sql text) returns text language plpgsql as $$
begin
  execute 'set local role historietas_agendamento_monitor';
  execute p_sql;
  execute 'reset role';
  return 'ok';
exception when others then return sqlstate;
end $$;
select is(pg_temp.consultar_como_monitor('select historietas_privado.snapshot_monitor_capitulos()'),'ok','leitor restrito consulta snapshot');
select is(pg_temp.consultar_como_monitor('select * from auth.users'),'42501','nao le Auth');
select is(pg_temp.consultar_como_monitor('select historietas_privado.observar_runner_capitulos()'),'42501','nao altera observador');
select is(pg_temp.consultar_como_monitor('select historietas_privado.acionar_runner_capitulos()'),'42501','nao executa publicacoes');
select is(pg_temp.consultar_como_monitor('update historietas_privado.capitulo_runner_controle set habilitado=true'),'42501','nao abre gate');
select is(pg_temp.consultar_como_monitor('select historietas_privado.retomar_monitor_capitulos(1,''causa_corrigida'')'),'42501','nao remove pausas');
select * from finish();
rollback;
