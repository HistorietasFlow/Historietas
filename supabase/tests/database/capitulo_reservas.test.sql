begin;
select no_plan();
-- BEGIN RESERVATION FIXTURE
insert into auth.users(id) values ('e9100000-0000-4000-8000-000000000001'),
  ('e9100000-0000-4000-8000-000000000002') on conflict do nothing;
insert into public.profiles(id,user_id,nome,tipo) values
  ('e9100000-0000-4000-8000-000000000001','e9100000-0000-4000-8000-000000000001','QA reservas','autor'),
  ('e9100000-0000-4000-8000-000000000002','e9100000-0000-4000-8000-000000000002','QA terceiro','leitor');
select set_config('request.jwt.claim.sub','e9100000-0000-4000-8000-000000000001',true);
select public.aceitar_termos_publicacao('2026-08-05','2026-08-05','2026-08-05');
insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,publicado,slug) values
  ('e9200000-0000-4000-8000-000000000001','e9100000-0000-4000-8000-000000000001','QA reservas','QA','Fantasia','HQ','Livre',false,'qa-reservas-capitulo');
insert into public.capitulos(id,obra_id,user_id,titulo,ordem,publicado) values
  ('e9300000-0000-4000-8000-000000000001','e9200000-0000-4000-8000-000000000001',
   'e9100000-0000-4000-8000-000000000001','Draft texto preservado',1,false);
-- END RESERVATION FIXTURE

select ok(not has_function_privilege('anon','public.reservar_pagina_capitulo(uuid,bigint,uuid,text)','EXECUTE'), 'anon sem RPC de reserva');
select ok(not has_function_privilege('service_role','public.reservar_pagina_capitulo(uuid,bigint,uuid,text)','EXECUTE'), 'service role nao assume identidade');
select ok(not has_function_privilege('authenticated','historietas_privado.objetos_storage_com_reservas()','EXECUTE'), 'ledger global privado');
select ok(not has_table_privilege('authenticated','historietas_privado.capitulo_uploads_pendentes','INSERT'), 'sem INSERT direto');
select ok(not has_table_privilege('authenticated','historietas_privado.capitulo_uploads_pendentes','UPDATE'), 'sem UPDATE direto');
select ok(not has_table_privilege('authenticated','historietas_privado.capitulo_uploads_pendentes','SELECT'), 'sem listagem privada');
select ok(not exists (select 1 from pg_proc where oid in (
  'public.reservar_pagina_capitulo(uuid,bigint,uuid,text)'::regprocedure,
  'public.liberar_reserva_pagina_capitulo(uuid)'::regprocedure) and prosecdef), 'wrappers invoker');

set local role authenticated;
select lives_ok($$select public.reservar_pagina_capitulo('e9300000-0000-4000-8000-000000000001',0,
 'e9400000-0000-4000-8000-000000000001','image/png')$$, 'autor reserva draft sem converter texto');
select lives_ok($$select public.reservar_pagina_capitulo('e9300000-0000-4000-8000-000000000001',0,
 'e9400000-0000-4000-8000-000000000001','image/png')$$, 'retry idempotente');
select throws_ok($$select public.reservar_pagina_capitulo('e9300000-0000-4000-8000-000000000001',0,
 'e9400000-0000-4000-8000-000000000001','image/webp')$$,'22023',null,'chave nao muda formato');
select throws_ok($$select public.reservar_pagina_capitulo('e9300000-0000-4000-8000-000000000001',1,
 gen_random_uuid(),'image/png')$$,'PT409',null,'versao antiga recusada sem retry automatico');
select throws_ok($$select public.reservar_pagina_capitulo('e9300000-0000-4000-8000-000000000001',0,
 gen_random_uuid(),'image/gif')$$,'22023',null,'MIME invalido');
reset role;
select is((select count(*)::integer from historietas_privado.capitulo_uploads_pendentes
 where user_id='e9100000-0000-4000-8000-000000000001'),1,'retry nao duplica registro');
select is((select tipo_conteudo from public.capitulos where id='e9300000-0000-4000-8000-000000000001'),'texto','reserva nao ativa ilustrado');
select is((select versao_paginas from public.capitulos where id='e9300000-0000-4000-8000-000000000001'),0::bigint,'reserva nao muda versao');
select ok((select storage_path = user_id::text || '/capitulos/' || capitulo_id::text || '/' || id::text || '.png'
 from historietas_privado.capitulo_uploads_pendentes where chave_requisicao='e9400000-0000-4000-8000-000000000001'),'caminho gerado e imutavel');
select is((select (metadata->>'size')::bigint from historietas_privado.objetos_storage_com_reservas()
 where name like 'e9100000-0000-4000-8000-000000000001/%'),2097152::bigint,'reserva cobra 2 MiB');
select set_config('request.jwt.claim.sub','e9100000-0000-4000-8000-000000000002',true);
set local role authenticated;
select throws_ok($$select public.reservar_pagina_capitulo('e9300000-0000-4000-8000-000000000001',0,
 gen_random_uuid(),'image/png')$$,'42501',null,'terceiro nao reserva');
reset role;
select set_config('request.jwt.claim.sub','',true);
set local role authenticated;
select throws_ok($$select public.reservar_pagina_capitulo('e9300000-0000-4000-8000-000000000001',0,
 gen_random_uuid(),'image/png')$$,'42501',null,'sem identidade nao reserva');
reset role;
select set_config('request.jwt.claim.sub','e9100000-0000-4000-8000-000000000001',true);

-- Objetos sinteticos somente nesta transacao com rollback; nenhum byte fisico.
savepoint quota;
insert into storage.objects(bucket_id,name,metadata)
select 'arquivos-obras', 'e9100000-0000-4000-8000-000000000001/legado-'||g, '{"size":1}'::jsonb from generate_series(1,29) g;
select ok(not historietas_privado.upload_storage_dentro_cota('arquivos-obras',
 'e9100000-0000-4000-8000-000000000001/novo','1',null),'reserva + 29 legados bloqueiam objeto 31');
select throws_ok($$select public.reservar_pagina_capitulo('e9300000-0000-4000-8000-000000000001',0,
 gen_random_uuid(),'image/png')$$,'54000',null,'reserva respeita teto 30 compartilhado');
select set_config('request.jwt.claim.sub','e9100000-0000-4000-8000-000000000002',true);
select ok(historietas_privado.upload_storage_dentro_cota('arquivos-obras',
 'e9100000-0000-4000-8000-000000000002/novo','1',null),'cota individual de A nao e atribuida a B');
rollback to quota;

savepoint quota;
insert into storage.objects(bucket_id,name,metadata)
select 'capas-obras','e9100000-0000-4000-8000-000000000001/capa-'||g,'{"size":2097152}'::jsonb from generate_series(1,49) g;
select ok(not historietas_privado.upload_storage_dentro_cota('arquivos-obras',
 'e9100000-0000-4000-8000-000000000001/novo','1',null),'100 MiB incluindo reserva');
select throws_ok($$select public.reservar_pagina_capitulo('e9300000-0000-4000-8000-000000000001',0,
 gen_random_uuid(),'image/png')$$,'54000',null,'nova reserva nao excede 100 MiB');
rollback to quota;

savepoint quota;
insert into storage.objects(bucket_id,name,metadata)
select 'capas-obras','e9100000-0000-4000-8000-000000000001/contagem-'||g,'{"size":1}'::jsonb from generate_series(1,99) g;
select ok(not historietas_privado.upload_storage_dentro_cota('arquivos-obras',
 'e9100000-0000-4000-8000-000000000001/novo','1',null),'100 objetos por usuario incluindo reserva');
rollback to quota;

savepoint quota;
insert into storage.objects(bucket_id,name,metadata)
select 'capas-obras','qa-global-objetos/'||g,'{"size":0}'::jsonb from generate_series(1,
 greatest(0,5000-(select count(*)::integer from historietas_privado.objetos_storage_com_reservas()))) g;
select ok(not historietas_privado.upload_storage_dentro_cota('arquivos-obras',
 'e9100000-0000-4000-8000-000000000001/novo','1',null),'5000 objetos globais incluindo reserva');
rollback to quota;

savepoint quota;
insert into storage.objects(bucket_id,name,metadata)
select 'arquivos-obras','qa-global-bytes/'||g,
 jsonb_build_object('size',least(5242880, restante-(g-1)*5242880))
from (select greatest(0,734003200-(select sum((metadata->>'size')::bigint)
 from historietas_privado.objetos_storage_com_reservas())) restante) q,
 lateral generate_series(1,ceil(restante/5242880.0)::integer) g;
select ok(not historietas_privado.upload_storage_dentro_cota('arquivos-obras',
 'e9100000-0000-4000-8000-000000000001/novo','1',null),'700 MiB globais incluindo reserva');
rollback to quota;

savepoint quota;
insert into storage.objects(bucket_id,name,metadata)
select 'arquivos-obras',storage_path,'{"size":100}'::jsonb
 from historietas_privado.capitulo_uploads_pendentes where chave_requisicao='e9400000-0000-4000-8000-000000000001';
select is((select count(*)::integer from historietas_privado.objetos_storage_com_reservas()
 where name like 'e9100000-0000-4000-8000-000000000001/%'),1,'objeto + reserva nao duplica quantidade');
select is((select (metadata->>'size')::bigint from historietas_privado.objetos_storage_com_reservas()
 where name like 'e9100000-0000-4000-8000-000000000001/%'),2097152::bigint,'mantem capacidade comprometida');
update storage.objects set metadata=null where name like 'e9100000-0000-4000-8000-000000000001/%';
select is((select (metadata->>'size')::bigint from historietas_privado.objetos_storage_com_reservas()
 where name like 'e9100000-0000-4000-8000-000000000001/%'),5242880::bigint,'upload legado sem metadata cobra maximo');
select public.liberar_reserva_pagina_capitulo(id) from historietas_privado.capitulo_uploads_pendentes
 where chave_requisicao='e9400000-0000-4000-8000-000000000001';
select is((select count(*)::integer from historietas_privado.objetos_storage_com_reservas()
 where name like 'e9100000-0000-4000-8000-000000000001/%'),1,'liberar nao libera capacidade do arquivo existente');
select is((select count(*)::integer from storage.objects where name like 'e9100000-0000-4000-8000-000000000001/%'),1,'liberar nao apaga objeto');
rollback to quota;

select public.liberar_reserva_pagina_capitulo(id) from historietas_privado.capitulo_uploads_pendentes
 where chave_requisicao='e9400000-0000-4000-8000-000000000001';
select lives_ok($$select public.liberar_reserva_pagina_capitulo(id) from historietas_privado.capitulo_uploads_pendentes
 where chave_requisicao='e9400000-0000-4000-8000-000000000001'$$,'liberacao idempotente');
select is((select count(*)::integer from historietas_privado.objetos_storage_com_reservas()
 where name like 'e9100000-0000-4000-8000-000000000001/%'),0,'liberacao devolve capacidade sem objeto');
select throws_ok($$select public.reservar_pagina_capitulo('e9300000-0000-4000-8000-000000000001',0,
 'e9400000-0000-4000-8000-000000000001','image/png')$$,'55000',null,'retry nao reativa reserva liberada');
select is((select count(*)::integer from historietas_privado.capitulo_arquivos_limpeza
 where storage_path like 'e9100000-0000-4000-8000-000000000001/%'),1,'outbox idempotente');

-- Reserva antiga: expiracao so afeta capacidade ainda sem arquivo fisico.
insert into historietas_privado.capitulo_uploads_pendentes(id,capitulo_id,user_id,storage_path,
 versao_esperada,criado_em,expira_em,chave_requisicao) values
 ('e9400000-0000-4000-8000-000000000003','e9300000-0000-4000-8000-000000000001','e9100000-0000-4000-8000-000000000001',
 'e9100000-0000-4000-8000-000000000001/capitulos/e9300000-0000-4000-8000-000000000001/e9400000-0000-4000-8000-000000000003.webp',
 0,now()-interval '2 hours',now()-interval '1 hour','e9400000-0000-4000-8000-000000000003');
select is((select count(*)::integer from historietas_privado.objetos_storage_com_reservas()
 where name like 'e9100000-0000-4000-8000-000000000001/%'),0,'expirada nao consome capacidade');
select throws_ok($$select public.reservar_pagina_capitulo('e9300000-0000-4000-8000-000000000001',0,
 'e9400000-0000-4000-8000-000000000003','image/webp')$$,'55000',null,'retry nao renova expiracao');
select throws_ok($$update historietas_privado.capitulo_uploads_pendentes set storage_path='../forjado'
 where chave_requisicao='e9400000-0000-4000-8000-000000000003'$$,'23514',null,'caminho forjado bloqueado');

savepoint quota;
insert into storage.objects(bucket_id,name,metadata)
select 'arquivos-obras',storage_path,'{"size":100}'::jsonb
 from historietas_privado.capitulo_uploads_pendentes where chave_requisicao='e9400000-0000-4000-8000-000000000003';
select is((select (metadata->>'size')::bigint from historietas_privado.objetos_storage_com_reservas()
 where name like 'e9100000-0000-4000-8000-000000000001/%'),100::bigint,'expirada ainda conta bytes reais do arquivo');
rollback to quota;

savepoint quota;
insert into historietas_privado.capitulo_uploads_pendentes(id,capitulo_id,user_id,storage_path,versao_esperada,liberado_em)
select id,'e9300000-0000-4000-8000-000000000001','e9100000-0000-4000-8000-000000000001',
 'e9100000-0000-4000-8000-000000000001/capitulos/e9300000-0000-4000-8000-000000000001/'||id::text||'.png',0,now()
 from (select gen_random_uuid() id from generate_series(1,100)) q;
select throws_ok($$select public.reservar_pagina_capitulo('e9300000-0000-4000-8000-000000000001',0,
 gen_random_uuid(),'image/png')$$,'54000',null,'churn de reservas liberadas tem limite diario');
rollback to quota;

savepoint quota;
update public.capitulos set publicado=true where id='e9300000-0000-4000-8000-000000000001';
select throws_ok($$select public.reservar_pagina_capitulo('e9300000-0000-4000-8000-000000000001',0,
 gen_random_uuid(),'image/png')$$,'22023',null,'nao prepara conversao de texto ja publicado');
rollback to quota;

savepoint quota;
update public.obras set classificacao_indicativa='18+',avisos_conteudo=array['violencia_intensa']
 where id='e9200000-0000-4000-8000-000000000001';
select lives_ok($$select public.reservar_pagina_capitulo('e9300000-0000-4000-8000-000000000001',0,
 gen_random_uuid(),'image/jpeg')$$,'autor pode preparar draft proprio 18+ sem publicar nem ampliar leitura');
rollback to quota;
-- As fixtures de limites nao podem deixar alteracoes no estado-base. Mantem
-- tambem o ultimo resultado TAP fora de savepoints revertidos.
select is((select classificacao_indicativa from public.obras
 where id='e9200000-0000-4000-8000-000000000001'),'Livre','cenarios isolados preservam estado-base');
select * from finish();
rollback;
