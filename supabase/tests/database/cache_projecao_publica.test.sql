begin;
select no_plan();
insert into auth.users(id) values('c0100000-0000-4000-8000-000000000001');
insert into public.profiles(id,user_id,nome,tipo) values('c0100000-0000-4000-8000-000000000001','c0100000-0000-4000-8000-000000000001','QA barreira','autor');
select set_config('request.jwt.claim.sub','c0100000-0000-4000-8000-000000000001',true);
select public.aceitar_termos_publicacao('2026-08-05','2026-08-05','2026-08-05');
insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,publicado,slug) values
 ('c0200000-0000-4000-8000-000000000001','c0100000-0000-4000-8000-000000000001','QA barreira','QA','Fantasia','Romance','Livre',true,'qa-barreira'),
 ('c0200000-0000-4000-8000-000000000002','c0100000-0000-4000-8000-000000000001','QA draft','QA','Fantasia','Romance','Livre',false,'qa-barreira-draft');
insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,avisos_conteudo,publicado,slug) values
 ('c0200000-0000-4000-8000-000000000003','c0100000-0000-4000-8000-000000000001','QA adulto','QA','Fantasia','Romance','18+',array['terror'],true,'qa-barreira-adulto');
insert into public.capitulos(id,obra_id,user_id,titulo,texto,ordem,publicado) values
 ('c0300000-0000-4000-8000-000000000001','c0200000-0000-4000-8000-000000000001','c0100000-0000-4000-8000-000000000001','Um','Texto publico',1,true),
 ('c0300000-0000-4000-8000-000000000002','c0200000-0000-4000-8000-000000000001','c0100000-0000-4000-8000-000000000001','Segredo','Texto secreto',2,false),
 ('c0300000-0000-4000-8000-000000000003','c0200000-0000-4000-8000-000000000001','c0100000-0000-4000-8000-000000000001','Nove','Texto nove',9,true);
create temp table qa_barreira as select public.obter_projecao_publica_obra('qa-barreira') p;
create temp table qa_sitemap as select public.obter_revisao_sitemap_publico() revisao;
grant select on qa_sitemap to anon,authenticated;
grant select on qa_barreira to anon,authenticated;
select ok(not exists(select 1 from pg_proc where oid in (
 'public.listar_capitulos_projecao_publica(text,uuid,text,integer,integer)'::regprocedure,
 'public.listar_revisoes_sitemap_publico(uuid,integer)'::regprocedure,
 'public.listar_capitulos_sitemap_publico(uuid,integer)'::regprocedure) and prosecdef),'todas as leituras invoker');
select ok(not has_function_privilege('service_role','public.listar_capitulos_projecao_publica(text,uuid,text,integer,integer)','EXECUTE'),'sem novo acesso service role');
set local role anon;
select is(length(public.obter_revisao_sitemap_publico()),64,'barreira agregada SHA256, nao MAX de revisoes');
select is(public.obter_revisao_sitemap_publico(),(select revisao from qa_sitemap),'manifesto estavel sem escritas');
select is(public.existe_capitulo_projecao_publica('qa-barreira',1),true,'proxy confirma existencia sem texto');
select is(public.existe_capitulo_projecao_publica('qa-barreira',2),false,'proxy nao revela draft');
select is((public.listar_capitulos_projecao_publica('qa-barreira',(p->>'geracao')::uuid,p->>'revisao',0,1)#>>'{capitulos,0,texto}'),'Texto publico','snapshot e texto correspondente') from qa_barreira;
select is((public.listar_capitulos_projecao_publica('qa-barreira',(p->>'geracao')::uuid,p->>'revisao',1,1)#>>'{capitulos,0,ordem}'),'9','pagina seguinte usa ordem real, nao inclui draft') from qa_barreira;
select is(jsonb_array_length(public.listar_capitulos_projecao_publica('qa-barreira',(p->>'geracao')::uuid,p->>'revisao',0,500)->'capitulos'),2,'apenas publicados') from qa_barreira;
select is(public.listar_capitulos_projecao_publica('qa-barreira',(p->>'geracao')::uuid,'0',0,500)->>'valida','false','revisao antiga recusada') from qa_barreira;
select is(public.listar_capitulos_projecao_publica('qa-barreira','c0990000-0000-4000-8000-000000000001',p->>'revisao',0,500)->>'valida','false','geracao forjada recusada') from qa_barreira;
select is(public.listar_capitulos_projecao_publica('qa-barreira',(p->>'geracao')::uuid,p->>'revisao',0,501)->>'valida','false','limite invalido nao libera dados') from qa_barreira;
select is((select count(*) from public.listar_revisoes_sitemap_publico('c0200000-0000-4000-8000-000000000000',500) where id='c0200000-0000-4000-8000-000000000001'),1::bigint,'sitemap inclui obra publica');
select is((select count(*) from public.listar_revisoes_sitemap_publico('c0200000-0000-4000-8000-000000000000',500) where id in ('c0200000-0000-4000-8000-000000000002','c0200000-0000-4000-8000-000000000003')),0::bigint,'sitemap exclui drafts e 18+');
select is((select ordem from public.listar_capitulos_sitemap_publico('c0300000-0000-4000-8000-000000000002',1)),9,'cursor do sitemap e ordem real');
select is((select revisao from public.listar_capitulos_sitemap_publico('c0300000-0000-4000-8000-000000000002',1)),(select p->>'revisao' from qa_barreira),'dados e revisao no mesmo snapshot');
reset role;
update public.capitulos set texto='Texto editado' where id='c0300000-0000-4000-8000-000000000001';
set local role anon;
select isnt(public.obter_revisao_sitemap_publico(),(select revisao from qa_sitemap),'edicao publicada muda a barreira do sitemap');
select is(public.listar_capitulos_projecao_publica('qa-barreira',(p->>'geracao')::uuid,p->>'revisao',0,500)->>'valida','false','edicao invalida paginas de cache anteriores') from qa_barreira;
select is(jsonb_array_length(public.listar_capitulos_projecao_publica('qa-barreira',(p->>'geracao')::uuid,p->>'revisao',0,500)->'capitulos'),0,'sem dados de outra revisao') from qa_barreira;
reset role;
create policy qa_barreira_negar on public.obras as restrictive for select to anon using(false);
set local role anon;
select is((select count(*) from public.listar_revisoes_sitemap_publico(null,500)),0::bigint,'manifesto respeita RLS adicional');
select is((select count(*) from public.listar_capitulos_sitemap_publico(null,500)),0::bigint,'capitulos respeitam RLS adicional');
select is(public.obter_revisao_sitemap_publico(),encode(sha256(convert_to('','UTF8')),'hex'),'barreira tambem respeita RLS adicional');
reset role;
drop policy qa_barreira_negar on public.obras;
update public.obras set classificacao_indicativa='18+',avisos_conteudo=array['terror'] where id='c0200000-0000-4000-8000-000000000001';
set local role authenticated;
select is(public.listar_capitulos_projecao_publica('qa-barreira',(p->>'geracao')::uuid,p->>'revisao',0,500)->>'valida','false','18+ bloqueado inclusive para autor') from qa_barreira;
reset role;
select * from finish();
rollback;
