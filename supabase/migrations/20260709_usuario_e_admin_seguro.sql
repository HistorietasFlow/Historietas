-- 20260709_usuario_e_admin_seguro.sql
-- Corrige a RPC de admin para confiar apenas em app_metadata.
-- Não confia em user_metadata nem em colunas editáveis de profiles.

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
  role_app text := lower(coalesce(jwt_atual -> 'app_metadata' ->> 'role', ''));
  cargo_app text := lower(coalesce(jwt_atual -> 'app_metadata' ->> 'cargo', ''));
  tipo_usuario_app text := lower(coalesce(jwt_atual -> 'app_metadata' ->> 'tipo_usuario', ''));
begin
  if usuario_atual is null then
    return false;
  end if;

  return
    role_app in ('admin', 'moderador', 'moderator')
    or cargo_app in ('admin', 'moderador', 'moderator')
    or tipo_usuario_app in ('admin', 'moderador', 'moderator');
end;
$$;

revoke all on function public.usuario_e_admin() from public;
revoke all on function public.usuario_e_admin() from anon;
grant execute on function public.usuario_e_admin() to authenticated;

commit;