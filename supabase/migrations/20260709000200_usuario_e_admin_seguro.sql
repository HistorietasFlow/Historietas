-- 20260709_usuario_e_admin_seguro.sql
-- Corrige a RPC de admin para confiar apenas em app_metadata.
-- Não confia em user_metadata nem em colunas editáveis de profiles.
-- Aceita role/cargo/tipo_usuario e também flags booleanas admin/is_admin em app_metadata.

begin;

create or replace function public.usuario_e_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  usuario_atual uuid := auth.uid();
  jwt_atual jsonb := coalesce(auth.jwt(), '{}'::jsonb);
  app_metadata_atual jsonb := coalesce(jwt_atual -> 'app_metadata', '{}'::jsonb);
  role_app text := lower(coalesce(app_metadata_atual ->> 'role', ''));
  cargo_app text := lower(coalesce(app_metadata_atual ->> 'cargo', ''));
  tipo_usuario_app text := lower(coalesce(app_metadata_atual ->> 'tipo_usuario', ''));
  admin_app text := lower(coalesce(app_metadata_atual ->> 'admin', ''));
  is_admin_app text := lower(coalesce(app_metadata_atual ->> 'is_admin', ''));
begin
  if usuario_atual is null then
    return false;
  end if;

  return
    role_app in ('admin', 'moderador', 'moderator')
    or cargo_app in ('admin', 'moderador', 'moderator')
    or tipo_usuario_app in ('admin', 'moderador', 'moderator')
    or admin_app in ('true', '1', 'sim', 'yes')
    or is_admin_app in ('true', '1', 'sim', 'yes');
end;
$$;

revoke all on function public.usuario_e_admin() from public;
revoke all on function public.usuario_e_admin() from anon;
grant execute on function public.usuario_e_admin() to authenticated;

commit;