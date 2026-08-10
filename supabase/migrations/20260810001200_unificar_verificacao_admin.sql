begin;

create or replace function public.usuario_e_admin()
returns boolean
language sql
stable
security definer
set search_path to 'pg_catalog', 'public', 'auth', 'pg_temp'
as $$
  with contexto as (
    select
      auth.uid() as usuario_id,
      coalesce(
        auth.jwt() -> 'app_metadata',
        '{}'::jsonb
      ) as app_metadata
  )
  select
    usuario_id is not null
    and (
      lower(btrim(coalesce(app_metadata ->> 'role', '')))
        in ('admin', 'moderador', 'moderator')
      or lower(btrim(coalesce(app_metadata ->> 'cargo', '')))
        in ('admin', 'moderador', 'moderator')
      or lower(btrim(coalesce(app_metadata ->> 'tipo_usuario', '')))
        in ('admin', 'moderador', 'moderator')
      or lower(btrim(coalesce(app_metadata ->> 'admin', '')))
        in ('true', '1', 'sim', 'yes')
      or lower(btrim(coalesce(app_metadata ->> 'is_admin', '')))
        in ('true', '1', 'sim', 'yes')
      or lower(btrim(coalesce(app_metadata ->> 'moderator', '')))
        in ('true', '1', 'sim', 'yes')
      or exists (
        select 1
        from jsonb_array_elements_text(
          case
            when jsonb_typeof(app_metadata -> 'roles') = 'array'
              then app_metadata -> 'roles'
            else '[]'::jsonb
          end
        ) as papel(valor)
        where lower(btrim(papel.valor))
          in ('admin', 'moderador', 'moderator')
      )
    )
  from contexto;
$$;

create or replace function public.comunidade_usuario_e_admin()
returns boolean
language sql
stable
set search_path to 'pg_catalog', 'public'
as $$
  select public.usuario_e_admin();
$$;

create or replace function public.suporte_usuario_e_admin()
returns boolean
language sql
stable
set search_path to 'pg_catalog', 'public'
as $$
  select public.usuario_e_admin();
$$;

revoke all on function public.usuario_e_admin()
  from public, anon;
revoke all on function public.comunidade_usuario_e_admin()
  from public, anon;
revoke all on function public.suporte_usuario_e_admin()
  from public, anon;

grant execute on function public.usuario_e_admin()
  to authenticated;
grant execute on function public.comunidade_usuario_e_admin()
  to authenticated;
grant execute on function public.suporte_usuario_e_admin()
  to authenticated;

comment on function public.usuario_e_admin() is
  'Regra canonica de privilegio administrativo baseada exclusivamente em app_metadata da sessao autenticada.';

comment on function public.comunidade_usuario_e_admin() is
  'Reutiliza a regra canonica de privilegio administrativo de usuario_e_admin().';

comment on function public.suporte_usuario_e_admin() is
  'Reutiliza a regra canonica de privilegio administrativo de usuario_e_admin().';

commit;
