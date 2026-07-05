-- 20260705_notificacoes_rls_select_proprio.sql
-- Garante que o usuário logado consiga ler/atualizar/excluir as próprias notificações.

begin;

alter table public.notificacoes enable row level security;

drop policy if exists "notificacoes_select_proprio" on public.notificacoes;
drop policy if exists "notificacoes_insert_proprio" on public.notificacoes;
drop policy if exists "notificacoes_update_proprio" on public.notificacoes;
drop policy if exists "notificacoes_delete_proprio" on public.notificacoes;

create policy "notificacoes_select_proprio"
  on public.notificacoes
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "notificacoes_insert_proprio"
  on public.notificacoes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "notificacoes_update_proprio"
  on public.notificacoes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "notificacoes_delete_proprio"
  on public.notificacoes
  for delete
  to authenticated
  using (auth.uid() = user_id);

commit;
