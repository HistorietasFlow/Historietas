-- DERIVED OFFLINE from recovered probe; NOT a historical raw SQL log.
-- Only pending cursor assertion, 4 EXPLAIN plans and anon scale count.
\set ON_ERROR_STOP on
\pset format unaligned
\pset tuples_only on
begin;
set local search_path = public, extensions;
select 'PGTAP no_plan_before=' || (to_regprocedure('no_plan()') is not null)::int;
create extension if not exists pgtap with schema extensions;
select no_plan();
insert into auth.users(id) values ('ce100000-0000-4000-8000-000000000001'),('ce100000-0000-4000-8000-000000000002'),('ce100000-0000-4000-8000-000000000003'),('ce100000-0000-4000-8000-000000000004');
insert into public.profiles(id,user_id,nome,tipo)
select id,id,'QA historias comum',case when id in ('ce100000-0000-4000-8000-000000000001','ce100000-0000-4000-8000-000000000004') then 'autor' else 'leitor' end
from auth.users where id in ('ce100000-0000-4000-8000-000000000001','ce100000-0000-4000-8000-000000000002','ce100000-0000-4000-8000-000000000003','ce100000-0000-4000-8000-000000000004');
insert into public.preferencias_privacidade(user_id,visibilidade_biblioteca,mostrar_favoritos)
values ('ce100000-0000-4000-8000-000000000001','publico',true),('ce100000-0000-4000-8000-000000000002','publico',true),('ce100000-0000-4000-8000-000000000003','publico',true),('ce100000-0000-4000-8000-000000000004','publico',true);
select set_config('request.jwt.claim.sub','ce100000-0000-4000-8000-000000000001',true);
select public.aceitar_termos_publicacao('2026-08-05','2026-08-05','2026-08-05');
select set_config('request.jwt.claim.sub','ce100000-0000-4000-8000-000000000004',true);
select public.aceitar_termos_publicacao('2026-08-05','2026-08-05','2026-08-05');
insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,avisos_conteudo,publicado,slug)
select ('ce200000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
case when n in (10,11) then 'ce100000-0000-4000-8000-000000000001'::uuid else 'ce100000-0000-4000-8000-000000000004'::uuid end,
'QA comum '||n,'QA','Fantasia','Romance',case when n in (9,11) then '18+' else 'Livre' end,
case when n in (9,11) then array['violencia_intensa'] else '{}'::text[] end,
n not in (8,10),'qa-historias-comum-'||n from generate_series(1,11) n;
insert into public.favoritos(user_id,obra_id,visibilidade)
select u,('ce200000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
case when (u='ce100000-0000-4000-8000-000000000001' and n=4) or (u='ce100000-0000-4000-8000-000000000002' and n=5) then 'privado'
 when (u='ce100000-0000-4000-8000-000000000001' and n=6) or (u='ce100000-0000-4000-8000-000000000002' and n=7) then 'parcial' else 'publico' end
from unnest(array['ce100000-0000-4000-8000-000000000001'::uuid,'ce100000-0000-4000-8000-000000000002'::uuid]) u cross join generate_series(1,11) n;
reset role; set local request.jwt.claim.sub = 'ce100000-0000-4000-8000-000000000001'; set local request.jwt.claims = '{"sub":"ce100000-0000-4000-8000-000000000001","role":"authenticated"}'; set local role authenticated; set local statement_timeout = '8s';
reset role; insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,publicado,slug)
select ('ce200000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'ce100000-0000-4000-8000-000000000004','QA comum escala '||n,'QA','Fantasia','Romance','Livre',true,'qa-historias-comum-'||n from generate_series(100,1099) n;
insert into public.favoritos(user_id,obra_id,visibilidade)
select u,('ce200000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'publico'
from unnest(array['ce100000-0000-4000-8000-000000000001'::uuid,'ce100000-0000-4000-8000-000000000002'::uuid]) u cross join generate_series(100,1099) n;
reset role; set local request.jwt.claim.sub = 'ce100000-0000-4000-8000-000000000001'; set local request.jwt.claims = '{"sub":"ce100000-0000-4000-8000-000000000001","role":"authenticated"}'; set local role authenticated; set local statement_timeout = '8s';
select is((select min(id::text) from (select o.id from public.obras o
 join public.favoritos a on a.obra_id=o.id and a.user_id='ce100000-0000-4000-8000-000000000001'
 join public.favoritos b on b.obra_id=o.id and b.user_id='ce100000-0000-4000-8000-000000000002'
 where a.visibilidade='publico' and b.visibilidade='publico'
 and o.publicado=true and o.classificacao_indicativa in ('Livre','10+','12+','14+','16+')
 and o.id >= 'ce200000-0000-4000-8000-000000000001' and o.id <= 'ce200000-0000-4000-8000-000000999999' and o.id > 'ce200000-0000-4000-8000-000000000116' order by o.id limit 20) p),'ce200000-0000-4000-8000-000000000117','Cursor follows unique obra ID, no skipped public match');
select 'PLAN page1 authenticated'; explain (analyze,buffers,format json) select o.id from public.obras o
 join public.favoritos a on a.obra_id=o.id and a.user_id='ce100000-0000-4000-8000-000000000001'
 join public.favoritos b on b.obra_id=o.id and b.user_id='ce100000-0000-4000-8000-000000000002'
 where a.visibilidade='publico' and b.visibilidade='publico'
 and o.publicado=true and o.classificacao_indicativa in ('Livre','10+','12+','14+','16+')
 and o.id >= 'ce200000-0000-4000-8000-000000000001' and o.id <= 'ce200000-0000-4000-8000-000000999999' order by o.id limit 20;
select 'PLAN deep keyset authenticated'; explain (analyze,buffers,format json) select o.id from public.obras o
 join public.favoritos a on a.obra_id=o.id and a.user_id='ce100000-0000-4000-8000-000000000001'
 join public.favoritos b on b.obra_id=o.id and b.user_id='ce100000-0000-4000-8000-000000000002'
 where a.visibilidade='publico' and b.visibilidade='publico'
 and o.publicado=true and o.classificacao_indicativa in ('Livre','10+','12+','14+','16+')
 and o.id >= 'ce200000-0000-4000-8000-000000000001' and o.id <= 'ce200000-0000-4000-8000-000000999999' and o.id > 'ce200000-0000-4000-8000-000000001000' order by o.id limit 20;
select 'PLAN exact count authenticated'; explain (analyze,buffers,format json) select count(*) from (select o.id from public.obras o
 join public.favoritos a on a.obra_id=o.id and a.user_id='ce100000-0000-4000-8000-000000000001'
 join public.favoritos b on b.obra_id=o.id and b.user_id='ce100000-0000-4000-8000-000000000002'
 where a.visibilidade='publico' and b.visibilidade='publico'
 and o.publicado=true and o.classificacao_indicativa in ('Livre','10+','12+','14+','16+')
 and o.id >= 'ce200000-0000-4000-8000-000000000001' and o.id <= 'ce200000-0000-4000-8000-000000999999') p;
reset role; set local request.jwt.claim.sub = ''; set local request.jwt.claims = '{}'; set local role anon; set local statement_timeout = '3s';
select is((select count(*) from (select o.id from public.obras o
 join public.favoritos a on a.obra_id=o.id and a.user_id='ce100000-0000-4000-8000-000000000001'
 join public.favoritos b on b.obra_id=o.id and b.user_id='ce100000-0000-4000-8000-000000000002'
 where a.visibilidade='publico' and b.visibilidade='publico'
 and o.publicado=true and o.classificacao_indicativa in ('Livre','10+','12+','14+','16+')
 and o.id >= 'ce200000-0000-4000-8000-000000000001' and o.id <= 'ce200000-0000-4000-8000-000000999999') probe),1003::bigint,'Anon exact count excludes protected items at scale');
select 'PLAN page1 anon'; explain (analyze,buffers,format json) select o.id from public.obras o
 join public.favoritos a on a.obra_id=o.id and a.user_id='ce100000-0000-4000-8000-000000000001'
 join public.favoritos b on b.obra_id=o.id and b.user_id='ce100000-0000-4000-8000-000000000002'
 where a.visibilidade='publico' and b.visibilidade='publico'
 and o.publicado=true and o.classificacao_indicativa in ('Livre','10+','12+','14+','16+')
 and o.id >= 'ce200000-0000-4000-8000-000000000001' and o.id <= 'ce200000-0000-4000-8000-000000999999' order by o.id limit 20;
select * from finish(); reset role; rollback;
