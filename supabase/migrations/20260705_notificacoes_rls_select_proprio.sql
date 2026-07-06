-- 20260705_notificacoes_rls_select_proprio.sql
-- Garante que o usuário logado consiga ler/atualizar/excluir as próprias notificações.
-- Mantém notificações privadas por usuário e remove policies duplicadas/inseguras.

begin;

alter table if exists public.notificacoes enable row level security;

-- Remove versões duplicadas/antigas da mesma regra.
drop policy if exists "notificacoes_select_proprio" on public.notificacoes;
drop policy if exists "notificacoes_select_proprias" on public.notificacoes;
drop policy if exists "notificacoes_insert_proprio" on public.notificacoes;
drop policy if exists "notificacoes_insert_proprias" on public.notificacoes;
drop policy if exists "notificacoes_insert_autenticado" on public.notificacoes;
drop policy if exists "notificacoes_update_proprio" on public.notificacoes;
drop policy if exists "notificacoes_update_proprias" on public.notificacoes;
drop policy if exists "notificacoes_delete_proprio" on public.notificacoes;
drop policy if exists "notificacoes_delete_proprias" on public.notificacoes;

create policy "notificacoes_select_proprio"
  on public.notificacoes
  for select
  to authenticated
  using (
    auth.uid() is not null
    and user_id::text = auth.uid()::text
  );

create policy "notificacoes_insert_proprio"
  on public.notificacoes
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and user_id::text = auth.uid()::text
  );

create policy "notificacoes_update_proprio"
  on public.notificacoes
  for update
  to authenticated
  using (
    auth.uid() is not null
    and user_id::text = auth.uid()::text
  )
  with check (
    auth.uid() is not null
    and user_id::text = auth.uid()::text
  );

create policy "notificacoes_delete_proprio"
  on public.notificacoes
  for delete
  to authenticated
  using (
    auth.uid() is not null
    and user_id::text = auth.uid()::text
  );

-- Garante permissões SQL para o papel autenticado.
-- A proteção real continua sendo feita pelas policies acima.
grant select, insert, update, delete on public.notificacoes to authenticated;

-- Anônimos não devem acessar notificações.
revoke all on public.notificacoes from anon;

commit;
