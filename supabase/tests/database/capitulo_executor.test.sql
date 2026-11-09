begin;
select no_plan();
-- BEGIN EXECUTOR FIXTURE
insert into auth.users(id) values ('ac100000-0000-4000-8000-000000000001'),
 ('ac100000-0000-4000-8000-000000000002'),('ac100000-0000-4000-8000-000000000003') on conflict do nothing;
insert into public.profiles(id,user_id,nome,tipo) values
 ('ac100000-0000-4000-8000-000000000001','ac100000-0000-4000-8000-000000000001','QA executor','autor'),
 ('ac100000-0000-4000-8000-000000000002','ac100000-0000-4000-8000-000000000002','QA seguidor','leitor'),
 ('ac100000-0000-4000-8000-000000000003','ac100000-0000-4000-8000-000000000003','QA terceiro','leitor');
select set_config('request.jwt.claim.sub','ac100000-0000-4000-8000-000000000001',true);
select public.aceitar_termos_publicacao('2026-08-05','2026-08-05','2026-08-05');
insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,publicado,slug) values
 ('ac200000-0000-4000-8000-000000000001','ac100000-0000-4000-8000-000000000001','Obra executor','QA','Fantasia','Romance','Livre',true,'qa-executor');
insert into public.capitulos(id,obra_id,user_id,titulo,texto,ordem,publicado,criado_em)
 select ('ac300000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,
 'ac200000-0000-4000-8000-000000000001','ac100000-0000-4000-8000-000000000001',
 'Capitulo '||i,'Texto privado de capitulo que so pode ser publicado na hora agendada.',i,false,'2020-01-01Z'
 from generate_series(1,16) i;
insert into public.seguindo_obras(user_id,obra_id) values
 ('ac100000-0000-4000-8000-000000000002','ac200000-0000-4000-8000-000000000001');
insert into public.favoritos(user_id,obra_id) values
 ('ac100000-0000-4000-8000-000000000002','ac200000-0000-4000-8000-000000000001');
insert into public.seguindo_usuarios(seguidor_id,seguido_id) values
 ('ac100000-0000-4000-8000-000000000003','ac100000-0000-4000-8000-000000000001');
insert into auth.sessions(id,user_id) values
 ('ac500000-0000-4000-8000-000000000001','ac100000-0000-4000-8000-000000000001');
-- END EXECUTOR FIXTURE
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{}',true);
create function pg_temp.preparar(p_num integer,p_vencido boolean default true) returns uuid
language plpgsql as $$
declare v_id uuid := ('ac300000-0000-4000-8000-'||lpad(p_num::text,12,'0'))::uuid;
begin
 perform set_config('request.jwt.claim.sub','ac100000-0000-4000-8000-000000000001',true);
 perform set_config('request.jwt.claims','{"sub":"ac100000-0000-4000-8000-000000000001","session_id":"ac500000-0000-4000-8000-000000000001"}',true);
 perform public.agendar_capitulo(v_id,0,'2099-01-01Z','UTC');
 perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{}',true);
 if p_vencido then update historietas_privado.capitulo_agendamentos set publicar_em=now()-interval '1 minute' where capitulo_id=v_id; end if;
 return v_id;
end;
$$;
select ok(auth.uid() is null,'executor nao recebe identidade impersonada');
select ok(not exists (select 1 from pg_proc where oid in (
 'historietas_privado.executar_agendamento_capitulo(uuid,bigint)'::regprocedure,
 'historietas_privado.executar_lote_agendamentos_capitulos(integer)'::regprocedure,
 'historietas_privado.notificar_capitulo_agendado(uuid,uuid,uuid,timestamptz)'::regprocedure) and prosecdef),'executor e helpers invoker');
select ok(not exists (select 1 from unnest(array['anon','authenticated','service_role']) r
 cross join unnest(array['historietas_privado.executar_agendamento_capitulo(uuid,bigint)',
 'historietas_privado.executar_lote_agendamentos_capitulos(integer)',
 'historietas_privado.notificar_capitulo_agendado(uuid,uuid,uuid,timestamptz)']) f
 where has_function_privilege(r,f,'EXECUTE')),'nenhum executor exposto ao cliente/service role');
select ok(not has_table_privilege('authenticated','historietas_privado.capitulo_publicacao_eventos','SELECT,INSERT,UPDATE,DELETE'),'evento privado');
select throws_ok($$select historietas_privado.executar_lote_agendamentos_capitulos(11)$$,'22023',null,'lote limitado');
select throws_ok($$select historietas_privado.executar_lote_agendamentos_capitulos(0)$$,'22023',null,'lote vazio invalido');
select throws_ok($$select historietas_privado.executar_agendamento_capitulo(null,1)$$,'22023',null,'sem id nao executa');

select is(historietas_privado.executar_agendamento_capitulo(pg_temp.preparar(1,false),1)->>'estado','futuro','nao publica antes do instante');
select is((select count(*)::integer from public.notificacoes where obra_id='ac200000-0000-4000-8000-000000000001'),0,'nao notifica antes');
select is((select count(*)::integer from public.diario_atividades where obra_id='ac200000-0000-4000-8000-000000000001'),0,'nao cria Diario antecipado');
select is(historietas_privado.executar_agendamento_capitulo(pg_temp.preparar(2),1)->>'estado','publicado','autor vigente com auth.uid nulo');
select ok((select publicado from public.capitulos where ordem=2 and obra_id='ac200000-0000-4000-8000-000000000001'),'publicacao persistida');
select is((select count(*)::integer from public.notificacoes where capitulo_id='ac300000-0000-4000-8000-000000000002'),2,'destinatarios legados deduplicados');
select is((select count(*)::integer from historietas_privado.capitulo_publicacao_eventos
 where obra_id='ac200000-0000-4000-8000-000000000001'),1,'evento atomico da fixture');
select ok((select e.diario_atividade_id=d.id and d.user_id=e.autor_id and d.tipo='publicou_capitulo'
 and d.criado_em=e.publicado_em and d.atualizado_em=e.publicado_em and d.texto=''
 from historietas_privado.capitulo_publicacao_eventos e join public.diario_atividades d on d.id=e.diario_atividade_id
 where e.obra_id='ac200000-0000-4000-8000-000000000001'),
 'Diario vinculado ao recibo, autor e instante reais');
select ok((select metadata->>'numero_capitulo'='2' and metadata->>'href'='/obra/qa-executor/capitulo/2'
 and not metadata ? 'texto' from public.diario_atividades
 where capitulo_id='ac300000-0000-4000-8000-000000000002'), 'metadata real sem texto do capitulo');
select ok((select bool_and(n.criada_em=e.publicado_em and n.created_at=e.publicado_em and n.updated_at=e.publicado_em)
 from public.notificacoes n join historietas_privado.capitulo_publicacao_eventos e using(capitulo_id)),'notificacoes usam publicacao efetiva, nao criacao do draft');
select is((select criado_em from public.capitulos where id='ac300000-0000-4000-8000-000000000002'),'2020-01-01Z'::timestamptz,'data legada preservada');
select is(historietas_privado.executar_agendamento_capitulo('ac300000-0000-4000-8000-000000000002',1)->>'repetido','true','resposta perdida retorna recibo');
select is((select count(*)::integer from public.notificacoes where capitulo_id='ac300000-0000-4000-8000-000000000002'),2,'retry nao duplica notificacoes');
select is((select count(*)::integer from public.diario_atividades where capitulo_id='ac300000-0000-4000-8000-000000000002'),1,'retry nao duplica Diario');
insert into historietas_privado.capitulo_publicacao_eventos select * from historietas_privado.capitulo_publicacao_eventos
 where capitulo_id='ac300000-0000-4000-8000-000000000002' on conflict do nothing;
select is((select count(*)::integer from public.diario_atividades where capitulo_id='ac300000-0000-4000-8000-000000000002'),1,'recibo duplicado ignorado nao cria atividade orfa');
select is(historietas_privado.executar_agendamento_capitulo('ac300000-0000-4000-8000-000000000002',99)->>'estado','desatualizado','revisao errada nao executa');

-- Falha depois da insercao das notificacoes: tudo deve ser revertido, nao so o evento.
create function pg_temp.falhar_evento() returns trigger language plpgsql as $$
begin raise exception 'Falha local injetada depois das notificacoes.' using errcode='XX000'; end;
$$;
create trigger zz_qa_falhar_evento after insert on historietas_privado.capitulo_publicacao_eventos
 for each row execute function pg_temp.falhar_evento();
select is(historietas_privado.executar_agendamento_capitulo(pg_temp.preparar(3),1)->>'estado','erro','falha nao vira sucesso');
select ok(not (select publicado from public.capitulos where id='ac300000-0000-4000-8000-000000000003'),'rollback da publicacao');
select is((select count(*)::integer from public.notificacoes where capitulo_id='ac300000-0000-4000-8000-000000000003'),0,'rollback das notificacoes');
select is((select count(*)::integer from historietas_privado.capitulo_publicacao_eventos where capitulo_id='ac300000-0000-4000-8000-000000000003'),0,'nenhum recibo falso');
select is((select count(*)::integer from public.diario_atividades where capitulo_id='ac300000-0000-4000-8000-000000000003'),0,'rollback tambem do Diario ja criado');
select throws_ok($$update public.capitulos set publicado=true where id='ac300000-0000-4000-8000-000000000003'$$,'PT409',null,'erro ainda bloqueia publicacao direta');
select is(historietas_privado.executar_agendamento_capitulo('ac300000-0000-4000-8000-000000000003',1)->>'estado','aguardando_retry','sem loop de retry imediato');
select is(historietas_privado.executar_agendamento_capitulo(pg_temp.preparar(4),1)->>'estado','erro','prepara erro editavel');
select is(historietas_privado.executar_agendamento_capitulo(pg_temp.preparar(5),1)->>'estado','erro','prepara erro cancelavel');
drop trigger zz_qa_falhar_evento on historietas_privado.capitulo_publicacao_eventos;
update historietas_privado.capitulo_agendamentos set executado_em=now()-interval '2 minutes'
 where capitulo_id='ac300000-0000-4000-8000-000000000003';
select is(historietas_privado.executar_agendamento_capitulo('ac300000-0000-4000-8000-000000000003',1)->>'estado','publicado','retry apos recuperacao');
select is((select count(*)::integer from public.notificacoes where capitulo_id='ac300000-0000-4000-8000-000000000003'),2,'retry so cria uma cadeia');
select is((select count(*)::integer from public.diario_atividades where capitulo_id='ac300000-0000-4000-8000-000000000003'),1,'retry apos falha cria uma unica atividade');
update public.capitulos set texto='Edicao cancela tambem o retry de uma falha.' where id='ac300000-0000-4000-8000-000000000004';
select is(historietas_privado.executar_agendamento_capitulo('ac300000-0000-4000-8000-000000000004',1)->>'estado','desatualizado','edicao impede retry antigo');
select set_config('request.jwt.claim.sub','ac100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"ac100000-0000-4000-8000-000000000001","session_id":"ac500000-0000-4000-8000-000000000001"}',true);
select is(public.cancelar_agendamento_capitulo('ac300000-0000-4000-8000-000000000005',1)->>'estado','cancelado','autor cancela erro sem relaxar grants');
select set_config('request.jwt.claim.sub','',true); select set_config('request.jwt.claims','{}',true);
select is(historietas_privado.executar_agendamento_capitulo('ac300000-0000-4000-8000-000000000005',1)->>'estado','desatualizado','cancelamento impede retry antigo');
select is((select count(*)::integer from public.diario_atividades where capitulo_id in
 ('ac300000-0000-4000-8000-000000000004','ac300000-0000-4000-8000-000000000005')),0,'edicao/cancelamento nao geram atividades');

select pg_temp.preparar(6);
savepoint autorizacao;
update auth.users set banned_until=now()+interval '1 day' where id='ac100000-0000-4000-8000-000000000001';
select is(historietas_privado.executar_agendamento_capitulo('ac300000-0000-4000-8000-000000000006',1)->>'estado','bloqueado','autor suspenso no Auth');
rollback to autorizacao;
savepoint autorizacao;
update auth.users set deleted_at=now() where id='ac100000-0000-4000-8000-000000000001';
select is(historietas_privado.executar_agendamento_capitulo('ac300000-0000-4000-8000-000000000006',1)->>'estado','bloqueado','autor excluido logicamente');
rollback to autorizacao;
savepoint autorizacao;
update public.profiles set termos_uso_versao=null where user_id='ac100000-0000-4000-8000-000000000001';
select is(historietas_privado.executar_agendamento_capitulo('ac300000-0000-4000-8000-000000000006',1)->>'estado','bloqueado','termos revogados');
rollback to autorizacao;
savepoint autorizacao;
update public.obras set publicado=false where id='ac200000-0000-4000-8000-000000000001';
select is(historietas_privado.executar_agendamento_capitulo('ac300000-0000-4000-8000-000000000006',1)->>'estado','bloqueado','obra nao publicada');
rollback to autorizacao;
savepoint autorizacao;
delete from public.profiles where user_id='ac100000-0000-4000-8000-000000000001';
select is(historietas_privado.executar_agendamento_capitulo('ac300000-0000-4000-8000-000000000006',1)->>'estado','bloqueado','perfil ausente');
rollback to autorizacao;
savepoint autorizacao;
insert into public.operacoes_exclusao_conta(subject_user_id) values ('ac100000-0000-4000-8000-000000000001');
select is(historietas_privado.executar_agendamento_capitulo('ac300000-0000-4000-8000-000000000006',1)->>'estado','bloqueado','exclusao iniciada impede publicacao');
rollback to autorizacao;
savepoint autorizacao;
update public.capitulos set tipo_conteudo='imagens' where id='ac300000-0000-4000-8000-000000000006';
select is(historietas_privado.executar_agendamento_capitulo('ac300000-0000-4000-8000-000000000006',1)->>'estado','desatualizado','tipo alterado invalida, sem publicar imagens');
rollback to autorizacao;
savepoint autorizacao;
-- Simula registro interno corrompido: nao autoriza propriedade por autor_id isolado.
update historietas_privado.capitulo_agendamentos set autor_id='ac100000-0000-4000-8000-000000000003'
 where capitulo_id='ac300000-0000-4000-8000-000000000006';
select is(historietas_privado.executar_agendamento_capitulo('ac300000-0000-4000-8000-000000000006',1)->>'estado','bloqueado','propriedade real revalidada');
rollback to autorizacao;

select pg_temp.preparar(7);
update public.capitulos set titulo=repeat('T',500) where id='ac300000-0000-4000-8000-000000000007';
-- Confirma novamente conteudo alterado, pela mesma RPC autenticada.
select set_config('request.jwt.claim.sub','ac100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"ac100000-0000-4000-8000-000000000001","session_id":"ac500000-0000-4000-8000-000000000001"}',true);
select public.agendar_capitulo('ac300000-0000-4000-8000-000000000007',2,'2099-01-01Z','UTC');
select set_config('request.jwt.claim.sub','',true); select set_config('request.jwt.claims','{}',true);
update historietas_privado.capitulo_agendamentos set publicar_em=now()-interval '1 minute' where capitulo_id='ac300000-0000-4000-8000-000000000007';
select is(historietas_privado.executar_agendamento_capitulo('ac300000-0000-4000-8000-000000000007',3)->>'estado','publicado','titulo longo respeita contrato real de notificacao');
select ok((select bool_and(char_length(mensagem)<=300) from public.notificacoes where capitulo_id='ac300000-0000-4000-8000-000000000007'),'mensagens dentro da constraint');

select pg_temp.preparar(8);
update public.obras set classificacao_indicativa='18+',avisos_conteudo=array['terror'] where id='ac200000-0000-4000-8000-000000000001';
select is(historietas_privado.executar_agendamento_capitulo('ac300000-0000-4000-8000-000000000008',1)->>'estado','publicado','publicacao nao altera classificacao');
select set_config('request.jwt.claim.sub','ac100000-0000-4000-8000-000000000002',true);
set local role authenticated;
select is((select count(*)::integer from public.notificacoes where capitulo_id='ac300000-0000-4000-8000-000000000008'),0,'18+ continua oculto nas notificacoes');
select is((select count(*)::integer from public.diario_atividades where capitulo_id='ac300000-0000-4000-8000-000000000008'),0,'18+ oculto no Diario para terceiros');
reset role;
select set_config('request.jwt.claim.sub','',true);
set local role anon;
select is((select count(*)::integer from public.capitulos where id='ac300000-0000-4000-8000-000000000008'),0,'18+ continua oculto publicamente');
select is((select count(*)::integer from public.diario_atividades where capitulo_id='ac300000-0000-4000-8000-000000000008'),0,'Diario nao vaza metadata 18+ ao anon');
reset role;
update public.obras set classificacao_indicativa='Livre',avisos_conteudo='{}' where id='ac200000-0000-4000-8000-000000000001';
set local role anon;
select is((select count(*)::integer from public.diario_atividades where capitulo_id='ac300000-0000-4000-8000-000000000002'),1,'publicacao publica visivel sob RLS existente');
reset role;
select ok(not has_table_privilege('anon','public.preferencias_privacidade','SELECT'),'anon nao recebe acesso a preferencias');
insert into public.preferencias_privacidade(user_id,mostrar_diario_perfil,mostrar_atividades_leitura)
 values ('ac100000-0000-4000-8000-000000000001',false,true)
 on conflict(user_id) do update set mostrar_diario_perfil=false;
select set_config('request.jwt.claim.sub','ac100000-0000-4000-8000-000000000002',true);
set local role authenticated;
select is((select count(*)::integer from public.diario_atividades where capitulo_id='ac300000-0000-4000-8000-000000000002'),0,'preferencia real oculta atividade para terceiro');
reset role;
select set_config('request.jwt.claim.sub','ac100000-0000-4000-8000-000000000001',true);
set local role authenticated;
select is((select count(*)::integer from public.diario_atividades where capitulo_id='ac300000-0000-4000-8000-000000000002'),1,'autor mantem Diario proprio privado');
reset role;
update public.preferencias_privacidade set mostrar_diario_perfil=true where user_id='ac100000-0000-4000-8000-000000000001';
select set_config('request.jwt.claim.sub','ac100000-0000-4000-8000-000000000002',true);
set local role authenticated;
select throws_ok($$insert into public.diario_atividades(user_id,tipo,obra_id,capitulo_id) values
 ('ac100000-0000-4000-8000-000000000002','publicou_capitulo','ac200000-0000-4000-8000-000000000001','ac300000-0000-4000-8000-000000000002')$$,
 '42501',null,'terceiro nao forja autoria de publicacao');
select lives_ok($$insert into public.diario_atividades(user_id,tipo) values
 ('ac100000-0000-4000-8000-000000000002','criou_lista')$$,'tipo legado continua aceito');
select lives_ok($$insert into public.diario_atividades(user_id,tipo)
 select 'ac100000-0000-4000-8000-000000000002'::uuid,tipo from unnest(array[
 'comecou_ler','leu_capitulo','concluiu_obra','avaliou_obra','favoritou_obra','salvou_obra','publicou_review','criou_lista']) tipo$$,
 'os oito tipos legados continuam aceitos');
select is((select count(*)::integer from public.diario_atividades where user_id='ac100000-0000-4000-8000-000000000002'),9,
 'leitura legada funciona com search_path vazio e permissao do invocador');
reset role;
select set_config('request.jwt.claim.sub','ac100000-0000-4000-8000-000000000001',true);
set local role authenticated;
select throws_ok($$insert into public.diario_atividades(user_id,tipo,obra_id,capitulo_id) values
 ('ac100000-0000-4000-8000-000000000001','publicou_capitulo','ac200000-0000-4000-8000-000000000001','ac300000-0000-4000-8000-000000000001')$$,
 '42501',null,'autor nao anuncia draft nao publicado');
select lives_ok($$delete from public.diario_atividades where capitulo_id='ac300000-0000-4000-8000-000000000003'$$,'autor remove atividade propria');
reset role;
select set_config('request.jwt.claim.sub','',true);
select is(historietas_privado.executar_agendamento_capitulo('ac300000-0000-4000-8000-000000000003',1)->>'repetido','true','retry reconhece recibo apos remocao da atividade');
select is((select count(*)::integer from public.diario_atividades where capitulo_id='ac300000-0000-4000-8000-000000000003'),0,'retry nao ressuscita atividade removida');
update public.capitulos set publicado=false where id='ac300000-0000-4000-8000-000000000002';
set local role anon;
select is((select count(*)::integer from public.diario_atividades where capitulo_id='ac300000-0000-4000-8000-000000000002'),0,'despublicacao oculta metadata historica');
reset role;
select pg_temp.preparar(9); select pg_temp.preparar(10);
select is(jsonb_array_length(historietas_privado.executar_lote_agendamentos_capitulos(1)),1,'lote respeita limite');
select pg_temp.preparar(11);
delete from public.capitulos where id='ac300000-0000-4000-8000-000000000011';
select is(historietas_privado.executar_agendamento_capitulo('ac300000-0000-4000-8000-000000000011',1)->>'estado','ausente','capitulo removido nao ressuscita');
delete from auth.users where id='ac100000-0000-4000-8000-000000000001';
select is(historietas_privado.executar_agendamento_capitulo('ac300000-0000-4000-8000-000000000010',1)->>'estado','ausente','conta excluida nao publica depois');
select * from finish();
rollback;
