begin;
select no_plan();
select is(historietas_privado.observar_runner_capitulos()->>'estado','nao_configurado','sem fonte nao inventa observacao');
select ok(not (select habilitado from historietas_privado.capitulo_runner_controle),'nenhuma ativacao');
select ok(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname in ('observar_runner_capitulos','retomar_monitor_capitulos','saude_runner_capitulos')),'sem API publica');
select ok(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace,
  unnest(array['anon','authenticated','service_role','historietas_capitulo_runner']) r
  where n.nspname='historietas_privado' and p.proname in ('fonte_monitor_capitulos',
  'configurar_monitor_capitulos','pausar_monitor_capitulos','observar_runner_capitulos',
  'retomar_monitor_capitulos','proteger_pausa_runner_capitulos','saude_runner_capitulos')
  and (p.prosecdef or has_function_privilege(r,p.oid,'EXECUTE'))),'invoker sem EXECUTE para API/runner');
select ok(not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace,
  unnest(array['anon','authenticated','service_role','historietas_capitulo_runner']) r
  where n.nspname='historietas_privado' and c.relname in ('capitulo_runner_monitor',
    'capitulo_runner_observacoes','capitulo_runner_incidentes')
  and (not c.relrowsecurity or has_table_privilege(r,c.oid,'SELECT,INSERT,UPDATE,DELETE'))),'RLS e nenhuma concessao privada');
select throws_ok($$select historietas_privado.observar_runner_capitulos(101)$$,'22023',null,'lote limitado');
select throws_ok($$select historietas_privado.retomar_monitor_capitulos(1,'texto livre')$$,'22023',null,'sem texto sensivel no log');
select throws_ok($$select historietas_privado.retomar_monitor_capitulos(1,'causa_corrigida')$$,'55000',null,'retomada exige monitor');
-- Estado privado simulado apenas nesta transacao para verificar o gate.
insert into historietas_privado.capitulo_runner_monitor(job_id,extensao_oid,identidade_job,intervalo_segundos)
  values(1,0,'{}',60);
insert into historietas_privado.capitulo_runner_incidentes(revisao,motivo) values(1,'configuracao');
select throws_ok($$update historietas_privado.capitulo_runner_controle set habilitado=true$$,'55000',null,'pausa nao pode ser contornada por habilitacao isolada');
update historietas_privado.capitulo_runner_monitor set pausado=false;
select lives_ok($$update historietas_privado.capitulo_runner_controle set habilitado=true$$,'contrato anterior permanece apos revisao administrativa');
select historietas_privado.pausar_monitor_capitulos('tres_falhas');
select ok((select pausado from historietas_privado.capitulo_runner_monitor),'pausa persistente');
select ok(not (select habilitado from historietas_privado.capitulo_runner_controle),'pausa fecha gate');
select is((select revisao from historietas_privado.capitulo_runner_monitor),2::bigint,'revisao de incidente avanca');
select historietas_privado.pausar_monitor_capitulos('tres_falhas');
select is((select count(*) from historietas_privado.capitulo_runner_incidentes),2::bigint,'pausa repetida idempotente');
select throws_ok($$select historietas_privado.retomar_monitor_capitulos(1,'causa_corrigida')$$,'55000',null,'revisao antiga rejeitada');
select ok(not (historietas_privado.saude_runner_capitulos() ? 'capitulo_id'),'saude agregada sem identidade');
select ok(historietas_privado.saude_runner_capitulos() ?& array['retriesEsgotados','atrasados','outboxSemConfirmacao','incidentesAbertos'],'saude reutiliza metricas existentes');
select * from finish();
rollback;
