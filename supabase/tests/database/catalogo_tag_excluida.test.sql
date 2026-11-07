begin;
select plan(20);

select ok(not prosecdef and pronargdefaults = 0 and proconfig = array['search_path=""'],
  'exclusão mantém invoker, search_path e resolução não ambígua')
from pg_proc where oid = 'public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text)'::regprocedure;
select ok(has_function_privilege('anon',
  'public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text)', 'EXECUTE')
  and has_function_privilege('authenticated',
  'public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text)', 'EXECUTE')
  and not exists (select 1 from pg_proc, lateral aclexplode(proacl) acl
    where oid = 'public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text)'::regprocedure
      and acl.grantee = 0 and acl.privilege_type = 'EXECUTE'), 'acesso público limitado aos papéis previstos');

insert into auth.users (id) values ('75000000-0000-4000-8000-000000000001'), ('75000000-0000-4000-8000-000000000002');
insert into public.profiles (id, user_id, nome, tipo)
values ('75000000-0000-4000-8000-000000000001', '75000000-0000-4000-8000-000000000001', 'Autor QA exclusão', 'autor'),
  ('75000000-0000-4000-8000-000000000002', '75000000-0000-4000-8000-000000000002', 'Leitor QA exclusão', 'leitor');
insert into public.preferencias_privacidade (user_id, visibilidade_biblioteca, mostrar_avaliacoes)
values ('75000000-0000-4000-8000-000000000002', 'publico', true);
insert into public.obras (id, user_id, titulo, autor, genero, formato,
  classificacao_indicativa, avisos_conteudo, tags, arquivo_url, publicado, slug, criada_em)
select ('76000000-0000-4000-8000-' || lpad(g::text,12,'0'))::uuid,
  '75000000-0000-4000-8000-000000000001', 'Obra QA exclusão ' || g, 'Autor QA exclusão',
  'Fantasia', case when g = 2 then 'Mangá' else 'HQ' end,
  case when g = 60 then '18+' else 'Livre' end,
  case when g = 60 then array['violencia_intensa'] else '{}'::text[] end,
  case when g in (1,2,59,60) then array['base'] when g = 3 then array['base',null]
    when g = 4 then array['base', E'%_\\,.()'] when g = 5 then array['base','ação épica extra']
    else array['base', E' AÇÃO  Épica\t'] end,
  'https://example.invalid/qa.txt', g <> 59, 'qa-exclusao-' || g,
  '2032-01-01'::timestamptz + g * interval '1 day'
from generate_series(1,60) g;
insert into public.obra_avaliacoes (obra_id, user_id, nota, visibilidade)
values ('76000000-0000-4000-8000-000000000001', '75000000-0000-4000-8000-000000000002', 4.5, 'publico'),
  ('76000000-0000-4000-8000-000000000002', '75000000-0000-4000-8000-000000000002', 5, 'publico');

set local role anon;
select is((select count(*)::integer from public.obras where id::text like '76000000-0000-4000-8000-%'), 58,
  'fixture anon: publicadas visíveis sem draft/18+');
select is((select count(*)::integer from public.listar_obras_catalogo('', '', '', '', 'todos', 'mais-recentes', 24,
  null, null, null, 'base') where obra_id in ('76000000-0000-4000-8000-000000000001', '76000000-0000-4000-8000-000000000002')), 0,
  'obras antigas elegíveis estão fora da primeira página inicial');
select is((select count(*)::integer from public.listar_obras_catalogo('', '', '', '', 'todos', 'mais-recentes', 24,
  null, null, null, 'base', null, E' ÁÇÃO\t ÉPICA ')), 5, 'exclui por tag normalizada antes do limite');
select is((select obra_id::text from public.listar_obras_catalogo('', '', '', '', 'todos', 'mais-recentes', 1,
  null, null, null, 'base', null, 'acao epica')), '76000000-0000-4000-8000-000000000005', 'primeira página filtrada');
select is((select obra_id::text from public.listar_obras_catalogo('', '', '', '', 'todos', 'mais-recentes', 1,
  0, '2032-01-06', '76000000-0000-4000-8000-000000000005', 'base', null, 'acao epica')),
  '76000000-0000-4000-8000-000000000004', 'cursor avança sem salto ou repetição');
select is((select count(*)::integer from public.listar_obras_catalogo('', '', '', '', 'todos', 'mais-recentes', 24,
  null, null, null, 'base', null, 'acao epica') where obra_id = '76000000-0000-4000-8000-000000000003'), 1, 'tag nula não exclui a obra');
select is((select count(*)::integer from public.listar_obras_catalogo('', '', '', '', 'todos', 'mais-recentes', 24,
  null, null, null, 'base', null, 'acao epica') where obra_id = '76000000-0000-4000-8000-000000000005'), 1, 'não exclui substring');
select is((select count(*)::integer from public.listar_obras_catalogo('', '', '', '', 'todos', 'mais-recentes', 50,
  null, null, null, E'%_\\,.()', null, E'%_\\,.()')), 0, 'curingas, barra e pontuação são literais');
select is((select obra_id::text from public.listar_obras_catalogo('', 'Fantasia', 'HQ', 'Livre', 'todos', 'mais-recentes', 24,
  null, null, null, 'base', 4.5, 'acao epica')), '76000000-0000-4000-8000-000000000001', 'combina inclusão, exclusão, nota, gênero e formato');
select is((select count(*)::integer from public.listar_obras_catalogo('', '', '', '', 'todos', 'mais-recentes', 24,
  null, null, null, 'base', null, 'base')), 0, 'incluir e excluir a mesma tag retorna vazio legítimo');
select results_eq(
  $$ select * from public.listar_obras_catalogo('', '', '', '', 'todos', 'mais-recentes', 24, null, null, null, 'base', null, '') $$,
  $$ select * from public.listar_obras_catalogo('', '', '', '', 'todos', 'mais-recentes', 24, null, null, null, 'base', null) $$,
  'exclusão vazia preserva a variante de 12 argumentos');
select results_eq(
  $$ select * from public.listar_obras_catalogo('', '', '', '', 'todos', 'mais-recentes', 24, null, null, null, 'base', null, null) $$,
  $$ select * from public.listar_obras_catalogo('', '', '', '', 'todos', 'mais-recentes', 24, null, null, null, 'base') $$,
  'exclusão nula preserva a variante de 11 argumentos');
select lives_ok($$ select * from public.listar_obras_catalogo('qa') $$, 'chamada posicional de 10 argumentos continua válida');
select throws_ok($$ select * from public.listar_obras_catalogo('', '', '', '', 'todos', 'mais-recentes', 24,
  null, null, null, '', null, repeat('a',91)) $$, '22023', 'A tag excluída aceita no máximo 90 caracteres.', 'limite de entrada validado');
select is((select obra_id::text from public.listar_obras_catalogo('', '', '', '', 'todos', 'mais-recentes', 24,
  null, null, null, 'base', 5, 'acao epica')), '76000000-0000-4000-8000-000000000002', 'nota mínima preservada');
select is((select count(*)::integer from public.listar_obras_catalogo('', '', '', '', 'todos', 'mais-recentes', 24,
  null, null, null, 'base', null, 'acao epica') where obra_id in ('76000000-0000-4000-8000-000000000059', '76000000-0000-4000-8000-000000000060')), 0,
  'exclusão não amplia publicação ou acesso 18+');
reset role;
set local role authenticated;
select is((select count(*)::integer from public.listar_obras_catalogo('', '', '', '', 'todos', 'mais-recentes', 24,
  null, null, null, 'base', null, 'acao epica')), 5, 'mesmo filtro funciona sob authenticated sem privilégios elevados');
select results_eq(
  $$ select * from public.listar_obras_catalogo('', '', '', '', 'todos', 'mais-recentes', 24, null, null, null, 'base', 4.5, '') $$,
  $$ select * from public.listar_obras_catalogo('', '', '', '', 'todos', 'mais-recentes', 24, null, null, null, 'base', 4.5) $$,
  'nota mínima de 12 argumentos permanece compatível');
reset role;
select * from finish();
rollback;
