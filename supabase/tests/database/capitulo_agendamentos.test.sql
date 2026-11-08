begin;
select no_plan();
-- BEGIN SCHEDULING FIXTURE
insert into auth.users(id) values ('ab100000-0000-4000-8000-000000000001'),
  ('ab100000-0000-4000-8000-000000000002') on conflict do nothing;
insert into public.profiles(id,user_id,nome,tipo) values
  ('ab100000-0000-4000-8000-000000000001','ab100000-0000-4000-8000-000000000001','QA agenda','autor'),
  ('ab100000-0000-4000-8000-000000000002','ab100000-0000-4000-8000-000000000002','QA terceiro','autor');
select set_config('request.jwt.claim.sub','ab100000-0000-4000-8000-000000000001',true);
select public.aceitar_termos_publicacao('2026-08-05','2026-08-05','2026-08-05');
insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,avisos_conteudo,publicado,slug) values
  ('ab200000-0000-4000-8000-000000000001','ab100000-0000-4000-8000-000000000001','QA agenda','QA','Fantasia','Romance','Livre','{}',true,'qa-agendamento'),
  ('ab200000-0000-4000-8000-000000000002','ab100000-0000-4000-8000-000000000001','QA draft','QA','Fantasia','Romance','Livre','{}',false,'qa-agendamento-draft'),
  ('ab200000-0000-4000-8000-000000000003','ab100000-0000-4000-8000-000000000001','QA adulto','QA','Fantasia','Romance','18+','{terror}',true,'qa-agendamento-adulto');
insert into public.capitulos(id,obra_id,user_id,titulo,texto,ordem,publicado) values
  ('ab300000-0000-4000-8000-000000000001','ab200000-0000-4000-8000-000000000001','ab100000-0000-4000-8000-000000000001','Capitulo agendavel','Texto privado que nao deve aparecer antes da publicacao.',1,false),
  ('ab300000-0000-4000-8000-000000000002','ab200000-0000-4000-8000-000000000002','ab100000-0000-4000-8000-000000000001','Draft de obra','Texto draft',1,false),
  ('ab300000-0000-4000-8000-000000000003','ab200000-0000-4000-8000-000000000001','ab100000-0000-4000-8000-000000000001','Ja publicado','Texto publicado',2,true),
  ('ab300000-0000-4000-8000-000000000004','ab200000-0000-4000-8000-000000000003','ab100000-0000-4000-8000-000000000001','Draft adulto','Texto adulto',1,false);
insert into auth.sessions(id,user_id) values
  ('ab500000-0000-4000-8000-000000000001','ab100000-0000-4000-8000-000000000001'),
  ('ab500000-0000-4000-8000-000000000002','ab100000-0000-4000-8000-000000000002');
-- END SCHEDULING FIXTURE
select set_config('request.jwt.claims','{"sub":"ab100000-0000-4000-8000-000000000001","role":"authenticated","session_id":"ab500000-0000-4000-8000-000000000001"}',true);

select ok((select relrowsecurity from pg_class where oid='historietas_privado.capitulo_agendamentos'::regclass),'RLS habilitado');
select ok(not has_table_privilege('authenticated','historietas_privado.capitulo_agendamentos','SELECT,INSERT,UPDATE,DELETE'),'tabela sem acesso direto');
select ok(not has_table_privilege('service_role','historietas_privado.capitulo_agendamentos','SELECT,INSERT,UPDATE,DELETE'),'service role sem acesso direto');
select ok(not has_function_privilege('anon','public.agendar_capitulo(uuid,bigint,timestamptz,text)','EXECUTE'),'anon sem agendamento');
select ok(not has_function_privilege('service_role','public.agendar_capitulo(uuid,bigint,timestamptz,text)','EXECUTE'),'sem bypass service role');
select ok(not exists (select 1 from pg_proc where oid in (
  'public.agendar_capitulo(uuid,bigint,timestamptz,text)'::regprocedure,
  'public.cancelar_agendamento_capitulo(uuid,bigint)'::regprocedure,
  'public.consultar_agendamento_capitulo(uuid)'::regprocedure) and prosecdef),'wrappers invoker');
select ok((select proconfig @> array['search_path=""'] from pg_proc
  where oid='historietas_privado.operar_agendamento_capitulo(text,uuid,bigint,timestamptz,text)'::regprocedure),'search_path fechado');
select ok(not has_function_privilege('authenticated','historietas_privado.invalidar_agendamento_capitulo()','EXECUTE'),'trigger nao vira RPC');

set local role authenticated;
select is(public.consultar_agendamento_capitulo('ab300000-0000-4000-8000-000000000001')->>'revisao','0','sem registro tem revisao zero');
select throws_ok($$select public.agendar_capitulo('ab300000-0000-4000-8000-000000000001',1,'2099-01-01Z','UTC')$$,'PT409',null,'revisao inexistente recusada');
select throws_ok($$select public.agendar_capitulo('ab300000-0000-4000-8000-000000000001',0,now()-interval '1 day','UTC')$$,'22023',null,'data passada');
select throws_ok($$select public.agendar_capitulo('ab300000-0000-4000-8000-000000000001',0,'infinity','UTC')$$,'22023',null,'data infinita');
select throws_ok($$select public.agendar_capitulo('ab300000-0000-4000-8000-000000000001',0,null,'UTC')$$,'22023',null,'data nula');
select throws_ok($$select public.agendar_capitulo('ab300000-0000-4000-8000-000000000001',0,'2099-01-01Z','Invalido/QA')$$,'22023',null,'fuso desconhecido');
select throws_ok($$select public.agendar_capitulo('ab300000-0000-4000-8000-000000000001',0,'2099-01-01Z','EST')$$,'22023',null,'abreviatura ambigua');
select throws_ok($$select public.agendar_capitulo('ab300000-0000-4000-8000-000000000001',-1,'2099-01-01Z','UTC')$$,'22023',null,'revisao negativa');
select throws_ok($$select public.agendar_capitulo('ab300000-0000-4000-8000-000000000002',0,'2099-01-01Z','UTC')$$,'PT409',null,'obra nao publicada');
select throws_ok($$select public.agendar_capitulo('ab300000-0000-4000-8000-000000000003',0,'2099-01-01Z','UTC')$$,'PT409',null,'nao despublica capitulo existente');
select is(public.agendar_capitulo('ab300000-0000-4000-8000-000000000001',0,'2099-01-01 09:00:00-03','America/Sao_Paulo')->>'revisao','1','agenda autoria real');
select is(public.agendar_capitulo('ab300000-0000-4000-8000-000000000001',0,'2099-01-01 12:00:00+00','America/Sao_Paulo')->>'revisao','1','retry mesmo instante nao incrementa');
select throws_ok($$select public.agendar_capitulo('ab300000-0000-4000-8000-000000000001',0,'2099-01-02Z','UTC')$$,'PT409',null,'retry nao troca parametros');
select is(public.agendar_capitulo('ab300000-0000-4000-8000-000000000001',1,'2099-01-02Z','UTC')->>'revisao','2','reagendar exige revisao atual');
select throws_ok($$update public.capitulos set publicado=true where id='ab300000-0000-4000-8000-000000000001'$$,'PT409',null,'publicacao direta bloqueada');
select throws_ok($$update public.capitulos set publicado=true,texto='Novo texto' where id='ab300000-0000-4000-8000-000000000001'$$,'PT409',null,'edicao conjunta nao contorna bloqueio');
select lives_ok($$update public.capitulos set atualizado_em=now() where id='ab300000-0000-4000-8000-000000000001'$$,'metadata sem invalidar');
select is(public.consultar_agendamento_capitulo('ab300000-0000-4000-8000-000000000001')->>'revisao','2','metadata preserva revisao');
select lives_ok($$update public.capitulos set titulo='Titulo editado' where id='ab300000-0000-4000-8000-000000000001'$$,'edicao legitima funciona');
select is(public.consultar_agendamento_capitulo('ab300000-0000-4000-8000-000000000001')->>'estado','invalidado','titulo invalida automaticamente');
select is(public.consultar_agendamento_capitulo('ab300000-0000-4000-8000-000000000001')->>'revisao','3','invalidacao incrementa revisao');
select throws_ok($$select public.agendar_capitulo('ab300000-0000-4000-8000-000000000001',1,'2099-01-02Z','UTC')$$,'PT409',null,'resposta antiga nao ressuscita');
select is(public.agendar_capitulo('ab300000-0000-4000-8000-000000000001',3,'2099-01-03Z','UTC')->>'revisao','4','reconfirmacao explicita');
update public.capitulos set texto='Texto editado e ainda privado' where id='ab300000-0000-4000-8000-000000000001';
select is(public.consultar_agendamento_capitulo('ab300000-0000-4000-8000-000000000001')->>'resultado','conteudo_alterado','texto tambem invalida');
select is(public.agendar_capitulo('ab300000-0000-4000-8000-000000000001',5,'2099-01-04Z','UTC')->>'revisao','6','nova confirmacao');
select is(public.cancelar_agendamento_capitulo('ab300000-0000-4000-8000-000000000001',6)->>'revisao','7','cancelamento monotono');
select is(public.cancelar_agendamento_capitulo('ab300000-0000-4000-8000-000000000001',6)->>'revisao','7','cancelamento idempotente');
select is(public.cancelar_agendamento_capitulo('ab300000-0000-4000-8000-000000000001',7)->>'estado','cancelado','cancelamento ja aplicado');
select throws_ok($$select public.agendar_capitulo('ab300000-0000-4000-8000-000000000001',5,'2099-01-04Z','UTC')$$,'PT409',null,'retry antigo nao desfaz cancelamento');
select is(public.agendar_capitulo('ab300000-0000-4000-8000-000000000001',7,'2099-01-05Z','UTC')->>'publicacaoAutomaticaHabilitada','false','nenhum executor habilitado');
select is(public.agendar_capitulo('ab300000-0000-4000-8000-000000000004',0,'2099-01-01Z','UTC')->>'estado','agendado','autor pode preparar seu draft 18+ sem publica-lo');
reset role;
select is((select publicar_em from historietas_privado.capitulo_agendamentos where capitulo_id='ab300000-0000-4000-8000-000000000001'),'2099-01-05Z'::timestamptz,'instante absoluto persistido');
select is((select count(*)::integer from historietas_privado.capitulo_agendamentos),2,'um registro por capitulo');
select ok(not (select publicado from public.capitulos where id='ab300000-0000-4000-8000-000000000001'),'draft continua privado');
select throws_ok($$update historietas_privado.capitulo_agendamentos set estado='publicado',resultado=null where capitulo_id='ab300000-0000-4000-8000-000000000001'$$,'23514',null,'contrato exige resultado consistente');

savepoint gates;
update public.profiles set termos_uso_versao=null where user_id='ab100000-0000-4000-8000-000000000001';
select throws_ok($$select public.agendar_capitulo('ab300000-0000-4000-8000-000000000001',8,'2099-01-06Z','UTC')$$,'42501',null,'termos sempre revalidados');
select lives_ok($$select public.cancelar_agendamento_capitulo('ab300000-0000-4000-8000-000000000001',8)$$,'termos revogados nao impedem cancelamento');
rollback to gates;
savepoint gates;
update public.obras set publicado=false where id='ab200000-0000-4000-8000-000000000001';
select throws_ok($$select public.agendar_capitulo('ab300000-0000-4000-8000-000000000001',8,'2099-01-06Z','UTC')$$,'PT409',null,'obra despublicada nao reagenda');
select lives_ok($$select public.cancelar_agendamento_capitulo('ab300000-0000-4000-8000-000000000001',8)$$,'obra despublicada permite cancelamento');
rollback to gates;
savepoint gates;
delete from auth.sessions where id='ab500000-0000-4000-8000-000000000001';
select throws_ok($$select public.consultar_agendamento_capitulo('ab300000-0000-4000-8000-000000000001')$$,'42501',null,'JWT apos logout recusado');
rollback to gates;
savepoint gates;
update auth.sessions set not_after=now()-interval '1 second' where id='ab500000-0000-4000-8000-000000000001';
select throws_ok($$select public.agendar_capitulo('ab300000-0000-4000-8000-000000000001',8,'2099-01-06Z','UTC')$$,'42501',null,'sessao expirada');
rollback to gates;

select set_config('request.jwt.claim.sub','ab100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"ab100000-0000-4000-8000-000000000002","role":"authenticated","session_id":"ab500000-0000-4000-8000-000000000002"}',true);
set local role authenticated;
select throws_ok($$select public.agendar_capitulo('ab300000-0000-4000-8000-000000000001',8,'2099-01-06Z','UTC')$$,'42501',null,'terceiro nao agenda');
select throws_ok($$select public.cancelar_agendamento_capitulo('ab300000-0000-4000-8000-000000000001',8)$$,'42501',null,'terceiro nao cancela');
select throws_ok($$select public.consultar_agendamento_capitulo('ab300000-0000-4000-8000-000000000001')$$,'42501',null,'terceiro nao consulta dados privados');
select is((select count(*)::integer from public.capitulos where id='ab300000-0000-4000-8000-000000000001'),0,'RLS esconde draft de terceiros');
reset role;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{}',true);
set local role anon;
select is((select count(*)::integer from public.capitulos where id in ('ab300000-0000-4000-8000-000000000001','ab300000-0000-4000-8000-000000000004')),0,'anon nao recebe drafts nem 18+');
select throws_ok($$select public.consultar_agendamento_capitulo('ab300000-0000-4000-8000-000000000001')$$,'42501',null,'anon sem leitura do agendamento');
reset role;

-- Somente fixture SQL simula tipo ilustrado sem autorizar upload/publicacao.
savepoint ilustrado;
update public.capitulos set tipo_conteudo='imagens' where id='ab300000-0000-4000-8000-000000000002';
update public.obras set publicado=true where id='ab200000-0000-4000-8000-000000000002';
select set_config('request.jwt.claim.sub','ab100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"ab100000-0000-4000-8000-000000000001","session_id":"ab500000-0000-4000-8000-000000000001"}',true);
select throws_ok($$select public.agendar_capitulo('ab300000-0000-4000-8000-000000000002',0,'2099-01-01Z','UTC')$$,'PT409',null,'imagens nao podem ser agendadas');
rollback to ilustrado;

delete from public.capitulos where id='ab300000-0000-4000-8000-000000000001';
select is((select count(*)::integer from historietas_privado.capitulo_agendamentos where capitulo_id='ab300000-0000-4000-8000-000000000001'),0,'exclusao nao deixa tarefa orfa');
select * from finish();
rollback;
