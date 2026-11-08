begin;
select no_plan();
-- BEGIN CACHE FIXTURE
insert into auth.users(id) values ('bc100000-0000-4000-8000-000000000001') on conflict do nothing;
insert into public.profiles(id,user_id,nome,tipo) values
 ('bc100000-0000-4000-8000-000000000001','bc100000-0000-4000-8000-000000000001','QA cache','autor');
select set_config('request.jwt.claim.sub','bc100000-0000-4000-8000-000000000001',true);
select public.aceitar_termos_publicacao('2026-08-05','2026-08-05','2026-08-05');
insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,publicado,slug) values
 ('bc200000-0000-4000-8000-000000000001','bc100000-0000-4000-8000-000000000001','Obra cache','QA','Fantasia','Romance','Livre',true,'qa-cache');
insert into public.capitulos(id,obra_id,user_id,titulo,texto,ordem,publicado)
 select ('bc300000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,
 'bc200000-0000-4000-8000-000000000001','bc100000-0000-4000-8000-000000000001',
 'Capitulo '||i,'Texto privado do teste local de cache.',i,false from generate_series(1,3) i;
insert into auth.sessions(id,user_id) values ('bc500000-0000-4000-8000-000000000001','bc100000-0000-4000-8000-000000000001');
-- END CACHE FIXTURE
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{}',true);
-- Isola a fila neste teste transacional; ROLLBACK restaura registros locais.
delete from historietas_privado.capitulo_cache_outbox;
select ok((select relrowsecurity from pg_class where oid='historietas_privado.capitulo_cache_outbox'::regclass),'outbox com RLS');
select ok(not exists(select 1 from unnest(array['anon','authenticated','service_role']) r
 where has_table_privilege(r,'historietas_privado.capitulo_cache_outbox','SELECT,INSERT,UPDATE,DELETE')),'sem grants de tabela');
select ok(not has_function_privilege('authenticated','public.reivindicar_cache_capitulos(integer)','EXECUTE'),'cliente nao reivindica');
select ok(not has_function_privilege('anon','public.autorizar_consumidor_cache_capitulos()','EXECUTE'),'anon nao consulta gate');
select throws_ok($$select public.reivindicar_cache_capitulos(6)$$,'22023',null,'lote limitado');
select set_config('request.jwt.claim.sub','bc100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"bc100000-0000-4000-8000-000000000001","session_id":"bc500000-0000-4000-8000-000000000001"}',true);
select public.agendar_capitulo('bc300000-0000-4000-8000-000000000001',0,'2099-01-01Z','UTC');
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{}',true);
select is(historietas_privado.executar_agendamento_capitulo('bc300000-0000-4000-8000-000000000001',1)->>'estado','futuro','sem execucao antecipada');
select is((select count(*)::int from historietas_privado.capitulo_cache_outbox),0,'sem cache de draft');
update historietas_privado.capitulo_agendamentos set publicar_em=now()-interval '1 minute' where capitulo_id='bc300000-0000-4000-8000-000000000001';
select is(historietas_privado.executar_agendamento_capitulo('bc300000-0000-4000-8000-000000000001',1)->>'estado','publicado','publica por contrato existente');
select ok((select b.capitulo_id=e.capitulo_id and b.revisao_agendada=e.revisao_agendada
 and b.obra_id=e.obra_id and b.publicado_em=e.publicado_em and b.slug_publicacao='qa-cache' and b.numero_capitulo=1
 from historietas_privado.capitulo_cache_outbox b join historietas_privado.capitulo_publicacao_eventos e
 using(capitulo_id,revisao_agendada) where b.capitulo_id='bc300000-0000-4000-8000-000000000001'),'snapshot vinculado ao recibo real');
select throws_ok($$update historietas_privado.capitulo_cache_outbox set numero_capitulo=99$$,'55000',null,'snapshot imutavel');
select is(historietas_privado.executar_agendamento_capitulo('bc300000-0000-4000-8000-000000000001',1)->>'repetido','true','retry reconhece publicacao');
select is((select count(*)::int from historietas_privado.capitulo_cache_outbox),1,'retry nao duplica outbox');
set local role service_role;
select throws_ok($$select * from historietas_privado.capitulo_cache_outbox$$,'42501',null,'service role nao le tabela');
select set_config('qa.cache_claim',public.reivindicar_cache_capitulos(1)::text,true);
select is(jsonb_array_length(current_setting('qa.cache_claim')::jsonb),1,'servidor recebe lote');
select is(public.reivindicar_cache_capitulos(1),'[]'::jsonb,'lease impede segundo consumidor');
select lives_ok($$select public.registrar_solicitacao_cache_capitulo(
 (current_setting('qa.cache_claim')::jsonb->0->>'id')::uuid,
 (current_setting('qa.cache_claim')::jsonb->0->>'leaseId')::uuid)$$,'registra solicitacao apos enfileirar');
select lives_ok($$select public.registrar_solicitacao_cache_capitulo(
 (current_setting('qa.cache_claim')::jsonb->0->>'id')::uuid,
 (current_setting('qa.cache_claim')::jsonb->0->>'leaseId')::uuid)$$,'registro idempotente');
reset role;
select ok((select solicitada_em is not null and lease_id is not null from historietas_privado.capitulo_cache_outbox),'solicitacao nao confirma nem remove pendencia');
update historietas_privado.capitulo_cache_outbox set lease_ate=clock_timestamp()-interval '1 second';
select throws_ok($$select public.registrar_solicitacao_cache_capitulo(
 (current_setting('qa.cache_claim')::jsonb->0->>'id')::uuid,
 (current_setting('qa.cache_claim')::jsonb->0->>'leaseId')::uuid)$$,'55000',null,'lease vencido nao atualiza');
update public.obras set slug='qa-cache-renomeada' where id='bc200000-0000-4000-8000-000000000001';
select is(public.reivindicar_cache_capitulos(1)->0->>'slugAtual','qa-cache-renomeada','inclui slug atual sem modificar snapshot');
select is((select slug_publicacao from historietas_privado.capitulo_cache_outbox),'qa-cache','slug original preservado');

-- Mesmo que a claim do token diga admin, a autorizacao usa Auth atual/sessao.
select set_config('request.jwt.claim.sub','bc100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"bc100000-0000-4000-8000-000000000001","session_id":"bc500000-0000-4000-8000-000000000001","app_metadata":{"role":"admin"}}',true);
set local role authenticated;
select ok(not public.autorizar_consumidor_cache_capitulos(),'claim antiga/forjada nao autoriza');
reset role;
update auth.users set raw_app_meta_data='{"role":"admin"}' where id='bc100000-0000-4000-8000-000000000001';
set local role authenticated;
select ok(public.autorizar_consumidor_cache_capitulos(),'admin atual com sessao ativa');
reset role;
delete from auth.sessions where id='bc500000-0000-4000-8000-000000000001';
set local role authenticated;
select ok(not public.autorizar_consumidor_cache_capitulos(),'logout revoga acionamento');
reset role;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{}',true);

-- Forca falha DEPOIS de enfileirar e criar Diario: subtransacao reverte tudo.
create function pg_temp.falhar_cache() returns trigger language plpgsql as $$
begin raise exception 'Falha apos outbox.' using errcode='XX000'; end;
$$;
create trigger zz_qa_falhar_cache after insert on historietas_privado.capitulo_publicacao_eventos
for each row execute function pg_temp.falhar_cache();
insert into auth.sessions(id,user_id) values ('bc500000-0000-4000-8000-000000000001','bc100000-0000-4000-8000-000000000001');
select set_config('request.jwt.claim.sub','bc100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"bc100000-0000-4000-8000-000000000001","session_id":"bc500000-0000-4000-8000-000000000001"}',true);
select public.agendar_capitulo('bc300000-0000-4000-8000-000000000002',0,'2099-01-01Z','UTC');
select set_config('request.jwt.claim.sub','',true); select set_config('request.jwt.claims','{}',true);
update historietas_privado.capitulo_agendamentos set publicar_em=now()-interval '1 minute' where capitulo_id='bc300000-0000-4000-8000-000000000002';
select is(historietas_privado.executar_agendamento_capitulo('bc300000-0000-4000-8000-000000000002',1)->>'estado','erro','falha nao confirma');
select is((select count(*)::int from historietas_privado.capitulo_cache_outbox where numero_capitulo=2),0,'rollback da outbox');
select is((select count(*)::int from public.diario_atividades where capitulo_id='bc300000-0000-4000-8000-000000000002'),0,'rollback do Diario');
select ok(not (select publicado from public.capitulos where id='bc300000-0000-4000-8000-000000000002'),'rollback da publicacao');
delete from public.obras where id='bc200000-0000-4000-8000-000000000001';
select is((select count(*)::int from historietas_privado.capitulo_cache_outbox),1,'cascata preserva invalidacao pendente');
select * from finish();
rollback;
