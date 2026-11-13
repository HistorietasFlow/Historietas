begin;
select no_plan();

select ok(relrowsecurity, 'RLS privada: '||relname) from pg_class where oid in (
 'historietas_privado.obra_capas_estado'::regclass,
 'historietas_privado.obra_capas_referencias'::regclass,
 'historietas_privado.obra_capas_operacoes'::regclass);
select ok(not has_table_privilege(r,t,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE'),r||' sem acesso: '||t)
from unnest(array['anon','authenticated','service_role']) r cross join unnest(array[
 'historietas_privado.obra_capas_estado','historietas_privado.obra_capas_referencias',
 'historietas_privado.obra_capas_operacoes']) t;
select ok(not prosecdef and proconfig=array['search_path=""'], 'wrapper invoker restrito: '||proname)
from pg_proc where oid in ('public.consultar_contrato_capa(uuid)'::regprocedure,
 'public.aplicar_operacao_capa(uuid,uuid,uuid,bigint,uuid,text,text[])'::regprocedure,
 'public.consultar_operacao_capa(uuid)'::regprocedure);
select ok(not has_function_privilege(r,f,'EXECUTE'),r||' nao executa '||f)
from unnest(array['anon','service_role']) r cross join unnest(array[
 'public.consultar_contrato_capa(uuid)','public.aplicar_operacao_capa(uuid,uuid,uuid,bigint,uuid,text,text[])',
 'public.consultar_operacao_capa(uuid)']) f;
select ok(not exists(select 1 from pg_constraint where contype='f' and conrelid in (
 'historietas_privado.obra_capas_estado'::regclass,'historietas_privado.obra_capas_referencias'::regclass,
 'historietas_privado.obra_capas_operacoes'::regclass)), 'evidencias sem cascatas');

insert into auth.users(id) values ('ca110000-0000-4000-8000-000000000001'),('ca110000-0000-4000-8000-000000000002');
insert into auth.sessions(id,user_id,not_after) values
 ('ca120000-0000-4000-8000-000000000001','ca110000-0000-4000-8000-000000000001',now()+interval '1 day'),
 ('ca120000-0000-4000-8000-000000000002','ca110000-0000-4000-8000-000000000002',now()+interval '1 day');
insert into public.profiles(id,user_id,nome,tipo) select id,id,'QA capas','autor' from auth.users where id::text like 'ca110000-%';
insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,slug,capa_url) values
 ('ca130000-0000-4000-8000-000000000001','ca110000-0000-4000-8000-000000000001','Privada','QA','Fantasia','HQ','Livre','qa-capa-privada',''),
 ('ca130000-0000-4000-8000-000000000002','ca110000-0000-4000-8000-000000000001','Publica','QA','Fantasia','HQ','Livre','qa-capa-publica','https://example.invalid/publica.png');
-- Simula tupla anterior a migration: nenhum backfill ou regravacao da obra.
alter table public.obras disable trigger obras_contrato_capa;
insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,slug)
 values('ca130000-0000-4000-8000-000000000003','ca110000-0000-4000-8000-000000000001','Legado','QA','Fantasia','HQ','Livre','qa-capa-legado');
alter table public.obras enable trigger obras_contrato_capa;
create temp table qa_capa_antes as select id,to_jsonb(o) dados,xmin::text xmin_antes from public.obras o where slug='qa-capa-legado';
select is((select count(*)::int from historietas_privado.obra_capas_estado where obra_id='ca130000-0000-4000-8000-000000000003'),0,'legado nao preenchido em massa');
select set_config('request.jwt.claims','{"sub":"ca110000-0000-4000-8000-000000000001","role":"authenticated","session_id":"ca120000-0000-4000-8000-000000000001"}',true);
select public.aceitar_termos_publicacao('2026-08-05','2026-08-05','2026-08-05');
set local role authenticated;
create temp table qa_capa_snapshot as select public.consultar_contrato_capa('ca130000-0000-4000-8000-000000000001') s;
select is(public.consultar_contrato_capa('ca130000-0000-4000-8000-000000000003')->>'publicaOuIncerta','true','NULL historico nao certifica ausencia de exposicao');
reset role;
select ok((select to_jsonb(o)=a.dados and o.xmin::text=a.xmin_antes from public.obras o join qa_capa_antes a using(id)), 'inicializacao sob demanda nao regrava obra');
insert into historietas_privado.obra_capas_referencias(id,obra_id,geracao,autor_id,bucket,caminho)
 select 'ca140000-0000-4000-8000-000000000001',obra_id,geracao,autor_id,'capas-obras-privadas',
 autor_id::text||'/'||geracao::text||'/ca140000-0000-4000-8000-000000000001.webp'
 from historietas_privado.obra_capas_estado where obra_id='ca130000-0000-4000-8000-000000000001';
select throws_ok($$insert into historietas_privado.obra_capas_referencias(id,obra_id,geracao,autor_id,bucket,caminho)
 select 'ca140000-0000-4000-8000-000000000002',obra_id,geracao,autor_id,'capas-obras-privadas',
 'ca110000-0000-4000-8000-000000000002/'||geracao::text||'/ca140000-0000-4000-8000-000000000002.webp'
 from historietas_privado.obra_capas_estado where obra_id='ca130000-0000-4000-8000-000000000001'$$,
 '23514',null,'caminho forjado rejeitado inclusive no contrato interno');
select throws_ok($$update historietas_privado.obra_capas_referencias set caminho='forjado'$$,'55000','REGISTRO_CAPA_IMUTAVEL','referencia imutavel inclusive para escritor interno');
select throws_ok($$delete from historietas_privado.obra_capas_referencias$$,'55000','REGISTRO_CAPA_IMUTAVEL','referencia nao desaparece em cleanup');
set local role authenticated;
select throws_ok($$insert into historietas_privado.obra_capas_referencias(id) values(gen_random_uuid())$$,'42501',null,'cliente nao cadastra caminho nem prova');
create temp table qa_capa_recibo as select public.aplicar_operacao_capa(
 'ca150000-0000-4000-8000-000000000001','ca130000-0000-4000-8000-000000000001',
 (s->>'geracao')::uuid,(s->>'versao')::bigint,'ca140000-0000-4000-8000-000000000001','12+',array[]::text[]) r from qa_capa_snapshot;
select is((select r->>'estado' from qa_capa_recibo),'confirmada','vinculo e classificacao confirmados juntos');
select is((select (r->>'versao')::bigint from qa_capa_recibo),2::bigint,'versao propria incrementada uma vez');
select is(public.consultar_operacao_capa('ca150000-0000-4000-8000-000000000001'),(select r from qa_capa_recibo),'recuperacao causal por UUID');
select is(public.aplicar_operacao_capa('ca150000-0000-4000-8000-000000000001','ca130000-0000-4000-8000-000000000001',
 (s->>'geracao')::uuid,(s->>'versao')::bigint,'ca140000-0000-4000-8000-000000000001','12+',array[]::text[]),
 (select r from qa_capa_recibo),'retry devolve mesmo recibo sem novo efeito') from qa_capa_snapshot;
select throws_ok(format($q$select public.aplicar_operacao_capa('ca150000-0000-4000-8000-000000000001',
 'ca130000-0000-4000-8000-000000000001',%L,1,null,'Livre',array[]::text[])$q$,(select s->>'geracao' from qa_capa_snapshot)),
 'PT409','OPERACAO_CAPA_DIVERGENTE','UUID nao pode mudar intencao');
select throws_ok($$update public.obras set classificacao_indicativa='14+',sinopse='Nao salvar' where slug='qa-capa-privada'$$,
 '42501','CAPA_EXIGE_OPERACAO_VERSIONADA','cliente antigo nao contorna contrato gerenciado');
select throws_ok($$update public.obras set capa_url='https://example.invalid/nova.png' where slug='qa-capa-privada'$$,
 '42501','CAPA_EXIGE_OPERACAO_VERSIONADA','Data API antiga nao instala URL publica em capa privada');
select lives_ok($$update public.obras set sinopse='Metadado permitido' where slug='qa-capa-privada'$$,'metadados nao relacionados continuam compativeis');
select is(public.consultar_contrato_capa('ca130000-0000-4000-8000-000000000001')->>'versao','2','metadado nao consome versao de capa');
select throws_ok(format($q$select public.aplicar_operacao_capa('ca150000-0000-4000-8000-000000000002',
 'ca130000-0000-4000-8000-000000000001',%L,2,'ca140000-0000-4000-8000-000000000001','18+',array['terror'])$q$,(select s->>'geracao' from qa_capa_snapshot)),
 '23514','TRANSICAO_18_CAPA_BLOQUEADA','contrato nao libera 18+ privado');
-- Protecao instalada globalmente nao pode quebrar edicao de obras legadas.
select lives_ok($qa$
 update public.obras set titulo='Publica renomeada' where slug='qa-capa-publica'
$qa$,'writer legado ainda atualiza metadado comum');
select is(public.consultar_contrato_capa('ca130000-0000-4000-8000-000000000002')->>'versao','1',
 'titulo nao regrava estado da capa');
select lives_ok($qa$
 update public.obras set capa_nome='Capa antiga revisada' where slug='qa-capa-publica'
$qa$,'writer legado ainda edita capa publica sem migracao');
select is(public.consultar_contrato_capa('ca130000-0000-4000-8000-000000000002')->>'versao','2',
 'edicao da capa publica renova uma versao');
select lives_ok($qa$
 update public.obras set capa_nome=capa_nome where slug='qa-capa-publica'
$qa$,'UPDATE idempotente legado continua permitido');
select is(public.consultar_contrato_capa('ca130000-0000-4000-8000-000000000002')->>'versao','2',
 'UPDATE sem alteracao nao amplifica revisao');
select lives_ok($$update public.obras set capa_url='' where slug='qa-capa-publica'$$,'remocao logica legada preservada');
select throws_ok($$update public.obras set classificacao_indicativa='18+',avisos_conteudo=array['terror'] where slug='qa-capa-publica'$$,
 '23514','TRANSICAO_18_CAPA_BLOQUEADA','limpar URL nao prova retirada publica');
select throws_ok($$update public.obras set classificacao_indicativa='18+',avisos_conteudo=array['terror'] where slug='qa-capa-legado'$$,
 '23514','TRANSICAO_18_CAPA_BLOQUEADA','legado incerto nao recebe falso zero');
savepoint capa_rollback;
select public.aplicar_operacao_capa('ca150000-0000-4000-8000-000000000003','ca130000-0000-4000-8000-000000000001',
 (s->>'geracao')::uuid,2,null,'14+',array[]::text[]) from qa_capa_snapshot;
rollback to capa_rollback;
select is(public.consultar_contrato_capa('ca130000-0000-4000-8000-000000000001')->>'versao','2','rollback restaura versao e referencia');
select is(public.consultar_operacao_capa('ca150000-0000-4000-8000-000000000003')->>'estado','ausente','rollback nao deixa recibo de sucesso');
select is(public.consultar_operacao_capa('ca150000-0000-4000-8000-000000000003')->>'terminal','false','ausencia nao prova encerramento de requisicao atrasada');
reset role;
create function pg_temp.qa_ignorar_capa() returns trigger language plpgsql as $$ begin return null; end $$;
create trigger qa_ignorar_capa before update on public.obras
for each row when(old.id='ca130000-0000-4000-8000-000000000001') execute function pg_temp.qa_ignorar_capa();
set local role authenticated;
select throws_ok(format($q$select public.aplicar_operacao_capa('ca150000-0000-4000-8000-000000000004',
 'ca130000-0000-4000-8000-000000000001',%L,2,null,'14+',array[]::text[])$q$,(select s->>'geracao' from qa_capa_snapshot)),
 '55000','GRAVACAO_CAPA_NAO_CONFIRMADA','zero linhas nao cria falso recibo');
reset role;
drop trigger qa_ignorar_capa on public.obras;
select is((select classificacao_indicativa from public.obras where slug='qa-capa-privada'),'12+','sem efeito parcial de falha/rollback');
select is((select count(*)::int from historietas_privado.obra_capas_operacoes where obra_id='ca130000-0000-4000-8000-000000000001'),1,'um unico recibo duravel');
select throws_ok($$update historietas_privado.obra_capas_operacoes set recibo='{}'$$,'55000','REGISTRO_CAPA_IMUTAVEL','recibo confirmado nao pode ser reescrito');
select throws_ok($$delete from historietas_privado.obra_capas_operacoes$$,'55000','REGISTRO_CAPA_IMUTAVEL','recibo conservado');
savepoint capa_autoria;
update public.obras set user_id='ca110000-0000-4000-8000-000000000002' where slug='qa-capa-privada';
select isnt((select geracao::text from historietas_privado.obra_capas_estado where obra_id='ca130000-0000-4000-8000-000000000001'),
 (select s->>'geracao' from qa_capa_snapshot),'mudanca administrativa de autoria invalida geracao');
select is((select capa_privada_id from historietas_privado.obra_capas_estado where obra_id='ca130000-0000-4000-8000-000000000001'),null::uuid,'novo autor nao herda referencia privada');
rollback to capa_autoria;
delete from public.obras where slug='qa-capa-privada';
select is((select count(*)::int from historietas_privado.obra_capas_operacoes where id='ca150000-0000-4000-8000-000000000001'),1,'exclusao conserva causalidade');
insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,slug)
 values('ca130000-0000-4000-8000-000000000001','ca110000-0000-4000-8000-000000000001','Recriada','QA','Fantasia','HQ','Livre','qa-capa-privada');
select isnt((select geracao::text from historietas_privado.obra_capas_estado where obra_id='ca130000-0000-4000-8000-000000000001'),
 (select s->>'geracao' from qa_capa_snapshot),'recriacao recebe nova geracao');
select is((select capa_privada_id from historietas_privado.obra_capas_estado where obra_id='ca130000-0000-4000-8000-000000000001'),null::uuid,'recriacao nao herda vinculo');
select set_config('request.jwt.claims','{"sub":"ca110000-0000-4000-8000-000000000002","role":"authenticated","session_id":"ca120000-0000-4000-8000-000000000002"}',true);
set local role authenticated;
select throws_ok($$select public.consultar_contrato_capa('ca130000-0000-4000-8000-000000000001')$$,'42501','OBRA_CAPA_INDISPONIVEL','terceiro nao recebe estado privado');
select throws_ok($$select public.consultar_operacao_capa('ca150000-0000-4000-8000-000000000001')$$,'42501','OPERACAO_CAPA_INDISPONIVEL','terceiro nao recebe recibo');
reset role;
delete from auth.sessions where id='ca120000-0000-4000-8000-000000000002';
set local role authenticated;
select throws_ok($$select public.consultar_contrato_capa('ca130000-0000-4000-8000-000000000001')$$,'42501','SESSAO_CAPA_INDISPONIVEL','JWT antigo nao substitui sessao revogada');
reset role;
select is((select count(*)::int from historietas_privado.capitulo_cache_outbox where obra_id::text like 'ca130000-%'),0,'sem outbox ou publicacao nova');
select is((select count(*)::int from storage.buckets where id='capas-obras-privadas'),0,'nenhum bucket ativado');
select * from finish();
rollback;
