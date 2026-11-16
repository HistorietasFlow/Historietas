begin;
select no_plan();

select ok(not attnotnull and not atthasdef and atttypid='bigint'::regtype,
  'contador BIGINT nullable sem default') from pg_attribute
  where attrelid='public.capitulos'::regclass and attname='palavras_contadas';
select ok((select relrowsecurity from pg_class where oid='public.capitulos'::regclass), 'RLS preservada');
select ok(not has_function_privilege('authenticated','historietas_privado.preencher_palavras_capitulos(integer)','EXECUTE')
  and not has_function_privilege('service_role','historietas_privado.preencher_palavras_capitulos(integer)','EXECUTE'), 'backfill somente administrativo');
select ok(not has_function_privilege('anon','historietas_privado.definir_palavras_capitulo()','EXECUTE'), 'trigger sem RPC/EXECUTE publico');
select ok(not prosecdef and pronargdefaults=0 and proconfig=array['search_path=""'], 'RPC nova invoker sem defaults e search_path vazio')
from pg_proc where pronamespace='public'::regnamespace and proname='listar_obras_catalogo' and pronargs=17;
select is((select count(*)::integer from pg_proc where pronamespace='public'::regnamespace
  and proname='listar_obras_catalogo' and pronargs between 10 and 15),6,'seis variantes anteriores presentes');

insert into auth.users(id) values ('eb100000-0000-4000-8000-000000000001'),('eb100000-0000-4000-8000-000000000002');
insert into public.profiles(id,user_id,nome,tipo)
select id,id,'QA palavras','autor' from auth.users where id::text like 'eb100000-%';
insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,avisos_conteudo,tags,publicado,slug,criada_em,status_editorial,arquivo_url)
select ('eb200000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
  case when n=12 then 'eb100000-0000-4000-8000-000000000002'::uuid else 'eb100000-0000-4000-8000-000000000001'::uuid end,
  'QA palavras '||n,'QA','Fantasia','Conto',case when n=11 then '18+' else 'Livre' end,
  case when n=11 then array['terror'] else '{}'::text[] end,array['qa-palavras'],n<>9,'qa-palavras-'||n,
  '2035-01-01'::timestamptz+(case when n in (5,6) then n+100 else n end)*interval '1 day','concluida',case when n in (5,6) then 'privado/qa.txt' else '' end
from generate_series(1,65) n;
insert into public.capitulos(id,obra_id,user_id,titulo,texto,ordem,publicado,palavras_contadas)
select ('eb300000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
  ('eb200000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
  case when n=12 then 'eb100000-0000-4000-8000-000000000002'::uuid else 'eb100000-0000-4000-8000-000000000001'::uuid end,
  'Titulo nao contado',case when n=1 then 'um dois tres quatro cinco seis sete' when n=2 then '' else 'duas palavras' end,
  1,n<>10,999999 from generate_series(1,65) n where n<>6;
select is((select palavras_contadas from public.capitulos where id='eb300000-0000-4000-8000-000000000001'),7::bigint,'INSERT ignora contador forjado');

-- NULL preexistente: fixture somente local/revertida, sem janela fora desta transacao.
set constraints all immediate;
alter table public.capitulos disable trigger capitulos_palavras_contadas;
update public.capitulos set palavras_contadas=null where id='eb300000-0000-4000-8000-000000000003';
insert into public.capitulos(id,obra_id,user_id,titulo,texto,ordem,publicado)
values ('eb300000-0000-4000-8000-000000000104','eb200000-0000-4000-8000-000000000004','eb100000-0000-4000-8000-000000000001','Parte antiga','nao medido',2,true);
alter table public.capitulos enable trigger capitulos_palavras_contadas;
-- Representacao mista exercitada antes das constraints deferred; rollback final,
-- sem manifesto/upload/finalizacao ou alteracao dos bloqueios ilustrados.
set constraints all deferred;
update public.capitulos set tipo_conteudo='imagens' where id='eb300000-0000-4000-8000-000000000007';
insert into public.capitulos(id,obra_id,user_id,titulo,texto,ordem,publicado,tipo_conteudo)
values ('eb300000-0000-4000-8000-000000000108','eb200000-0000-4000-8000-000000000008','eb100000-0000-4000-8000-000000000001','Imagem','nao contar',2,true,'imagens');

create function pg_temp.palavras(p_min numeric,p_max numeric,p_limite integer default 50,
  p_valor numeric default null,p_data timestamptz default null,p_id uuid default null)
returns table(obra_id uuid,cursor_valor numeric,cursor_data timestamptz,cursor_id uuid,tem_mais boolean)
language sql security invoker as $$
 select * from public.listar_obras_catalogo('QA palavras','','','','todos','mais-recentes',p_limite,
 p_valor,p_data,p_id,'qa-palavras',null,'','','',p_min,p_max)
$$;

set local role anon;
select is((select count(*) from pg_temp.palavras(7,7)),1::bigint,'limites inclusivos encontram obra alem da primeira pagina');
select is((select obra_id from pg_temp.palavras(7,7)),'eb200000-0000-4000-8000-000000000001'::uuid,'destino correto, nao amostra inicial');
select is((select obra_id from pg_temp.palavras(0,0)),'eb200000-0000-4000-8000-000000000002'::uuid,'zero medido nao equivale a desconhecido');
select is((select count(*) from pg_temp.palavras(0,null) where right(obra_id::text,12) in
  ('000000000003','000000000004','000000000005','000000000006','000000000007','000000000008','000000000009','000000000010','000000000011')),0::bigint,
  'exclui NULL, parcial, anexo, misto, draft, capitulo nao publicado e 18+');
select ok(exists(select 1 from pg_temp.palavras(null,null) where obra_id='eb200000-0000-4000-8000-000000000005'),'neutro preserva obra com anexo');
select is((select count(*) from public.capitulos where obra_id='eb200000-0000-4000-8000-000000000009'),0::bigint,'anon nao ve contador de rascunho');
select throws_ok($$select * from pg_temp.palavras(-1,null)$$,'22023','Intervalo de palavras invalido.','negativo rejeitado');
select throws_ok($$select * from pg_temp.palavras(1.5,null)$$,'22023','Intervalo de palavras invalido.','decimal nao arredondado');
select throws_ok($$select * from pg_temp.palavras(3,2)$$,'22023','Intervalo de palavras invalido.','intervalo invertido rejeitado');
select throws_ok($$select * from pg_temp.palavras(null,9007199254740992)$$,'22023','Intervalo de palavras invalido.','representacao nao segura rejeitada');
select throws_ok($$select * from pg_temp.palavras('NaN',null)$$,'22023','Intervalo de palavras invalido.','NaN rejeitado');
select throws_ok($$select * from pg_temp.palavras(null,'Infinity')$$,'22023','Intervalo de palavras invalido.','infinito rejeitado');
select lives_ok($$select * from pg_temp.palavras(0,9007199254740991)$$,'maior inteiro seguro e permitido');
select throws_ok($$select * from pg_temp.palavras(null,1.5)$$,'22023','Intervalo de palavras invalido.','maximo fracionario rejeitado');
select throws_ok($$select * from pg_temp.palavras(null,-1)$$,'22023','Intervalo de palavras invalido.','maximo negativo rejeitado');
select is((select count(*) from pg_temp.palavras(8,null)),0::bigint,'sem correspondencia e vazio legitimo');
select results_eq($$select * from pg_temp.palavras(null,null)$$,
 $$select * from public.listar_obras_catalogo('QA palavras','','','','todos','mais-recentes',50,null,null,null,'qa-palavras',null,'','','')$$,'neutro equivale exatamente a variante 15');
select is((select count(*) from public.listar_obras_catalogo('QA palavras','Fantasia','Conto','Livre','com-capitulos','mais-capitulos',24,null,null,null,'qa-palavras',null,'bloqueada','Terror','concluida',7,7)),1::bigint,
 'combina busca, genero, formato, classificacao, capitulos, tag/exclusoes e status');
select is((select count(*) from public.listar_obras_catalogo('QA palavras','','','','todos','mais-recentes',24,null,null,null,'qa-palavras',null,'qa-palavras','','',0,null)),0::bigint,'filtros contraditorios nao alargam busca');
select is((with p1 as (select * from pg_temp.palavras(2,2,2)),
 ultimo as (select * from p1 order by cursor_data,cursor_id limit 1),
 p2 as (select p.* from ultimo u cross join lateral pg_temp.palavras(2,2,2,u.cursor_valor,u.cursor_data,u.cursor_id) p)
 select count(*) from p1 join p2 using(obra_id)),0::bigint,'cursor seguinte nao repete obras');
reset role;

select set_config('request.jwt.claim.sub','eb100000-0000-4000-8000-000000000001',true);
select public.aceitar_termos_publicacao('2026-08-05','2026-08-05','2026-08-05');
set local role authenticated;
update public.capitulos set palavras_contadas=123 where id='eb300000-0000-4000-8000-000000000001';
select is((select palavras_contadas from public.capitulos where id='eb300000-0000-4000-8000-000000000001'),7::bigint,'UPDATE so do contador nao falsifica');
update public.capitulos set titulo='Outro titulo',palavras_contadas=null where id='eb300000-0000-4000-8000-000000000001';
select is((select palavras_contadas from public.capitulos where id='eb300000-0000-4000-8000-000000000001'),7::bigint,'NULL forjado nao apaga medicao');
update public.capitulos set texto=U&'  caf\00E9\00A0guarda-chuva\FEFFd\2019agua\000D\000A123 ! \+01F600  '
where id='eb300000-0000-4000-8000-000000000009';
select is((select palavras_contadas from public.capitulos where id='eb300000-0000-4000-8000-000000000009'),6::bigint,'Unicode, NBSP, BOM, CRLF, hifen, apostrofo, numeros, pontuacao e emoji');
update public.capitulos set texto=U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF'
where id='eb300000-0000-4000-8000-000000000009';
select is((select palavras_contadas from public.capitulos where id='eb300000-0000-4000-8000-000000000009'),0::bigint,'todos os separadores ECMAScript contam zero');
select is((select count(*) from pg_temp.palavras(0,null) where obra_id='eb200000-0000-4000-8000-000000000009'),0::bigint,'autor autenticado tambem nao soma obra privada');
update public.capitulos set publicado=false where id='eb300000-0000-4000-8000-000000000001';
select is((select count(*) from pg_temp.palavras(7,7)),0::bigint,'despublicacao remove contribuicao');
update public.capitulos set publicado=true where id='eb300000-0000-4000-8000-000000000001';
select is((select count(*) from pg_temp.palavras(7,7)),1::bigint,'republicacao restaura contribuicao');
savepoint palavras_rollback;
update public.capitulos set texto='apenas' where id='eb300000-0000-4000-8000-000000000001';
rollback to palavras_rollback;
select is((select palavras_contadas from public.capitulos where id='eb300000-0000-4000-8000-000000000001'),7::bigint,'rollback restaura contador');
delete from public.capitulos where id='eb300000-0000-4000-8000-000000000001';
select is((select count(*) from pg_temp.palavras(7,7)),0::bigint,'exclusao remove contribuicao');
reset role;
select set_config('request.jwt.claim.sub','eb100000-0000-4000-8000-000000000002',true);
set local role authenticated;
with alteradas as (update public.capitulos set palavras_contadas=88 where id='eb300000-0000-4000-8000-000000000002' returning id)
select is((select count(*) from alteradas),0::bigint,'terceiro nao altera contador');
reset role;
select set_config('request.jwt.claim.sub','',true);
select is((select count(*) from historietas_privado.preencher_palavras_capitulos(1)),1::bigint,'lote respeita limite');
select is((select palavras_contadas from public.capitulos where id='eb300000-0000-4000-8000-000000000003'),2::bigint,'backfill mede texto real, nao grava zero sentinela');
select is((select count(*) from historietas_privado.preencher_palavras_capitulos(25)),1::bigint,'retoma somente medicao ausente');
select is((select count(*) from historietas_privado.preencher_palavras_capitulos(25)),0::bigint,'repeticao nao reescreve linhas confirmadas');
select throws_ok($$select * from historietas_privado.preencher_palavras_capitulos(26)$$,'22023',null,'lote excessivo rejeitado');
select is((select palavras_contadas from public.capitulos where id='eb300000-0000-4000-8000-000000000007'),null::bigint,'imagens nao fingem zero palavras');
update public.capitulos set tipo_conteudo='texto' where id='eb300000-0000-4000-8000-000000000007';
select is((select palavras_contadas from public.capitulos where id='eb300000-0000-4000-8000-000000000007'),2::bigint,'mudanca de tipo recalcula a partir do corpo armazenado');
select * from finish();
rollback;
