begin;
select plan(13);

select is((select listagem_habilitada from novas_vozes_interno.config), false,
  'a instalação não habilita a listagem');

-- Cada autor tem uma primeira obra pública. O segundo começa com o texto na
-- obra em rascunho. A conta do terceiro já existia antes do marco observado.
insert into auth.users(id, created_at) values
  ('db100000-0000-4000-8000-000000000001', clock_timestamp()),
  ('db100000-0000-4000-8000-000000000002', clock_timestamp()),
  ('db100000-0000-4000-8000-000000000003',
    (select observado_desde - interval '1 day' from novas_vozes_interno.config));
set local request.jwt.claim.sub = 'db100000-0000-4000-8000-000000000001';
select public.aceitar_termos_publicacao('2026-08-05','2026-08-05','2026-08-05');
set local request.jwt.claim.sub = 'db100000-0000-4000-8000-000000000002';
select public.aceitar_termos_publicacao('2026-08-05','2026-08-05','2026-08-05');
set local request.jwt.claim.sub = 'db100000-0000-4000-8000-000000000003';
select public.aceitar_termos_publicacao('2026-08-05','2026-08-05','2026-08-05');
set local request.jwt.claim.sub = '';
insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,publicado,slug) values
  ('db200000-0000-4000-8000-000000000001','db100000-0000-4000-8000-000000000001','Em branco','QA A','Fantasia','Conto','Livre',true,'qa-nv-em-branco'),
  ('db200000-0000-4000-8000-000000000002','db100000-0000-4000-8000-000000000002','Destino','QA B','Fantasia','Conto','Livre',true,'qa-nv-destino'),
  ('db200000-0000-4000-8000-000000000003','db100000-0000-4000-8000-000000000002','Origem','QA B','Fantasia','Conto','Livre',false,'qa-nv-origem'),
  ('db200000-0000-4000-8000-000000000004','db100000-0000-4000-8000-000000000003','Legado','QA C','Fantasia','Conto','Livre',true,'qa-nv-legado'),
  ('db200000-0000-4000-8000-000000000005','db100000-0000-4000-8000-000000000001','Outra obra','QA A','Fantasia','Conto','Livre',true,'qa-nv-segunda');
insert into public.capitulos(id,obra_id,user_id,titulo,texto,ordem,publicado) values
  ('db300000-0000-4000-8000-000000000001','db200000-0000-4000-8000-000000000001','db100000-0000-4000-8000-000000000001','Em branco',U&'\0020\0009\000D\000A\00A0\2003\FEFF',1,true),
  ('db300000-0000-4000-8000-000000000002','db200000-0000-4000-8000-000000000003','db100000-0000-4000-8000-000000000002','Em trânsito','Havia vento na praça.',1,true),
  ('db300000-0000-4000-8000-000000000003','db200000-0000-4000-8000-000000000004','db100000-0000-4000-8000-000000000003','Legado','História publicada.',1,true);

-- Descarrega os eventos pendentes antes do próximo passo. Sem este limite,
-- uma atualização posterior poderia mascarar a falta do gatilho em obra_id.
set constraints all immediate;
select is((select count(*) from novas_vozes_interno.estreias
  where autor_id in ('db100000-0000-4000-8000-000000000001','db100000-0000-4000-8000-000000000002')), 0::bigint,
  'separadores sozinhos e texto em obra rascunho não iniciam uma estreia');
select ok(not exists (select 1 from novas_vozes_interno.estreias where autor_id = 'db100000-0000-4000-8000-000000000003'),
  'uma conta com histórico anterior desconhecido não é certificada');

update public.capitulos set texto = repeat(E'\t', 600) || 'Primeira frase.'
  where id = 'db300000-0000-4000-8000-000000000001';
select is((select count(*) from novas_vozes_interno.estreias where autor_id = 'db100000-0000-4000-8000-000000000001'), 1::bigint,
  'o primeiro texto legível registra a estreia, mesmo após a posição 600');
create temporary table qa_primeira_estreia on commit drop as
  select primeira_publicacao from novas_vozes_interno.estreias where autor_id = 'db100000-0000-4000-8000-000000000001';

set local role anon;
select is((select count(*) from public.listar_novas_vozes()), 0::bigint,
  'com a listagem desligada a obra certificada não é exibida');
reset role;
update novas_vozes_interno.config set listagem_habilitada = true;
set local role anon;
select is((select possui_previa from public.listar_novas_vozes() where slug = 'qa-nv-em-branco'), false,
  'obra legível aparece sem prévia se os primeiros 600 caracteres forem separadores');
reset role;

set constraints all deferred;
set local request.jwt.claim.sub = 'db100000-0000-4000-8000-000000000002';
set local role authenticated;
update public.capitulos set obra_id = 'db200000-0000-4000-8000-000000000002'
  where id = 'db300000-0000-4000-8000-000000000002';
reset role;
set local request.jwt.claim.sub = '';
set constraints all immediate;
select is((select count(*) from novas_vozes_interno.estreias where autor_id = 'db100000-0000-4000-8000-000000000002'), 1::bigint,
  'mudar somente obra_id para a obra pública do mesmo autor certifica a estreia');
set local role anon;
select is((select possui_previa from public.listar_novas_vozes() where slug = 'qa-nv-destino'), true,
  'a obra de destino aparece com a abertura legível');
reset role;

insert into public.capitulos(id,obra_id,user_id,titulo,texto,ordem,publicado) values
  ('db300000-0000-4000-8000-000000000004','db200000-0000-4000-8000-000000000005','db100000-0000-4000-8000-000000000001','Um novo conto','Outra história.',1,true);
select is((select primeira_publicacao from novas_vozes_interno.estreias where autor_id = 'db100000-0000-4000-8000-000000000001'),
  (select primeira_publicacao from qa_primeira_estreia), 'outra obra pública mantém a data da primeira estreia');
set local role anon;
select is((select count(*) from public.listar_novas_vozes() where user_id = 'db100000-0000-4000-8000-000000000001'), 1::bigint,
  'duas obras elegíveis do mesmo autor ocupam somente um lugar');
reset role;

update novas_vozes_interno.estreias set primeira_publicacao = statement_timestamp() - interval '89 days'
  where autor_id = 'db100000-0000-4000-8000-000000000001';
set local role anon;
select is((select count(*) from public.listar_novas_vozes() where user_id = 'db100000-0000-4000-8000-000000000001'), 1::bigint,
  'estreia dentro dos 90 dias continua elegível');
reset role;
update novas_vozes_interno.estreias set primeira_publicacao = statement_timestamp() - interval '91 days'
  where autor_id = 'db100000-0000-4000-8000-000000000001';
set local role anon;
select is((select count(*) from public.listar_novas_vozes() where user_id = 'db100000-0000-4000-8000-000000000001'), 0::bigint,
  'estreia fora dos 90 dias deixa a seleção');
select is((select count(*) from public.listar_novas_vozes() where slug = 'qa-nv-destino'), 1::bigint,
  'a expiração de outro autor não esvazia a seção');
reset role;

select * from finish();
rollback;
