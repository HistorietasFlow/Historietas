begin;
select no_plan();

insert into auth.users(id) values ('de100000-0000-4000-8000-000000000001'),
  ('de100000-0000-4000-8000-000000000002') on conflict do nothing;
insert into public.profiles(id,user_id,nome,tipo) values
  ('de100000-0000-4000-8000-000000000001','de100000-0000-4000-8000-000000000001','QA agenda','autor'),
  ('de100000-0000-4000-8000-000000000002','de100000-0000-4000-8000-000000000002','QA terceiro','autor');
select set_config('request.jwt.claim.sub','de100000-0000-4000-8000-000000000001',true);
select public.aceitar_termos_publicacao('2026-08-05','2026-08-05','2026-08-05');
insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,avisos_conteudo,publicado,slug) values
  ('de200000-0000-4000-8000-000000000001','de100000-0000-4000-8000-000000000001','QA agenda','QA','Fantasia','Romance','Livre','{}',true,'qa-diario-edicao'),
  ('de200000-0000-4000-8000-000000000002','de100000-0000-4000-8000-000000000001','QA draft','QA','Fantasia','Romance','Livre','{}',false,'qa-diario-edicao-draft'),
  ('de200000-0000-4000-8000-000000000003','de100000-0000-4000-8000-000000000001','QA adulto','QA','Fantasia','Romance','18+','{terror}',true,'qa-diario-edicao-adulto');
insert into public.capitulos(id,obra_id,user_id,titulo,texto,ordem,publicado) values
  ('de300000-0000-4000-8000-000000000001','de200000-0000-4000-8000-000000000001','de100000-0000-4000-8000-000000000001','Capitulo agendavel','Texto privado que nao deve aparecer antes da publicacao.',1,false),
  ('de300000-0000-4000-8000-000000000002','de200000-0000-4000-8000-000000000002','de100000-0000-4000-8000-000000000001','Draft de obra','Texto draft',1,false),
  ('de300000-0000-4000-8000-000000000003','de200000-0000-4000-8000-000000000001','de100000-0000-4000-8000-000000000001','Ja publicado','Texto publicado',2,true),
  ('de300000-0000-4000-8000-000000000004','de200000-0000-4000-8000-000000000003','de100000-0000-4000-8000-000000000001','Draft adulto','Texto adulto',1,false);
insert into auth.sessions(id,user_id) values
  ('de500000-0000-4000-8000-000000000001','de100000-0000-4000-8000-000000000001'),
  ('de500000-0000-4000-8000-000000000002','de100000-0000-4000-8000-000000000002');

select set_config('request.jwt.claims','{"sub":"de100000-0000-4000-8000-000000000001","role":"authenticated","session_id":"de500000-0000-4000-8000-000000000001"}',true);
select lives_ok($q$insert into public.diario_atividades(user_id,tipo) select 'de100000-0000-4000-8000-000000000001',t from unnest(array['comecou_ler','leu_capitulo','concluiu_obra','avaliou_obra','favoritou_obra','salvou_obra','publicou_review','criou_lista','publicou_capitulo']) t$q$,'tipos antigos preservados');
select throws_ok($q$insert into public.diario_atividades(user_id,tipo) values('de100000-0000-4000-8000-000000000001','evento_inventado')$q$,'23514',null,'CHECK nao aceita tipo arbitrario');
select ok(not habilitado,'migration nao ativa evento') from historietas_privado.diario_edicao_config;
select ok(relrowsecurity,'RLS privada habilitada') from pg_class where oid in
 ('historietas_privado.diario_edicao_config'::regclass,'historietas_privado.diario_edicao_recibos'::regclass);
select ok(not has_table_privilege(r,t,'SELECT,INSERT,UPDATE,DELETE'),'sem DML privado: '||r||' '||t)
from unnest(array['anon','authenticated','service_role']) r cross join
 unnest(array['historietas_privado.diario_edicao_config','historietas_privado.diario_edicao_recibos']) t;
select ok(not has_function_privilege(r,'public.registrar_diario_edicao_capitulo(uuid,uuid)','EXECUTE'),'sem RPC para '||r)
from unnest(array['anon','service_role']) r;
select ok(not prosecdef,'wrapper publico invoker') from pg_proc where oid='public.registrar_diario_edicao_capitulo(uuid,uuid)'::regprocedure;
select ok(proconfig=array['search_path=""'],'search_path fechado') from pg_proc where oid in
 ('historietas_privado.registrar_diario_edicao(uuid,uuid)'::regprocedure,'historietas_privado.edicao_diario_visivel(uuid,uuid,uuid,text)'::regprocedure);
select ok(not has_function_privilege('authenticated','historietas_privado.definir_versao_diario_edicao()','EXECUTE'),'trigger nao vira RPC');
delete from public.diario_atividades where user_id='de100000-0000-4000-8000-000000000001' and tipo<>'editou_capitulo';
select is((select diario_edicao_versao from public.capitulos where id='de300000-0000-4000-8000-000000000003'),null::uuid,'INSERT sem versao');
set local role authenticated;
select throws_ok($$select public.registrar_diario_edicao_capitulo('de300000-0000-4000-8000-000000000003',null)$$,'55000',null,'gate fechado');
reset role;
update historietas_privado.diario_edicao_config set habilitado=true;
set local role authenticated;
update public.capitulos set texto='Edicao confirmada' where id='de300000-0000-4000-8000-000000000003';
reset role;
create temp table edicao_v1 as select diario_edicao_versao as versao from public.capitulos where id='de300000-0000-4000-8000-000000000003';
grant select on edicao_v1 to authenticated;
select ok((select versao is not null from edicao_v1),'UPDATE cria token');
set local role authenticated;
select lives_ok($$select public.registrar_diario_edicao_capitulo('de300000-0000-4000-8000-000000000003',(select versao from edicao_v1))$$,'autor registra edicao');
select lives_ok($$select public.registrar_diario_edicao_capitulo('de300000-0000-4000-8000-000000000003',(select versao from edicao_v1))$$,'resposta perdida admite consulta idempotente');
select throws_ok($$insert into public.diario_atividades(user_id,tipo,obra_id,capitulo_id,metadata) values
 ('de100000-0000-4000-8000-000000000001','editou_capitulo','de200000-0000-4000-8000-000000000001','de300000-0000-4000-8000-000000000003','{"href":"/privado","titulo":"Vazamento"}')$$,'42501',null,'DML direto nao forja snapshots');
update public.capitulos set diario_edicao_versao=gen_random_uuid() where id='de300000-0000-4000-8000-000000000003';
reset role;
select is((select diario_edicao_versao from public.capitulos where id='de300000-0000-4000-8000-000000000003'),(select versao from edicao_v1),'token nao e forjavel');
select is((select count(*)::integer from historietas_privado.diario_edicao_recibos),1,'um recibo');
select is((select count(*)::integer from public.diario_atividades where tipo='editou_capitulo'),1,'um evento');
select ok(metadata='{}'::jsonb and texto='' and nota is null,'sem snapshots privados') from public.diario_atividades where tipo='editou_capitulo';
set local role authenticated;
with u as (update public.diario_atividades set tipo='leu_capitulo',metadata='{"titulo":"forjado"}' where tipo='editou_capitulo' returning id)
select is(count(*)::integer,0,'evento imutavel inclusive tipo') from u;
select throws_ok($$select public.registrar_diario_edicao_capitulo('de300000-0000-4000-8000-000000000001',null)$$,'42501',null,'draft nao gera evento');
select throws_ok($$select public.registrar_diario_edicao_capitulo('de300000-0000-4000-8000-000000000002',null)$$,'42501',null,'obra draft nao gera evento');
select throws_ok($$select public.registrar_diario_edicao_capitulo('de300000-0000-4000-8000-000000000004',null)$$,'42501',null,'18+ nao gera evento');
select throws_ok($$select public.registrar_diario_edicao_capitulo('de300000-0000-4000-8000-000000000003',gen_random_uuid())$$,'PT409',null,'versao desconhecida');
reset role;
select set_config('request.jwt.claim.sub','de100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"de100000-0000-4000-8000-000000000002","role":"authenticated","session_id":"de500000-0000-4000-8000-000000000002"}',true);
set local role authenticated;
select throws_ok($$select public.registrar_diario_edicao_capitulo('de300000-0000-4000-8000-000000000003',(select versao from edicao_v1))$$,'42501',null,'terceiro nao reutiliza recibo');
select is((select count(*)::integer from public.diario_atividades where tipo='editou_capitulo'),1,'leitor ve edicao publica');
reset role;
insert into public.preferencias_privacidade(user_id,mostrar_diario_perfil) values('de100000-0000-4000-8000-000000000001',false)
on conflict(user_id) do update set mostrar_diario_perfil=false;
set local role authenticated;
select is((select count(*)::integer from public.diario_atividades where tipo='editou_capitulo'),0,'preferencia oculta evento');
reset role;
update public.preferencias_privacidade set mostrar_diario_perfil=true where user_id='de100000-0000-4000-8000-000000000001';
update public.preferencias_privacidade set mostrar_atividades_leitura=false where user_id='de100000-0000-4000-8000-000000000001';
set local role authenticated;
select is((select count(*)::integer from public.diario_atividades where tipo='editou_capitulo'),0,'atividades desligadas ocultam evento');
reset role;
update public.preferencias_privacidade set mostrar_atividades_leitura=true,perfil_privado=true where user_id='de100000-0000-4000-8000-000000000001';
set local role authenticated;
select is((select count(*)::integer from public.diario_atividades where tipo='editou_capitulo'),0,'perfil privado nao abre para terceiro');
reset role;
update public.preferencias_privacidade set perfil_privado=false where user_id='de100000-0000-4000-8000-000000000001';

insert into public.usuarios_bloqueados(bloqueador_id,bloqueado_id) values('de100000-0000-4000-8000-000000000001','de100000-0000-4000-8000-000000000002');
set local role authenticated;
select is((select count(*)::integer from public.diario_atividades where tipo='editou_capitulo'),0,'bloqueio respeitado');
reset role;
delete from public.usuarios_bloqueados where bloqueador_id='de100000-0000-4000-8000-000000000001';
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{}',true);
set local role anon;
select is((select count(*)::integer from public.diario_atividades where tipo='editou_capitulo'),1,'anon sem grant em preferencias le somente novo evento');
reset role;
update public.capitulos set publicado=false where id='de300000-0000-4000-8000-000000000003';
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{}',true);
set local role anon;
select is((select count(*)::integer from public.diario_atividades where tipo='editou_capitulo'),0,'despublicacao oculta inclusive metadata');
reset role;
select set_config('request.jwt.claim.sub','de100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"de100000-0000-4000-8000-000000000001","role":"authenticated","session_id":"de500000-0000-4000-8000-000000000001"}',true);
update public.capitulos set publicado=true where id='de300000-0000-4000-8000-000000000003';
update public.obras set classificacao_indicativa='18+',avisos_conteudo='{terror}' where id='de200000-0000-4000-8000-000000000001';
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{}',true);
set local role anon;
select is((select count(*)::integer from public.diario_atividades where tipo='editou_capitulo'),0,'mudanca para 18+ retira evento');
reset role;
select set_config('request.jwt.claim.sub','de100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"de100000-0000-4000-8000-000000000001","role":"authenticated","session_id":"de500000-0000-4000-8000-000000000001"}',true);
update public.obras set classificacao_indicativa='Livre',avisos_conteudo='{}' where id='de200000-0000-4000-8000-000000000001';
select set_config('request.jwt.claim.sub','de100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"de100000-0000-4000-8000-000000000001","role":"authenticated","session_id":"de500000-0000-4000-8000-000000000001"}',true);
set local role authenticated;
delete from public.diario_atividades where tipo='editou_capitulo';
select is(public.registrar_diario_edicao_capitulo('de300000-0000-4000-8000-000000000003',(select versao from edicao_v1)),null::uuid,'retry nao recria atividade apagada');
reset role;
select is((select count(*)::integer from public.diario_atividades where tipo='editou_capitulo'),0,'tombstone preservado');
select is((select count(*)::integer from historietas_privado.diario_edicao_recibos),1,'exclusao voluntaria nao apaga recibo');
-- Forca falha depois do INSERT da atividade: recibo e evento devem ser atomicos.
update public.capitulos set texto='Segunda edicao' where id='de300000-0000-4000-8000-000000000003';
create temp table edicao_v2 as select diario_edicao_versao as versao from public.capitulos where id='de300000-0000-4000-8000-000000000003';
grant select on edicao_v2 to authenticated;
create function pg_temp.recusar_recibo() returns trigger language plpgsql as $q$
begin raise exception 'Falha de recibo simulada'; end; $q$;
create trigger qa_recibo_falha before insert on historietas_privado.diario_edicao_recibos for each row execute function pg_temp.recusar_recibo();
set local role authenticated;
select throws_ok($q$select public.registrar_diario_edicao_capitulo('de300000-0000-4000-8000-000000000003',(select versao from edicao_v2))$q$,'P0001','Falha de recibo simulada','falha do recibo reverte atividade');
reset role;
select is((select count(*)::integer from public.diario_atividades where tipo='editou_capitulo'),0,'nao deixa efeito parcial');
drop trigger qa_recibo_falha on historietas_privado.diario_edicao_recibos;
set local role authenticated;
select lives_ok($q$select public.registrar_diario_edicao_capitulo('de300000-0000-4000-8000-000000000003',(select versao from edicao_v2))$q$,'nova tentativa apos rollback comprovado');
reset role;
select is((select count(*)::integer from public.diario_atividades where tipo='editou_capitulo'),1,'exatamente uma atividade confirmada');
delete from public.capitulos where id='de300000-0000-4000-8000-000000000003';
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{}',true);
set local role anon;
select is((select count(*)::integer from public.diario_atividades where tipo='editou_capitulo'),0,'exclusao retira evento sem titulo/link retido');
reset role;
select ok(metadata='{}'::jsonb and texto='','exclusao nao deixa snapshot') from public.diario_atividades where tipo='editou_capitulo';
select set_config('request.jwt.claim.sub','de100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"de100000-0000-4000-8000-000000000001","role":"authenticated","session_id":"de500000-0000-4000-8000-000000000001"}',true);
delete from auth.sessions where id='de500000-0000-4000-8000-000000000001';
set local role authenticated;
select throws_ok($q$select public.registrar_diario_edicao_capitulo('de300000-0000-4000-8000-000000000001',(select versao from edicao_v1))$q$,'42501','Sessao indisponivel.','sessao revogada nao opera');
reset role;
select ok((select habilitado from historietas_privado.diario_edicao_config),'gate so habilitado dentro da transacao de teste');
select * from finish();
rollback;
