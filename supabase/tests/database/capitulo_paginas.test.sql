begin;
select no_plan();
-- BEGIN LOCAL FIXTURE (tambem executada pelo teste Data API)
-- Metadados sinteticos: nenhum arquivo e enviado.
insert into auth.users(id) values
  ('e8100000-0000-4000-8000-000000000001'), ('e8100000-0000-4000-8000-000000000002')
on conflict (id) do nothing;
insert into public.profiles(id, user_id, nome, tipo)
values ('e8100000-0000-4000-8000-000000000001', 'e8100000-0000-4000-8000-000000000001', 'QA paginas', 'autor'),
  ('e8100000-0000-4000-8000-000000000002', 'e8100000-0000-4000-8000-000000000002', 'QA terceiro', 'leitor');
select set_config('request.jwt.claim.sub','e8100000-0000-4000-8000-000000000001',true);
select public.aceitar_termos_publicacao('2026-08-05', '2026-08-05', '2026-08-05');
select set_config('request.jwt.claim.sub','',true);
insert into public.obras(id, user_id, titulo, autor, genero, formato, classificacao_indicativa,
  avisos_conteudo, publicado, slug)
select ('e8200000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid,
  'e8100000-0000-4000-8000-000000000001', 'QA paginas ' || g, 'QA paginas', 'Fantasia', 'HQ',
  case when g = 3 then '18+' else 'Livre' end,
  case when g = 3 then array['violencia_intensa'] else '{}'::text[] end,
  g <> 2, 'qa-paginas-' || g from generate_series(1, 3) g;
insert into public.capitulos(id, obra_id, user_id, titulo, texto, ordem, publicado, tipo_conteudo)
select ('e8300000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid,
  ('e8200000-0000-4000-8000-' || lpad((case when g = 3 then 2 when g = 4 then 3 else 1 end)::text, 12, '0'))::uuid,
  'e8100000-0000-4000-8000-000000000001', 'Capitulo QA ' || g, '', g, false, 'imagens'
from generate_series(1, 4) g;
insert into public.capitulos(id, obra_id, user_id, titulo, texto, ordem, publicado)
values ('e8300000-0000-4000-8000-000000000005', 'e8200000-0000-4000-8000-000000000001',
  'e8100000-0000-4000-8000-000000000001', 'Texto legado', 'Texto preservado', 5, true);
insert into public.capitulo_paginas(id, capitulo_id, ordem, storage_path, largura, altura, tamanho_bytes, mime_type, descricao)
select ('e8400000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid,
  ('e8300000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid, 1,
  'e8100000-0000-4000-8000-000000000001/capitulos/e8300000-0000-4000-8000-' || lpad(g::text,12,'0') ||
  '/e8400000-0000-4000-8000-' || lpad(g::text,12,'0') || '.webp', 800, 1200, 1024, 'image/webp', 'Cena QA ' || g
from generate_series(1, 4) g;
update public.capitulos set publicado = true
where id in ('e8300000-0000-4000-8000-000000000001', 'e8300000-0000-4000-8000-000000000003',
  'e8300000-0000-4000-8000-000000000004');
-- END LOCAL FIXTURE
set constraints all immediate;

select is((select tipo_conteudo from public.capitulos where id = 'e8300000-0000-4000-8000-000000000005'),
  'texto', 'capitulo legado mantem tipo texto');
select is((select texto from public.capitulos where id = 'e8300000-0000-4000-8000-000000000005'),
  'Texto preservado', 'texto legado nao muda');
select is((select versao_paginas from public.capitulos where id = 'e8300000-0000-4000-8000-000000000005'),
  0::bigint, 'legado inicia versao zero');
select is((select versao_paginas from public.capitulos where id = 'e8300000-0000-4000-8000-000000000001'),
  1::bigint, 'insercao incrementa versao do manifesto');
select ok((select not public from storage.buckets where id = 'arquivos-obras'), 'bucket permanece privado');
select is((select count(*)::integer from pg_policies where schemaname = 'storage' and tablename = 'objects'
  and policyname in ('capitulo_paginas_storage_insert_bloqueado','capitulo_paginas_storage_update_bloqueado',
    'capitulo_paginas_storage_delete_bloqueado') and permissive = 'RESTRICTIVE'), 3,
  'namespace de paginas bloqueia escrita direta sem substituir policies dos anexos');
select ok((select relrowsecurity from pg_class where oid = 'public.capitulo_paginas'::regclass), 'RLS habilitada');
select ok(not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'capitulo_paginas'
  and cmd <> 'SELECT'), 'nenhuma policy de escrita');
select ok(not has_table_privilege('authenticated','public.capitulo_paginas','INSERT')
  and not has_table_privilege('authenticated','public.capitulo_paginas','UPDATE')
  and not has_table_privilege('authenticated','public.capitulo_paginas','DELETE')
  and not has_table_privilege('authenticated','public.capitulo_paginas','TRUNCATE')
  and not has_table_privilege('service_role','public.capitulo_paginas','INSERT'), 'Data API sem escrita, inclusive service role');
select ok(not has_column_privilege('anon','public.capitulo_paginas','storage_path','SELECT')
  and not has_column_privilege('authenticated','public.capitulo_paginas','storage_path','SELECT'), 'caminho fora da projecao publica');
select ok(not has_table_privilege('authenticated','historietas_privado.capitulo_uploads_pendentes','SELECT')
  and not has_table_privilege('service_role','historietas_privado.capitulo_uploads_pendentes','INSERT')
  and not has_table_privilege('authenticated','historietas_privado.capitulo_arquivos_limpeza','SELECT'), 'contratos internos fechados');
select ok(not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace,
  lateral aclexplode(p.proacl) acl where n.nspname = 'historietas_privado'
  and p.proname in ('proteger_contrato_capitulo_ilustrado', 'validar_referencia_pagina_capitulo',
    'incrementar_versao_paginas_capitulo','validar_manifesto_capitulo','enfileirar_arquivo_capitulo_removido')
  and (acl.grantee = 0 or acl.grantee in ('anon'::regrole, 'authenticated'::regrole, 'service_role'::regrole))),
  'triggers nao possuem EXECUTE para clientes');

set local role anon;
select is((select count(id)::integer from public.capitulo_paginas where capitulo_id::text like 'e8300000-%'),
  1, 'anon somente le manifesto publico permitido');
select throws_ok($$select storage_path from public.capitulo_paginas$$, '42501', null, 'anon nao le caminhos privados');
reset role;
select set_config('request.jwt.claim.sub','e8100000-0000-4000-8000-000000000001',true);
set local role authenticated;
select is((select count(id)::integer from public.capitulo_paginas where capitulo_id::text like 'e8300000-%'),
  4, 'autor le drafts, obra nao publicada e 18+ proprios');
select throws_ok($$update public.capitulos set tipo_conteudo = 'imagens'
  where id = 'e8300000-0000-4000-8000-000000000005'$$, '42501', null, 'autor nao ativa ilustrado diretamente');
select throws_ok($$update public.capitulos set versao_paginas = 99
  where id = 'e8300000-0000-4000-8000-000000000005'$$, '42501', null, 'autor nao forja versao');
select lives_ok($$update public.capitulos set texto = 'Texto preservado'
  where id = 'e8300000-0000-4000-8000-000000000005'$$, 'edicao de texto continua funcionando');
select throws_ok($$delete from public.capitulo_paginas where id = 'e8400000-0000-4000-8000-000000000001'$$,
  '42501', null, 'autor nao remove pagina por DML direto');
reset role;
select set_config('request.jwt.claim.sub','e8100000-0000-4000-8000-000000000002',true);
set local role authenticated;
select is((select count(id)::integer from public.capitulo_paginas where capitulo_id::text like 'e8300000-%'),
  1, 'terceiro nao ve drafts nem 18+');
reset role;
select set_config('request.jwt.claim.sub','',true);

select throws_ok($$update public.capitulo_paginas set storage_path = 'outro'
  where id = 'e8400000-0000-4000-8000-000000000001'$$, '23514', null, 'caminho imutavel');
select throws_ok($$update public.capitulo_paginas set altura = 2000
  where id = 'e8400000-0000-4000-8000-000000000001'$$, '23514', null, 'metadados de arquivo imutaveis');
select throws_ok($$update public.capitulo_paginas set descricao = '  '
  where id = 'e8400000-0000-4000-8000-000000000001'$$, '23514', null, 'descricao significativa obrigatoria');
select throws_ok($$update public.capitulo_paginas set ordem = 11
  where id = 'e8400000-0000-4000-8000-000000000001'$$, '23514', null, 'no maximo dez posicoes');
select throws_ok($$update public.capitulos set versao_paginas = 0
  where id = 'e8300000-0000-4000-8000-000000000001'$$, '23514', null, 'versao nunca regride');
select throws_ok($$update public.capitulos set tipo_conteudo = 'texto'
  where id = 'e8300000-0000-4000-8000-000000000001'$$, '23514', null, 'manifesto nao pode virar texto');
select throws_ok($$update public.capitulos set tipo_conteudo = 'video'
  where id = 'e8300000-0000-4000-8000-000000000005'$$, '23514', null, 'tipo desconhecido rejeitado');
select throws_ok($$update public.capitulo_paginas set ordem = 2
  where id = 'e8400000-0000-4000-8000-000000000001'$$, '23514', null, 'manifesto sem lacunas');
select throws_ok($$delete from public.capitulo_paginas where id = 'e8400000-0000-4000-8000-000000000001'$$,
  '23514', null, 'capitulo publicado nao perde ultima pagina');

-- Insere casos invalidos novos: constraints nao sao mascaradas pela imutabilidade de UPDATE.
create function pg_temp.pagina_invalida(p_alteracoes jsonb) returns void language plpgsql as $$
declare v public.capitulo_paginas;
begin
  v := jsonb_populate_record(null::public.capitulo_paginas,
    jsonb_build_object('id','e8400000-0000-4000-8000-000000000010',
      'capitulo_id','e8300000-0000-4000-8000-000000000002','ordem',2,
      'storage_path','e8100000-0000-4000-8000-000000000001/capitulos/e8300000-0000-4000-8000-000000000002/e8400000-0000-4000-8000-000000000010.webp',
      'largura',800,'altura',1200,'tamanho_bytes',1024,'mime_type','image/webp','descricao','Cena','criado_em',now()) || p_alteracoes);
  insert into public.capitulo_paginas select v.*;
end;
$$;
select throws_ok($$select pg_temp.pagina_invalida('{"largura":2049}')$$, '23514', null, 'largura limitada');
select throws_ok($$select pg_temp.pagina_invalida('{"altura":4097}')$$, '23514', null, 'altura limitada');
select throws_ok($$select pg_temp.pagina_invalida('{"largura":2048,"altura":4096}')$$, '23514', null, 'limite de pixels');
select throws_ok($$select pg_temp.pagina_invalida('{"tamanho_bytes":2097153}')$$, '23514', null, 'limite de bytes');
select throws_ok($$select pg_temp.pagina_invalida('{"tamanho_bytes":0}')$$, '23514', null, 'arquivo vazio rejeitado');
select throws_ok($$select pg_temp.pagina_invalida('{"mime_type":"image/gif"}')$$, '23514', null, 'GIF fora do contrato');
select throws_ok($$select pg_temp.pagina_invalida('{"mime_type":"image/svg+xml"}')$$, '23514', null, 'SVG fora do contrato');
select throws_ok($$select pg_temp.pagina_invalida('{"largura":0}')$$, '23514', null, 'dimensoes positivas');
select throws_ok($$select pg_temp.pagina_invalida('{"storage_path":"../outro.webp"}')$$, '23514', null, 'traversal rejeitado');
select throws_ok($$select pg_temp.pagina_invalida('{"capitulo_id":"e8300000-0000-4000-8000-000000000005"}')$$,
  '23514', null, 'texto nao recebe paginas');
select throws_ok($$select pg_temp.pagina_invalida('{"capitulo_id":"e8300000-0000-4000-8000-000000000099"}')$$,
  '23503', null, 'capitulo inexistente rejeitado');
select throws_ok($$select pg_temp.pagina_invalida('{"ordem":1}')$$, '23505', null, 'ordem unica por capitulo');
select lives_ok($$select pg_temp.pagina_invalida('{}')$$, 'pagina valida no draft');
select is((select versao_paginas from public.capitulos where id = 'e8300000-0000-4000-8000-000000000002'),
  2::bigint, 'segunda pagina incrementa versao');
set constraints all deferred;
update public.capitulo_paginas set ordem = case ordem when 1 then 2 else 1 end
where capitulo_id = 'e8300000-0000-4000-8000-000000000002';
set constraints all immediate;
select is((select ordem from public.capitulo_paginas where id = 'e8400000-0000-4000-8000-000000000010'),
  1, 'reordenacao atomica troca posicoes sem colisao');
insert into historietas_privado.capitulo_uploads_pendentes(id, capitulo_id, user_id, storage_path, versao_esperada)
values ('e8400000-0000-4000-8000-000000000011', 'e8300000-0000-4000-8000-000000000002',
  'e8100000-0000-4000-8000-000000000001',
  'e8100000-0000-4000-8000-000000000001/capitulos/e8300000-0000-4000-8000-000000000002/e8400000-0000-4000-8000-000000000011.webp', 4);
select throws_ok($$update historietas_privado.capitulo_uploads_pendentes set user_id = 'e8100000-0000-4000-8000-000000000002'
  where id = 'e8400000-0000-4000-8000-000000000011'$$, '23514', null, 'reserva respeita proprietario');
select throws_ok($$update historietas_privado.capitulo_uploads_pendentes set expira_em = criado_em + interval '25 hours'
  where id = 'e8400000-0000-4000-8000-000000000011'$$, '23514', null, 'reserva com prazo limitado');
select set_config('request.jwt.claim.sub','e8100000-0000-4000-8000-000000000001',true);
set local role authenticated;
select lives_ok($$delete from public.capitulos where id = 'e8300000-0000-4000-8000-000000000002'$$,
  'exclusao autorizada do capitulo mantem limpeza recuperavel sem ampliar grants');
reset role;
select set_config('request.jwt.claim.sub','',true);
select is((select count(*)::integer from historietas_privado.capitulo_arquivos_limpeza
  where storage_path like '%/e8300000-0000-4000-8000-000000000002/%'), 3, 'cascata preserva paginas e reservas na outbox');
select is((select count(id)::integer from public.capitulo_paginas where capitulo_id = 'e8300000-0000-4000-8000-000000000002'),
  0, 'FK remove metadados do capitulo excluido');
select * from finish();
rollback;
