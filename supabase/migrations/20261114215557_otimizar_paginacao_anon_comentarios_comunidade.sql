begin;

set local lock_timeout = '5s';
set local statement_timeout = '60s';

do $preconditions$
declare
  policy_roles name[];
begin
  select array_agg(role_name.rolname order by role_name.rolname)
  into policy_roles
  from pg_catalog.pg_policy policy
  cross join lateral pg_catalog.unnest(policy.polroles) role_oid
  join pg_catalog.pg_roles role_name on role_name.oid = role_oid
  where policy.polrelid = 'public.comunidade_comentarios'::regclass
    and policy.polname = 'comunidade_comentarios_select_visivel_sem_bloqueio';

  if policy_roles is distinct from array['anon'::name, 'authenticated'::name] then
    raise exception
      'Policy de comentarios inesperada antes da otimizacao: roles=%.',
      policy_roles;
  end if;

  if to_regprocedure(
    'historietas_privado.comunidade_pode_ver_post(uuid)'
  ) is null
     or to_regprocedure(
       'historietas_privado.comunidade_pode_ver_comentario(uuid)'
     ) is null then
    raise exception 'Helpers privados de visibilidade da Comunidade ausentes.';
  end if;
end;
$preconditions$;

-- Para anon, auth.uid() e sempre null. Nesse caso, a regra atual de
-- comunidade_pode_ver_comentario(id) e equivalente a verificar diretamente
-- a visibilidade do post_id, sem reler o proprio comentario por chave primaria.
-- Authenticated conserva integralmente a funcao que tambem valida bloqueios
-- entre a identidade atual e o autor de cada comentario.
alter policy "comunidade_comentarios_select_visivel_sem_bloqueio"
on public.comunidade_comentarios
to authenticated
using (
  historietas_privado.comunidade_pode_ver_comentario(id)
);

create policy "comunidade_comentarios_select_post_visivel_anon"
on public.comunidade_comentarios
for select
to anon
using (
  historietas_privado.comunidade_pode_ver_post(post_id)
);

comment on policy "comunidade_comentarios_select_post_visivel_anon"
on public.comunidade_comentarios is
  'Anon consulta somente a visibilidade do post; bloqueios por identidade continuam exclusivos da policy authenticated.';

do $postconditions$
begin
  if not exists (
    select 1
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'comunidade_comentarios'
      and policyname = 'comunidade_comentarios_select_visivel_sem_bloqueio'
      and roles = array['authenticated'::name]
      and cmd = 'SELECT'
  ) then
    raise exception 'Policy authenticated de comentarios nao foi preservada.';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'comunidade_comentarios'
      and policyname = 'comunidade_comentarios_select_post_visivel_anon'
      and roles = array['anon'::name]
      and cmd = 'SELECT'
  ) then
    raise exception 'Policy anon otimizada de comentarios nao foi criada.';
  end if;
end;
$postconditions$;

commit;
