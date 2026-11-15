begin;
select plan(23);

select ok(not prosecdef and pronargdefaults = 0 and proconfig = array['search_path=""'],
  '14 argumentos: invoker, search_path e sem defaults') from pg_proc
where oid = 'public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text,text)'::regprocedure;
select ok(has_function_privilege('anon', oid, 'EXECUTE') and has_function_privilege('authenticated', oid, 'EXECUTE')
  and not exists (select 1 from aclexplode(proacl) acl where acl.grantee = 0 and acl.privilege_type = 'EXECUTE'),
  'permissões explícitas sem EXECUTE para PUBLIC') from pg_proc
where oid = 'public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text,text)'::regprocedure;
select is((select count(*)::integer from pg_proc where pronamespace = 'public'::regnamespace
  and proname = 'listar_obras_catalogo' and pronargs in (10,11,12,13)), 4, 'quatro assinaturas anteriores preservadas');

insert into auth.users (id) values ('77000000-0000-4000-8000-000000000001'), ('77000000-0000-4000-8000-000000000002');
insert into public.profiles (id, user_id, nome, tipo) values
  ('77000000-0000-4000-8000-000000000001','77000000-0000-4000-8000-000000000001','Autor QA gênero','autor'),
  ('77000000-0000-4000-8000-000000000002','77000000-0000-4000-8000-000000000002','Leitor QA gênero','leitor');
insert into public.preferencias_privacidade (user_id, visibilidade_biblioteca, mostrar_avaliacoes)
values ('77000000-0000-4000-8000-000000000002','publico',true);
insert into public.obras (id,user_id,titulo,autor,genero,formato,classificacao_indicativa,avisos_conteudo,tags,arquivo_url,publicado,slug,criada_em)
select ('78000000-0000-4000-8000-' || lpad(g::text,12,'0'))::uuid,
  '77000000-0000-4000-8000-000000000001','QA gênero exclusão ' || g,'Autor QA gênero',
  case g when 1 then 'Melodrama' when 2 then 'Fantasia, Romance' when 3 then 'SCI-FI espacial'
    when 4 then E'sci\t fi' when 5 then 'Ficção científica' when 6 then 'Fantasia sombria'
    when 7 then 'Cyberpunk' when 8 then 'Ação e aventura' when 9 then 'Romances' else 'Drama' end,
  'HQ',case when g = 60 then '18+' else 'Livre' end,
  case when g = 60 then array['violencia_intensa'] else '{}'::text[] end,
  case when g = 2 then array['qa-genero','bloqueada'] else array['qa-genero'] end,
  'https://example.invalid/qa.txt',g <> 59,'qa-genero-excluido-' || g,
  '2033-01-01'::timestamptz + g * interval '1 day'
from generate_series(1,60) g;
insert into public.obra_avaliacoes (obra_id,user_id,nota,visibilidade) values
  ('78000000-0000-4000-8000-000000000006','77000000-0000-4000-8000-000000000002',4.5,'publico');

set local role anon;
select is((select count(*)::integer from public.obras where id::text like '78000000-0000-4000-8000-%'),58,'fixture visível sob anon sem draft/18+');
select is((select count(*)::integer from public.listar_obras_catalogo('','','','','todos','mais-recentes',24,null,null,null,'qa-genero',null,'','drama')),9,'exclusão antes do limite encontra obras fora da primeira página');
select is((select obra_id::text from public.listar_obras_catalogo('','','','','todos','mais-recentes',1,null,null,null,'qa-genero',null,'','drama')),
  '78000000-0000-4000-8000-000000000009','primeira página filtrada');
select is((select obra_id::text from public.listar_obras_catalogo('','','','','todos','mais-recentes',1,0,'2033-01-10','78000000-0000-4000-8000-000000000009','qa-genero',null,'','drama')),
  '78000000-0000-4000-8000-000000000008','cursor sem saltos ou repetições');
select is((select count(*)::integer from public.listar_obras_catalogo('','','','','todos','mais-recentes',24,null,null,null,'qa-genero',null,'','drama') where obra_id = '78000000-0000-4000-8000-000000000001'),1,'Drama não exclui Melodrama');
select is((select count(*)::integer from public.listar_obras_catalogo('','Fantasia','','','todos','mais-recentes',24,null,null,null,'qa-genero',null,'','romance')),1,'Romance exclui Fantasia, Romance e preserva Fantasia sombria');
select is((select count(*)::integer from public.listar_obras_catalogo('','','','','todos','mais-recentes',50,null,null,null,'qa-genero',null,'','romance') where obra_id = '78000000-0000-4000-8000-000000000009'),1,'não exclui substring Romances');
select is((select count(*)::integer from public.listar_obras_catalogo('','Ficção','','','todos','mais-recentes',50,null,null,null,'qa-genero',null,'',E' FICÇÃO\t')),0,'Ficção cobre aliases e espaços no texto composto');
select results_eq(
  $$select * from public.listar_obras_catalogo('','','','','todos','mais-recentes',24,null,null,null,'qa-genero',null,'','sci-fi')$$,
  $$select * from public.listar_obras_catalogo('','','','','todos','mais-recentes',24,null,null,null,'qa-genero',null,'','ficcao')$$,'alias recebido normalizado');
select is((select count(*)::integer from public.listar_obras_catalogo('','Ação','','','todos','mais-recentes',24,null,null,null,'qa-genero',null,'','aventura')),0,'termo em gênero composto');
select is((select count(*)::integer from public.listar_obras_catalogo('','Drama','','','todos','mais-recentes',24,null,null,null,'qa-genero',null,'','drama')),0,'incluir e excluir o mesmo gênero retorna vazio legítimo');
select is((select obra_id::text from public.listar_obras_catalogo('','Fantasia','HQ','Livre','todos','mais-capitulos',24,null,null,null,'qa-genero',4.5,'bloqueada','romance')),
  '78000000-0000-4000-8000-000000000006','combina gênero, formato, tags, nota real e ordenação');
select results_eq(
  $$select * from public.listar_obras_catalogo('','','','','todos','mais-recentes',24,null,null,null,'qa-genero',null,'','')$$,
  $$select * from public.listar_obras_catalogo('','','','','todos','mais-recentes',24,null,null,null,'qa-genero',null,'')$$,'vazio preserva contrato de 13 argumentos');
select results_eq(
  $$select * from public.listar_obras_catalogo('','','','','todos','mais-recentes',24,null,null,null,'qa-genero',null,'',null)$$,
  $$select * from public.listar_obras_catalogo('','','','','todos','mais-recentes',24,null,null,null,'qa-genero',null)$$,'null preserva contrato de 12 argumentos');
select throws_ok($$select * from public.listar_obras_catalogo('','','','','todos','mais-recentes',24,null,null,null,'qa-genero',null,'','%_\,.()')$$,
  '22023','Gênero excluído inválido.','entrada não vira padrão de pesquisa');
select is((select count(*)::integer from public.listar_obras_catalogo('','','','','todos','mais-recentes',50,null,null,null,'qa-genero',null,'','romance') where obra_id in ('78000000-0000-4000-8000-000000000059','78000000-0000-4000-8000-000000000060')),0,'não amplia visibilidade ou bloqueio 18+');
select is((select count(*)::integer from public.listar_obras_catalogo('','','','','todos','mais-recentes',50,null,null,null,'qa-genero',null,'','drama') where obra_id = '78000000-0000-4000-8000-000000000007'),1,'gênero personalizado não relacionado preservado');
select ok((select tem_mais from public.listar_obras_catalogo('','','','','todos','mais-recentes',1,null,null,null,'qa-genero',null,'','drama')),'tem_mais considera somente elegíveis');
reset role;
set local role authenticated;
select is((select count(*)::integer from public.listar_obras_catalogo('','','','','todos','mais-recentes',24,null,null,null,'qa-genero',null,'','drama')),9,'authenticated mantém contrato sem elevar privilégios');
reset role;
select ok((select count(*) = 5 and bool_and(not prosecdef) from pg_proc where pronamespace = 'public'::regnamespace and proname = 'listar_obras_catalogo' and pronargs between 10 and 14),'todas as cinco variantes anteriores continuam SECURITY INVOKER');
select * from finish();
rollback;
