-- 20260705_notificacoes_rls_select_proprio.sql
-- Mantém as notificações privadas e acessíveis somente pelo próprio usuário.
-- A criação de notificações fica restrita às RPCs SECURITY DEFINER do projeto.
-- O cliente pode apenas ler, marcar como lida e excluir as próprias notificações.

begin;

do $$
declare
  v_policy record;
begin
  -- Algumas instalações podem aplicar esta migration antes da criação da tabela.
  -- Nesse caso, encerra sem quebrar a sequência de migrations.
  if to_regclass('public.notificacoes') is null then
    return;
  end if;

  alter table public.notificacoes enable row level security;

  -- Policies permissivas são combinadas com OR. Remove todas as antigas para
  -- impedir que uma regra esquecida reabra o acesso às notificações.
  for v_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'notificacoes'
  loop
    execute format(
      'drop policy if exists %I on public.notificacoes',
      v_policy.policyname
    );
  end loop;

  create policy "notificacoes_select_proprio"
    on public.notificacoes
    for select
    to authenticated
    using (
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

  -- Bloqueia acesso direto genérico, inclusive INSERT pelo cliente.
  -- As RPCs SECURITY DEFINER continuam responsáveis pela criação.
  revoke all on public.notificacoes from public;
  revoke all on public.notificacoes from anon;
  revoke all on public.notificacoes from authenticated;

  grant select on public.notificacoes to authenticated;
  grant delete on public.notificacoes to authenticated;

  -- O cliente pode alterar somente o estado de leitura.
  grant update (lida) on public.notificacoes to authenticated;
end
$$;

commit;