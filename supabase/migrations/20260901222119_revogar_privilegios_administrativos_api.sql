begin;

set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- As roles da Data API precisam somente dos privilegios funcionais concedidos
-- deliberadamente. RLS nao restringe TRUNCATE e nao justifica permitir que
-- clientes criem triggers, referencias ou executem manutencao nas tabelas.
revoke truncate, trigger, references, maintain
on all tables in schema public
from anon, authenticated;

-- Evita que migrations futuras executadas pelo owner postgres restaurem os
-- mesmos privilegios nas novas tabelas de public.
alter default privileges for role postgres in schema public
  revoke truncate, trigger, references, maintain
  on tables
  from anon, authenticated;

do $validation$
declare
  residual_grant text;
begin
  -- has_table_privilege verifica o acesso efetivo, inclusive grants herdados
  -- ou recebidos por PUBLIC, e nao apenas a ACL direta de cada role.
  select format(
    '%I.%I (%s: %s)',
    namespace_row.nspname,
    relation_row.relname,
    target_role.role_name,
    target_privilege.privilege_name
  )
  into residual_grant
  from pg_catalog.pg_class relation_row
  join pg_catalog.pg_namespace namespace_row
    on namespace_row.oid = relation_row.relnamespace
  cross join (
    values ('anon'), ('authenticated')
  ) as target_role(role_name)
  cross join (
    values
      ('TRUNCATE'),
      ('TRIGGER'),
      ('REFERENCES'),
      ('MAINTAIN')
  ) as target_privilege(privilege_name)
  where namespace_row.nspname = 'public'
    and relation_row.relkind in ('r', 'p', 'v', 'm', 'f')
    and pg_catalog.has_table_privilege(
      target_role.role_name,
      relation_row.oid,
      target_privilege.privilege_name
    )
  limit 1;

  if residual_grant is not null then
    raise exception
      'privilegio administrativo residual em public: %',
      residual_grant;
  end if;

  if exists (
    select 1
    from pg_catalog.pg_default_acl default_acl
    join pg_catalog.pg_roles owner_role
      on owner_role.oid = default_acl.defaclrole
    join pg_catalog.pg_namespace namespace_row
      on namespace_row.oid = default_acl.defaclnamespace
    cross join lateral pg_catalog.aclexplode(default_acl.defaclacl) acl_entry
    join pg_catalog.pg_roles grantee_role
      on grantee_role.oid = acl_entry.grantee
    where owner_role.rolname = 'postgres'
      and namespace_row.nspname = 'public'
      and default_acl.defaclobjtype = 'r'
      and grantee_role.rolname in ('anon', 'authenticated')
      and acl_entry.privilege_type in (
        'TRUNCATE',
        'TRIGGER',
        'REFERENCES',
        'MAINTAIN'
      )
  ) then
    raise exception
      'privilegio administrativo residual nos defaults de postgres.public';
  end if;
end
$validation$;

commit;
