begin;
select plan(26);
-- SQL regression for the corrective DRAFT; all data is synthetic/rolled back.
insert into auth.users(id)
select ('b9100000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid
from generate_series(1,4) i;
insert into public.profiles(id,user_id,nome,tipo)
select id,id,'QA paginado',case when right(id::text,12)='000000000001'
 then 'autor' else 'leitor' end
from auth.users where id::text like 'b9100000-0000-4000-8000-%';
insert into public.preferencias_privacidade
  (user_id,visibilidade_biblioteca,mostrar_avaliacoes,perfil_privado)
select ('b9100000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,
  case when i=4 then 'somente_eu' else 'publico' end,true,false
from generate_series(2,4) i;
insert into public.obras
  (id,user_id,titulo,autor,genero,formato,classificacao_indicativa,
   avisos_conteudo,publicado,arquivo_url,slug)
select ('b9200000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,
  'b9100000-0000-4000-8000-000000000001'::uuid,
  'QA nucleo paginado '||i,'QA autor','Fantasia','HQ',
  case when i=3 then '18+' else 'Livre' end,
  case when i=3 then array['violencia_intensa']::text[] else '{}'::text[] end,
  true,'https://example.invalid/test.txt','qa-nucleo-'||i
from generate_series(1,3) i;
insert into public.obra_avaliacoes(obra_id,user_id,nota,visibilidade)
values
 ('b9200000-0000-4000-8000-000000000001','b9100000-0000-4000-8000-000000000002',5,'parcial'),
 ('b9200000-0000-4000-8000-000000000001','b9100000-0000-4000-8000-000000000003',4.5,'publico'),
 ('b9200000-0000-4000-8000-000000000001','b9100000-0000-4000-8000-000000000004',5,'publico'),
 ('b9200000-0000-4000-8000-000000000002','b9100000-0000-4000-8000-000000000002',5,'privado'),
 ('b9200000-0000-4000-8000-000000000003','b9100000-0000-4000-8000-000000000002',5,'publico');

select ok((select not prosecdef and provolatile='s'
  and proconfig=array['search_path=""']
  from pg_proc where oid='public.listar_ranking_geral(uuid,text,integer)'::regprocedure),
  'RPC publica continua STABLE SECURITY INVOKER');
select ok((select prosecdef and provolatile='s'
  and proowner='postgres'::regrole and proconfig=array['search_path=""']
  from pg_proc where oid='historietas_privado.listar_ranking_geral_nucleo(uuid,text,integer)'::regprocedure),
  'nucleo privado STABLE DEFINER com owner postgres e search_path fixo');
select ok(has_function_privilege('anon',
    'historietas_privado.listar_ranking_geral_nucleo(uuid,text,integer)','EXECUTE')
  and not has_function_privilege('authenticated',
    'historietas_privado.listar_ranking_geral_nucleo(uuid,text,integer)','EXECUTE')
  and not has_function_privilege('service_role',
    'historietas_privado.listar_ranking_geral_nucleo(uuid,text,integer)','EXECUTE'),
  'EXECUTE do nucleo estritamente anon');
select ok(not exists (select 1 from pg_proc p,
   lateral aclexplode(p.proacl) acl
   where p.oid='historietas_privado.listar_ranking_geral_nucleo(uuid,text,integer)'::regprocedure
     and acl.grantee=0 and acl.privilege_type='EXECUTE'),
  'nenhum EXECUTE herdado de PUBLIC');
select ok(has_function_privilege('anon',
  'public.listar_ranking_geral(uuid,text,integer)','EXECUTE')
  and not has_function_privilege('authenticated',
  'public.listar_ranking_geral(uuid,text,integer)','EXECUTE'),
  'ACL da RPC publica preservada');
select ok(pg_get_function_result(
  'historietas_privado.listar_ranking_geral_nucleo(uuid,text,integer)'::regprocedure
  ) not like '%user_id%'
  and pg_get_function_result(
  'historietas_privado.listar_ranking_geral_nucleo(uuid,text,integer)'::regprocedure
  ) not like '%soma numeric%',
  'retorno da funcao privada nao revela UUID de votante nem soma bruta');
select throws_ok(
 $$select * from historietas_privado.listar_ranking_geral_nucleo(null,null,20)$$,
 '42501','O Ranking Geral exige contexto anonimo.',
 'postgres nao pode invocar nucleo sem assumir papel anon');
select throws_ok(
 $$select * from public.listar_ranking_geral(null,null,20)$$,
 '42501','O Ranking Geral exige contexto anonimo.',
 'postgres nao pode invocar RPC como contexto privilegiado');

select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;

select is((select count(*) from public.listar_ranking_geral()),1::bigint,
 'somente obra publica com votos publicamente elegiveis');
select is((select total_avaliacoes from public.listar_ranking_geral()),2::bigint,
 'voto parcial permitido e publico; privada ou Biblioteca fechada excluida');
select is((select nota_media from public.listar_ranking_geral()),4.75::numeric,
 'media publica continua exata');
select is((select count(*) from public.listar_ranking_geral()
   where obra_id='b9200000-0000-4000-8000-000000000003'),0::bigint,
 '18+ nao e divulgado');
select results_eq(
 $$select row_to_json(r)::text from public.listar_ranking_geral(null,null,20) r$$,
 $$select row_to_json(r)::text from historietas_privado.listar_ranking_geral_nucleo(null,null,20) r$$,
 'chamada SQL direta equivale exatamente a pagina publica');
select throws_ok(
 $$select * from historietas_privado.listar_ranking_geral_nucleo(null,null,51)$$,
 '22023','Limite do Ranking Geral invalido.',
 'nucleo privado nao permite pagina acima do teto');
select set_config('request.jwt.claim.sub','b9100000-0000-4000-8000-000000000002',true);
select throws_ok(
 $$select * from historietas_privado.listar_ranking_geral_nucleo(null,null,20)$$,
 '42501','O Ranking Geral exige contexto anonimo.',
 'JWT com identidade nao consegue acessar nucleo mesmo sob papel anon');
reset role;
select set_config('request.jwt.claim.sub','',true);
create temp table qa_nucleo_cursor(obra uuid,assinatura text);
grant select,insert on qa_nucleo_cursor to anon;
set local role anon;
insert into qa_nucleo_cursor
select obra_id,assinatura from public.listar_ranking_geral(null,null,20) limit 1;
reset role;
update public.preferencias_privacidade set mostrar_avaliacoes=false
where user_id='b9100000-0000-4000-8000-000000000002';
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
select is((select estado from qa_nucleo_cursor as old_cursor,
 lateral public.listar_ranking_geral(old_cursor.obra,old_cursor.assinatura,20) as new_page),
 'cursor_desatualizado'::text,'revogacao invalida cursor da RPC');
select is((select total_avaliacoes from public.listar_ranking_geral()),1::bigint,
 'revogacao retira apenas voto do usuario revogado');

reset role;
-- Selo de auditoria nao oferece acesso direto a anon.
select ok(not has_function_privilege('anon',
  'historietas_privado.ranking_geral_assinatura_acesso()','EXECUTE'),
  'anon nao executa diretamente o gerador do selo RLS');
select ok(not has_table_privilege('anon',
  'historietas_privado.ranking_geral_selo_acesso','SELECT'),
  'anon nao consulta o registro privado do selo RLS');

-- Uma policy NOVA e permissiva deve invalidar o selo imediatamente.
create policy qa_ranking_drift_rejeitado
on public.obra_avaliacoes for select to anon using (true);
select set_config('request.jwt.claim.sub','',true);
set local role anon;
select throws_ok(
 $$select * from public.listar_ranking_geral(null,null,20)$$,
 '42501','Ranking Geral bloqueado por divergencia nas regras de acesso.',
 'policy anon criada apos migration deve bloquear o nucleo privilegiado');
reset role;
drop policy qa_ranking_drift_rejeitado on public.obra_avaliacoes;

-- Edicao da helper de privacidade tambem deve bloquear ate nova auditoria.
alter function public.usuario_pode_ver_aba_perfil(uuid,text) volatile;
select set_config('request.jwt.claim.sub','',true);
set local role anon;
select throws_ok(
 $$select * from public.listar_ranking_geral(null,null,20)$$,
 '42501','Ranking Geral bloqueado por divergencia nas regras de acesso.',
 'mudanca posterior de helper autorizadora bloqueia o ranking');
reset role;
alter function public.usuario_pode_ver_aba_perfil(uuid,text) stable;

select set_config('request.jwt.claim.sub','',true);
set local role anon;
select is((select total_avaliacoes from public.listar_ranking_geral()),1::bigint,
 'restaurar policies e helper restaura a permissao de leitura');
reset role;

-- Changes in the real private cores must invalidate the seal too, even when
-- their public wrappers stay byte-for-byte unchanged. Restore exact DDL.
create temp table qa_ranking_private_helper_ddl(signature text primary key, ddl text);
insert into qa_ranking_private_helper_ddl
select signature, pg_get_functiondef(signature::regprocedure)
from (values
  ('historietas_privado.usuario_pode_ver_aba_perfil(uuid,text)'),
  ('historietas_privado.usuarios_possuem_bloqueio(uuid,uuid)')
) helpers(signature);

create or replace function historietas_privado.usuario_pode_ver_aba_perfil(
  p_user_id uuid, p_visibilidade text
) returns boolean language sql stable security definer set search_path = ''
as $drift$ select true; $drift$;
set local role anon;
select throws_ok(
 $$select * from public.listar_ranking_geral(null,null,20)$$,
 '42501','Ranking Geral bloqueado por divergencia nas regras de acesso.',
 'alterar corpo do nucleo privado de perfil bloqueia o ranking');
reset role;
do $restore$
begin
  execute (select ddl from qa_ranking_private_helper_ddl
    where signature='historietas_privado.usuario_pode_ver_aba_perfil(uuid,text)');
end $restore$;
set local role anon;
select is((select total_avaliacoes from public.listar_ranking_geral()),1::bigint,
 'restaurar nucleo privado de perfil restaura leitura');
reset role;

create or replace function historietas_privado.usuarios_possuem_bloqueio(
  p_usuario_a uuid, p_usuario_b uuid
) returns boolean language sql stable security definer set search_path = ''
as $drift$ select false; $drift$;
set local role anon;
select throws_ok(
 $$select * from public.listar_ranking_geral(null,null,20)$$,
 '42501','Ranking Geral bloqueado por divergencia nas regras de acesso.',
 'alterar corpo do nucleo privado de bloqueios bloqueia o ranking');
reset role;
do $restore$
begin
  execute (select ddl from qa_ranking_private_helper_ddl
    where signature='historietas_privado.usuarios_possuem_bloqueio(uuid,uuid)');
end $restore$;
set local role anon;
select is((select total_avaliacoes from public.listar_ranking_geral()),1::bigint,
 'restaurar nucleo privado de bloqueios restaura leitura');
reset role;

select * from finish();
rollback;
