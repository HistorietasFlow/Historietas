begin;
select no_plan();
-- BEGIN LIGHT SNAPSHOT FIXTURE
insert into auth.users(id) values('d0100000-0000-4000-8000-000000000001'),('d0100000-0000-4000-8000-000000000002') on conflict do nothing;
insert into public.profiles(id,user_id,nome,tipo) values
 ('d0100000-0000-4000-8000-000000000001','d0100000-0000-4000-8000-000000000001','QA snapshot','autor'),
 ('d0100000-0000-4000-8000-000000000002','d0100000-0000-4000-8000-000000000002','QA terceiro','leitor');
select set_config('request.jwt.claim.sub','d0100000-0000-4000-8000-000000000001',true);
select public.aceitar_termos_publicacao('2026-08-05','2026-08-05','2026-08-05');
insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,avisos_conteudo,publicado,slug) values
 ('d0200000-0000-4000-8000-000000000001','d0100000-0000-4000-8000-000000000001','Snapshot leve','QA','Fantasia','Romance','Livre','{}',true,'qa-snapshot-leve'),
 ('d0200000-0000-4000-8000-000000000002','d0100000-0000-4000-8000-000000000001','Draft','QA','Fantasia','Romance','Livre','{}',false,'qa-snapshot-draft'),
 ('d0200000-0000-4000-8000-000000000003','d0100000-0000-4000-8000-000000000001','Adulto','QA','Fantasia','Romance','18+',array['terror'],true,'qa-snapshot-adulto'),
 ('d0200000-0000-4000-8000-000000000004','d0100000-0000-4000-8000-000000000001','Sem capítulos','QA','Fantasia','Romance','Livre','{}',true,'qa-snapshot-vazio');
update public.obras set arquivo_url='privado/legacy.pdf',arquivo_nome='Legado.pdf',arquivo_tipo='application/pdf',
 arquivo_tamanho=123,arquivo_categoria='documento' where id='d0200000-0000-4000-8000-000000000001';
insert into public.capitulos(id,obra_id,user_id,titulo,texto,ordem,publicado) values
 ('d0300000-0000-4000-8000-000000000001','d0200000-0000-4000-8000-000000000001','d0100000-0000-4000-8000-000000000001','Dois','TEXTO_NAO_TRANSFERIR',2,true),
 ('d0300000-0000-4000-8000-000000000002','d0200000-0000-4000-8000-000000000001','d0100000-0000-4000-8000-000000000001','Segredo','DRAFT_NAO_TRANSFERIR',3,false),
 ('d0300000-0000-4000-8000-000000000003','d0200000-0000-4000-8000-000000000001','d0100000-0000-4000-8000-000000000001','Sete','OUTRO_TEXTO',7,true);
-- END LIGHT SNAPSHOT FIXTURE
create temp table qa_light as select public.obter_projecao_publica_obra('qa-snapshot-leve') p;
grant select on qa_light to anon,authenticated;
select ok(not (select prosecdef from pg_proc where oid='public.listar_capitulos_leves_projecao_publica(text,uuid,text,integer,uuid,integer)'::regprocedure),'RPC invoker');
select is((select provolatile::text from pg_proc where oid='public.listar_capitulos_leves_projecao_publica(text,uuid,text,integer,uuid,integer)'::regprocedure),'s','STABLE: mesmo snapshot');
select ok(has_function_privilege('anon','public.listar_capitulos_leves_projecao_publica(text,uuid,text,integer,uuid,integer)','EXECUTE'),'anon com EXECUTE');
select ok(has_function_privilege('authenticated','public.listar_capitulos_leves_projecao_publica(text,uuid,text,integer,uuid,integer)','EXECUTE'),'authenticated com EXECUTE');
select ok(not has_function_privilege('service_role','public.listar_capitulos_leves_projecao_publica(text,uuid,text,integer,uuid,integer)','EXECUTE'),'service role sem grant');
select ok(to_regprocedure('public.listar_capitulos_projecao_publica(text,uuid,text,integer,integer)') is not null,'assinatura anterior preservada');
set local role anon;
select is(jsonb_array_length(public.listar_capitulos_leves_projecao_publica('qa-snapshot-leve',(p->>'geracao')::uuid,p->>'revisao',null,null,500)->'capitulos'),2,'apenas capítulos publicados') from qa_light;
select is(public.listar_capitulos_leves_projecao_publica('qa-snapshot-leve',(p->>'geracao')::uuid,p->>'revisao',null,null,1)#>>'{capitulos,0,ordem}','2','ordem real inicial') from qa_light;
select is(public.listar_capitulos_leves_projecao_publica('qa-snapshot-leve',(p->>'geracao')::uuid,p->>'revisao',2,'d0300000-0000-4000-8000-000000000001',1)#>>'{capitulos,0,ordem}','7','cursor preserva lacuna e ignora draft') from qa_light;
select ok(not (public.listar_capitulos_leves_projecao_publica('qa-snapshot-leve',(p->>'geracao')::uuid,p->>'revisao',null,null,500)::text ~ 'TEXTO|DRAFT|privado/|arquivo_url|user_id'),'sem texto, caminho ou dados privados') from qa_light;
select is(public.listar_capitulos_leves_projecao_publica('qa-snapshot-leve',(p->>'geracao')::uuid,p->>'revisao',null,null,500)#>>'{anexo,nome}','Legado.pdf','metadados de anexo preservados') from qa_light;
select is(public.listar_capitulos_leves_projecao_publica('qa-snapshot-leve',(p->>'geracao')::uuid,'0',null,null,500)->>'valida','false','revisão obsoleta recusada') from qa_light;
select is(public.listar_capitulos_leves_projecao_publica('qa-snapshot-leve','d0990000-0000-4000-8000-000000000001',p->>'revisao',null,null,500)->>'valida','false','geração forjada recusada') from qa_light;
select is(public.listar_capitulos_leves_projecao_publica('qa-snapshot-leve',(p->>'geracao')::uuid,p->>'revisao',null,null,501)->>'valida','false','limite inválido não devolve dados') from qa_light;
select is(public.listar_capitulos_leves_projecao_publica('qa-snapshot-leve',(p->>'geracao')::uuid,p->>'revisao',2,null,500)->>'valida','false','cursor incompleto recusado') from qa_light;
select is(public.listar_capitulos_leves_projecao_publica('ausente',(p->>'geracao')::uuid,p->>'revisao',null,null,500)->>'obraId',null::text,'ausente não divulga identidade') from qa_light;
select is(public.listar_capitulos_leves_projecao_publica('qa-snapshot-vazio',
 (public.obter_projecao_publica_obra('qa-snapshot-vazio')->>'geracao')::uuid,
 public.obter_projecao_publica_obra('qa-snapshot-vazio')->>'revisao',null,null,500)->>'valida','true','lista vazia válida não é obra ausente');
reset role;
set local role authenticated;
select is(public.listar_capitulos_leves_projecao_publica('qa-snapshot-draft',(p->>'geracao')::uuid,p->>'revisao',null,null,500)->>'valida','false','autor não recebe obra draft') from qa_light;
select is(public.listar_capitulos_leves_projecao_publica('qa-snapshot-adulto',(p->>'geracao')::uuid,p->>'revisao',null,null,500)->>'valida','false','autor não recebe 18+') from qa_light;
select set_config('request.jwt.claim.sub','d0100000-0000-4000-8000-000000000002',true);
select is(public.listar_capitulos_leves_projecao_publica('qa-snapshot-leve',(p->>'geracao')::uuid,p->>'revisao',null,null,500)->>'valida','true','terceiro recebe só projeção pública') from qa_light;
reset role;
select set_config('request.jwt.claim.sub','d0100000-0000-4000-8000-000000000001',true);
update public.capitulos set titulo='Editado' where id='d0300000-0000-4000-8000-000000000001';
set local role anon;
select is(public.listar_capitulos_leves_projecao_publica('qa-snapshot-leve',(p->>'geracao')::uuid,p->>'revisao',null,null,500)->>'valida','false','edição invalida revisão anterior') from qa_light;
reset role;
update qa_light set p=public.obter_projecao_publica_obra('qa-snapshot-leve');
create policy qa_light_obra_deny on public.obras as restrictive for select to anon using(false);
set local role anon;
select is(public.listar_capitulos_leves_projecao_publica('qa-snapshot-leve',(p->>'geracao')::uuid,p->>'revisao',null,null,500)->>'valida','false','RLS adicional não é contornada') from qa_light;
reset role;
drop policy qa_light_obra_deny on public.obras;
create policy qa_light_chapter_deny on public.capitulos as restrictive for select to anon using(false);
set local role anon;
select is(jsonb_array_length(public.listar_capitulos_leves_projecao_publica('qa-snapshot-leve',
 (public.obter_projecao_publica_obra('qa-snapshot-leve')->>'geracao')::uuid,
 public.obter_projecao_publica_obra('qa-snapshot-leve')->>'revisao',null,null,500)->'capitulos'),0,'RLS dos capítulos permanece efetiva');
reset role;
drop policy qa_light_chapter_deny on public.capitulos;
update qa_light set p=public.obter_projecao_publica_obra('qa-snapshot-leve');
delete from public.capitulos where id='d0300000-0000-4000-8000-000000000003';
select is(public.listar_capitulos_leves_projecao_publica('qa-snapshot-leve',(p->>'geracao')::uuid,p->>'revisao',null,null,500)->>'valida','false','exclusão invalida lista antiga') from qa_light;
update public.obras set slug='qa-snapshot-renomeado' where id='d0200000-0000-4000-8000-000000000001';
select is(public.listar_capitulos_leves_projecao_publica('qa-snapshot-leve',(p->>'geracao')::uuid,p->>'revisao',null,null,500)->>'valida','false','slug antigo não resolve') from qa_light;
select * from finish();
rollback;
