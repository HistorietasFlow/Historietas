begin;
select no_plan();

select ok(not attnotnull and not atthasdef, 'status nullable sem default/backfill')
from pg_attribute where attrelid='public.obras'::regclass and attname='status_editorial';
select ok(has_column_privilege('authenticated','public.obras','status_editorial','UPDATE'), 'autor pode editar somente a nova coluna autorizada');
select ok(not has_table_privilege('authenticated','public.obras','UPDATE'), 'sem UPDATE amplo, inclusive heranca');
select ok(not has_column_privilege('authenticated','public.obras','user_id','UPDATE'), 'propriedade continua imutavel');
select ok(not has_column_privilege('anon','public.obras','status_editorial','UPDATE'), 'anon sem UPDATE efetivo');
select ok(has_table_privilege('authenticated','public.obras','INSERT'), 'INSERT legado reutilizado');
select ok((select relrowsecurity from pg_class where oid='public.obras'::regclass), 'RLS continua habilitada');
select is((select count(*)::integer from pg_proc where pronamespace='public'::regnamespace
  and proname='listar_obras_catalogo' and pronargs between 10 and 14),5,'cinco assinaturas antigas presentes');
select ok(not prosecdef and pronargdefaults=0 and proconfig=array['search_path=""'], 'nova variante invoker, sem defaults, search_path vazio')
from pg_proc where oid='public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text,text,text)'::regprocedure;
select ok(has_function_privilege('anon',oid,'EXECUTE') and has_function_privilege('authenticated',oid,'EXECUTE')
  and has_function_privilege('service_role',oid,'EXECUTE') and not exists
  (select 1 from aclexplode(proacl) a where a.grantee=0 and a.privilege_type='EXECUTE'), 'ACL restrita da variante nova')
from pg_proc where oid='public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text,text,text)'::regprocedure;

-- BEGIN EDITORIAL FIXTURE
insert into auth.users(id) values
 ('e8100000-0000-4000-8000-000000000001'),('e8100000-0000-4000-8000-000000000002'),('e8100000-0000-4000-8000-000000000003');
insert into public.profiles(id,user_id,nome,tipo) select id,id,'QA editorial','autor' from auth.users where id in
 ('e8100000-0000-4000-8000-000000000001','e8100000-0000-4000-8000-000000000002','e8100000-0000-4000-8000-000000000003');
insert into public.preferencias_privacidade(user_id,visibilidade_biblioteca,mostrar_avaliacoes)
values ('e8100000-0000-4000-8000-000000000002','publico',true);
-- Omite o campo novo como um cliente antigo. A criacao nao infere um estado.
insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,avisos_conteudo,tags,arquivo_url,publicado,slug,criada_em)
select ('e8200000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid,
 case when g=63 then 'e8100000-0000-4000-8000-000000000003'::uuid else 'e8100000-0000-4000-8000-000000000001'::uuid end,
 'QA editorial '||g,'QA editorial',case when g=4 then 'Romance' else 'Fantasia' end,'HQ',
 case when g=62 then '18+' else 'Livre' end,case when g=62 then array['terror'] else '{}'::text[] end,
 case when g=4 then array['qa-editorial','bloqueada'] else array['qa-editorial'] end,
 'https://example.invalid/qa.txt',g not in (61,64),'qa-editorial-'||g,'2034-01-01'::timestamptz+g*interval '1 day'
from generate_series(1,64) g;
update public.obras set status_editorial=case when id::text like '%000001' or id::text like '%000064' then null
 when id::text like '%000002' then 'em_andamento' when right(id::text,6) in ('000003','000004','000061','000062','000063') then 'concluida'
 else 'pausada' end where id::text like 'e8200000-%';
insert into public.capitulos(id,obra_id,user_id,titulo,texto,ordem,publicado)
select ('e8300000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid,
 ('e8200000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid,'e8100000-0000-4000-8000-000000000001','QA','Texto QA',1,true
from generate_series(3,4) g;
insert into public.obra_avaliacoes(obra_id,user_id,nota,visibilidade)
values ('e8200000-0000-4000-8000-000000000003','e8100000-0000-4000-8000-000000000002',4.5,'publico');
-- END EDITORIAL FIXTURE

select is((select status_editorial from public.obras where slug='qa-editorial-1'),null,'INSERT legado permanece NULL');
select throws_ok($$update public.obras set status_editorial='Publicado' where slug='qa-editorial-1'$$,'23514',null,'CHECK rejeita estado de publicacao');
select throws_ok($$update public.obras set status_editorial='' where slug='qa-editorial-1'$$,'23514',null,'CHECK rejeita vazio armazenado');
select throws_ok($$update public.obras set status_editorial='Concluida' where slug='qa-editorial-1'$$,'23514',null,'CHECK nao normaliza entrada invalida');
select is((select status_editorial from public.obras where slug='qa-editorial-1'),null,'rejeicoes preservam NULL');

set local role anon;
select is((select count(*)::integer from public.listar_obras_catalogo('','','','','todos','mais-recentes',24,null,null,null,'qa-editorial',null,'','','concluida')),3,'status antes do limite encontra resultados antigos');
select is((select obra_id::text from public.listar_obras_catalogo('','','','','todos','mais-recentes',1,null,null,null,'qa-editorial',null,'','','concluida')),'e8200000-0000-4000-8000-000000000063','pagina inicial ordenada');
select is((select obra_id::text from public.listar_obras_catalogo('','','','','todos','mais-recentes',1,0,'2034-03-05','e8200000-0000-4000-8000-000000000063','qa-editorial',null,'','','concluida')),'e8200000-0000-4000-8000-000000000004','cursor mantem filtro');
select is((select obra_id::text from public.listar_obras_catalogo('QA editorial','Fantasia','HQ','Livre','com-capitulos','mais-capitulos',24,null,null,null,'qa-editorial',4.5,'bloqueada','romance','concluida')),'e8200000-0000-4000-8000-000000000003','combina busca, genero, formato, classificacao, capitulos, nota e exclusoes');
select is((select count(*)::integer from public.listar_obras_catalogo('','','','','todos','mais-recentes',50,null,null,null,'qa-editorial',null,'','','em_andamento')),1,'em andamento nao inclui NULL');
select is((select count(*)::integer from public.listar_obras_catalogo('','','','','todos','mais-recentes',50,null,null,null,'qa-editorial',null,'','','pausada')),50,'pausada preserva limite e tem mais');
select ok((select bool_and(tem_mais) from public.listar_obras_catalogo('','','','','todos','mais-recentes',1,null,null,null,'qa-editorial',null,'','','pausada')),'tem_mais dos elegiveis');
select results_eq($$select * from public.listar_obras_catalogo('','','','','todos','mais-recentes',24,null,null,null,'qa-editorial',null,'','',null)$$,
 $$select * from public.listar_obras_catalogo('','','','','todos','mais-recentes',24,null,null,null,'qa-editorial',null,'','')$$,'NULL neutro equivale a 14 argumentos');
select results_eq($$select * from public.listar_obras_catalogo('','','','','todos','mais-recentes',24,null,null,null,'qa-editorial',null,'','','')$$,
 $$select * from public.listar_obras_catalogo('','','','','todos','mais-recentes',24,null,null,null,'qa-editorial',null,'','')$$,'vazio neutro equivale a 14 argumentos');
select throws_ok($$select * from public.listar_obras_catalogo('','','','','todos','mais-recentes',24,null,null,null,'qa-editorial',null,'','','nao_informado')$$,'22023','Status editorial invalido.','nao informado nao e filtro adicional');
select throws_ok($$select * from public.listar_obras_catalogo('','','','','todos','mais-recentes',24,null,null,null,'qa-editorial',null,'','',' Concluida ')$$,'22023','Status editorial invalido.','parametro desconhecido nao vira consulta ampla');
select is(public.obter_projecao_publica_obra('qa-editorial-1')#>'{obra,statusEditorial}','null'::jsonb,'projecao confirma null explicitamente');
select is(public.obter_projecao_publica_obra('qa-editorial-3')#>>'{obra,statusEditorial}','concluida','projecao publica aditiva');
select is(public.obter_projecao_publica_obra('qa-editorial-61')->>'estado','obra_indisponivel','draft nao expoe status');
select is(public.obter_projecao_publica_obra('qa-editorial-62')->>'estado','obra_indisponivel','18+ nao expoe status');
select throws_ok($$update public.obras set status_editorial='pausada' where slug='qa-editorial-3'$$,'42501',null,'anon nao edita');
reset role;

select set_config('request.jwt.claim.sub','e8100000-0000-4000-8000-000000000002',true);
set local role authenticated;
with u as (update public.obras set status_editorial='pausada' where slug='qa-editorial-3' returning id)
select is(count(*)::integer,0,'terceiro nao edita obra publica') from u;
select is((select count(*)::integer from public.obras where slug in ('qa-editorial-61','qa-editorial-62')),0,'terceiro nao ve privado ou 18+');
reset role;
select set_config('request.jwt.claim.sub','e8100000-0000-4000-8000-000000000003',true);
set local role authenticated;
select throws_ok($$update public.obras set status_editorial='pausada',sinopse='Nao salvar' where slug='qa-editorial-63'$$,'P0001','ACEITE_TERMOS_PUBLICACAO_OBRIGATORIO','status de obra publicada exige termos');
select is((select status_editorial from public.obras where slug='qa-editorial-63'),'concluida','termos recusados preservam status');
select is((select sinopse from public.obras where slug='qa-editorial-63'),'','termos recusados revertem outros campos');
reset role;

select set_config('request.jwt.claim.sub','e8100000-0000-4000-8000-000000000001',true);
select public.aceitar_termos_publicacao('2026-08-05','2026-08-05','2026-08-05');
create temp table editorial_antes as select revisao from historietas_privado.obra_projecao_revisoes where obra_id='e8200000-0000-4000-8000-000000000003';
set local role authenticated;
select lives_ok($$update public.obras set status_editorial='pausada' where slug='qa-editorial-3'$$,'proprietario com termos atualiza');
select lives_ok($$update public.obras set sinopse='Edicao antiga' where slug='qa-editorial-3'$$,'cliente antigo edita outros metadados');
select is((select status_editorial from public.obras where slug='qa-editorial-3'),'pausada','outros metadados preservam status');
select lives_ok($$update public.obras set status_editorial=null where slug='qa-editorial-3'$$,'limpeza explicita aceita NULL');
select ok((select publicado from public.obras where slug='qa-editorial-3'),'status nao despublica');
select lives_ok($$update public.obras set status_editorial='em_andamento' where slug='qa-editorial-61'$$,'autor edita proprio rascunho');
select is((select count(*)::integer from historietas_privado.obra_projecao_revisoes where obra_id='e8200000-0000-4000-8000-000000000061'),0,'revisao publica nao e CAS disponivel para draft');
select is((select count(*)::integer from historietas_privado.obra_projecao_revisoes where obra_id='e8200000-0000-4000-8000-000000000062'),0,'revisao publica nao e CAS disponivel para 18+');
reset role;
select is((select revisao from historietas_privado.obra_projecao_revisoes where obra_id='e8200000-0000-4000-8000-000000000003'),(select revisao+3 from editorial_antes),'status, metadado e NULL avancam revisao existente atomicamente');
savepoint editorial_rollback;
update public.obras set status_editorial='concluida' where slug='qa-editorial-3';
rollback to editorial_rollback;
select is(public.obter_projecao_publica_obra('qa-editorial-3')#>'{obra,statusEditorial}','null'::jsonb,'rollback restaura dados');
select is((select revisao from historietas_privado.obra_projecao_revisoes where obra_id='e8200000-0000-4000-8000-000000000003'),(select revisao+3 from editorial_antes),'rollback restaura revisao');
select is((select count(*)::integer from historietas_privado.capitulo_cache_outbox where obra_id::text like 'e8200000-%'),0,'nenhum evento de publicacao criado por metadado');
select * from finish();
rollback;
