begin;
select plan(32);

-- Fixtures sinteticas, revertidas integralmente; leituras sempre sob RLS.
insert into auth.users(id) values ('cf100000-0000-4000-8000-000000000001'), ('cf100000-0000-4000-8000-000000000002'), ('cf100000-0000-4000-8000-000000000003');
insert into public.profiles(id,user_id,nome,tipo)
select id,id,'QA favoritos',case when id='cf100000-0000-4000-8000-000000000003' then 'autor' else 'leitor' end
from auth.users where id in ('cf100000-0000-4000-8000-000000000001','cf100000-0000-4000-8000-000000000002','cf100000-0000-4000-8000-000000000003');
insert into public.preferencias_privacidade(user_id,visibilidade_biblioteca,mostrar_favoritos)
values ('cf100000-0000-4000-8000-000000000001','publico',true);
select set_config('request.jwt.claim.sub','cf100000-0000-4000-8000-000000000003',true);
select public.aceitar_termos_publicacao('2026-08-05','2026-08-05','2026-08-05');
insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,avisos_conteudo,publicado,slug)
select ('cf200000-0000-4000-8000-' || lpad(g::text,12,'0'))::uuid,
 'cf100000-0000-4000-8000-000000000003','QA favoritos ' || g,'QA autor','Fantasia','Romance',
 case when g=5 then '18+' else 'Livre' end,
 case when g=5 then array['violencia_intensa'] else '{}'::text[] end,
 g<>4,'qa-favoritos-seguranca-' || g
from generate_series(1,5) g;
-- Publico, parcial, privado, draft publico e 18+ publico.
insert into public.favoritos(user_id,obra_id,visibilidade)
select 'cf100000-0000-4000-8000-000000000001',('cf200000-0000-4000-8000-' || lpad(g::text,12,'0'))::uuid,
 case g when 2 then 'parcial' when 3 then 'privado' else 'publico' end
from generate_series(1,5) g;

reset role;
select set_config('request.jwt.claim.sub','cf100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"cf100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' ), 5::bigint, 'proprietario le todos os favoritos, inclusive privado, draft e 18+');

reset role;
select set_config('request.jwt.claim.sub','cf100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"cf100000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' ), 2::bigint, 'terceiro: somente publico e parcial elegiveis');
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' and obra_id in ('cf200000-0000-4000-8000-000000000004','cf200000-0000-4000-8000-000000000005')), 0::bigint, 'terceiro: IDs draft e 18+ nao enumeraveis');
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' and obra_id='cf200000-0000-4000-8000-000000000003'), 0::bigint, 'terceiro: favorito privado oculto');

reset role;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' ), 2::bigint, 'anon: somente publico e parcial elegiveis');
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' and obra_id in ('cf200000-0000-4000-8000-000000000004','cf200000-0000-4000-8000-000000000005')), 0::bigint, 'anon: IDs draft e 18+ nao enumeraveis');
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' and obra_id='cf200000-0000-4000-8000-000000000003'), 0::bigint, 'anon: favorito privado oculto');

reset role;
select set_config('request.jwt.claim.sub','cf100000-0000-4000-8000-000000000003',true);
select set_config('request.jwt.claims','{"sub":"cf100000-0000-4000-8000-000000000003","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' ), 2::bigint, 'autor como terceiro: somente publico e parcial elegiveis');
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' and obra_id in ('cf200000-0000-4000-8000-000000000004','cf200000-0000-4000-8000-000000000005')), 0::bigint, 'autor como terceiro: IDs draft e 18+ nao enumeraveis');
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' and obra_id='cf200000-0000-4000-8000-000000000003'), 0::bigint, 'autor como terceiro: favorito privado oculto');

reset role;
update public.preferencias_privacidade set mostrar_favoritos=false where user_id='cf100000-0000-4000-8000-000000000001';

reset role;
select set_config('request.jwt.claim.sub','cf100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"cf100000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' ), 0::bigint, 'categoria desativada: revoga terceiro');

reset role;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' ), 0::bigint, 'categoria desativada: revoga anon');

reset role;
select set_config('request.jwt.claim.sub','cf100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"cf100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' ), 5::bigint, 'categoria desativada: preserva proprietario');

reset role;
update public.preferencias_privacidade set mostrar_favoritos=true,visibilidade_biblioteca='somente_eu' where user_id='cf100000-0000-4000-8000-000000000001';

reset role;
select set_config('request.jwt.claim.sub','cf100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"cf100000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' ), 0::bigint, 'Biblioteca privada: revoga terceiro');

reset role;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' ), 0::bigint, 'Biblioteca privada: revoga anon');

reset role;
select set_config('request.jwt.claim.sub','cf100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"cf100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' ), 5::bigint, 'Biblioteca privada: preserva proprietario');

reset role;
update public.preferencias_privacidade set mostrar_favoritos=true,visibilidade_biblioteca='publico' where user_id='cf100000-0000-4000-8000-000000000001';

reset role;
insert into public.usuarios_bloqueados(bloqueador_id,bloqueado_id) values ('cf100000-0000-4000-8000-000000000001','cf100000-0000-4000-8000-000000000002');

reset role;
select set_config('request.jwt.claim.sub','cf100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"cf100000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' ), 0::bigint, 'proprietario bloqueia terceiro');

reset role;
select set_config('request.jwt.claim.sub','cf100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"cf100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' ), 5::bigint, 'proprietario bloqueia terceiro: acesso pessoal preservado');

reset role;
delete from public.usuarios_bloqueados where bloqueador_id='cf100000-0000-4000-8000-000000000001' and bloqueado_id='cf100000-0000-4000-8000-000000000002';

reset role;
select set_config('request.jwt.claim.sub','cf100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"cf100000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' ), 2::bigint, 'proprietario bloqueia terceiro: desbloqueio restaura somente elegiveis');

reset role;
insert into public.usuarios_bloqueados(bloqueador_id,bloqueado_id) values ('cf100000-0000-4000-8000-000000000002','cf100000-0000-4000-8000-000000000001');

reset role;
select set_config('request.jwt.claim.sub','cf100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"cf100000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' ), 0::bigint, 'terceiro bloqueia proprietario');

reset role;
select set_config('request.jwt.claim.sub','cf100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"cf100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' ), 5::bigint, 'terceiro bloqueia proprietario: acesso pessoal preservado');

reset role;
delete from public.usuarios_bloqueados where bloqueador_id='cf100000-0000-4000-8000-000000000002' and bloqueado_id='cf100000-0000-4000-8000-000000000001';

reset role;
select set_config('request.jwt.claim.sub','cf100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"cf100000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' ), 2::bigint, 'terceiro bloqueia proprietario: desbloqueio restaura somente elegiveis');

reset role;
-- Alteracoes administrativas de fixtures nao herdam a identidade do leitor.
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{}',true);
update public.obras set publicado=false where id='cf200000-0000-4000-8000-000000000001';

reset role;
select set_config('request.jwt.claim.sub','cf100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"cf100000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' ), 1::bigint, 'despublicacao revoga imediatamente');

reset role;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' ), 1::bigint, 'despublicacao revoga anon');

reset role;
select set_config('request.jwt.claim.sub','cf100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"cf100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' ), 5::bigint, 'despublicacao preserva proprietario');

reset role;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{}',true);
update public.obras set classificacao_indicativa='18+',avisos_conteudo=array['violencia_intensa'] where id='cf200000-0000-4000-8000-000000000002';

reset role;
select set_config('request.jwt.claim.sub','cf100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"cf100000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' ), 0::bigint, 'mudanca para 18+ revoga imediatamente');

reset role;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' ), 0::bigint, 'mudanca para 18+ revoga anon');

reset role;
select set_config('request.jwt.claim.sub','cf100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"cf100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' ), 5::bigint, 'mudanca para 18+ preserva proprietario');

reset role;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{}',true);
update public.obras set publicado=true where id='cf200000-0000-4000-8000-000000000001';
update public.favoritos set visibilidade='privado' where user_id='cf100000-0000-4000-8000-000000000001' and obra_id='cf200000-0000-4000-8000-000000000001';

reset role;
select set_config('request.jwt.claim.sub','cf100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"cf100000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' ), 0::bigint, 'privacidade individual revoga apos republicacao');

reset role;
select set_config('request.jwt.claim.sub','cf100000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"cf100000-0000-4000-8000-000000000001","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' ), 5::bigint, 'privacidade individual preserva proprietario');
delete from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' and obra_id='cf200000-0000-4000-8000-000000000001';
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' ), 4::bigint, 'proprietario ainda pode remover favorito privado');

reset role;
select set_config('request.jwt.claim.sub','cf100000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"cf100000-0000-4000-8000-000000000002","role":"authenticated"}',true);
set local role authenticated;
select is((select count(*) from public.favoritos where user_id='cf100000-0000-4000-8000-000000000001' ), 0::bigint, 'remocao nao restaura divulgacao');

reset role;
select * from finish();
rollback;
