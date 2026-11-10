begin;
select no_plan();
select ok(not (select habilitado from historietas_privado.capitulo_runner_controle),'instalacao continua desativada');
select ok(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace,
 unnest(array['anon','authenticated','service_role','historietas_capitulo_runner']) r
 where n.nspname='historietas_privado' and p.proname in
 ('planejar_notificacoes_capitulo_agendado','admitir_notificacoes_capitulo','aplicar_notificacoes_capitulo','proteger_orcamento_notificacoes')
 and (p.prosecdef or has_function_privilege(r,p.oid,'EXECUTE'))),'contratos invoker sem grant de API/papel operacional');
select ok((select relrowsecurity from pg_class where oid='historietas_privado.capitulo_notificacao_orcamento'::regclass),'RLS privado');
select ok(not exists(select 1 from unnest(array['anon','authenticated','service_role','historietas_capitulo_runner']) r
 where has_table_privilege(r,'historietas_privado.capitulo_notificacao_orcamento','SELECT,INSERT,UPDATE,DELETE')),'nenhum cliente altera saldo/limites');
select throws_ok($$update historietas_privado.capitulo_notificacao_orcamento set limite_total=1001$$,'23514',null,'nao amplia teto acumulado');
select throws_ok($$update historietas_privado.capitulo_notificacao_orcamento set limite_destinatarios=101$$,'23514',null,'nao amplia audiencia');
select throws_ok($$update historietas_privado.capitulo_notificacao_orcamento set limite_total_bytes=2097153$$,'23514',null,'nao amplia payload');

-- BEGIN NOTIFICATION BUDGET FIXTURE (somente banco descartavel)
insert into auth.users(id) values('d4100000-0000-4000-8000-000000000001') on conflict do nothing;
insert into public.profiles(id,user_id,nome,tipo) values
 ('d4100000-0000-4000-8000-000000000001','d4100000-0000-4000-8000-000000000001','QA orcamento','autor');
select set_config('request.jwt.claim.sub','d4100000-0000-4000-8000-000000000001',true);
select public.aceitar_termos_publicacao('2026-08-05','2026-08-05','2026-08-05');
insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,publicado,slug) values
 ('d4200000-0000-4000-8000-000000000001','d4100000-0000-4000-8000-000000000001','Obra orçamento','QA','Fantasia','Romance','Livre',true,'qa-orcamento');
insert into public.capitulos(id,obra_id,user_id,titulo,texto,ordem,publicado)
 select ('d4300000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,
 'd4200000-0000-4000-8000-000000000001','d4100000-0000-4000-8000-000000000001',
 'Capítulo '||i,'Texto privado.',i,false from generate_series(1,12) i;
insert into auth.sessions(id,user_id) values
 ('d4500000-0000-4000-8000-000000000001','d4100000-0000-4000-8000-000000000001');
select set_config('request.jwt.claim.sub','',true);
-- END NOTIFICATION BUDGET FIXTURE
insert into auth.users(id) select ('d4600000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid from generate_series(1,101) i;
insert into public.profiles(id,user_id,nome,tipo) select id,id,'Leitor QA','leitor' from auth.users where id::text like 'd4600000-%';
insert into public.seguindo_obras(user_id,obra_id) select id,'d4200000-0000-4000-8000-000000000001'
 from auth.users where id in ('d4600000-0000-4000-8000-000000000001','d4600000-0000-4000-8000-000000000002','d4100000-0000-4000-8000-000000000001');
insert into public.favoritos(user_id,obra_id) values
 ('d4600000-0000-4000-8000-000000000001','d4200000-0000-4000-8000-000000000001');
insert into public.seguindo_usuarios(seguidor_id,seguido_id) values
 ('d4600000-0000-4000-8000-000000000003','d4100000-0000-4000-8000-000000000001');

create function pg_temp.preparar(n integer) returns void language plpgsql as $$
declare id uuid:=('d4300000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid;
begin
 perform set_config('request.jwt.claim.sub','d4100000-0000-4000-8000-000000000001',true);
 perform set_config('request.jwt.claims','{"sub":"d4100000-0000-4000-8000-000000000001","session_id":"d4500000-0000-4000-8000-000000000001"}',true);
 perform public.agendar_capitulo(id,0,'2099-01-01Z','UTC');
 perform set_config('request.jwt.claim.sub','',true); perform set_config('request.jwt.claims','{}',true);
 update historietas_privado.capitulo_agendamentos set publicar_em=now()-interval '1 hour' where capitulo_id=id;
end;
$$;
create function pg_temp.executar(n integer) returns jsonb language sql as $$
 select historietas_privado.executar_agendamento_capitulo(('d4300000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,1);
$$;
create function pg_temp.plano(n integer) returns jsonb language sql as $$
 select historietas_privado.planejar_notificacoes_capitulo_agendado('d4200000-0000-4000-8000-000000000001',
 ('d4300000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'d4100000-0000-4000-8000-000000000001',now());
$$;
create temp table saldo_inicial as select notificacoes_admitidas n,payload_admitido_bytes b from historietas_privado.capitulo_notificacao_orcamento;
select pg_temp.preparar(i) from generate_series(1,8) i;
select is((pg_temp.plano(1)->>'destinatarios')::integer,3,'uniao das tres fontes, dedup e exclusao do autor');
select is(jsonb_array_length(pg_temp.plano(1)->'linhas'),3,'plano completo antes da publicacao');
select ok(not (select publicado from public.capitulos where id='d4300000-0000-4000-8000-000000000001'),'planejar nao publica');
select is((pg_temp.executar(1)->>'notificacoes')::integer,3,'publica com audiencia completa');
select is((select notificacoes_admitidas from historietas_privado.capitulo_notificacao_orcamento),(select n+3 from saldo_inicial),'debito conservador confirmado');
create temp table saldo_apos as select * from historietas_privado.capitulo_notificacao_orcamento;
select is(pg_temp.executar(1)->>'repetido','true','resposta perdida usa recibo');
select is((select row_to_json(c)::text from historietas_privado.capitulo_notificacao_orcamento c),(select row_to_json(c)::text from saldo_apos c),'retry nao cobra novamente');
select is((select count(*) from public.diario_atividades where capitulo_id='d4300000-0000-4000-8000-000000000001'),1::bigint,'um Diario');
select is((select count(*) from historietas_privado.capitulo_cache_outbox where capitulo_id='d4300000-0000-4000-8000-000000000001'),1::bigint,'uma outbox preservada');

update historietas_privado.capitulo_notificacao_orcamento set limite_destinatarios=2;
select is(pg_temp.executar(2)->>'estado','capacidade_notificacoes','excesso bloqueia todo o item');
select ok(not (select publicado from public.capitulos where id='d4300000-0000-4000-8000-000000000002'),'nenhuma publicacao parcial');
select is((select estado from historietas_privado.capitulo_agendamentos where capitulo_id='d4300000-0000-4000-8000-000000000002'),'agendado','intencao e revisao preservadas');
select is((select count(*) from public.notificacoes where capitulo_id='d4300000-0000-4000-8000-000000000002'),0::bigint,'nenhuma notificacao parcial');
select is((select count(*) from historietas_privado.capitulo_publicacao_eventos where capitulo_id='d4300000-0000-4000-8000-000000000002'),0::bigint,'nenhum recibo indevido');
update historietas_privado.capitulo_notificacao_orcamento set limite_destinatarios=3,limite_por_capitulo=2;
select is(pg_temp.executar(2)->>'estado','capacidade_notificacoes','limite de linhas independente');
update historietas_privado.capitulo_notificacao_orcamento set limite_por_capitulo=3,limite_linha_bytes=1;
select is(pg_temp.executar(2)->>'estado','capacidade_notificacoes','payload individual bloqueia');
update historietas_privado.capitulo_notificacao_orcamento set limite_linha_bytes=8192,limite_capitulo_bytes=1;
select is(pg_temp.executar(2)->>'estado','capacidade_notificacoes','payload do capitulo bloqueia');
update historietas_privado.capitulo_notificacao_orcamento set limite_capitulo_bytes=262144,
 limite_total=(select notificacoes_admitidas from historietas_privado.capitulo_notificacao_orcamento)::integer+2;
select is(pg_temp.executar(2)->>'estado','capacidade_notificacoes','saldo acumulado bloqueia');
update historietas_privado.capitulo_notificacao_orcamento set limite_total=1000,limite_total_bytes=1;
select is(pg_temp.executar(2)->>'estado','capacidade_notificacoes','saldo acumulado de payload bloqueia');
update historietas_privado.capitulo_notificacao_orcamento set limite_destinatarios=100,
 limite_por_capitulo=100,limite_linha_bytes=8192,limite_capitulo_bytes=262144,limite_total=1000,limite_total_bytes=2097152;

update historietas_privado.capitulo_notificacao_orcamento set limite_destinatarios=2;
update historietas_privado.capitulo_runner_controle set habilitado=true;
set local statement_timeout='10s'; set local lock_timeout='100ms';
select throws_ok($$update historietas_privado.capitulo_notificacao_orcamento set limite_destinatarios=3$$,'55000',null,'configuracao exige gate fechado');
select is(historietas_privado.executar_runner_capitulos()->>'estado','capacidade_notificacoes','runner distingue capacidade de falha tecnica');
select ok(not (select habilitado from historietas_privado.capitulo_runner_controle),'runner pausa sem retomada automatica');
select is((select count(*) from historietas_privado.capitulo_runner_tentativas where capitulo_id='d4300000-0000-4000-8000-000000000002'),0::bigint,'nao consome retry tecnico');
update historietas_privado.capitulo_notificacao_orcamento set limite_destinatarios=100;

create function pg_temp.falhar() returns trigger language plpgsql as $$ begin raise exception 'QA rollback'; end $$;
create trigger zz_qa_orcamento after insert on historietas_privado.capitulo_publicacao_eventos for each row execute function pg_temp.falhar();
select is(pg_temp.executar(3)->>'estado','erro','falha posterior permanece transitoria');
select is((select row_to_json(c)::text from historietas_privado.capitulo_notificacao_orcamento c),(select row_to_json(c)::text from saldo_apos c),'rollback reverte saldo e efeitos juntos');
select is((select count(*) from public.notificacoes where capitulo_id='d4300000-0000-4000-8000-000000000003'),0::bigint,'rollback nao deixa notificacoes');
drop trigger zz_qa_orcamento on historietas_privado.capitulo_publicacao_eventos;
update historietas_privado.capitulo_agendamentos set executado_em=now()-interval '2 minutes' where capitulo_id='d4300000-0000-4000-8000-000000000003';
select is(pg_temp.executar(3)->>'estado','publicado','retry legitimo apos falha');

insert into public.seguindo_obras(user_id,obra_id) select id,'d4200000-0000-4000-8000-000000000001'
 from auth.users where id::text like 'd4600000-%' on conflict do nothing;
select is((pg_temp.plano(4)->>'destinatarios')::integer,101,'N+1 detecta fanout maior');
select is(pg_temp.executar(4)->>'estado','capacidade_notificacoes','nao trunca audiencia para caber');
select ok(not (select publicado from public.capitulos where id='d4300000-0000-4000-8000-000000000004'),'fanout alto nao publica');
delete from public.seguindo_obras where obra_id='d4200000-0000-4000-8000-000000000001'
 and user_id='d4600000-0000-4000-8000-000000000101';
select is((pg_temp.executar(7)->>'notificacoes')::integer,100,'teto de 100 aceita audiencia inteira, sem truncamento');
delete from public.seguindo_obras where obra_id='d4200000-0000-4000-8000-000000000001'
 and user_id::text like 'd4600000-%' and user_id not in
 ('d4600000-0000-4000-8000-000000000001','d4600000-0000-4000-8000-000000000002');
update historietas_privado.capitulo_notificacao_orcamento set limite_destinatarios=3,limite_por_capitulo=3;
select is(pg_temp.executar(4)->>'estado','publicado','limite inclusivo exato');

delete from public.seguindo_obras where obra_id='d4200000-0000-4000-8000-000000000001';
delete from public.favoritos where obra_id='d4200000-0000-4000-8000-000000000001';
delete from public.seguindo_usuarios where seguido_id='d4100000-0000-4000-8000-000000000001';
select is((pg_temp.executar(5)->>'notificacoes')::integer,0,'audiencia vazia legitima publica sem notificacoes');
insert into public.seguindo_obras(user_id,obra_id) select id,'d4200000-0000-4000-8000-000000000001'
 from auth.users where id in ('d4600000-0000-4000-8000-000000000001','d4600000-0000-4000-8000-000000000002');
insert into public.seguindo_usuarios(seguidor_id,seguido_id) values
 ('d4600000-0000-4000-8000-000000000003','d4100000-0000-4000-8000-000000000001');

-- Contrato legado permanece sem os novos limites e sem consumir o novo saldo.
update historietas_privado.capitulo_notificacao_orcamento set limite_destinatarios=1;
select public.cancelar_agendamento_capitulo('d4300000-0000-4000-8000-000000000006',1)
 from (select set_config('request.jwt.claim.sub','d4100000-0000-4000-8000-000000000001',true),
 set_config('request.jwt.claims','{"sub":"d4100000-0000-4000-8000-000000000001","session_id":"d4500000-0000-4000-8000-000000000001"}',true)) sessao;
update public.capitulos set publicado=true where id='d4300000-0000-4000-8000-000000000006';
select is(historietas_privado.notificar_capitulo_agendado('d4200000-0000-4000-8000-000000000001',
 'd4300000-0000-4000-8000-000000000006','d4100000-0000-4000-8000-000000000001',now()),3,'notificador legado inalterado');
create temp table plano_exato as select pg_temp.plano(8) plano;
update historietas_privado.capitulo_notificacao_orcamento set limite_destinatarios=3,limite_por_capitulo=3,
 limite_linha_bytes=(select max(octet_length(value::text)+512) from plano_exato,jsonb_array_elements(plano->'linhas')),
 limite_capitulo_bytes=(select sum(octet_length(value::text)+512) from plano_exato,jsonb_array_elements(plano->'linhas')),
 limite_total=notificacoes_admitidas+3,
 limite_total_bytes=payload_admitido_bytes+(select sum(octet_length(value::text)+512) from plano_exato,jsonb_array_elements(plano->'linhas'));
select ok(historietas_privado.admitir_notificacoes_capitulo((select plano from plano_exato)),'limites exatos de linhas e bytes inclusivos');
select ok(not historietas_privado.admitir_notificacoes_capitulo((select plano from plano_exato)),'segunda admissao nao reutiliza saldo exato');
select * from finish();
rollback;
