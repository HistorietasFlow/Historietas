begin;
select plan(13);

select ok(not prosecdef and pronargdefaults = 0,
  'variante com tag é invoker e não torna ambíguas chamadas legadas')
from pg_proc where oid = 'public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text)'::regprocedure;
select ok(has_function_privilege('anon',
  'public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text)', 'EXECUTE'),
  'visitante preserva acesso ao catálogo filtrado');
select ok(not exists (
  select 1 from pg_proc, lateral aclexplode(proacl) acl
  where oid = 'public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text)'::regprocedure
    and acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
), 'PUBLIC não recebe EXECUTE');

insert into auth.users (id) values ('71000000-0000-4000-8000-000000000001');
insert into public.profiles (id, user_id, nome, tipo)
values ('71000000-0000-4000-8000-000000000001', '71000000-0000-4000-8000-000000000001', 'Autor QA tag', 'autor');
insert into public.obras (id, user_id, titulo, autor, genero, formato,
  classificacao_indicativa, avisos_conteudo, tags, arquivo_url, publicado, slug, criada_em)
select ('72000000-0000-4000-8000-' || lpad(g::text,12,'0'))::uuid,
  '71000000-0000-4000-8000-000000000001', 'Obra QA tag ' || g, 'Autor QA tag',
  'Fantasia', case when g = 2 then 'Mangá' else 'HQ' end,
  case when g = 54 then '18+' else 'Livre' end,
  case when g = 54 then array['violencia_intensa'] else '{}'::text[] end,
  case when g in (1,2,53,54) then array[' QA-AÇÃO '] when g = 55 then array['%_\,.()'] else array['outra'] end,
  'https://example.invalid/qa.txt', g <> 53, 'qa-tag-' || g,
  '2030-01-01'::timestamptz + g * interval '1 day'
from generate_series(1,55) g;

set local role anon;
select lives_ok($$ select * from public.listar_obras_catalogo('qa') $$,
  'chamada posicional legada continua resolvendo');
select is((select count(*)::integer from public.listar_obras_catalogo(
  '', '', '', '', 'todos', 'mais-recentes', 24, null, null, null, 'qa-acao')), 2,
  'tag alcança obras fora da primeira página e exclui draft e 18+');
select is((select obra_id::text from public.listar_obras_catalogo(
  '', '', '', '', 'todos', 'mais-recentes', 1, null, null, null, E' QA-ÁÇÃO\t')),
  '72000000-0000-4000-8000-000000000002', 'normalização e primeira página');
select is((select obra_id::text from public.listar_obras_catalogo(
  '', '', '', '', 'todos', 'mais-recentes', 1, 0, '2030-01-03',
  '72000000-0000-4000-8000-000000000002', 'qa-acao')),
  '72000000-0000-4000-8000-000000000001', 'cursor avança sem perder resultado');
select is((select count(*)::integer from public.listar_obras_catalogo(
  '', 'Fantasia', 'HQ', 'Livre', 'todos', 'mais-recentes', 24, null, null, null, 'qa-acao')), 1,
  'tag combina com filtros explícitos');
select is((select count(*)::integer from public.listar_obras_catalogo(
  '', '', '', '', 'todos', 'mais-recentes', 24, null, null, null, '%_\,.()')), 1,
  'pontuação e curingas são literais');
select is((select count(*)::integer from public.listar_obras_catalogo(
  '', '', '', '', 'todos', 'mais-recentes', 24, null, null, null, 'qa-ac')), 0,
  'não aceita substring como tag completa');
select throws_ok($$ select * from public.listar_obras_catalogo(
  '', '', '', '', 'todos', 'mais-recentes', 24, null, null, null, repeat('a',91)) $$,
  '22023', 'A tag aceita no máximo 90 caracteres.', 'entrada longa é rejeitada');
select results_eq(
  $$ select * from public.listar_obras_catalogo('', '', '', '', 'todos', 'mais-recentes', 24, null, null, null, '') $$,
  $$ select * from public.listar_obras_catalogo('', '', '', '', 'todos', 'mais-recentes', 24, null, null, null) $$,
  'tag vazia equivale ao contrato antigo');
select ok(has_function_privilege('authenticated',
  'public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text)', 'EXECUTE'),
  'usuário autenticado preserva acesso sem privilégio elevado');
reset role;
select * from finish();
rollback;
