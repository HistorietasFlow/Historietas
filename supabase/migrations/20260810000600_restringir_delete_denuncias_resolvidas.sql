-- Mantem a regra de remocao do painel tambem no banco:
-- administradores/moderadores autenticados so podem excluir denuncias resolvidas.

drop policy if exists comunidade_denuncias_delete_admin
  on public.comunidade_denuncias;

create policy comunidade_denuncias_delete_admin
  on public.comunidade_denuncias
  for delete
  to authenticated
  using (
    public.usuario_e_admin()
    and status = 'resolvida'
  );

drop policy if exists denuncias_perfis_delete_admin
  on public.denuncias_perfis;

create policy denuncias_perfis_delete_admin
  on public.denuncias_perfis
  for delete
  to authenticated
  using (
    public.usuario_e_admin()
    and status = 'resolvida'
  );

comment on policy comunidade_denuncias_delete_admin
  on public.comunidade_denuncias
  is 'Permite excluir do painel somente denuncias de conteudo resolvidas por administrador ou moderador autenticado.';

comment on policy denuncias_perfis_delete_admin
  on public.denuncias_perfis
  is 'Permite excluir do painel somente denuncias de perfil resolvidas por administrador ou moderador autenticado.';