-- Inventario APENAS: nao instala extensao, cria job, concede LOGIN ou aciona runner.
-- Executar por sessao administrativa autorizada. Nao comprova identidade do job.
-- Sem senhas, HBA, comandos de jobs, dados de usuarios ou corpos de funcoes.
begin isolation level repeatable read read only;
select current_setting('server_version') as postgres;
select name, default_version, installed_version from pg_available_extensions where name='pg_cron';
select extversion as cron_instalado from pg_extension where extname='pg_cron';
select current_setting('cron.use_background_workers',true) as background_workers,
  current_setting('cron.log_run',true) as log_run,
  case when current_setting('cron.host',true) in ('localhost','127.0.0.1','::1') then 'loopback'
    when current_setting('cron.host',true) is null then 'indisponivel' else 'nao_loopback' end as host;
select rolname, rolcanlogin, rolinherit, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls
  from pg_roles where rolname in ('historietas_capitulo_runner','historietas_agendamento_monitor');
select r.rolname, case when s.setdatabase=0 then 'global_do_papel' else 'banco_especifico' end as escopo,
  conf as configuracao
  from pg_db_role_setting s join pg_roles r on r.oid=s.setrole
  cross join lateral unnest(s.setconfig) conf
  where r.rolname in ('historietas_capitulo_runner','historietas_agendamento_monitor')
    and split_part(conf,'=',1) in ('statement_timeout','lock_timeout','idle_in_transaction_session_timeout','default_transaction_read_only');
select r.rolname, has_function_privilege(r.oid,to_regprocedure('historietas_privado.acionar_runner_capitulos()'),'EXECUTE') as executa_entrada
  from pg_roles r where r.rolname in ('anon','authenticated','service_role','historietas_capitulo_runner');
select r.rolname, count(*) filter (where has_table_privilege(r.oid,c.oid,
  'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')) as relacoes_com_privilegio
  from pg_roles r cross join pg_class c join pg_namespace n on n.oid=c.relnamespace
  where r.rolname in ('historietas_capitulo_runner','historietas_agendamento_monitor')
    and n.nspname in ('public','auth','historietas_privado','storage') and c.relkind in ('r','p','v','m')
  group by r.rolname;
select p.rolname as papel, m.rolname as membro, g.rolname as concedente,
  a.admin_option, a.inherit_option, a.set_option
  from pg_auth_members a join pg_roles p on p.oid=a.roleid
  join pg_roles m on m.oid=a.member join pg_roles g on g.oid=a.grantor
  where p.rolname in ('historietas_capitulo_runner','historietas_agendamento_monitor');
rollback;
