begin;
select no_plan();
select ok(not (select habilitado from historietas_privado.capitulo_runner_controle),'runner segue desativado');
select is((select limite_eventos from historietas_privado.capitulo_runner_capacidade),10000,'orcamento limitado de eventos');
select ok(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace,
  unnest(array['anon','authenticated','service_role','historietas_capitulo_runner']) r
  where n.nspname='historietas_privado' and p.proname in ('medir_capacidade_capitulos',
    'proteger_limite_eventos_outbox','verificar_capacidade_runner_capitulos','retomar_capacidade_runner_capitulos',
    'proteger_pausa_capacidade_capitulos','proteger_orcamento_capitulos')
  and (p.prosecdef or has_function_privilege(r,p.oid,'EXECUTE'))),'invoker privado sem concessoes de API/runner');
select ok(not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace,
  unnest(array['anon','authenticated','service_role','historietas_capitulo_runner']) r
  where n.nspname='historietas_privado' and c.relname in ('capitulo_runner_capacidade','capitulo_capacidade_incidentes')
  and (not c.relrowsecurity or has_table_privilege(r,c.oid,'SELECT,INSERT,UPDATE,DELETE'))),'RLS e grants minimos');
select ok(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname like '%capacidade%capitulos%'),'sem wrapper publico');
select ok(historietas_privado.medir_capacidade_capitulos() ?& array['eventos','outboxTabelaBytes','outboxIndicesBytes',
  'notificacoesBytes','bancoBytes','alerta','contagemLimitada'],'medidas reais e alerta agregados');
select is((historietas_privado.medir_capacidade_capitulos()->>'outboxBytes')::bigint,
  pg_total_relation_size('historietas_privado.capitulo_cache_outbox'),'inclui indices e toast');
select throws_ok($$update historietas_privado.capitulo_runner_capacidade set limite_eventos=10001$$,'23514',null,'sem ampliacao silenciosa');
select throws_ok($$select historietas_privado.retomar_capacidade_runner_capitulos(1,'texto livre')$$,'22023',null,'justificativa fechada');
-- Apenas eventos sinteticos desta transacao; nenhum evento anterior e removido.
create temp table capacidade_seed as select count(*) as antes,
 (select count(*) from historietas_privado.capitulo_capacidade_incidentes) as incidentes_antes,
 (select revisao from historietas_privado.capitulo_runner_capacidade) as revisao_antes
 from historietas_privado.capitulo_cache_outbox;
create function pg_temp.retomar_capacidade(p_offset integer) returns jsonb language sql as $$
 select historietas_privado.retomar_capacidade_runner_capitulos(
   (select revisao_antes+p_offset from pg_temp.capacidade_seed),'capacidade_revisada'); $$;
update historietas_privado.capitulo_runner_capacidade set limite_eventos=(select antes+2 from capacidade_seed),alerta_percentual=50;
insert into historietas_privado.capitulo_cache_outbox(capitulo_id,revisao_agendada,obra_id,publicado_em,solicitada_em)
 values('b8100000-0000-4000-8000-000000000001',1,'b8200000-0000-4000-8000-000000000001',now(),now());
select ok((historietas_privado.medir_capacidade_capitulos()->>'alerta')::boolean,'aviso antes do limite');
select is(historietas_privado.verificar_capacidade_runner_capitulos()->>'estado','disponivel','ultima vaga ainda disponivel');
create temp table capacidade_admissoes as select admissoes from historietas_privado.capitulo_runner_capacidade;
insert into historietas_privado.capitulo_cache_outbox(capitulo_id,revisao_agendada,obra_id,publicado_em)
 values('b8100000-0000-4000-8000-000000000001',1,'b8200000-0000-4000-8000-000000000001',now()) on conflict do nothing;
select is((select admissoes from historietas_privado.capitulo_runner_capacidade),
  (select admissoes from capacidade_admissoes),'retry idempotente nao consome capacidade');
insert into historietas_privado.capitulo_cache_outbox(capitulo_id,revisao_agendada,obra_id,publicado_em)
 values('b8100000-0000-4000-8000-000000000002',1,'b8200000-0000-4000-8000-000000000001',now());
select throws_ok($$insert into historietas_privado.capitulo_cache_outbox(capitulo_id,revisao_agendada,obra_id,publicado_em)
 values(gen_random_uuid(),1,gen_random_uuid(),now())$$,'54000',null,'INSERT efetivo nao ultrapassa o limite');
select is(historietas_privado.verificar_capacidade_runner_capitulos()->>'motivo','eventos','pausa duravel antes de executar');
select is((select count(*) from historietas_privado.capitulo_cache_outbox),(select antes+2 from capacidade_seed),
  'preserva inclusive evento com solicitada_em: nao e ACK');
select throws_ok($$update historietas_privado.capitulo_runner_controle set habilitado=true$$,'55000',null,'nao habilita pausa isoladamente');
select is((select count(*) from historietas_privado.capitulo_capacidade_incidentes),
 (select incidentes_antes+1 from capacidade_seed),'um incidente');
select historietas_privado.verificar_capacidade_runner_capitulos();
select is((select count(*) from historietas_privado.capitulo_capacidade_incidentes),
 (select incidentes_antes+1 from capacidade_seed),'pausa repetida nao gera crescimento');
select throws_ok($$select pg_temp.retomar_capacidade(1)$$,
  '55000',null,'nao retoma acima do limite');
update historietas_privado.capitulo_runner_capacidade set limite_eventos=(select antes+3 from capacidade_seed);
select throws_ok($$select pg_temp.retomar_capacidade(1000)$$,
  '55000',null,'revisao antiga rejeitada');
select is(pg_temp.retomar_capacidade(1)->>'estado','retomada_registrada','retomada explicita');
select ok(not (select habilitado from historietas_privado.capitulo_runner_controle),'retomar nao ativa');
insert into historietas_privado.capitulo_cache_outbox(capitulo_id,revisao_agendada,obra_id,publicado_em)
 values('b8100000-0000-4000-8000-000000000003',1,'b8200000-0000-4000-8000-000000000001',now());
select historietas_privado.verificar_capacidade_runner_capitulos();
select is(pg_temp.retomar_capacidade(1)->>'estado','ja_registrado','resposta perdida idempotente');
select ok((select pausado from historietas_privado.capitulo_runner_capacidade),'retry antigo nao remove pausa nova');
select is((select revisao from historietas_privado.capitulo_runner_capacidade),
 (select revisao_antes+2 from capacidade_seed),'revisao monotona');
update historietas_privado.capitulo_runner_capacidade set limite_eventos=(select antes+4 from capacidade_seed);
select pg_temp.retomar_capacidade(2);
savepoint medicao;
create or replace function historietas_privado.medir_capacidade_capitulos() returns jsonb language plpgsql
 security invoker set search_path='' as $$begin raise exception 'Nao copiar conteudo sensivel.' using errcode='42501'; end;$$;
select is(historietas_privado.verificar_capacidade_runner_capitulos()->>'motivo','medicao_indisponivel','falha de medicao fecha gate');
select is((select medidas from historietas_privado.capitulo_capacidade_incidentes order by revisao desc limit 1),'{}'::jsonb,'nao grava SQLERRM');
rollback to medicao;
savepoint fonte;
delete from historietas_privado.capitulo_runner_capacidade;
select is(historietas_privado.verificar_capacidade_runner_capitulos()->>'estado','capacidade_indisponivel','configuracao ausente falha fechada');
rollback to fonte;
savepoint bytes;
update historietas_privado.capitulo_runner_capacidade set limite_outbox_bytes=1;
select is(historietas_privado.verificar_capacidade_runner_capitulos()->>'motivo','outbox_bytes','inclui crescimento fisico da outbox');
rollback to bytes;
savepoint notificacoes;
update historietas_privado.capitulo_runner_capacidade set limite_notificacoes_bytes=1;
select is(historietas_privado.verificar_capacidade_runner_capitulos()->>'motivo','notificacoes_bytes','mede indices das notificacoes');
rollback to notificacoes;
savepoint banco;
update historietas_privado.capitulo_runner_capacidade set limite_banco_bytes=1;
select is(historietas_privado.verificar_capacidade_runner_capitulos()->>'motivo','banco_bytes','banco compartilhado tambem freia');
rollback to banco;
insert into historietas_privado.capitulo_capacidade_incidentes(revisao,motivo,medidas)
 select (select coalesce(max(revisao),0) from historietas_privado.capitulo_capacidade_incidentes)+i,'eventos','{}'
 from generate_series(1,100-(select count(*)::integer from historietas_privado.capitulo_capacidade_incidentes)) i;
select is(historietas_privado.verificar_capacidade_runner_capitulos()->>'motivo','incidentes','saturacao de logs pausa sem apagar evidencia');
select is((select count(*) from historietas_privado.capitulo_capacidade_incidentes),100::bigint,'nenhum incidente apagado nem log ilimitado');
select throws_ok($$select pg_temp.retomar_capacidade(3)$$,'55000',null,'saturacao exige tratamento separado');
select * from finish();
rollback;
