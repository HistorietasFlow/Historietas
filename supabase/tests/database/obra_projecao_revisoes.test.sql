begin;
select no_plan();
-- BEGIN PROJECTION FIXTURE
insert into auth.users(id) values ('bf100000-0000-4000-8000-000000000001') on conflict do nothing;
insert into public.profiles(id,user_id,nome,tipo) values
 ('bf100000-0000-4000-8000-000000000001','bf100000-0000-4000-8000-000000000001','QA projecao','autor');
select set_config('request.jwt.claim.sub','bf100000-0000-4000-8000-000000000001',true);
select public.aceitar_termos_publicacao('2026-08-05','2026-08-05','2026-08-05');
insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,publicado,slug) values
 ('bf200000-0000-4000-8000-000000000001','bf100000-0000-4000-8000-000000000001','Obra projecao','QA','Fantasia','Romance','Livre',true,'qa-projecao'),
 ('bf200000-0000-4000-8000-000000000002','bf100000-0000-4000-8000-000000000001','Obra privada','QA','Fantasia','Romance','Livre',false,'qa-projecao-draft');
insert into public.capitulos(id,obra_id,user_id,titulo,texto,ordem,publicado) values
 ('bf300000-0000-4000-8000-000000000001','bf200000-0000-4000-8000-000000000001','bf100000-0000-4000-8000-000000000001','Um','Texto publico',1,true),
 ('bf300000-0000-4000-8000-000000000002','bf200000-0000-4000-8000-000000000001','bf100000-0000-4000-8000-000000000001','Segredo','Texto secreto',2,false);
insert into auth.sessions(id,user_id) values ('bf500000-0000-4000-8000-000000000001','bf100000-0000-4000-8000-000000000001');
-- END PROJECTION FIXTURE
create temp table projecao_antes as select * from historietas_privado.obra_projecao_revisoes
 where obra_id='bf200000-0000-4000-8000-000000000001';
select ok((select relrowsecurity from pg_class where oid='historietas_privado.obra_projecao_revisoes'::regclass),'ledger com RLS');
select ok(not exists(select 1 from unnest(array['anon','authenticated','service_role']) r
 where has_table_privilege(r,'historietas_privado.obra_projecao_revisoes','INSERT,UPDATE,DELETE,TRUNCATE')),'sem escrita por clientes ou service role');
select ok(not (select prosecdef from pg_proc where oid='public.obter_projecao_publica_obra(text,integer)'::regprocedure),'consulta invoker');
select ok(not has_function_privilege('anon','historietas_privado.revisar_projecao_obra()','EXECUTE'),'trigger nao exposto');
select ok(not has_function_privilege('authenticated','historietas_privado.revisar_projecao_capitulo()','EXECUTE'),'cliente nao avanca revisao');

set local role anon;
select is(public.obter_projecao_publica_obra('qa-projecao',1)->>'estado','capitulo_publico','anon le capitulo publicado');
select is(public.obter_projecao_publica_obra('qa-projecao',1)#>>'{capitulo,texto}','Texto publico','dados reais no snapshot');
select is(public.obter_projecao_publica_obra('qa-projecao',2)->>'estado','capitulo_indisponivel','draft nao aparece');
select ok(not (public.obter_projecao_publica_obra('qa-projecao',2)::text like '%Texto secreto%'),'sem texto de draft');
select is(public.obter_projecao_publica_obra('qa-projecao',99)->>'estado','capitulo_indisponivel','ausencia conserva identidade/revisao da obra');
select is(public.obter_projecao_publica_obra('qa-projecao-draft')->>'estado','obra_indisponivel','obra privada indistinguivel de ausente');
select is(public.obter_projecao_publica_obra('inexistente'),'{"estado":"obra_indisponivel"}'::jsonb,'ausente nao expoe identidade/revisao');
select throws_ok($$select excluida from historietas_privado.obra_projecao_revisoes$$,'42501',null,'tombstone privado');
select throws_ok($$update historietas_privado.obra_projecao_revisoes set revisao=1$$,'42501',null,'sem forge');
reset role;

create policy qa_projecao_negar_obra on public.obras as restrictive for select to anon using(false);
set local role anon;
select is(public.obter_projecao_publica_obra('qa-projecao',1)->>'estado','obra_indisponivel','RPC obedece RLS adicional sem bypass');
reset role;
drop policy qa_projecao_negar_obra on public.obras;

update public.capitulos set texto='Novo draft' where id='bf300000-0000-4000-8000-000000000002';
select is((select revisao from historietas_privado.obra_projecao_revisoes where obra_id='bf200000-0000-4000-8000-000000000001'),
 (select revisao from projecao_antes),'editar draft nao revela atividade');
update public.capitulos set visualizacoes=visualizacoes+1 where id='bf300000-0000-4000-8000-000000000001';
update public.obras set visualizacoes=visualizacoes+1 where id='bf200000-0000-4000-8000-000000000001';
select is((select revisao from historietas_privado.obra_projecao_revisoes where obra_id='bf200000-0000-4000-8000-000000000001'),
 (select revisao from projecao_antes),'metricas nao geram churn de revisoes');
savepoint antes_edicao;
update public.capitulos set texto='Mudanca revertida' where id='bf300000-0000-4000-8000-000000000001';
rollback to antes_edicao;
select is((public.obter_projecao_publica_obra('qa-projecao',1)->>'revisao')::bigint,(select revisao from projecao_antes),'rollback restaura revisao');
select is(public.obter_projecao_publica_obra('qa-projecao',1)#>>'{capitulo,texto}','Texto publico','rollback restaura dados juntos');
update public.capitulos set publicado=true where id='bf300000-0000-4000-8000-000000000002';
select is((public.obter_projecao_publica_obra('qa-projecao',2)->>'revisao')::bigint,(select revisao+1 from projecao_antes),'publicacao manual avanca uma vez');
select is(public.obter_projecao_publica_obra('qa-projecao',2)#>>'{capitulo,texto}','Novo draft','publicacao e dados juntos');
update public.capitulos set ordem=3 where id='bf300000-0000-4000-8000-000000000002';
select is(public.obter_projecao_publica_obra('qa-projecao',2)->>'estado','capitulo_indisponivel','ordem antiga ausente');
select is(public.obter_projecao_publica_obra('qa-projecao',3)->>'estado','capitulo_publico','ordem real nova');
select is((public.obter_projecao_publica_obra('qa-projecao',3)->>'revisao')::bigint,(select revisao+2 from projecao_antes),'reordenacao avanca');
update public.capitulos set publicado=false where id='bf300000-0000-4000-8000-000000000002';
select is(public.obter_projecao_publica_obra('qa-projecao',3)->>'estado','capitulo_indisponivel','despublicacao esconde');
update public.obras set slug='qa-projecao-renomeada' where id='bf200000-0000-4000-8000-000000000001';
select is(public.obter_projecao_publica_obra('qa-projecao')->>'estado','obra_indisponivel','slug anterior nao resolve');
select is((public.obter_projecao_publica_obra('qa-projecao-renomeada')->>'revisao')::bigint,(select revisao+4 from projecao_antes),'rename preserva sequencia');
update public.obras set classificacao_indicativa='18+',avisos_conteudo=array['terror'] where id='bf200000-0000-4000-8000-000000000001';
set local role authenticated;
select is(public.obter_projecao_publica_obra('qa-projecao-renomeada')->>'estado','obra_indisponivel','nem autor libera 18+ nesta projecao publica');
select is((select count(*)::int from historietas_privado.obra_projecao_revisoes where obra_id in ('bf200000-0000-4000-8000-000000000001','bf200000-0000-4000-8000-000000000002')),0,'autor nao le revisoes privadas/18+');
select is(public.obter_projecao_publica_obra('qa-projecao-draft')->>'estado','obra_indisponivel','nem autor recebe draft pela RPC publica');
reset role;
update public.obras set classificacao_indicativa='Livre',avisos_conteudo='{}',publicado=false where id='bf200000-0000-4000-8000-000000000001';
select is(public.obter_projecao_publica_obra('qa-projecao-renomeada')->>'estado','obra_indisponivel','despublicacao da obra esconde tudo');
update public.obras set publicado=true where id='bf200000-0000-4000-8000-000000000001';
select set_config('request.jwt.claims','{"sub":"bf100000-0000-4000-8000-000000000001","session_id":"bf500000-0000-4000-8000-000000000001"}',true);
select public.agendar_capitulo('bf300000-0000-4000-8000-000000000002',0,'2099-01-01Z','UTC');
update historietas_privado.capitulo_agendamentos set publicar_em=now()-interval '1 minute' where capitulo_id='bf300000-0000-4000-8000-000000000002';
update projecao_antes set revisao=(public.obter_projecao_publica_obra('qa-projecao-renomeada')->>'revisao')::bigint;
select is(historietas_privado.executar_agendamento_capitulo('bf300000-0000-4000-8000-000000000002',1)->>'estado','publicado','executor legado publica');
select is((public.obter_projecao_publica_obra('qa-projecao-renomeada')->>'revisao')::bigint,(select revisao+1 from projecao_antes),'publicacao agendada avanca via trigger comum');
select is(historietas_privado.executar_agendamento_capitulo('bf300000-0000-4000-8000-000000000002',1)->>'repetido','true','retry do executor idempotente');
select is((public.obter_projecao_publica_obra('qa-projecao-renomeada')->>'revisao')::bigint,(select revisao+1 from projecao_antes),'retry nao muda revisao');
delete from public.capitulos where id='bf300000-0000-4000-8000-000000000002';
select is((public.obter_projecao_publica_obra('qa-projecao-renomeada')->>'revisao')::bigint,(select revisao+2 from projecao_antes),'exclusao de capitulo avanca');
delete from public.obras where id='bf200000-0000-4000-8000-000000000001';
select ok((select excluida from historietas_privado.obra_projecao_revisoes where obra_id='bf200000-0000-4000-8000-000000000001'),'cascade nao apaga tombstone');
update projecao_antes set revisao=(select revisao from historietas_privado.obra_projecao_revisoes where obra_id='bf200000-0000-4000-8000-000000000001');
insert into public.obras(id,user_id,titulo,autor,genero,formato,publicado,slug,classificacao_indicativa) values
 ('bf200000-0000-4000-8000-000000000001','bf100000-0000-4000-8000-000000000001','Recriada','QA','Fantasia','Romance',true,'qa-projecao','Livre');
select is((public.obter_projecao_publica_obra('qa-projecao')->>'revisao')::bigint,(select revisao+1 from projecao_antes),'mesmo UUID nunca reinicia revisao');
select isnt((public.obter_projecao_publica_obra('qa-projecao')->>'geracao')::uuid,(select geracao from projecao_antes),'recriacao tem outra geracao');
update public.obras set slug='qa-projecao-antiga' where id='bf200000-0000-4000-8000-000000000001';
update public.obras set slug='qa-projecao',publicado=true where id='bf200000-0000-4000-8000-000000000002';
select is(public.obter_projecao_publica_obra('qa-projecao')->>'obraId','bf200000-0000-4000-8000-000000000002','slug reutilizado resolve outra identidade, nunca cache antigo');
update projecao_antes set revisao=(select revisao from historietas_privado.obra_projecao_revisoes where obra_id='bf200000-0000-4000-8000-000000000001');
-- Valida eventos DEFERRABLE existentes antes do TRUNCATE administrativo.
set constraints all immediate;
truncate public.capitulos cascade;
select is((public.obter_projecao_publica_obra('qa-projecao-antiga')->>'revisao')::bigint,(select revisao+1 from projecao_antes),'truncate administrativo de capitulos invalida conservadoramente');
truncate public.obras cascade;
select is(public.obter_projecao_publica_obra('qa-projecao-antiga')->>'estado','obra_indisponivel','truncate de obras nao deixa identidade publica');
select ok((select excluida from historietas_privado.obra_projecao_revisoes where obra_id='bf200000-0000-4000-8000-000000000001'),'truncate preserva tombstone');
select * from finish();
rollback;
