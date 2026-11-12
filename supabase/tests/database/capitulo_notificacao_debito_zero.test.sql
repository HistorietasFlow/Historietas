begin;
select no_plan();
select ok(not (select habilitado from historietas_privado.capitulo_runner_controle),'runner permanece desativado');
select ok((select not prosecdef and provolatile='v' from pg_proc
  where oid='historietas_privado.admitir_notificacoes_capitulo(jsonb)'::regprocedure),'contrato invoker volatile preservado');
select ok(not exists(select 1 from unnest(array['anon','authenticated','service_role','historietas_capitulo_runner']) r
  where has_function_privilege(r,'historietas_privado.admitir_notificacoes_capitulo(jsonb)','EXECUTE')),'sem novo grant de API/runner');
select ok((select relrowsecurity from pg_class where oid='historietas_privado.capitulo_notificacao_orcamento'::regclass),'RLS permanece ativo');

create temp table estado_inicial as select ctid::text versao,to_jsonb(b) saldo from historietas_privado.capitulo_notificacao_orcamento b;
select ok(historietas_privado.admitir_notificacoes_capitulo('{"linhas":[],"destinatarios":0}'),'plano vazio valido continua aceito');
select is((select ctid::text from historietas_privado.capitulo_notificacao_orcamento),(select versao from estado_inicial),'debito zero nao cria versao de linha');
select ok(bool_and(historietas_privado.admitir_notificacoes_capitulo('{"linhas":[],"destinatarios":0}')),'repeticoes vazias continuam aceitas') from generate_series(1,100);
select is((select ctid::text from historietas_privado.capitulo_notificacao_orcamento),(select versao from estado_inicial),'100 repeticoes nao criam tuplas mortas por UPDATE');
select is((select to_jsonb(b) from historietas_privado.capitulo_notificacao_orcamento b),(select saldo from estado_inicial),'contadores e todos os limites preservados');
select throws_ok($$select historietas_privado.admitir_notificacoes_capitulo('{}')$$,'55000','Plano privado invalido.','vazio nao ignora formato invalido');
select throws_ok($$select historietas_privado.admitir_notificacoes_capitulo('{"linhas":[]}')$$,'55000','Plano privado invalido.','vazio nao ignora destinatarios ausentes');
select throws_ok($$select historietas_privado.admitir_notificacoes_capitulo('{"linhas":[],"destinatarios":-1}')$$,'55000','Plano privado invalido.','vazio nao ignora destinatarios negativos');
select ok(not historietas_privado.admitir_notificacoes_capitulo('{"linhas":[],"destinatarios":101}'),'audiencia excedida continua negada mesmo sem linhas');
select ok(historietas_privado.admitir_notificacoes_capitulo('{"linhas":[],"destinatarios":1}'),'audiencia sem novas linhas nao gera debito');
select is((select ctid::text from historietas_privado.capitulo_notificacao_orcamento),(select versao from estado_inicial),'validacoes nao escrevem saldo');

select ok(historietas_privado.admitir_notificacoes_capitulo('{"linhas":[{}],"destinatarios":1}'),'plano nao vazio continua admitido');
select isnt((select ctid::text from historietas_privado.capitulo_notificacao_orcamento),(select versao from estado_inicial),'debito real mantem barreira de escrita');
select is((select notificacoes_admitidas from historietas_privado.capitulo_notificacao_orcamento),
  (select (saldo->>'notificacoes_admitidas')::bigint+1 from estado_inicial),'debito real incrementa exatamente uma unidade');
-- Nao usar rollback to savepoint: isso apagaria tambem as assercoes pgTAP.
select * from finish();
rollback;
