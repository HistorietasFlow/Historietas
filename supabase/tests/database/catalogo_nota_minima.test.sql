begin;
select plan(18);

select ok(not prosecdef and pronargdefaults = 0 and proconfig = array['search_path=""'],
  'nota mínima preserva invoker, search_path e resolução não ambígua')
from pg_proc where oid = 'public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric)'::regprocedure;
select ok(has_function_privilege('anon',
  'public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric)', 'EXECUTE')
  and has_function_privilege('authenticated',
  'public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric)', 'EXECUTE')
  and not exists (select 1 from pg_proc, lateral aclexplode(proacl) acl
    where oid = 'public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric)'::regprocedure
      and acl.grantee = 0 and acl.privilege_type = 'EXECUTE'), 'somente papéis previstos executam a nova variante');

insert into auth.users (id)
select ('73000000-0000-4000-8000-' || lpad(g::text,12,'0'))::uuid from generate_series(1,3) g;
insert into public.profiles (id, user_id, nome, tipo)
select id, id, 'QA nota ' || id, case when id = '73000000-0000-4000-8000-000000000001' then 'autor' else 'leitor' end
from auth.users where id in ('73000000-0000-4000-8000-000000000001',
  '73000000-0000-4000-8000-000000000002', '73000000-0000-4000-8000-000000000003');
insert into public.obras (id, user_id, titulo, autor, genero, formato,
  classificacao_indicativa, avisos_conteudo, tags, arquivo_url, publicado, slug, criada_em)
select ('74000000-0000-4000-8000-' || lpad(g::text,12,'0'))::uuid,
  '73000000-0000-4000-8000-000000000001', 'Obra QA nota ' || g, 'Autor QA nota',
  'Fantasia', case when g = 2 then 'Mangá' else 'HQ' end,
  case when g = 54 then '18+' else 'Livre' end,
  case when g = 54 then array['violencia_intensa'] else '{}'::text[] end,
  array['qa-nota'], 'https://example.invalid/qa.txt', g <> 53, 'qa-nota-' || g,
  '2031-01-01'::timestamptz + g * interval '1 day'
from generate_series(1,55) g;
insert into public.obra_avaliacoes (obra_id, user_id, nota)
select ('74000000-0000-4000-8000-' || lpad(g::text,12,'0'))::uuid,
  ('73000000-0000-4000-8000-' || lpad(u::text,12,'0'))::uuid,
  case when g = 1 then case when u = 2 then 4 else 5 end
    when g = 3 then case when u = 2 then 4 else 4.5 end
    when g = 8 then 0.5 else 5 end
from unnest(array[1,2,3,8,53,54]) g cross join generate_series(2,3) u;

select ok(strpos(pg_get_functiondef(
  'public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric)'::regprocedure),
  'where interacao.user_id <> obra.user_id') > 0, 'média ainda desconsidera notas do autor');
select throws_ok($$ insert into public.obra_avaliacoes (obra_id,user_id,nota)
  values ('74000000-0000-4000-8000-000000000004','73000000-0000-4000-8000-000000000001',5) $$,
  '42501', 'O autor não pode avaliar a própria obra.', 'trigger continua impedindo autoavaliação');

set local role anon;
select lives_ok($$ select * from public.listar_obras_catalogo('qa') $$, 'assinatura legada permanece válida');
select lives_ok($$ select * from public.listar_obras_catalogo('', '', '', '', 'todos', 'mais-recentes', 24, null, null, null, 'qa-nota') $$,
  'assinatura com tag permanece válida');
select results_eq(
  $$ select * from public.listar_obras_catalogo('', '', '', '', 'todos', 'mais-recentes', 24, null, null, null, 'qa-nota', null) $$,
  $$ select * from public.listar_obras_catalogo('', '', '', '', 'todos', 'mais-recentes', 24, null, null, null, 'qa-nota') $$,
  'filtro desativado mantém obras sem avaliação e contrato anterior');
select is((select count(*)::integer from public.listar_obras_catalogo(
  '', '', '', '', 'todos', 'mais-recentes', 24, null, null, null, 'qa-nota', 4.5)), 2,
  'filtra antes do limite, alcança obras antigas e exclui draft/18+');
select is((select count(*)::integer from public.listar_obras_catalogo(
  '', '', '', '', 'todos', 'mais-recentes', 24, null, null, null, 'qa-nota', 5)), 1, 'limite superior inclusivo');
select is((select count(*)::integer from public.listar_obras_catalogo(
  '', '', '', '', 'todos', 'mais-recentes', 24, null, null, null, 'qa-nota', 0.5)
  where obra_id = '74000000-0000-4000-8000-000000000004'), 0, 'sem avaliações não satisfaz filtro ativo');
select is((select obra_id::text from public.listar_obras_catalogo(
  '', '', '', '', 'todos', 'mais-recentes', 1, null, null, null, 'qa-nota', 4.5)),
  '74000000-0000-4000-8000-000000000002', 'primeira página contém melhor obra elegível mais recente');
select is((select obra_id::text from public.listar_obras_catalogo(
  '', '', '', '', 'todos', 'mais-recentes', 1, 0, '2031-01-03',
  '74000000-0000-4000-8000-000000000002', 'qa-nota', 4.5)),
  '74000000-0000-4000-8000-000000000001', 'cursor avança sem perder obra elegível');
select is((select obra_id::text from public.listar_obras_catalogo(
  '', 'Fantasia', 'HQ', 'Livre', 'todos', 'mais-recentes', 24, null, null, null, 'qa-nota', 4.5)),
  '74000000-0000-4000-8000-000000000001', 'combina nota, tag, formato, gênero e classificação');
select throws_ok($$ select * from public.listar_obras_catalogo('', '', '', '', 'todos', 'mais-recentes', 24, null, null, null, '', 0) $$,
  '22023', 'Avaliação mínima inválida.', 'zero não ativa consulta inválida');
select throws_ok($$ select * from public.listar_obras_catalogo('', '', '', '', 'todos', 'mais-recentes', 24, null, null, null, '', 5.5) $$,
  '22023', 'Avaliação mínima inválida.', 'nota acima da escala rejeitada');
select throws_ok($$ select * from public.listar_obras_catalogo('', '', '', '', 'todos', 'mais-recentes', 24, null, null, null, '', 4.1) $$,
  '22023', 'Avaliação mínima inválida.', 'passo fora da meia estrela rejeitado');
select is((select count(*)::integer from public.listar_obras_catalogo(
  '', '', '', '', 'todos', 'mais-recentes', 24, null, null, null, 'qa-nota', 0.5)
  where obra_id = '74000000-0000-4000-8000-000000000008'), 1, 'limite inferior inclusivo');
select is((select count(*)::integer from public.listar_obras_catalogo(
  '', '', '', '', 'todos', 'mais-recentes', 24, null, null, null, 'qa-nota', 4.5)
  where obra_id = '74000000-0000-4000-8000-000000000003'), 0, 'média 4,25 não é arredondada para 4,5');
reset role;
select * from finish();
rollback;
