-- 20260705_seguindo_usuarios_rls.sql
-- Cria/ajusta RLS para seguir usuários/autores.
-- Compatível com a RPC criar_notificacao_social:
-- - tabela: seguindo_usuarios
-- - colunas: seguidor_id, seguido_id
-- - usuário logado só pode seguir/deixar de seguir com o próprio seguidor_id

begin;

create table if not exists public.seguindo_usuarios (
  id uuid primary key default gen_random_uuid(),
  seguidor_id uuid not null references auth.users(id) on delete cascade,
  seguido_id uuid not null references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),

  constraint seguindo_usuarios_unique unique (seguidor_id, seguido_id),
  constraint seguindo_usuarios_nao_seguir_si_mesmo check (seguidor_id <> seguido_id)
);

create index if not exists seguindo_usuarios_seguidor_id_idx
  on public.seguindo_usuarios (seguidor_id);

create index if not exists seguindo_usuarios_seguido_id_idx
  on public.seguindo_usuarios (seguido_id);

alter table public.seguindo_usuarios enable row level security;

drop policy if exists "seguindo_usuarios_select_publico"
  on public.seguindo_usuarios;

drop policy if exists "seguindo_usuarios_insert_proprio"
  on public.seguindo_usuarios;

drop policy if exists "seguindo_usuarios_delete_proprio"
  on public.seguindo_usuarios;

drop policy if exists "seguindo_usuarios_update_bloqueado"
  on public.seguindo_usuarios;

create policy "seguindo_usuarios_select_publico"
  on public.seguindo_usuarios
  for select
  using (true);

create policy "seguindo_usuarios_insert_proprio"
  on public.seguindo_usuarios
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and seguidor_id = auth.uid()
    and seguido_id <> auth.uid()
  );

create policy "seguindo_usuarios_delete_proprio"
  on public.seguindo_usuarios
  for delete
  to authenticated
  using (
    auth.uid() is not null
    and seguidor_id = auth.uid()
  );

create policy "seguindo_usuarios_update_bloqueado"
  on public.seguindo_usuarios
  for update
  to authenticated
  using (false)
  with check (false);

revoke all on public.seguindo_usuarios from public;
revoke all on public.seguindo_usuarios from anon;

grant select on public.seguindo_usuarios to anon, authenticated;
grant insert, delete on public.seguindo_usuarios to authenticated;

revoke update on public.seguindo_usuarios from anon;
revoke update on public.seguindo_usuarios from authenticated;

commit;