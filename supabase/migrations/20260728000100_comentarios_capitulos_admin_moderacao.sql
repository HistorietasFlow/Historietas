-- 20260728000100_comentarios_capitulos_admin_moderacao.sql
-- Permite que administradores e moderadores analisem e removam
-- comentários de capítulos denunciados no painel de moderação.

begin;

do $$
begin
  if to_regclass('public.comentarios_capitulos') is null then
    raise exception
      'A tabela public.comentarios_capitulos precisa existir antes desta migration.';
  end if;

  if to_regprocedure('public.usuario_e_admin()') is null then
    raise exception
      'A função public.usuario_e_admin() precisa existir antes desta migration.';
  end if;
end
$$;

alter table public.comentarios_capitulos
  enable row level security;

-- Mantém a política de leitura pública/proprietário existente e acrescenta
-- uma política permissiva exclusiva para administração e moderação.
drop policy if exists "comentarios_capitulos_select_admin_moderacao"
  on public.comentarios_capitulos;

create policy "comentarios_capitulos_select_admin_moderacao"
  on public.comentarios_capitulos
  for select
  to authenticated
  using (
    public.usuario_e_admin()
  );

-- Substitui a remoção limitada ao autor por uma regra que também permite
-- a remoção administrativa de comentários denunciados.
drop policy if exists "comentarios_capitulos_delete_proprio"
  on public.comentarios_capitulos;

drop policy if exists "comentarios_capitulos_delete_proprio_ou_admin"
  on public.comentarios_capitulos;

create policy "comentarios_capitulos_delete_proprio_ou_admin"
  on public.comentarios_capitulos
  for delete
  to authenticated
  using (
    auth.uid() is not null
    and (
      user_id = auth.uid()
      or public.usuario_e_admin()
    )
  );

-- Garante os privilégios de tabela necessários. As políticas RLS continuam
-- decidindo quais registros cada usuário autenticado pode acessar ou remover.
grant select, delete
  on public.comentarios_capitulos
  to authenticated;

commit;