begin;
select no_plan();
select ok(not attnotnull and not atthasdef and atttypid='uuid'::regtype,
 'versao UUID nullable, sem default volatil ou backfill') from pg_attribute
where attrelid='public.obras'::regclass and attname='status_editorial_versao';
select ok(not prosecdef and proconfig=array['search_path=""'], 'trigger privado invoker e search_path vazio')
from pg_proc where oid='historietas_privado.definir_versao_status_editorial()'::regprocedure;
select ok(not has_function_privilege(r,'historietas_privado.definir_versao_status_editorial()','EXECUTE'),
 'sem EXECUTE efetivo do trigger para '||r) from unnest(array['anon','authenticated','service_role']) r;
select ok(not has_column_privilege(r,'public.obras','status_editorial_versao','UPDATE'),
 'sem UPDATE efetivo da versao para '||r) from unnest(array['anon','authenticated']) r;
select ok(has_column_privilege('authenticated','public.obras','status_editorial','UPDATE')
 and not has_table_privilege('authenticated','public.obras','UPDATE'), 'UPDATE editorial preservado sem UPDATE amplo');
select ok((select relrowsecurity from pg_class where oid='public.obras'::regclass), 'RLS mantida');
select is((select count(*)::integer from pg_proc where pronamespace='public'::regnamespace
 and proname='listar_obras_catalogo' and pronargs between 10 and 15 and not prosecdef),6,'seis variantes invoker preservadas');

insert into auth.users(id) values ('e9100000-0000-4000-8000-000000000001'),('e9100000-0000-4000-8000-000000000002');
insert into public.profiles(id,user_id,nome,tipo) values
 ('e9100000-0000-4000-8000-000000000001','e9100000-0000-4000-8000-000000000001','QA versao','autor'),
 ('e9100000-0000-4000-8000-000000000002','e9100000-0000-4000-8000-000000000002','QA sem termos','autor');
-- INSERT explicito tenta impor UUID antigo ou NULL; ambos devem ser ignorados.
insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,publicado,slug,status_editorial,status_editorial_versao)
values
 ('e9200000-0000-4000-8000-000000000001','e9100000-0000-4000-8000-000000000001','Draft','QA','Fantasia','HQ','Livre',false,'qa-versao-draft',null,'e9400000-0000-4000-8000-000000000001'),
 ('e9200000-0000-4000-8000-000000000002','e9100000-0000-4000-8000-000000000001','Publica','QA','Fantasia','HQ','Livre',true,'qa-versao-publica','em_andamento',null),
 ('e9200000-0000-4000-8000-000000000003','e9100000-0000-4000-8000-000000000002','Sem termos','QA','Fantasia','HQ','Livre',true,'qa-versao-sem-termos','pausada',null);
insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,publicado,slug)
values ('e9200000-0000-4000-8000-000000000004','e9100000-0000-4000-8000-000000000001','Cliente antigo','QA','Fantasia','HQ','Livre',false,'qa-versao-antiga');
select ok((select bool_and(status_editorial_versao is not null) from public.obras where id::text like 'e9200000-%'), 'todos os INSERTs recebem token, inclusive antigo e NULL explicito');
select isnt((select status_editorial_versao from public.obras where slug='qa-versao-draft'),'e9400000-0000-4000-8000-000000000001'::uuid,'UUID enviado nao determina o armazenado');
select is((select status_editorial from public.obras where slug='qa-versao-antiga'),null,'cliente antigo conserva status NULL');
create temp table versao_antes as select id,status_editorial,status_editorial_versao,sinopse,publicado from public.obras where id::text like 'e9200000-%';
create temp table revisao_antes as select revisao from historietas_privado.obra_projecao_revisoes where obra_id='e9200000-0000-4000-8000-000000000002';

select set_config('request.jwt.claim.sub','e9100000-0000-4000-8000-000000000001',true);
select public.aceitar_termos_publicacao('2026-08-05','2026-08-05','2026-08-05');
set local role authenticated;
select lives_ok($$update public.obras set status_editorial='em_andamento' where slug='qa-versao-publica'$$,'mesmo status permitido');
select lives_ok($$update public.obras set sinopse='Outra edicao' where slug='qa-versao-publica'$$,'metadado antigo permitido');
select throws_ok($$update public.obras set status_editorial_versao=null where slug='qa-versao-publica'$$,'42501',null,'cliente nao limpa versao');
select throws_ok($$update public.obras set status_editorial_versao='e9400000-0000-4000-8000-000000000001' where slug='qa-versao-publica'$$,'42501',null,'cliente nao forja versao');
reset role;
select is((select status_editorial_versao from public.obras where slug='qa-versao-publica'),
 (select status_editorial_versao from versao_antes where id='e9200000-0000-4000-8000-000000000002'),'no-op e outros campos nao trocam token');
select is((select revisao from historietas_privado.obra_projecao_revisoes where obra_id='e9200000-0000-4000-8000-000000000002'),
 (select revisao+1 from revisao_antes),'somente metadado efetivo incrementa revisao, sem duplicar efeito');
set local role authenticated;
select lives_ok($$update public.obras set status_editorial='pausada' where slug='qa-versao-publica'$$,'mudanca efetiva pelo proprietario');
select lives_ok($$update public.obras set status_editorial='em_andamento' where slug='qa-versao-draft'$$,'transicao de NULL');
reset role;
select isnt((select status_editorial_versao from public.obras where slug='qa-versao-publica'),
 (select status_editorial_versao from versao_antes where id='e9200000-0000-4000-8000-000000000002'),'mudanca troca token');
select isnt((select status_editorial_versao from public.obras where slug='qa-versao-draft'),
 (select status_editorial_versao from versao_antes where id='e9200000-0000-4000-8000-000000000001'),'NULL para estado troca token');
select is((select revisao from historietas_privado.obra_projecao_revisoes where obra_id='e9200000-0000-4000-8000-000000000002'),
 (select revisao+2 from revisao_antes),'status e token geram um unico incremento publico');
truncate versao_antes;
insert into versao_antes select id,status_editorial,status_editorial_versao,sinopse,publicado from public.obras where id::text like 'e9200000-%';
set local role authenticated;
select throws_ok($$update public.obras set status_editorial='invalida',sinopse='Nao salvar' where slug='qa-versao-publica'$$,'23514',null,'CHECK aborta a linha inteira');
reset role;
select results_eq($$select id,status_editorial,status_editorial_versao,sinopse,publicado from public.obras where id::text like 'e9200000-%' order by id$$,
 $$select * from versao_antes order by id$$,'CHECK nao deixa token/status/metadados parciais');
select set_config('request.jwt.claim.sub','e9100000-0000-4000-8000-000000000002',true);
set local role authenticated;
select throws_ok($$update public.obras set status_editorial='concluida',sinopse='Nao salvar' where slug='qa-versao-sem-termos'$$,'P0001','ACEITE_TERMOS_PUBLICACAO_OBRIGATORIO','termos continuam obrigatorios');
with u as (update public.obras set status_editorial='concluida' where slug='qa-versao-publica' returning id)
select is(count(*)::integer,0,'terceiro nao altera') from u;
reset role;
select results_eq($$select id,status_editorial,status_editorial_versao,sinopse,publicado from public.obras where id::text like 'e9200000-%' order by id$$,
 $$select * from versao_antes order by id$$,'termos/autorizacao preservam dados');
set local role anon;
select throws_ok($$update public.obras set status_editorial='concluida' where slug='qa-versao-publica'$$,'42501',null,'anon nao altera');
select ok((select status_editorial_versao is not null from public.obras where slug='qa-versao-publica'),'SELECT existente expoe token de obra visivel; nao e segredo');
select is((select count(*)::integer from public.obras where slug='qa-versao-draft'),0,'token nao abre acesso ao draft');
select ok(not (public.obter_projecao_publica_obra('qa-versao-publica')->'obra' ? 'statusEditorialVersao')
 and not (public.obter_projecao_publica_obra('qa-versao-publica')->'obra' ? 'status_editorial_versao'),'token nao acrescentado a projecao publica');
reset role;

select set_config('request.jwt.claim.sub','e9100000-0000-4000-8000-000000000001',true);
savepoint antes_rollback;
update public.obras set status_editorial=null where slug='qa-versao-publica';
select isnt((select status_editorial_versao from public.obras where slug='qa-versao-publica'),
 (select status_editorial_versao from versao_antes where id='e9200000-0000-4000-8000-000000000002'),'transicao para NULL troca token');
rollback to antes_rollback;
select results_eq($$select id,status_editorial,status_editorial_versao,sinopse,publicado from public.obras where id::text like 'e9200000-%' order by id$$,
 $$select * from versao_antes order by id$$,'rollback restaura status e token');
select is((select revisao from historietas_privado.obra_projecao_revisoes where obra_id='e9200000-0000-4000-8000-000000000002'),
 (select revisao+2 from revisao_antes),'rollback tambem restaura revisao');
select is((select count(*)::integer from historietas_privado.capitulo_cache_outbox where obra_id::text like 'e9200000-%'),0,'sem efeito novo na outbox');
select * from finish();
rollback;
