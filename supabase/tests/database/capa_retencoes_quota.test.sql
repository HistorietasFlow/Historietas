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
select * from finish();
rollback;
