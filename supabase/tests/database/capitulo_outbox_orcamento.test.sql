begin;
select no_plan();
select ok((select not habilitado and limite is null and consumidas=0 and pausado and revisao=1
  from historietas_privado.capitulo_cache_orcamento),'instalado desativado, sem limite escolhido');
select ok(not exists(select 1 from unnest(array['anon','authenticated','service_role','historietas_capitulo_runner','historietas_agendamento_monitor']) r,
  unnest(array['capitulo_cache_orcamento','capitulo_cache_orcamento_retomadas']) t
  where has_table_privilege(r,'historietas_privado.'||t,'SELECT,INSERT,UPDATE,DELETE')),'nenhum acesso direto aos saldos/historico');
select ok((select bool_and(relrowsecurity) from pg_class where oid in
  ('historietas_privado.capitulo_cache_orcamento'::regclass,'historietas_privado.capitulo_cache_orcamento_retomadas'::regclass)),'RLS nas duas tabelas privadas');
select ok(not exists(select 1 from unnest(array['anon','authenticated','service_role','historietas_capitulo_runner','historietas_agendamento_monitor']) r
  where has_function_privilege(r,'historietas_privado.retomar_orcamento_cache_capitulos(bigint,bigint,text)','EXECUTE')),'retomada exclusiva de SQL administrativo');
select ok((select not prosecdef and proconfig=array['search_path=""'] from pg_proc
  where oid='historietas_privado.retomar_orcamento_cache_capitulos(bigint,bigint,text)'::regprocedure),'retomada invoker com search_path vazio');
select ok((select prosecdef and pg_get_userbyid(proowner)='postgres' and proconfig=array['search_path=""'] from pg_proc
  where oid='historietas_privado.reivindicar_cache_capitulos(integer)'::regprocedure),'owner/definer/search_path da reivindicacao preservados');
select ok(has_function_privilege('service_role','public.reivindicar_cache_capitulos(integer)','EXECUTE')
  and not has_function_privilege('anon','public.reivindicar_cache_capitulos(integer)','EXECUTE')
  and not has_function_privilege('authenticated','public.reivindicar_cache_capitulos(integer)','EXECUTE'),'wrapper continua somente service_role');
select throws_ok($$select public.reivindicar_cache_capitulos(6)$$,'22023','Lote invalido.','lote maximo anterior preservado');
select throws_ok($$select historietas_privado.retomar_orcamento_cache_capitulos(1,0,'configuracao_validada')$$,'22023',null,'sem limite zero');
select throws_ok($$select historietas_privado.retomar_orcamento_cache_capitulos(1,null,'configuracao_validada')$$,'22023',null,'sem limite implicito');
select throws_ok($$select historietas_privado.retomar_orcamento_cache_capitulos(1,1,'texto livre')$$,'22023',null,'sem justificativa sensivel livre');

-- Somente fixtures na transacao revertida. Os numeros pequenos sao orcamentos
-- de teste, nao valores operacionais recomendados ou instalados.
update historietas_privado.capitulo_cache_outbox set lease_id=gen_random_uuid(),lease_ate=clock_timestamp()+interval '1 hour';
create temp table qa_budget_ids as select gen_random_uuid() a,gen_random_uuid() b;
insert into historietas_privado.capitulo_cache_outbox(id,capitulo_id,revisao_agendada,obra_id,publicado_em)
  select a,gen_random_uuid(),1,gen_random_uuid(),clock_timestamp() from qa_budget_ids union all
  select b,gen_random_uuid(),1,gen_random_uuid(),clock_timestamp() from qa_budget_ids;
select is(jsonb_array_length(public.reivindicar_cache_capitulos(5)),2,'desativado preserva lote legado');
select is((select consumidas from historietas_privado.capitulo_cache_orcamento),0::bigint,'nao contabiliza retroativamente enquanto desativado');
select is(historietas_privado.retomar_orcamento_cache_capitulos(1,1,'configuracao_validada')->>'estado','retomada_registrada','configuracao explicita por revisao');
select ok(not (select habilitado from historietas_privado.capitulo_cache_orcamento),'configurar/retomar nao habilita controle');
select ok(not (select habilitado from historietas_privado.capitulo_runner_controle),'retomada nao habilita runner');
select is(historietas_privado.retomar_orcamento_cache_capitulos(1,1,'configuracao_validada')->>'estado','ja_registrado','resposta administrativa perdida e idempotente');
select is((select count(*) from historietas_privado.capitulo_cache_orcamento_retomadas),1::bigint,'retry nao duplica historico');
select throws_ok($$select historietas_privado.retomar_orcamento_cache_capitulos(1,2,'configuracao_validada')$$,'55000',null,'revisao antiga nao pode alterar parametros');
update historietas_privado.capitulo_cache_orcamento set habilitado=true;
create temp table qa_empty_stamp as select ctid::text stamp,revisao from historietas_privado.capitulo_cache_orcamento;
select is(public.reivindicar_cache_capitulos(5),'[]'::jsonb,'leases ativos nao sao retomados');
select is((select ctid::text from historietas_privado.capitulo_cache_orcamento),(select stamp from qa_empty_stamp),'lote vazio nao reescreve controle');
select is((select consumidas from historietas_privado.capitulo_cache_orcamento),0::bigint,'lote vazio nao debita');
update historietas_privado.capitulo_cache_outbox set lease_ate=clock_timestamp()-interval '1 second' where id in(select a from qa_budget_ids union select b from qa_budget_ids);
create temp table qa_budget_claim as select public.reivindicar_cache_capitulos(5) lote;
select is((select jsonb_array_length(lote) from qa_budget_claim),1,'saldo um limita lote solicitado de cinco a uma linha');
select ok((select consumidas=1 and pausado and revisao=3 from historietas_privado.capitulo_cache_orcamento),'ultimo debito e pausa confirmados atomicamente');
create temp table qa_paused_stamp as select ctid::text stamp from historietas_privado.capitulo_cache_orcamento;
select is(public.reivindicar_cache_capitulos(5),' {"estado":"orcamento_esgotado"}'::jsonb,'esgotamento nao e fila vazia');
select is((select ctid::text from historietas_privado.capitulo_cache_orcamento),(select stamp from qa_paused_stamp),'recusa repetida nao reescreve estado');
select is((select count(*) from historietas_privado.capitulo_cache_outbox where id in(select a from qa_budget_ids union select b from qa_budget_ids)),2::bigint,'nenhum evento perdido');
select is(public.registrar_solicitacao_cache_capitulo(
  (select (lote->0->>'id')::uuid from qa_budget_claim),(select (lote->0->>'leaseId')::uuid from qa_budget_claim)),true,'saturacao nao bloqueia registro de lease valido');
create temp table qa_registered_stamp as select ctid::text stamp,solicitada_em from historietas_privado.capitulo_cache_outbox
  where id=(select (lote->0->>'id')::uuid from qa_budget_claim);
select is(public.registrar_solicitacao_cache_capitulo(
  (select (lote->0->>'id')::uuid from qa_budget_claim),(select (lote->0->>'leaseId')::uuid from qa_budget_claim)),true,'retry do registro continua valido');
select is((select ctid::text from historietas_privado.capitulo_cache_outbox where id=(select (lote->0->>'id')::uuid from qa_budget_claim)),
  (select stamp from qa_registered_stamp),'#2257 preservada durante pausa');
select is(historietas_privado.retomar_orcamento_cache_capitulos(1,1,'configuracao_validada')->>'estado','ja_registrado','retry antigo reconhecido sem reabrir pausa nova');
select ok((select pausado and limite=1 and consumidas=1 from historietas_privado.capitulo_cache_orcamento),'retry antigo nao devolve saldo');
select throws_ok($$select historietas_privado.retomar_orcamento_cache_capitulos(2,2,'capacidade_reavaliada')$$,'55000',null,'CAS obsoleto recusado');
select throws_ok($$select historietas_privado.retomar_orcamento_cache_capitulos(3,1,'capacidade_reavaliada')$$,'55000',null,'retomada exige novo saldo explicito');
select is(historietas_privado.retomar_orcamento_cache_capitulos(3,2,'capacidade_reavaliada')->>'estado','retomada_registrada','retomada amplia teto sem reset');
select is((select consumidas from historietas_privado.capitulo_cache_orcamento),1::bigint,'consumo acumulado preservado');
select is(jsonb_array_length(public.reivindicar_cache_capitulos(5)),1,'pendencia restante continua recuperavel');
select ok((select consumidas=2 and pausado from historietas_privado.capitulo_cache_orcamento),'novo saldo esgota sem excesso');
update historietas_privado.capitulo_cache_orcamento set limite=3,pausado=true;
select is(public.reivindicar_cache_capitulos(1),' {"estado":"orcamento_pausado"}'::jsonb,'pausa com saldo nao e fila vazia');
select ok(not (select habilitado from historietas_privado.capitulo_runner_controle),'nenhuma ativacao operacional');
select * from finish();
rollback;
