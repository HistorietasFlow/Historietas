begin;
select no_plan();
select ok(relrowsecurity,'retencoes privadas exigem RLS') from pg_class
  where oid='historietas_privado.capa_upload_retencoes'::regclass;
select ok(not has_table_privilege(r,'historietas_privado.capa_upload_retencoes','SELECT,INSERT,UPDATE,DELETE'),
  'retencao inacessivel ao papel '||r)
  from unnest(array['anon','authenticated','service_role']) r;
insert into historietas_privado.capa_upload_retencoes
 (id,obra_id,usuario_id,geracao,asset_id,storage_path,estado)
 values (
 '33333333-3333-4333-8333-333333333331',
 '33333333-3333-4333-8333-333333333332',
 '33333333-3333-4333-8333-333333333333',
 '33333333-3333-4333-8333-333333333334',
 '33333333-3333-4333-8333-333333333335',
 '33333333-3333-4333-8333-333333333333/33333333-3333-4333-8333-333333333334/33333333-3333-4333-8333-333333333335.jpg',
 'incerta');
select is((select count(*)::bigint from historietas_privado.objetos_storage_com_reservas()
 where bucket_id='capas-obras-privadas' and name like '33333333-%'),1::bigint,
 'reserva incerta permanece cobrada sem objeto real');
select is((select (metadata->>'size')::bigint from historietas_privado.objetos_storage_com_reservas()
 where bucket_id='capas-obras-privadas' and name like '33333333-%'),2097152::bigint,
 'cobrar 2 MiB conservadores');
select ok(not historietas_privado.upload_storage_dentro_cota('capas-obras-privadas',
 '33333333-3333-4333-8333-333333333333/nova.jpg','100',null),
 'helper ainda nao autoriza uploads privados');
-- Testes focados: dados sinteticos dentro do ROLLBACK, sem IO ou bucket remoto.
-- Uma retencao privada (2 MiB) + 59 capas publicas pequenas = 60 capas.
select set_config('request.jwt.claims',
 '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
insert into storage.objects(bucket_id,name,metadata)
 select 'capas-obras',
   '33333333-3333-4333-8333-333333333333/qa-cota-'||n::text||'.png',
   jsonb_build_object('size',1)
 from generate_series(1,59) n;
select is((select count(*)::bigint from historietas_privado.objetos_storage_com_reservas()
 where name like '33333333-3333-4333-8333-333333333333/%'),60::bigint,
 '59 capas publicas e uma retencao privada: mesmo teto de 60');
select ok(not historietas_privado.upload_storage_dentro_cota('capas-obras',
 '33333333-3333-4333-8333-333333333333/qa-cota-60.png','1',null),
 'helper SQL recusa a 61a capa publica quando ha retencao privada');
select ok(historietas_privado.upload_storage_dentro_cota('capas-obras',
 '33333333-3333-4333-8333-333333333333/qa-cota-1.png','1',null),
 'substituir a mesma capa publica nao aumenta a contagem');
set local role authenticated;
select throws_ok($qa$
 insert into storage.objects(bucket_id,name,metadata) values
 ('capas-obras','33333333-3333-4333-8333-333333333333/qa-cota-60.png',
  jsonb_build_object('size',1))
$qa$,'42501',null,'policy restritiva da tabela Storage recusa a 61a capa');
reset role;

-- O bucket privado existe APENAS no teste transacional local e sofre rollback.
-- Aqui se comprova a uniao objeto fisico + retencao pelo MESMO caminho.
select is((select count(*)::integer from storage.buckets
 where id='capas-obras-privadas'),0,'bucket privado continua ausente no inicio');
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('capas-obras-privadas','capas-obras-privadas',false,2097152,
 array['image/jpeg','image/png','image/webp']::text[]);
savepoint objeto_privado_sintetico;
insert into storage.objects(bucket_id,name,metadata)
 values('capas-obras-privadas',
 '33333333-3333-4333-8333-333333333333/33333333-3333-4333-8333-333333333334/33333333-3333-4333-8333-333333333335.jpg',
 jsonb_build_object('size',100));
select is((select count(*)::bigint from historietas_privado.objetos_storage_com_reservas()
 where bucket_id='capas-obras-privadas'),1::bigint,
 'mesmo caminho fisico e reservado cobra um unico objeto');
select is((select (metadata->>'size')::bigint from historietas_privado.objetos_storage_com_reservas()
 where bucket_id='capas-obras-privadas'),2097152::bigint,
 'a retencao domina metadata fisica menor');
-- Retira apenas a fixture transacional; nunca apaga metadados do Storage.
rollback to objeto_privado_sintetico;
select is((select count(*)::bigint from historietas_privado.objetos_storage_com_reservas()
 where bucket_id='capas-obras-privadas'),1::bigint,
 'retencao incerta sobrevive a ausencia de objeto no inventario');
select * from finish();
rollback;
