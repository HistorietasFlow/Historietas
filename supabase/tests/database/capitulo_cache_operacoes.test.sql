begin;
select no_plan();
select ok((select not habilitado and not iniciado and pausado and pendente is null and revisao=1
  from historietas_privado.capitulo_cache_operacoes_controle),'protocolo instalado fechado e nao iniciado');
select ok(not exists(select 1 from unnest(array['anon','authenticated','service_role','historietas_capitulo_runner','historietas_agendamento_monitor']) r,
  unnest(array['capitulo_cache_operacoes_controle','capitulo_cache_operacoes','capitulo_cache_operacoes_recibos',
    'capitulo_cache_operacoes_eventos','capitulo_cache_operacoes_retomadas']) t
  where has_table_privilege(r,'historietas_privado.'||t,'SELECT,INSERT,UPDATE,DELETE')),'sem acesso direto aos registros privados');
select ok((select bool_and(relrowsecurity) from pg_class where relkind='r' and relnamespace='historietas_privado'::regnamespace
  and relname like 'capitulo_cache_operacoes%'),'RLS nas cinco tabelas');
select ok(not exists(select 1 from pg_proc p,unnest(array['anon','authenticated','service_role','historietas_capitulo_runner','historietas_agendamento_monitor']) r
  where p.pronamespace='historietas_privado'::regnamespace and p.proname in
    ('admitir_operacao_cache','executar_operacao_cache','reconciliar_operacao_cache','retomar_operacoes_cache',
     'reivindicar_cache_capitulos_nucleo','validar_admin_operacao_cache') and has_function_privilege(r,p.oid,'EXECUTE')),'nenhum caminho novo pela API, runner ou monitor');
select ok(not exists(select 1 from pg_proc where pronamespace='historietas_privado'::regnamespace
  and proname in ('admitir_operacao_cache','executar_operacao_cache','reconciliar_operacao_cache','retomar_operacoes_cache',
    'reivindicar_cache_capitulos_nucleo','validar_admin_operacao_cache') and (prosecdef or proconfig<>array['search_path=""'])),'contratos internos invoker/search_path vazio');
select ok(has_function_privilege('service_role','public.reivindicar_cache_capitulos(integer)','EXECUTE'),'assinatura e grant legado preservados');
select ok(not has_function_privilege('authenticated','public.reivindicar_cache_capitulos(integer)','EXECUTE'),'cliente continua sem reivindicacao');
select ok(not exists(select 1 from pg_constraint where conrelid='historietas_privado.capitulo_cache_operacoes'::regclass and contype='f'),'intencoes sobrevivem a cascatas de conta e sessao');
select ok(not exists(select 1 from pg_constraint where conrelid='historietas_privado.capitulo_cache_operacoes_recibos'::regclass
  and contype='f' and confdeltype='c'),'recibos sem cascata');
select ok((select count(*)=2 from pg_trigger where tgname in ('capitulo_cache_intencao_recibo','capitulo_cache_recibo_vinculos')
  and tgdeferrable and tginitdeferred),'consistencia diferida de estado, recibo e vinculos');

insert into auth.users(id,raw_app_meta_data,raw_user_meta_data) values
 ('dd120000-0000-4000-8000-000000000001','{"role":"admin"}','{}'),
 ('dd120000-0000-4000-8000-000000000002','{}','{"role":"admin"}');
insert into auth.sessions(id,user_id) values
 ('dd120000-0000-4000-8000-000000000003','dd120000-0000-4000-8000-000000000001'),
 ('dd120000-0000-4000-8000-000000000004','dd120000-0000-4000-8000-000000000002');
select throws_ok($$select historietas_privado.conferir_parametros_operacao_cache(null,gen_random_uuid(),gen_random_uuid(),1)$$,'22023',null,'UUID obrigatorio');
select throws_ok($$select historietas_privado.conferir_parametros_operacao_cache(gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),6)$$,'22023',null,'lote de ate cinco preservado');
select throws_ok($$select historietas_privado.validar_admin_operacao_cache('dd120000-0000-4000-8000-000000000002','dd120000-0000-4000-8000-000000000004')$$,'42501',null,'metadata editavel nao autoriza');
select throws_ok($$select historietas_privado.validar_admin_operacao_cache('dd120000-0000-4000-8000-000000000001','dd120000-0000-4000-8000-000000000004')$$,'42501',null,'sessao de outra identidade negada');
select is(historietas_privado.admitir_operacao_cache('dd120000-0000-4000-8000-000000000010',
 'dd120000-0000-4000-8000-000000000001','dd120000-0000-4000-8000-000000000003',1)->>'estado','admissao_bloqueada','desativado nao admite');
select throws_ok($$select historietas_privado.executar_operacao_cache('dd120000-0000-4000-8000-000000000010',
 'dd120000-0000-4000-8000-000000000001','dd120000-0000-4000-8000-000000000003',1)$$,'55000',null,'execucao nao cria intencao implicitamente');
select is(historietas_privado.retomar_operacoes_cache(1,'configuracao_validada')->>'estado','retomada_registrada','configuracao administrativa por CAS');
select ok(not (select habilitado from historietas_privado.capitulo_cache_operacoes_controle),'retomada nao habilita protocolo');
-- Somente fixture transacional local. Nenhum gate e habilitado pela migration.
update historietas_privado.capitulo_cache_operacoes_controle set habilitado=true;
select is(historietas_privado.admitir_operacao_cache('dd120000-0000-4000-8000-000000000010',
 'dd120000-0000-4000-8000-000000000001','dd120000-0000-4000-8000-000000000003',1)->>'estado','admitida','admissao grava intencao');
select ok((select pausado and pendente='dd120000-0000-4000-8000-000000000010' from historietas_privado.capitulo_cache_operacoes_controle),'admissao fecha gate antes da execucao');
select is(historietas_privado.admitir_operacao_cache('dd120000-0000-4000-8000-000000000010',
 'dd120000-0000-4000-8000-000000000001','dd120000-0000-4000-8000-000000000003',1)->>'estado','admitida','resposta de admissao perdida reutiliza intencao');
select throws_ok($$select historietas_privado.admitir_operacao_cache('dd120000-0000-4000-8000-000000000010',
 'dd120000-0000-4000-8000-000000000001','dd120000-0000-4000-8000-000000000003',2)$$,'55000',null,'mesmo UUID nao muda lote');
select is(historietas_privado.admitir_operacao_cache('dd120000-0000-4000-8000-000000000011',
 'dd120000-0000-4000-8000-000000000001','dd120000-0000-4000-8000-000000000003',1)->>'estado','admissao_bloqueada','outra operacao nao contorna ambiguidade');
select throws_ok($$select historietas_privado.executar_operacao_cache('dd120000-0000-4000-8000-000000000010',
 'dd120000-0000-4000-8000-000000000001','dd120000-0000-4000-8000-000000000003',1)$$,'55000','Intencao precisa de commit previo.','mesma transacao ou SAVEPOINT nao substitui commit');
select throws_ok($$update historietas_privado.capitulo_cache_operacoes set limite=2 where id='dd120000-0000-4000-8000-000000000010'$$,'55000',null,'parametros imutaveis mesmo para UPDATE acidental');
select throws_ok($$delete from historietas_privado.capitulo_cache_operacoes where id='dd120000-0000-4000-8000-000000000010'$$,'55000',null,'intencao nao pode desaparecer');
select throws_ok($$select public.reivindicar_cache_capitulos(1)$$,'55000',null,'wrapper legado nao contorna protocolo');
select throws_ok($$select historietas_privado.retomar_operacoes_cache(3,'causa_corrigida')$$,'55000',null,'CAS nao abandona operacao pendente');
select is(historietas_privado.retomar_operacoes_cache(1,'configuracao_validada')->>'estado','ja_registrado','retry administrativo reconhecido');
select ok((select pausado from historietas_privado.capitulo_cache_operacoes_controle),'retry antigo nao remove pausa posterior');
select is(historietas_privado.reconciliar_operacao_cache('dd120000-0000-4000-8000-000000000010',
 'dd120000-0000-4000-8000-000000000001','dd120000-0000-4000-8000-000000000003',1)->>'estado','encerrada_sem_claim','reconciliacao encerra sob lock');
select is(historietas_privado.executar_operacao_cache('dd120000-0000-4000-8000-000000000010',
 'dd120000-0000-4000-8000-000000000001','dd120000-0000-4000-8000-000000000003',1)->>'estado','encerrada_sem_claim','execucao tardia nao reabre');
select throws_ok($$update historietas_privado.capitulo_cache_operacoes set estado='admitida',encerrada_em=null where id='dd120000-0000-4000-8000-000000000010'$$,'55000',null,'tombstone imutavel');
select is(historietas_privado.reconciliar_operacao_cache('dd120000-0000-4000-8000-000000000012',
 'dd120000-0000-4000-8000-000000000001','dd120000-0000-4000-8000-000000000003',1)->>'estado','encerrada_sem_claim','UUID ausente recebe tombstone, nao presuncao de rollback');
select is(historietas_privado.admitir_operacao_cache('dd120000-0000-4000-8000-000000000012',
 'dd120000-0000-4000-8000-000000000001','dd120000-0000-4000-8000-000000000003',1)->>'estado','encerrada_sem_claim','admissao atrasada tambem nao reabre');
delete from auth.sessions where id='dd120000-0000-4000-8000-000000000003';
select throws_ok($$select historietas_privado.executar_operacao_cache('dd120000-0000-4000-8000-000000000010',
 'dd120000-0000-4000-8000-000000000001','dd120000-0000-4000-8000-000000000003',1)$$,'42501',null,'logout nega reutilizacao pela identidade anterior');
select is(historietas_privado.reconciliar_operacao_cache('dd120000-0000-4000-8000-000000000010',
 'dd120000-0000-4000-8000-000000000001','dd120000-0000-4000-8000-000000000003',1)->>'estado','encerrada_sem_claim','reconciliacao SQL administrativa funciona apos logout');
update historietas_privado.capitulo_cache_operacoes_controle set habilitado=false;
select throws_ok($$select public.reivindicar_cache_capitulos(1)$$,'55000',null,'desativar nao devolve caminho legado apos inicio');
select ok((select consumidas=0 and not habilitado and limite is null from historietas_privado.capitulo_cache_orcamento),'sem debito ou ativacao da 6D10');
select ok(not (select habilitado from historietas_privado.capitulo_runner_controle),'runner continua desativado');
select * from finish();
rollback;
