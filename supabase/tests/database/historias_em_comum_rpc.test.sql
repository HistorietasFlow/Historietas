begin;
select plan(46);

-- Auth sintético; CREATE e SQL ocorrem exclusivamente no banco local descartável.

-- Os registros da fixture sao sinteticos e revertidos por ROLLBACK.
insert into auth.users(id) values
 ('cd100000-0000-4000-8000-000000000001'),('cd100000-0000-4000-8000-000000000002'),('cd100000-0000-4000-8000-000000000003'),('cd100000-0000-4000-8000-000000000004');
insert into public.profiles(id,user_id,nome,tipo)
select id,id,'QA historias em comum',case when id='cd100000-0000-4000-8000-000000000004' then 'autor' else 'leitor' end
from auth.users where id in ('cd100000-0000-4000-8000-000000000001','cd100000-0000-4000-8000-000000000002','cd100000-0000-4000-8000-000000000003','cd100000-0000-4000-8000-000000000004');

insert into public.preferencias_privacidade(user_id,visibilidade_biblioteca,mostrar_favoritos,perfil_privado)
values ('cd100000-0000-4000-8000-000000000001','publico',true,false),('cd100000-0000-4000-8000-000000000002','publico',true,false),('cd100000-0000-4000-8000-000000000003','publico',true,false);

select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000004',true);
select public.aceitar_termos_publicacao('2026-08-05','2026-08-05','2026-08-05');

insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,avisos_conteudo,publicado,slug)
select ('cd200000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid, 'cd100000-0000-4000-8000-000000000004',
 'QA comum '||n,'Autor QA','Fantasia','Romance',
 case when n=6 then '18+' else 'Livre' end,
 case when n=6 then array['violencia_intensa'] else '{}'::text[] end,
 n <> 5, 'qa-historias-em-comum-'||n
from generate_series(1,8) n;

insert into public.favoritos(user_id,obra_id,visibilidade)
select 'cd100000-0000-4000-8000-000000000001',('cd200000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
 case when n=2 then 'parcial' when n=4 then 'privado' else 'publico' end
from generate_series(1,8) n;
insert into public.favoritos(user_id,obra_id,visibilidade)
select 'cd100000-0000-4000-8000-000000000002',('cd200000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
 case when n=3 then 'parcial' else 'publico' end
from generate_series(1,7) n;
insert into public.favoritos(user_id,obra_id,visibilidade) values
 ('cd100000-0000-4000-8000-000000000003','cd200000-0000-4000-8000-000000000008','publico');

reset role;

select ok(to_regprocedure('public.listar_historias_em_comum(uuid,uuid,integer)') is not null,'RPC instalada');

select ok(has_function_privilege('authenticated','public.listar_historias_em_comum(uuid,uuid,integer)','EXECUTE'),'RPC permitida a authenticated');

select ok(not has_function_privilege('anon','public.listar_historias_em_comum(uuid,uuid,integer)','EXECUTE'),'RPC negada ao anonimo');

select ok(not has_function_privilege('service_role','public.listar_historias_em_comum(uuid,uuid,integer)','EXECUTE'),'RPC nao concede EXECUTE a service_role');

select ok(not (select prosecdef from pg_proc where oid='public.listar_historias_em_comum(uuid,uuid,integer)'::regprocedure),'RPC e SECURITY INVOKER');

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000002'::uuid)),2::bigint,'apenas dois favoritos publicos em obras elegiveis');

select is((select min(obra_id::text) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000002'))::text,'cd200000-0000-4000-8000-000000000001','primeira obra elegivel');

select is((select max(obra_id::text) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000002'))::text,'cd200000-0000-4000-8000-000000000007','segunda obra elegivel');

select is((select titulo from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000002') where obra_id='cd200000-0000-4000-8000-000000000001')::text,'QA comum 1','titulo publico devolvido');

select is((select obra_id::text from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000002',null,1))::text,'cd200000-0000-4000-8000-000000000001','primeira pagina com limite um');

select is((select obra_id::text from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000002','cd200000-0000-4000-8000-000000000001',1))::text,'cd200000-0000-4000-8000-000000000007','cursor retorna item seguinte');

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000002'::uuid,'cd200000-0000-4000-8000-000000000007'::uuid,12)),0::bigint,'cursor apos ultimo item nao revela contagem total');

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000002'::uuid,null::uuid,0)),0::bigint,'limite zero falha fechado');

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000002'::uuid,null::uuid,21)),0::bigint,'limite excessivo falha fechado');

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000001'::uuid)),0::bigint,'proprio perfil nao tem comparacao');

select is((select count(*) from public.listar_historias_em_comum(null::uuid)),0::bigint,'alvo nulo falha fechado');

select is((select count(*) from public.favoritos where user_id='cd100000-0000-4000-8000-000000000001'),8::bigint,'proprietario conserva seus favoritos privados, draft e 18+');

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000001'::uuid)),2::bigint,'consulta reciproca B A');

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000003',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000003","role":"authenticated"}',true);
set local role authenticated;

select is((select obra_id::text from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000001'))::text,'cd200000-0000-4000-8000-000000000008','terceiro so consulta sua propria intersecao com A');

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000002'::uuid)),0::bigint,'terceiro nao consegue consultar o par A B');

reset role; update public.preferencias_privacidade set visibilidade_biblioteca = 'somente_eu' where user_id='cd100000-0000-4000-8000-000000000001';

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000002'::uuid)),0::bigint,'biblioteca propria oculta impede divulgacao');

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000001'::uuid)),0::bigint,'biblioteca do outro oculta impede divulgacao');

reset role; update public.preferencias_privacidade set visibilidade_biblioteca = 'publico' where user_id='cd100000-0000-4000-8000-000000000001';

reset role; update public.preferencias_privacidade set mostrar_favoritos = false where user_id='cd100000-0000-4000-8000-000000000001';

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000002'::uuid)),0::bigint,'categoria propria oculta impede divulgacao');

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000001'::uuid)),0::bigint,'categoria do outro oculta impede divulgacao');

reset role; update public.preferencias_privacidade set mostrar_favoritos = true where user_id='cd100000-0000-4000-8000-000000000001';

reset role; update public.preferencias_privacidade set perfil_privado = true where user_id='cd100000-0000-4000-8000-000000000001';

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000002'::uuid)),0::bigint,'perfil privado do solicitante impede divulgacao');

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000001'::uuid)),0::bigint,'perfil privado do visitado impede divulgacao');

reset role; update public.preferencias_privacidade set perfil_privado = false where user_id='cd100000-0000-4000-8000-000000000001';

reset role; update public.preferencias_privacidade set visibilidade_biblioteca = 'somente_eu' where user_id='cd100000-0000-4000-8000-000000000002';

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000002'::uuid)),0::bigint,'biblioteca do outro somente eu sem owner bypass');

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000001'::uuid)),0::bigint,'biblioteca propria somente eu sem owner bypass');

reset role; update public.preferencias_privacidade set visibilidade_biblioteca = 'publico' where user_id='cd100000-0000-4000-8000-000000000002';

reset role; update public.preferencias_privacidade set mostrar_favoritos = false where user_id='cd100000-0000-4000-8000-000000000002';

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000002'::uuid)),0::bigint,'categoria do outro desligada');

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000001'::uuid)),0::bigint,'categoria propria desligada');

reset role; update public.preferencias_privacidade set mostrar_favoritos = true where user_id='cd100000-0000-4000-8000-000000000002';

reset role; update public.preferencias_privacidade set perfil_privado = true where user_id='cd100000-0000-4000-8000-000000000002';

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000002'::uuid)),0::bigint,'perfil privado do outro');

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000001'::uuid)),0::bigint,'perfil proprio privado');

reset role; update public.preferencias_privacidade set perfil_privado = false where user_id='cd100000-0000-4000-8000-000000000002';

reset role; update public.preferencias_privacidade set visibilidade_biblioteca = 'seguidores' where user_id='cd100000-0000-4000-8000-000000000002';

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000002'::uuid)),0::bigint,'biblioteca somente para seguidores nao e divulgacao publica');

reset role; update public.preferencias_privacidade set visibilidade_biblioteca = 'publico' where user_id='cd100000-0000-4000-8000-000000000002';

reset role; insert into public.usuarios_bloqueados(bloqueador_id,bloqueado_id) values ('cd100000-0000-4000-8000-000000000001','cd100000-0000-4000-8000-000000000002');

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000002'::uuid)),0::bigint,'bloqueio A para B oculta em A');

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000001'::uuid)),0::bigint,'bloqueio A para B oculta em B');

reset role; delete from public.usuarios_bloqueados where bloqueador_id='cd100000-0000-4000-8000-000000000001' and bloqueado_id='cd100000-0000-4000-8000-000000000002';
insert into public.usuarios_bloqueados(bloqueador_id,bloqueado_id) values ('cd100000-0000-4000-8000-000000000002','cd100000-0000-4000-8000-000000000001');

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000002'::uuid)),0::bigint,'bloqueio B para A oculta em A');

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000001'::uuid)),0::bigint,'bloqueio B para A oculta em B');

reset role; delete from public.usuarios_bloqueados where bloqueador_id='cd100000-0000-4000-8000-000000000002' and bloqueado_id='cd100000-0000-4000-8000-000000000001';

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000002'::uuid)),2::bigint,'desbloqueio revalida resultados sem cache');

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;

delete from public.favoritos where user_id='cd100000-0000-4000-8000-000000000002' and obra_id='cd200000-0000-4000-8000-000000000001';

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000002'::uuid)),1::bigint,'remocao de favorito B revoga imediatamente');

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;

insert into public.favoritos(user_id,obra_id,visibilidade) values ('cd100000-0000-4000-8000-000000000002','cd200000-0000-4000-8000-000000000001','privado');

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000002'::uuid)),1::bigint,'favorito privado de B nao pode reaparecer');

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;

delete from public.favoritos where user_id='cd100000-0000-4000-8000-000000000002' and obra_id='cd200000-0000-4000-8000-000000000001';
insert into public.favoritos(user_id,obra_id,visibilidade) values ('cd100000-0000-4000-8000-000000000002','cd200000-0000-4000-8000-000000000001','publico');

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000002'::uuid)),2::bigint,'retorno a publico reapresenta obra elegivel');

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;

delete from public.favoritos where user_id='cd100000-0000-4000-8000-000000000001' and obra_id='cd200000-0000-4000-8000-000000000007';
insert into public.favoritos(user_id,obra_id,visibilidade) values ('cd100000-0000-4000-8000-000000000001','cd200000-0000-4000-8000-000000000007','parcial');

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000002'::uuid)),1::bigint,'favorito parcial proprio nao pode entrar na intersecao');

delete from public.favoritos where user_id='cd100000-0000-4000-8000-000000000001' and obra_id='cd200000-0000-4000-8000-000000000007';
insert into public.favoritos(user_id,obra_id,visibilidade) values ('cd100000-0000-4000-8000-000000000001','cd200000-0000-4000-8000-000000000007','publico');

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000002'::uuid)),2::bigint,'revogacao restaurada via escrita autenticada');

reset role; update public.obras set publicado=false where id='cd200000-0000-4000-8000-000000000001';

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000002'::uuid)),1::bigint,'despublicacao revoga imediatamente');

reset role; update public.obras set publicado=true where id='cd200000-0000-4000-8000-000000000001';

reset role; update public.obras set classificacao_indicativa='18+', avisos_conteudo=array['violencia_intensa'] where id='cd200000-0000-4000-8000-000000000007';

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000002'::uuid)),1::bigint,'classificacao 18+ revoga imediatamente');

reset role; update public.obras set classificacao_indicativa='Livre', avisos_conteudo='{}'::text[] where id='cd200000-0000-4000-8000-000000000007';

reset role;
select set_config('request.jwt.claim.sub','cd100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"cd100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;

select is((select count(*) from public.listar_historias_em_comum('cd100000-0000-4000-8000-000000000002'::uuid)),2::bigint,'somente obras publicas sao reintroduzidas');

reset role;
select * from finish();
rollback;
