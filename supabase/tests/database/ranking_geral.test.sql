begin;
select plan(31);
-- Exclusivamente pgTAP em Supabase local descartavel, sem dados reais.
insert into auth.users(id)
select ('a1100000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid
from generate_series(1, 9) as i;

insert into public.profiles(id,user_id,nome,tipo)
select id,id,'QA ranking geral',case when id='a1100000-0000-4000-8000-000000000001'::uuid then 'autor' else 'leitor' end
from auth.users where id::text like 'a1100000-0000-4000-8000-%';

insert into public.preferencias_privacidade
  (user_id,visibilidade_biblioteca,mostrar_avaliacoes,perfil_privado)
select ('a1100000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  case when i=7 then 'somente_eu' else 'publico' end,
  i<>8, false
from generate_series(2,9) as i;

insert into public.obras
  (id,user_id,titulo,autor,genero,formato,classificacao_indicativa,
   avisos_conteudo,arquivo_url,publicado,slug)
select ('a1200000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid,
  'a1100000-0000-4000-8000-000000000001'::uuid,
  'QA Ranking Geral ' || i, 'QA autor','Fantasia','HQ',
  case when i=6 then '18+' else 'Livre' end,
  case when i=6 then array['violencia_intensa'] else '{}'::text[] end,
  case when i=8 then '' else 'https://example.invalid/qa.txt' end,
  i<>7, 'qa-ranking-geral-'||i
from generate_series(1,11) as i;

-- 1: apenas uma avaliacao PARCIAL autorizada anonimamente.
insert into public.obra_avaliacoes(obra_id,user_id,nota,visibilidade)
values ('a1200000-0000-4000-8000-000000000001','a1100000-0000-4000-8000-000000000002',5,'parcial');

-- 2: duas avaliacoes visiveis, duas ocultas por preferencias do leitor.
insert into public.obra_avaliacoes(obra_id,user_id,nota,visibilidade)
values
('a1200000-0000-4000-8000-000000000002','a1100000-0000-4000-8000-000000000002',4.5,'publico'),
('a1200000-0000-4000-8000-000000000002','a1100000-0000-4000-8000-000000000003',4.5,'parcial'),
('a1200000-0000-4000-8000-000000000002','a1100000-0000-4000-8000-000000000007',5,'publico'),
('a1200000-0000-4000-8000-000000000002','a1100000-0000-4000-8000-000000000008',5,'parcial');

-- 3: media 4.0 com cinco votos.
insert into public.obra_avaliacoes(obra_id,user_id,nota,visibilidade)
select 'a1200000-0000-4000-8000-000000000003'::uuid,
 ('a1100000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,
 4,'publico' from generate_series(2,6) as i;

-- 4 e 9: mesmo score e quantidade; obra 4 precede 9 pelo UUID.
insert into public.obra_avaliacoes(obra_id,user_id,nota,visibilidade)
select ('a1200000-0000-4000-8000-'||lpad(w::text,12,'0'))::uuid,
 ('a1100000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,
 5,'publico'
from (values (4),(9)) as obras(w) cross join generate_series(2,6) as i;

-- Excluidas: 5 avaliacao privada, 6 conteudo 18+, 7 draft, 8 sem conteudo.
-- 10 perfil configurado para ocultar avaliacoes, 11 sem votos.
insert into public.obra_avaliacoes(obra_id,user_id,nota,visibilidade)
values
('a1200000-0000-4000-8000-000000000005','a1100000-0000-4000-8000-000000000002',5,'privado'),
('a1200000-0000-4000-8000-000000000006','a1100000-0000-4000-8000-000000000002',5,'publico'),
('a1200000-0000-4000-8000-000000000007','a1100000-0000-4000-8000-000000000002',5,'publico'),
('a1200000-0000-4000-8000-000000000008','a1100000-0000-4000-8000-000000000002',5,'publico'),
('a1200000-0000-4000-8000-000000000010','a1100000-0000-4000-8000-000000000008',5,'publico');

select ok(to_regprocedure('public.listar_ranking_geral(uuid,text,integer)') is not null,
  'nova funcao criada');
select ok(not prosecdef and proconfig=array['search_path=""'] and provolatile='s',
  'STABLE, SECURITY INVOKER, search_path vazio')
from pg_proc where oid='public.listar_ranking_geral(uuid,text,integer)'::regprocedure;
select ok(has_function_privilege('anon','public.listar_ranking_geral(uuid,text,integer)','EXECUTE')
 and not has_function_privilege('authenticated','public.listar_ranking_geral(uuid,text,integer)','EXECUTE')
 and not exists (select 1 from pg_proc p, lateral aclexplode(p.proacl) acl
  where p.oid='public.listar_ranking_geral(uuid,text,integer)'::regprocedure
  and acl.grantee=0 and acl.privilege_type='EXECUTE'),
 'somente anon recebe EXECUTE, sem PUBLIC');
select throws_ok(
 $$select * from public.listar_ranking_geral()$$,
 '42501', 'O Ranking Geral exige contexto anonimo.',
 'proprietario SQL nao pode executar com acesso privilegiado');

-- O trigger existente permanece autoridade para autoavaliacao.
select throws_ok(
 $$insert into public.obra_avaliacoes(obra_id,user_id,nota)
   values ('a1200000-0000-4000-8000-000000000011','a1100000-0000-4000-8000-000000000001',5)$$,
 '42501','O autor nao pode avaliar a propria obra.','autor nao vota na propria obra');

select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;

select is((select count(*) from public.listar_ranking_geral()),5::bigint,
  'somente cinco obras publicas com votos efetivamente elegiveis');
select is((select nota_media from public.listar_ranking_geral()
 where obra_id='a1200000-0000-4000-8000-000000000001'),5::numeric,
 'parcial autorizada compoe media publica');
select is((select total_avaliacoes from public.listar_ranking_geral()
 where obra_id='a1200000-0000-4000-8000-000000000001'),1::bigint,
 'parcial autorizada conta um voto');
select is((select pontuacao from public.listar_ranking_geral()
 where obra_id='a1200000-0000-4000-8000-000000000001'),(35::numeric/11),
 '5.0 com 1 voto: media bayesiana exata 35/11');
select is((select pontuacao from public.listar_ranking_geral()
 where obra_id='a1200000-0000-4000-8000-000000000002'),(39::numeric/12),
 '4.5 com 2 votos visiveis, exclui preferencias ocultas');
select is((select total_avaliacoes from public.listar_ranking_geral()
 where obra_id='a1200000-0000-4000-8000-000000000002'),2::bigint,
 'nao soma votos de Biblioteca somente_eu nem mostrar_avaliacoes=false');
select is((select pontuacao from public.listar_ranking_geral()
 where obra_id='a1200000-0000-4000-8000-000000000003'),(50::numeric/15),
 '4.0 com 5 votos: media bayesiana exata 50/15');
select is((select pontuacao from public.listar_ranking_geral()
 where obra_id='a1200000-0000-4000-8000-000000000004'),(55::numeric/15),
 '5.0 com 5 votos: media bayesiana exata 55/15');
select is((select count(*) from public.listar_ranking_geral()
 where obra_id in (
 'a1200000-0000-4000-8000-000000000005',
 'a1200000-0000-4000-8000-000000000006',
 'a1200000-0000-4000-8000-000000000007',
 'a1200000-0000-4000-8000-000000000008',
 'a1200000-0000-4000-8000-000000000010',
 'a1200000-0000-4000-8000-000000000011')),0::bigint,
 'privado, 18+, draft, sem conteudo, preferencias ocultas ou sem voto nao aparecem');
select results_eq(
 $$select right(obra_id::text,12) from public.listar_ranking_geral() order by posicao$$,
 $$values ('000000000004'),('000000000009'),('000000000003'),
          ('000000000002'),('000000000001')$$,
 'posicoes por score, quantidade e UUID');
select is((select posicao from public.listar_ranking_geral()
 where obra_id='a1200000-0000-4000-8000-000000000009'),2::bigint,
 'empate exato respeita UUID crescente');
select is((select count(*) from public.listar_ranking_geral(null,null,2)),2::bigint,
 'primeira pagina tem tamanho solicitado');
select is((select bool_and(tem_mais) from public.listar_ranking_geral(null,null,2)),true,
 'primeira pagina informa mais resultados');
select is((select count(distinct assinatura) from public.listar_ranking_geral(null,null,2)),1::bigint,
 'paginas compartilham assinatura global');
select is((with primeira as (
 select assinatura from public.listar_ranking_geral(null,null,2) limit 1
) select count(*) from primeira, lateral public.listar_ranking_geral(
 'a1200000-0000-4000-8000-000000000009',primeira.assinatura,2) as pagina
 where pagina.estado='ok'),2::bigint,
 'segunda pagina retorna 2 obras com assinatura atual');
select is((with primeira as (
 select assinatura from public.listar_ranking_geral(null,null,2) limit 1
) select count(*) from primeira, lateral public.listar_ranking_geral(
 'a1200000-0000-4000-8000-000000000002',primeira.assinatura,2) as pagina
 where pagina.estado='ok' and pagina.tem_mais=false),1::bigint,
 'ultima pagina tem 1 obra e informa fim');
select throws_ok($$select * from public.listar_ranking_geral(null,null,0)$$,
 '22023','Limite do Ranking Geral invalido.','limite 0 recusado');
select throws_ok($$select * from public.listar_ranking_geral(null,null,51)$$,
 '22023','Limite do Ranking Geral invalido.','limite maior que 50 recusado');
select throws_ok(
 $$select * from public.listar_ranking_geral('a1200000-0000-4000-8000-000000000004',null,20)$$,
 '22023','Cursor do Ranking Geral invalido.','cursor sem assinatura recusado');
select throws_ok(
 $$select * from public.listar_ranking_geral(null,'0123456789abcdef0123456789abcdef',20)$$,
 '22023','Cursor do Ranking Geral invalido.','assinatura sem cursor recusada');
select throws_ok(
 $$select * from public.listar_ranking_geral('a1200000-0000-4000-8000-000000000004','x',20)$$,
 '22023','Cursor do Ranking Geral invalido.','assinatura malformada recusada');

-- Guardar assinatura inicial; em seguida alterar votacao e preferencias.
reset role;
create temp table qa_ranking_assinatura(assinatura text);
grant select, insert on qa_ranking_assinatura to anon;
-- A funcao exige anon: salvar diretamente a assinatura em um bloco anon.
set local role anon;
insert into qa_ranking_assinatura
select assinatura from public.listar_ranking_geral(null,null,2) limit 1;
reset role;

-- Uma edicao valida de nota troca a posicao, sem criar outra avaliacao.
update public.obra_avaliacoes set nota=1
where obra_id='a1200000-0000-4000-8000-000000000004'
  and user_id='a1100000-0000-4000-8000-000000000002';

select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
select is((select estado from qa_ranking_assinatura as antiga,
 lateral public.listar_ranking_geral(
 'a1200000-0000-4000-8000-000000000009',antiga.assinatura,2) as nova),
 'cursor_desatualizado'::text,'mudanca de voto invalida cursor');
select is((select count(*) from qa_ranking_assinatura as antiga,
 lateral public.listar_ranking_geral(
 'a1200000-0000-4000-8000-000000000009',antiga.assinatura,2) as nova
 where nova.obra_id is not null),0::bigint,
 'cursor obsoleto nao entrega pagina silenciosamente');
select is((select obra_id from public.listar_ranking_geral(null,null,1)),
 'a1200000-0000-4000-8000-000000000009'::uuid,
 'classificacao nova apos edicao de nota');

-- Revogacao de preferencia deve remover parcial legitimamente publica.
reset role;
update public.preferencias_privacidade set mostrar_avaliacoes=false
where user_id='a1100000-0000-4000-8000-000000000002';
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
select is((select count(*) from public.listar_ranking_geral()
 where obra_id='a1200000-0000-4000-8000-000000000001'),0::bigint,
 'revogacao remove obra com unica avaliacao parcial');
select is((select estado from qa_ranking_assinatura as antiga,
 lateral public.listar_ranking_geral(
 'a1200000-0000-4000-8000-000000000009',antiga.assinatura,2) as nova),
 'cursor_desatualizado'::text,'revogacao tambem invalida o cursor');
reset role;

select * from finish();
rollback;
