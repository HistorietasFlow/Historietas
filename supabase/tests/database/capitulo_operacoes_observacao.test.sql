begin;
select no_plan();
select ok(not (select prosecdef from pg_proc where oid='historietas_privado.observar_operacoes_cache()'::regprocedure),'Helper invoker sem privilegio novo');
select ok(not exists(select 1 from unnest(array['anon','authenticated','service_role','historietas_capitulo_runner','historietas_agendamento_monitor']) r
  where has_function_privilege(r,'historietas_privado.observar_operacoes_cache()','execute')),'Nenhum acesso direto ao helper');
select ok((select prosrc not ilike '%for update%' from pg_proc where oid='historietas_privado.observar_operacoes_cache()'::regprocedure),'Observacao nao toma lock de escrita');
create temp table antes as select to_jsonb(g) g,to_jsonb(b) b,
  historietas_privado.observar_operacoes_cache() observacao,
  (select md5(coalesce(jsonb_agg(to_jsonb(e) order by id)::text,'[]')) from historietas_privado.capitulo_cache_outbox e) outbox
  from historietas_privado.capitulo_cache_operacoes_controle g cross join historietas_privado.capitulo_cache_orcamento b;
select is(historietas_privado.snapshot_monitor_capitulos()#>>'{operacoesCache,estado}','observado','Snapshot integra ledger privado');
select is(historietas_privado.observar_operacoes_cache()#>>'{retencao,politica}','integral_sem_purga','Retencao conservadora explicita');
select is(historietas_privado.observar_operacoes_cache()#>'{retencao,limiteAprovadoBytes}','null'::jsonb,'Nao inventa limite');
select ok((historietas_privado.observar_operacoes_cache()#>>'{retencao,relacoesBytes}')::bigint>0,'Mede relacoes e indices');
select ok(not(historietas_privado.observar_operacoes_cache()::text ~ 'usuario_id|sessao_id|session_id|operacaoId|lease_id|resultado|slug'),'Sem identidades ou conteudo');
savepoint ausente;
delete from historietas_privado.capitulo_cache_orcamento;
select is(historietas_privado.observar_operacoes_cache()->>'estado','indisponivel','Configuracao ausente nao vira saldo zero');
rollback to ausente;
savepoint fixture;
insert into auth.users(id,raw_app_meta_data) values('cd150000-0000-4000-8000-000000000001','{"role":"admin"}');
insert into auth.sessions(id,user_id) values('cd150000-0000-4000-8000-000000000002','cd150000-0000-4000-8000-000000000001');
update historietas_privado.capitulo_cache_operacoes_controle set habilitado=true,pausado=false;
select historietas_privado.admitir_operacao_cache('cd150000-0000-4000-8000-000000000003','cd150000-0000-4000-8000-000000000001','cd150000-0000-4000-8000-000000000002',1);
select is((historietas_privado.observar_operacoes_cache()#>>'{contagens,admitidas}')::int,1,'Observa intencao sem recibo');
select is(historietas_privado.observar_operacoes_cache()#>>'{integridade,gateConsistente}','true','Gate fechado corresponde a intencao');
select is(historietas_privado.admitir_operacao_cache('cd150000-0000-4000-8000-000000000004','cd150000-0000-4000-8000-000000000001','cd150000-0000-4000-8000-000000000002',1)->>'estado','admissao_bloqueada','Observacao nao permite nova admissao');
select throws_ok($$select historietas_privado.retomar_operacoes_cache((select revisao from historietas_privado.capitulo_cache_operacoes_controle),'causa_corrigida')$$,'55000',null,'Pendencia impede retomada');
select historietas_privado.reconciliar_operacao_cache('cd150000-0000-4000-8000-000000000003','cd150000-0000-4000-8000-000000000001','cd150000-0000-4000-8000-000000000002',1);
select is((historietas_privado.observar_operacoes_cache()#>>'{contagens,admitidas}')::int,0,'Reconciliacao remove incerteza de claim');
select is((historietas_privado.observar_operacoes_cache()#>>'{contagens,encerradas}')::int,(select (observacao#>>'{contagens,encerradas}')::int+1 from antes),'Tombstone continua observavel');
select is(historietas_privado.observar_operacoes_cache()#>>'{protocolo,pausado}','true','Observacao nao retoma nem apaga evidencia');
select is(historietas_privado.observar_operacoes_cache()#>>'{integridade,divergencias}','0','Tombstone nao e divergencia');
rollback to fixture;
select is((select to_jsonb(g) from historietas_privado.capitulo_cache_operacoes_controle g),(select g from antes),'Gate anterior preservado');
select is((select to_jsonb(b) from historietas_privado.capitulo_cache_orcamento b),(select b from antes),'Saldo anterior preservado');
select is((select md5(coalesce(jsonb_agg(to_jsonb(e) order by id)::text,'[]')) from historietas_privado.capitulo_cache_outbox e),(select outbox from antes),'Eventos IDs e leases preservados');
select ok(not(select habilitado from historietas_privado.capitulo_runner_controle),'Runner continua desativado');
select ok(not(select habilitado from historietas_privado.capitulo_cache_operacoes_controle),'Protocolo continua desativado');
select * from finish();
rollback;
