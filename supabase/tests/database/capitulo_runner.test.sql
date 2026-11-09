begin;
select no_plan();
-- BEGIN RUNNER FIXTURE (exclusivamente banco descartavel)
insert into auth.users(id) values ('b6100000-0000-4000-8000-000000000001') on conflict do nothing;
insert into public.profiles(id,user_id,nome,tipo) values
 ('b6100000-0000-4000-8000-000000000001','b6100000-0000-4000-8000-000000000001','QA runner','autor');
select set_config('request.jwt.claim.sub','b6100000-0000-4000-8000-000000000001',true);
select public.aceitar_termos_publicacao('2026-08-05','2026-08-05','2026-08-05');
insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,publicado,slug) values
 ('b6200000-0000-4000-8000-000000000001','b6100000-0000-4000-8000-000000000001','Obra runner','QA','Fantasia','Romance','Livre',true,'qa-runner');
insert into public.capitulos(id,obra_id,user_id,titulo,texto,ordem,publicado)
 select ('b6300000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,
 'b6200000-0000-4000-8000-000000000001','b6100000-0000-4000-8000-000000000001',
 'Capitulo '||i,'Texto de teste privado.',i,false from generate_series(1,12) i;
insert into auth.sessions(id,user_id) values
 ('b6500000-0000-4000-8000-000000000001','b6100000-0000-4000-8000-000000000001');
select set_config('request.jwt.claim.sub','',true);
-- END RUNNER FIXTURE

create function pg_temp.preparar_runner(p_num integer) returns void language plpgsql as $$
declare v_id uuid := ('b6300000-0000-4000-8000-'||lpad(p_num::text,12,'0'))::uuid;
begin
 perform set_config('request.jwt.claim.sub','b6100000-0000-4000-8000-000000000001',true);
 perform set_config('request.jwt.claims','{"sub":"b6100000-0000-4000-8000-000000000001","session_id":"b6500000-0000-4000-8000-000000000001"}',true);
 perform public.agendar_capitulo(v_id,0,'2099-01-01Z','UTC');
 perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{}',true);
 update historietas_privado.capitulo_agendamentos set publicar_em=now()-interval '1 hour' where capitulo_id=v_id;
end;
$$;
select is(historietas_privado.executar_runner_capitulos()->>'estado','desativado','instalacao nao executa');
select ok(not (select habilitado from historietas_privado.capitulo_runner_controle),'gate permanece falso');
select ok(not exists (select 1 from pg_proc where oid in
 ('historietas_privado.executar_runner_capitulos(integer,integer)'::regprocedure,
 'historietas_privado.metricas_runner_capitulos()'::regprocedure) and prosecdef),'runner e metricas invoker');
select ok(not exists(select 1 from unnest(array['anon','authenticated','service_role']) r
 where has_function_privilege(r,'historietas_privado.executar_runner_capitulos(integer,integer)','EXECUTE')
 or has_function_privilege(r,'historietas_privado.metricas_runner_capitulos()','EXECUTE')
 or has_table_privilege(r,'historietas_privado.capitulo_runner_controle','SELECT,INSERT,UPDATE,DELETE')
 or has_table_privilege(r,'historietas_privado.capitulo_runner_tentativas','SELECT,INSERT,UPDATE,DELETE')),'nenhuma API le/escreve/ativa o runner');
select ok((select bool_and(relrowsecurity) from pg_class where oid in
 ('historietas_privado.capitulo_runner_controle'::regclass,'historietas_privado.capitulo_runner_tentativas'::regclass)),'RLS nas tabelas privadas');
select throws_ok($$select historietas_privado.executar_runner_capitulos(6,2000)$$,'22023',null,'lote limitado');
select throws_ok($$select historietas_privado.executar_runner_capitulos(1,5001)$$,'22023',null,'orcamento limitado');
update historietas_privado.capitulo_runner_controle set habilitado=true;
set local statement_timeout='0';
select throws_ok($$select historietas_privado.executar_runner_capitulos()$$,'22023',null,'sem timeout previo nao executa');
set local statement_timeout='10s';
set local lock_timeout='0';
select throws_ok($$select historietas_privado.executar_runner_capitulos()$$,'22023',null,'sem lock timeout nao executa');
set local lock_timeout='100ms';
select pg_temp.preparar_runner(n) from generate_series(1,3) n;
select is((historietas_privado.metricas_runner_capitulos()->>'atrasados')::integer,3,'backlog contabilizado');
select cmp_ok((historietas_privado.metricas_runner_capitulos()->>'atrasoMaximoSegundos')::numeric,'>=',3600::numeric,'atraso medido');
select is((historietas_privado.executar_runner_capitulos(2,5000)->>'sucessos')::integer,2,'somente dois itens do backlog');
select is((historietas_privado.metricas_runner_capitulos()->>'pendencias')::integer,1,'restante preservado');
select is((historietas_privado.executar_runner_capitulos(2,5000)->>'sucessos')::integer,1,'recupera o restante');
select is((historietas_privado.executar_runner_capitulos()->>'tentativas')::integer,0,'retry de resposta perdida nao republica');
select is((select count(*)::integer from historietas_privado.capitulo_cache_outbox where obra_id='b6200000-0000-4000-8000-000000000001'),3,'uma outbox por publicacao');

select pg_temp.preparar_runner(4);
savepoint lote;
select is((historietas_privado.executar_runner_capitulos()->>'sucessos')::integer,1,'publica dentro da transacao');
rollback to lote;
select ok(not (select publicado from public.capitulos where ordem=4 and obra_id='b6200000-0000-4000-8000-000000000001'),'rollback reverte publicacao');
select is((historietas_privado.metricas_runner_capitulos()->>'sucessos')::integer,3,'rollback reverte telemetria');
select is((historietas_privado.executar_runner_capitulos()->>'sucessos')::integer,1,'nova transacao pode recuperar');

create function pg_temp.falhar_runner() returns trigger language plpgsql as $$
begin raise exception 'Erro controlado de QA.' using errcode='XX000'; end;
$$;
create trigger zz_qa_runner_falha after insert on historietas_privado.capitulo_publicacao_eventos
 for each row execute function pg_temp.falhar_runner();
select pg_temp.preparar_runner(5);
select is((historietas_privado.executar_runner_capitulos()->>'erros')::integer,1,'falha registrada sem falso sucesso');
select ok(not (select publicado from public.capitulos where ordem=5 and obra_id='b6200000-0000-4000-8000-000000000001'),'falha reverte capitulo');
select is((select count(*)::integer from public.diario_atividades where capitulo_id='b6300000-0000-4000-8000-000000000005'),0,'falha reverte Diario');
select is((historietas_privado.executar_runner_capitulos()->>'tentativas')::integer,0,'sem retry imediato');
select pg_temp.preparar_runner(6);
drop trigger zz_qa_runner_falha on historietas_privado.capitulo_publicacao_eventos;
-- O erro antigo ja e elegivel: provar prioridade do backlog nao atendido,
-- em vez de passar apenas porque a falha ainda estava no cooldown.
update historietas_privado.capitulo_runner_tentativas set proxima_em=now()-interval '1 minute'
 where capitulo_id='b6300000-0000-4000-8000-000000000005';
update historietas_privado.capitulo_agendamentos set executado_em=now()-interval '2 minutes'
 where capitulo_id='b6300000-0000-4000-8000-000000000005';
select is((historietas_privado.executar_runner_capitulos(1,5000)->>'sucessos')::integer,1,'falha antiga nao bloqueia backlog novo');
select ok((select publicado from public.capitulos where id='b6300000-0000-4000-8000-000000000006'),'intencao ainda nao atendida tem prioridade');
select ok(not (select publicado from public.capitulos where id='b6300000-0000-4000-8000-000000000005'),'retry antigo elegivel nao monopoliza o lote');
update historietas_privado.capitulo_runner_tentativas set proxima_em=now()-interval '1 minute'
 where capitulo_id='b6300000-0000-4000-8000-000000000005';
update historietas_privado.capitulo_agendamentos set executado_em=now()-interval '2 minutes'
 where capitulo_id='b6300000-0000-4000-8000-000000000005';
select is((historietas_privado.executar_runner_capitulos()->>'sucessos')::integer,1,'retry recupera depois do cooldown');
select is((select tentativas from historietas_privado.capitulo_runner_tentativas where capitulo_id='b6300000-0000-4000-8000-000000000005'),2,'tentativas por revisao');
select pg_temp.preparar_runner(7);
update auth.users set banned_until=now()+interval '1 day' where id='b6100000-0000-4000-8000-000000000001';
select is((historietas_privado.executar_runner_capitulos()->>'sucessos')::integer,0,'runner nao contorna autorizacao atual');
select is((select estado from historietas_privado.capitulo_agendamentos where capitulo_id='b6300000-0000-4000-8000-000000000007'),'bloqueado','autorizacao revogada bloqueia intencao');
select ok(not (historietas_privado.metricas_runner_capitulos() ? 'capitulo_id'),'metricas nao expoem identidade');
select is((select count(*)::integer from historietas_privado.capitulo_cache_outbox where obra_id='b6200000-0000-4000-8000-000000000001'),6,'outbox conservada, sem ACK ou limpeza');
select * from finish();
rollback;
