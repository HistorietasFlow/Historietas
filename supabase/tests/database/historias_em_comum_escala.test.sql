begin;
select plan(9);
-- 1.003 obras públicas sintéticas para proteger a paginação da RPC.
-- Nunca acessar dados de usuários reais; tudo é revertido por ROLLBACK.
insert into auth.users(id) values
('ce100000-0000-4000-8000-000000000001'),
('ce100000-0000-4000-8000-000000000002'),
('ce100000-0000-4000-8000-000000000003');

insert into public.profiles(id,user_id,nome,tipo)
select id,id,'QA escala historias em comum',
 case when id='ce100000-0000-4000-8000-000000000003' then 'autor' else 'leitor' end
from auth.users
where id in ('ce100000-0000-4000-8000-000000000001','ce100000-0000-4000-8000-000000000002','ce100000-0000-4000-8000-000000000003');

insert into public.preferencias_privacidade(user_id,visibilidade_biblioteca,mostrar_favoritos,perfil_privado)
values
('ce100000-0000-4000-8000-000000000001','publico',true,false),
('ce100000-0000-4000-8000-000000000002','publico',true,false);

select set_config('request.jwt.claim.sub','ce100000-0000-4000-8000-000000000003',true);
select public.aceitar_termos_publicacao('2026-08-05','2026-08-05','2026-08-05');

insert into public.obras
(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,avisos_conteudo,publicado,slug)
select
 ('ce200000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid,
 'ce100000-0000-4000-8000-000000000003'::uuid,
 'QA escala comum '||i,'QA autor','Fantasia','Conto',
 'Livre','{}'::text[],true,'qa-historias-comum-escala-'||i
from generate_series(1,1003) as i;

insert into public.favoritos(user_id,obra_id,visibilidade)
select usuarios.user_id, obras.id,'publico'
from (values
 ('ce100000-0000-4000-8000-000000000001'::uuid),
 ('ce100000-0000-4000-8000-000000000002'::uuid)
) as usuarios(user_id)
cross join public.obras as obras
where obras.id >= 'ce200000-0000-4000-8000-000000000001'::uuid
  and obras.id <= 'ce200000-0000-4000-8000-000000001003'::uuid
  and obras.user_id = 'ce100000-0000-4000-8000-000000000003'::uuid;

select ok(
 to_regprocedure('public.listar_historias_em_comum(uuid,uuid,integer)') is not null,
 'RPC de historias em comum presente no banco descartavel'
);

reset role;
select set_config('request.jwt.claim.sub','ce100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims',
 '{"sub":"ce100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;

-- Não aumentar o prazo observado no diagnóstico; a UI pede apenas 20 linhas.
set local statement_timeout = '8s';
select is(
 (select count(*) from public.favoritos
  where user_id='ce100000-0000-4000-8000-000000000001'::uuid),
 1003::bigint,'dono possui 1003 favoritos sem perda'
);
select is(
 (select count(*) from public.listar_historias_em_comum(
  'ce100000-0000-4000-8000-000000000002'::uuid,null::uuid,20)),
 20::bigint,'primeira página de 20 dentre 1003 em orçamento SQL de 8s'
);
select is(
 (select min(obra_id::text) from public.listar_historias_em_comum(
  'ce100000-0000-4000-8000-000000000002'::uuid,null::uuid,20)),
 'ce200000-0000-4000-8000-000000000001',
 'ordem keyset deterministica na primeira pagina'
);
select is(
 (select count(*) from public.listar_historias_em_comum(
  'ce100000-0000-4000-8000-000000000002'::uuid,
  'ce200000-0000-4000-8000-000000001000'::uuid,20)),
 3::bigint,'cursor na página final devolve exatamente tres obras'
);
select is(
 (select count(*) from public.listar_historias_em_comum(
  'ce100000-0000-4000-8000-000000000002'::uuid,
  'ce200000-0000-4000-8000-000000001003'::uuid,20)),
 0::bigint,'cursor final não revela contagens de outras obras'
);

reset role;
select set_config('request.jwt.claim.sub','ce100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims',
 '{"sub":"ce100000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
select is(
 (select count(*) from public.listar_historias_em_comum(
  'ce100000-0000-4000-8000-000000000001'::uuid,null::uuid,20)),
 20::bigint,'consulta recíproca preserva limite e RLS'
);

reset role;
update public.preferencias_privacidade
 set mostrar_favoritos=false
 where user_id='ce100000-0000-4000-8000-000000000002'::uuid;

reset role;
select set_config('request.jwt.claim.sub','ce100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims',
 '{"sub":"ce100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select is(
 (select count(*) from public.listar_historias_em_comum(
  'ce100000-0000-4000-8000-000000000002'::uuid,null::uuid,20)),
 0::bigint,'revogação de divulgação é imediata também com 1003 favoritos'
);
select is(
 (select count(*) from public.favoritos
  where user_id='ce100000-0000-4000-8000-000000000001'::uuid),
 1003::bigint,'revogação não remove coleções particulares'
);
reset role;
select * from finish();
rollback;
