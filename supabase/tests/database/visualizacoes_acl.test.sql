begin;

select plan(14);

select ok(
  has_function_privilege('service_role', assinatura, 'EXECUTE'),
  'servidor pode executar ' || assinatura
) from (values
  ('public.registrar_visualizacao_obra(uuid,text)'),
  ('public.registrar_visualizacao_capitulo(uuid,text)')
) as rpc(assinatura);

select ok(
  not has_function_privilege(papel, assinatura, 'EXECUTE'),
  papel || ' nao pode executar ' || assinatura
) from (values ('anon'), ('authenticated')) as cliente(papel)
cross join (values
  ('public.registrar_visualizacao_obra(uuid,text)'),
  ('public.registrar_visualizacao_capitulo(uuid,text)')
) as rpc(assinatura);

select ok(
  not exists (
    select 1 from pg_proc p,
      lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
    where p.oid = assinatura::regprocedure
      and acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
  ),
  'PUBLIC nao pode executar ' || assinatura
) from (values
  ('public.registrar_visualizacao_obra(uuid,text)'),
  ('public.registrar_visualizacao_capitulo(uuid,text)')
) as rpc(assinatura);

select ok(
  not has_function_privilege(papel, assinatura, 'EXECUTE'),
  papel || ' continua sem RPC legado ' || assinatura
) from (values ('anon'), ('authenticated'), ('service_role')) as cliente(papel)
cross join (values
  ('public.incrementar_visualizacao_obra(uuid)'),
  ('public.incrementar_visualizacao_capitulo(uuid)')
) as rpc(assinatura);

select * from finish();
rollback;
