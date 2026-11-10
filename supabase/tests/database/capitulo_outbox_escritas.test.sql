begin;
select no_plan();
create temp table qa_outbox_escritas as select gen_random_uuid() id,gen_random_uuid() lease;
create temp table qa_outbox_antes as select md5(coalesce(jsonb_agg(to_jsonb(b) order by id)::text,'[]')) hash
  from historietas_privado.capitulo_cache_outbox b;
insert into historietas_privado.capitulo_cache_outbox
  (id,capitulo_id,revisao_agendada,obra_id,publicado_em,lease_id,lease_ate)
  select id,gen_random_uuid(),1,gen_random_uuid(),clock_timestamp(),lease,clock_timestamp()+interval '5 minutes'
  from qa_outbox_escritas;
select ok((select prosecdef and pg_get_userbyid(proowner)='postgres' and proconfig=array['search_path=""']
  from pg_proc where oid='historietas_privado.registrar_solicitacao_cache_capitulo(uuid,uuid)'::regprocedure),'definer/owner/search_path preservados');
select ok(not exists(select 1 from unnest(array['anon','authenticated','historietas_capitulo_runner','historietas_agendamento_monitor']) r
  where has_function_privilege(r,'historietas_privado.registrar_solicitacao_cache_capitulo(uuid,uuid)','EXECUTE')),'sem ampliacao de grants');
select ok(has_function_privilege('service_role','public.registrar_solicitacao_cache_capitulo(uuid,uuid)','EXECUTE'),'wrapper do consumidor preservado');
select ok(not has_table_privilege('service_role','historietas_privado.capitulo_cache_outbox','SELECT,UPDATE,DELETE'),'sem acesso direto de service role');
update historietas_privado.capitulo_runner_capacidade set limite_eventos=(select count(*) from historietas_privado.capitulo_cache_outbox);
select throws_ok($$insert into historietas_privado.capitulo_cache_outbox(capitulo_id,revisao_agendada,obra_id,publicado_em)
  values(gen_random_uuid(),1,gen_random_uuid(),clock_timestamp())$$,'54000',null,'fila saturada continua recusando novo evento');
select is(public.registrar_solicitacao_cache_capitulo((select id from qa_outbox_escritas),(select lease from qa_outbox_escritas)),true,'primeiro registro valido');
create temp table qa_outbox_registrada as select b.ctid::text localizacao,b.solicitada_em,
  pg_stat_get_xact_tuples_updated('historietas_privado.capitulo_cache_outbox'::regclass) atualizacoes
  from historietas_privado.capitulo_cache_outbox b join qa_outbox_escritas q using(id);
select ok((select solicitada_em is not null from qa_outbox_registrada),'solicitacao registrada');
select ok((select (historietas_privado.medir_capacidade_capitulos()->>'bloqueio')='eventos'),'recuperacao continua possivel com fila saturada');
select ok(bool_and(public.registrar_solicitacao_cache_capitulo(q.id,q.lease)), 'mil retries validos continuam retornando true')
  from qa_outbox_escritas q cross join generate_series(1,1000);
select is((select b.ctid::text from historietas_privado.capitulo_cache_outbox b join qa_outbox_escritas q using(id)),
  (select localizacao from qa_outbox_registrada),'retry nao cria outra versao da tupla');
select is(pg_stat_get_xact_tuples_updated('historietas_privado.capitulo_cache_outbox'::regclass),
  (select atualizacoes from qa_outbox_registrada),'retry nao executa UPDATE efetivo');
select is((select b.solicitada_em from historietas_privado.capitulo_cache_outbox b join qa_outbox_escritas q using(id)),
  (select solicitada_em from qa_outbox_registrada),'timestamp original imutavel no retry');
select throws_ok($$select public.registrar_solicitacao_cache_capitulo((select id from qa_outbox_escritas),gen_random_uuid())$$,'55000','Lease indisponivel.','lease incorreto negado mesmo apos solicitacao');
select throws_ok($$select public.registrar_solicitacao_cache_capitulo(gen_random_uuid(),gen_random_uuid())$$,'55000','Lease indisponivel.','evento ausente negado');
update historietas_privado.capitulo_cache_outbox set lease_ate=clock_timestamp()-interval '1 second'
  where id=(select id from qa_outbox_escritas);
select throws_ok($$select public.registrar_solicitacao_cache_capitulo((select id from qa_outbox_escritas),(select lease from qa_outbox_escritas))$$,'55000','Lease indisponivel.','lease expirado negado mesmo apos solicitacao');
update qa_outbox_escritas set lease=gen_random_uuid();
update historietas_privado.capitulo_cache_outbox b set lease_id=q.lease,lease_ate=clock_timestamp()+interval '5 minutes',tentativas=tentativas+1
  from qa_outbox_escritas q where b.id=q.id;
create temp table qa_outbox_reivindicada as select b.ctid::text localizacao from historietas_privado.capitulo_cache_outbox b join qa_outbox_escritas q using(id);
select is(public.registrar_solicitacao_cache_capitulo((select id from qa_outbox_escritas),(select lease from qa_outbox_escritas)),true,'novo lease valido permite recuperacao');
select is((select b.ctid::text from historietas_privado.capitulo_cache_outbox b join qa_outbox_escritas q using(id)),
  (select localizacao from qa_outbox_reivindicada),'novo lease nao reescreve solicitacao existente');
select is((select b.solicitada_em from historietas_privado.capitulo_cache_outbox b join qa_outbox_escritas q using(id)),
  (select solicitada_em from qa_outbox_registrada),'reivindicacao nao apaga o primeiro registro');
select is((select md5(coalesce(jsonb_agg(to_jsonb(b) order by id)::text,'[]')) from historietas_privado.capitulo_cache_outbox b
  where b.id<>(select id from qa_outbox_escritas)),(select hash from qa_outbox_antes),'todas as pendencias anteriores intactas');
select ok(not (select habilitado from historietas_privado.capitulo_runner_controle),'runner permanece fechado');
select * from finish();
rollback;
