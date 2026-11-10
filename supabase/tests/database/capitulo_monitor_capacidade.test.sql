begin;
select no_plan();
create temp table monitor_antes as select
  (select md5(coalesce(jsonb_agg(to_jsonb(b) order by id)::text,'[]')) from historietas_privado.capitulo_cache_outbox b) outbox,
  (select to_jsonb(b) from historietas_privado.capitulo_notificacao_orcamento b) saldo;
select ok(not (select habilitado from historietas_privado.capitulo_runner_controle),'runner fechado');
select ok((select not prosecdef and proconfig=array['search_path=""'] from pg_proc
  where oid='historietas_privado.recursos_monitor_capitulos()'::regprocedure),'helper invoker com search_path vazio');
select ok(not exists(select 1 from unnest(array['anon','authenticated','service_role',
  'historietas_capitulo_runner','historietas_agendamento_monitor']) r
  where has_function_privilege(r,'historietas_privado.recursos_monitor_capitulos()','EXECUTE')),'sem novos grants de helper');
select ok(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname in ('recursos_monitor_capitulos','snapshot_monitor_capitulos')),'sem RPC publica');
create temp table snapshot_inicial as select historietas_privado.snapshot_monitor_capitulos() s;
select is((select (s#>>'{recursos,versao}')::integer from snapshot_inicial),1,'extensao versionada');
select is((select s#>>'{recursos,orcamentoNotificacoes,estado}' from snapshot_inicial),'observado','saldo nativo disponivel');
select is((select (s#>>'{recursos,orcamentoNotificacoes,linhasAdmitidas}')::bigint from snapshot_inicial),
  (select notificacoes_admitidas from historietas_privado.capitulo_notificacao_orcamento),'saldo real sem reset');
select is((select (s#>>'{recursos,orcamentoNotificacoes,limitePayloadBytes}')::bigint from snapshot_inicial),
  (select limite_total_bytes from historietas_privado.capitulo_notificacao_orcamento),'limite real sem ampliar');
select ok((select s#>>'{recursos,orcamentoNotificacoes,medidoEm}' is not null from snapshot_inicial),'horario proprio do saldo');
select is((select (s#>>'{capacidade,eventos}')::bigint from snapshot_inicial),
  (select count(*) from historietas_privado.capitulo_cache_outbox),'outbox inclui todas as pendencias');
select ok((select s#>>'{capacidade,medidoEm}' is not null from snapshot_inicial),'horario proprio da capacidade');
select ok((select (s->>'agora')::timestamptz >= (s#>>'{recursos,orcamentoNotificacoes,medidoEm}')::timestamptz
  from snapshot_inicial),'envelope carimbado depois do saldo');
select ok((select (s->>'agora')::timestamptz >= (s#>>'{recursos,wal,medidoEm}')::timestamptz
  from snapshot_inicial),'envelope carimbado depois do WAL');
select is((select s#>>'{recursos,disco,estado}' from snapshot_inicial),'indisponivel','nao inventa disco livre');
select is((select s#>'{recursos,disco,livreBytes}' from snapshot_inicial),'null'::jsonb,'disco livre desconhecido nao e zero');
select is((select s#>'{recursos,disco,totalBytes}' from snapshot_inicial),'null'::jsonb,'nao presume disco contratado');
select is((select s#>>'{recursos,wal,estado}' from snapshot_inicial),'observado','WAL nativo observado no descartavel');
select ok((select (s#>>'{recursos,wal,arquivosBytes}')::bigint>0 from snapshot_inicial),'WAL ocupado positivo');
select ok((select (s#>>'{recursos,wal,geradoAcumuladoBytes}')::numeric>=0 from snapshot_inicial),'WAL cumulativo separado');
select is((select s#>'{recursos,wal,limiteAprovadoBytes}' from snapshot_inicial),'null'::jsonb,'max_wal_size nao vira teto aprovado');
select ok(not exists(select 1 from jsonb_object_keys((select s#>'{recursos,wal}' from snapshot_inicial)) k
  where k not in ('estado','fonte','medidoEm','arquivosBytes','geradoAcumuladoBytes','estatisticasReiniciadasEm','limiteAprovadoBytes')),'WAL sem caminhos ou identidades');
savepoint ausente;
delete from historietas_privado.capitulo_notificacao_orcamento;
select is(historietas_privado.recursos_monitor_capitulos()#>>'{orcamentoNotificacoes,estado}',
  'indisponivel','configuracao ausente nao e saldo livre');
rollback to ausente;
select is(historietas_privado.recursos_monitor_capitulos()#>>'{orcamentoNotificacoes,estado}',
  'observado','recuperacao da fonte nao altera saldo');

grant historietas_agendamento_monitor to postgres with set true;
create function pg_temp.ler_monitor() returns jsonb language plpgsql as $$
declare r jsonb;
begin
  set local role historietas_agendamento_monitor;
  r:=historietas_privado.snapshot_monitor_capitulos();
  reset role;
  return r;
end $$;
select is(pg_temp.ler_monitor()#>>'{recursos,orcamentoNotificacoes,estado}','observado','snapshot restrito inclui saldo');
-- Injecao de permissao ausente SOMENTE nesta transacao descartavel: o helper
-- invoker nao ganha acesso as tabelas nem aos arquivos por receber EXECUTE.
savepoint falha;
grant execute on function historietas_privado.recursos_monitor_capitulos() to historietas_agendamento_monitor;
create function pg_temp.ler_helper_sem_permissao() returns jsonb language plpgsql as $$
declare r jsonb;
begin
  set local role historietas_agendamento_monitor;
  r:=historietas_privado.recursos_monitor_capitulos();
  reset role;
  return r;
end $$;
select is(pg_temp.ler_helper_sem_permissao()#>>'{orcamentoNotificacoes,estado}','falha','erro de SELECT nao vira saldo zero');
select ok(not (pg_temp.ler_helper_sem_permissao()::text ~* 'permission denied|42501|SQLERRM|pg_wal/'),'falha sanitizada');
rollback to falha;
select is((select md5(coalesce(jsonb_agg(to_jsonb(b) order by id)::text,'[]')) from historietas_privado.capitulo_cache_outbox b),
  (select outbox from monitor_antes),'leituras preservam IDs, eventos e leases');
select is((select to_jsonb(b) from historietas_privado.capitulo_notificacao_orcamento b),
  (select saldo from monitor_antes),'leituras preservam saldo e limites');
select ok(not (select habilitado from historietas_privado.capitulo_runner_controle),'observacao nao ativa runner');
select * from finish();
rollback;
