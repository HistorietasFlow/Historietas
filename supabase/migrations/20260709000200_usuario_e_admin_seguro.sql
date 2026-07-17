-- 20260709000200_usuario_e_admin_seguro.sql
-- Verifica privilégios administrativos usando somente app_metadata do JWT.
-- Não confia em user_metadata nem em campos editáveis da tabela profiles.

begin;

create or replace function public.usuario_e_admin()
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog
as $$
  with contexto as (
    select
      auth.uid() as usuario_id,
      coalesce(auth.jwt() -> 'app_metadata', '{}'::jsonb) as app_metadata
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
    )
  from contexto;
$$;

comment on function public.usuario_e_admin() is
  'Retorna true somente quando o usuário autenticado possui privilégio administrativo em app_metadata.';

revoke all
  on function public.usuario_e_admin()
  from public, anon, authenticated;

grant execute
  on function public.usuario_e_admin()
  to authenticated;

commit;