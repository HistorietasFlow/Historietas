begin;
select plan(20);

-- Permissões efetivas do limitador usado antes de assinar o arquivo.
select is(
  has_function_privilege(papel, assinatura, 'EXECUTE'),
  papel = 'service_role' and rpc_publica,
  format('EXECUTE de %s sobre %s', papel, assinatura)
)
from (values ('anon'), ('authenticated'), ('service_role')) as papeis(papel)
cross join (values
  ('public.consumir_limite_requisicao(text,text,integer,integer,integer)', true),
  ('historietas_privado.consumir_limite_requisicao(text,text,integer,integer,integer)', false)
) as funcoes(assinatura, rpc_publica)
order by papel, assinatura;

insert into auth.users(id) values ('d9110000-0000-4000-8000-000000000001'), ('d9110000-0000-4000-8000-000000000002');
set local request.jwt.claim.sub = 'd9110000-0000-4000-8000-000000000001';
select public.aceitar_termos_publicacao('2026-08-05','2026-08-05','2026-08-05');
set local request.jwt.claim.sub = '';
insert into public.obras(id,user_id,titulo,autor,genero,formato,slug,publicado,classificacao_indicativa,arquivo_url)
values ('d9120000-0000-4000-8000-000000000001','d9110000-0000-4000-8000-000000000001',
  'Obra fictícia','Autora fictícia','Fantasia','Romance','obra-ficticia-leitura-arquivo',true,'Livre',
  'd9110000-0000-4000-8000-000000000001/arquivo.txt');
insert into auth.sessions(id,user_id) values
  ('d9130000-0000-4000-8000-000000000001','d9110000-0000-4000-8000-000000000001'),
  ('d9130000-0000-4000-8000-000000000002','d9110000-0000-4000-8000-000000000002');
insert into public.preferencias_privacidade(user_id, perfil_privado, visibilidade_obras)
  values ('d9110000-0000-4000-8000-000000000001',false,'publico')
  on conflict (user_id) do update set perfil_privado=false, visibilidade_obras='publico';

select ok(not has_function_privilege('service_role','public.autorizar_leitura_arquivo_obra(uuid,uuid,text)','EXECUTE'), 'service role não é papel leitor');
set local role anon;
select ok(public.autorizar_leitura_arquivo_obra('d9120000-0000-4000-8000-000000000001','d9110000-0000-4000-8000-000000000001',encode(sha256(convert_to('d9110000-0000-4000-8000-000000000001/arquivo.txt','UTF8')),'hex')), 'visitante pode ler obra pública');
reset role;
set local request.jwt.claim.sub = 'd9110000-0000-4000-8000-000000000002';
set local request.jwt.claims = '{"session_id":"d9130000-0000-4000-8000-000000000002"}';
set local role authenticated;
select ok(public.autorizar_leitura_arquivo_obra('d9120000-0000-4000-8000-000000000001','d9110000-0000-4000-8000-000000000001',encode(sha256(convert_to('d9110000-0000-4000-8000-000000000001/arquivo.txt','UTF8')),'hex')), 'leitor autenticado autorizado');
select ok(not public.autorizar_leitura_arquivo_obra('d9120000-0000-4000-8000-000000000001','d9110000-0000-4000-8000-000000000002',encode(sha256(convert_to('d9110000-0000-4000-8000-000000000001/arquivo.txt','UTF8')),'hex')), 'recusa proprietário divergente');
reset role;

set local request.jwt.claim.sub = 'd9110000-0000-4000-8000-000000000001';
update public.obras set arquivo_url='d9110000-0000-4000-8000-000000000001/outro.txt'
  where id='d9120000-0000-4000-8000-000000000001';
set local request.jwt.claim.sub = 'd9110000-0000-4000-8000-000000000002';
set local role authenticated;
select ok(not public.autorizar_leitura_arquivo_obra('d9120000-0000-4000-8000-000000000001',
  'd9110000-0000-4000-8000-000000000001',encode(sha256(convert_to(
  'd9110000-0000-4000-8000-000000000001/arquivo.txt','UTF8')),'hex')), 'referência substituída antes da assinatura');
reset role;
set local request.jwt.claim.sub = 'd9110000-0000-4000-8000-000000000001';
update public.obras set arquivo_url='d9110000-0000-4000-8000-000000000001/arquivo.txt'
  where id='d9120000-0000-4000-8000-000000000001';
set local request.jwt.claim.sub = 'd9110000-0000-4000-8000-000000000002';
update public.preferencias_privacidade set perfil_privado=true where user_id='d9110000-0000-4000-8000-000000000001';
set local role authenticated;
select ok(not public.autorizar_leitura_arquivo_obra('d9120000-0000-4000-8000-000000000001','d9110000-0000-4000-8000-000000000001',encode(sha256(convert_to('d9110000-0000-4000-8000-000000000001/arquivo.txt','UTF8')),'hex')), 'privacidade do perfil reavaliada');
reset role;
update public.preferencias_privacidade set perfil_privado=false,visibilidade_obras='somente_eu' where user_id='d9110000-0000-4000-8000-000000000001';
set local role authenticated;
select ok(not public.autorizar_leitura_arquivo_obra('d9120000-0000-4000-8000-000000000001','d9110000-0000-4000-8000-000000000001',encode(sha256(convert_to('d9110000-0000-4000-8000-000000000001/arquivo.txt','UTF8')),'hex')), 'aba Obras reavaliada');
reset role;
update public.preferencias_privacidade set visibilidade_obras='publico' where user_id='d9110000-0000-4000-8000-000000000001';
insert into public.usuarios_bloqueados (bloqueador_id,bloqueado_id)
  values ('d9110000-0000-4000-8000-000000000001','d9110000-0000-4000-8000-000000000002');
set local role authenticated;
select ok(not public.autorizar_leitura_arquivo_obra('d9120000-0000-4000-8000-000000000001','d9110000-0000-4000-8000-000000000001',encode(sha256(convert_to('d9110000-0000-4000-8000-000000000001/arquivo.txt','UTF8')),'hex')), 'autor bloqueou leitor');
reset role;
delete from public.usuarios_bloqueados where bloqueador_id='d9110000-0000-4000-8000-000000000001' and bloqueado_id='d9110000-0000-4000-8000-000000000002';
insert into public.usuarios_bloqueados (bloqueador_id,bloqueado_id)
  values ('d9110000-0000-4000-8000-000000000002','d9110000-0000-4000-8000-000000000001');
set local role authenticated;
select ok(not public.autorizar_leitura_arquivo_obra('d9120000-0000-4000-8000-000000000001','d9110000-0000-4000-8000-000000000001',encode(sha256(convert_to('d9110000-0000-4000-8000-000000000001/arquivo.txt','UTF8')),'hex')), 'leitor bloqueou autor');
reset role;
delete from public.usuarios_bloqueados where bloqueador_id='d9110000-0000-4000-8000-000000000002' and bloqueado_id='d9110000-0000-4000-8000-000000000001';
set local request.jwt.claim.sub = 'd9110000-0000-4000-8000-000000000001';
update public.obras set publicado=false where id='d9120000-0000-4000-8000-000000000001';
set local request.jwt.claim.sub = 'd9110000-0000-4000-8000-000000000002';
set local role authenticated;
select ok(not public.autorizar_leitura_arquivo_obra('d9120000-0000-4000-8000-000000000001','d9110000-0000-4000-8000-000000000001',encode(sha256(convert_to('d9110000-0000-4000-8000-000000000001/arquivo.txt','UTF8')),'hex')), 'retirada de publicação reavaliada');
reset role;
set local request.jwt.claim.sub = 'd9110000-0000-4000-8000-000000000001';
update public.obras set publicado=true,classificacao_indicativa='18+',avisos_conteudo=array['terror'] where id='d9120000-0000-4000-8000-000000000001';
set local request.jwt.claim.sub = 'd9110000-0000-4000-8000-000000000002';
set local role authenticated;
select ok(not public.autorizar_leitura_arquivo_obra('d9120000-0000-4000-8000-000000000001','d9110000-0000-4000-8000-000000000001',encode(sha256(convert_to('d9110000-0000-4000-8000-000000000001/arquivo.txt','UTF8')),'hex')), 'classificação 18+ recusada');
reset role;

delete from auth.sessions where id='d9130000-0000-4000-8000-000000000002';
set local role authenticated;
select throws_ok($$select public.autorizar_leitura_arquivo_obra('d9120000-0000-4000-8000-000000000001','d9110000-0000-4000-8000-000000000001',encode(sha256(convert_to('d9110000-0000-4000-8000-000000000001/arquivo.txt','UTF8')),'hex'))$$, 'PT401','Sessão inválida.','sessão revogada recusada');
reset role;
set local request.jwt.claim.sub = 'd9110000-0000-4000-8000-000000000001';
set local request.jwt.claims = '{"session_id":"d9130000-0000-4000-8000-000000000001"}';
set local role authenticated;
select ok(public.autorizar_leitura_arquivo_obra('d9120000-0000-4000-8000-000000000001','d9110000-0000-4000-8000-000000000001',encode(sha256(convert_to('d9110000-0000-4000-8000-000000000001/arquivo.txt','UTF8')),'hex')), 'titular mantém acesso a obra 18+');
set local request.jwt.claims = '{"session_id":"não-é-uuid"}';
select throws_ok($$select public.autorizar_leitura_arquivo_obra('d9120000-0000-4000-8000-000000000001','d9110000-0000-4000-8000-000000000001',encode(sha256(convert_to('d9110000-0000-4000-8000-000000000001/arquivo.txt','UTF8')),'hex'))$$, 'PT401','Sessão inválida.','sessão inválida do titular também recusada');
reset role;
select * from finish();
rollback;
