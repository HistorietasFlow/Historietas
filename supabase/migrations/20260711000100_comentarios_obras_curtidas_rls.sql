-- 20260711000100_comentarios_obras_curtidas_rls.sql
-- Curtidas públicas em comentários de obras.
-- Cada usuário autenticado pode curtir uma vez e remover somente a própria curtida.

begin;

create extension if not exists pgcrypto;

create table if not exists public.comentarios_obras_curtidas (
  id uuid primary key default gen_random_uuid(),
  comentario_id uuid not null references public.comentarios_obras(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),

  constraint comentarios_obras_curtidas_comentario_usuario_unique
    unique (comentario_id, usuario_id)
);

create index if not exists comentarios_obras_curtidas_comentario_id_idx
  on public.comentarios_obras_curtidas (comentario_id);

create index if not exists comentarios_obras_curtidas_usuario_id_idx
  on public.comentarios_obras_curtidas (usuario_id);

alter table public.comentarios_obras_curtidas enable row level security;

drop policy if exists "comentarios_obras_curtidas_select_publico"
  on public.comentarios_obras_curtidas;

drop policy if exists "comentarios_obras_curtidas_insert_proprio"
  on public.comentarios_obras_curtidas;

drop policy if exists "comentarios_obras_curtidas_delete_proprio"
  on public.comentarios_obras_curtidas;

drop policy if exists "comentarios_obras_curtidas_update_bloqueado"
  on public.comentarios_obras_curtidas;

create policy "comentarios_obras_curtidas_select_publico"
  on public.comentarios_obras_curtidas
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.comentarios_obras comentario
      join public.obras obra on obra.id = comentario.obra_id
      where comentario.id = comentarios_obras_curtidas.comentario_id
        and coalesce(obra.publicado, false) = true
    )
  );

create policy "comentarios_obras_curtidas_insert_proprio"
  on public.comentarios_obras_curtidas
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and usuario_id = auth.uid()
    and exists (
      select 1
      from public.comentarios_obras comentario
      join public.obras obra on obra.id = comentario.obra_id
      where comentario.id = comentarios_obras_curtidas.comentario_id
        and (
          coalesce(obra.publicado, false) = true
          or obra.user_id = auth.uid()
        )
    )
  );

create policy "comentarios_obras_curtidas_delete_proprio"
  on public.comentarios_obras_curtidas
  for delete
  to authenticated
  using (
    auth.uid() is not null
    and usuario_id = auth.uid()
  );

create policy "comentarios_obras_curtidas_update_bloqueado"
  on public.comentarios_obras_curtidas
  for update
  to authenticated
  using (false)
  with check (false);

revoke all on public.comentarios_obras_curtidas from public;
revoke all on public.comentarios_obras_curtidas from anon;
revoke all on public.comentarios_obras_curtidas from authenticated;

grant select on public.comentarios_obras_curtidas to anon, authenticated;
grant insert, delete on public.comentarios_obras_curtidas to authenticated;

commit;