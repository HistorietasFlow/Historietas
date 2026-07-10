-- 20260710_comentarios_obras_rls.sql
-- Comentários públicos das obras.
-- Compatível com app/obra/[slug]/ObraDinamicaClient.tsx:
-- - tabela: public.comentarios_obras
-- - colunas: id, obra_id, user_id, comentario, criado_em
-- - leitura pública somente para obras publicadas
-- - dono da obra pode visualizar comentários da própria obra não publicada
-- - escrita e remoção restritas ao usuário autenticado dono do comentário
-- - administradores/moderadores podem remover comentários

begin;

create extension if not exists pgcrypto;

create table if not exists public.comentarios_obras (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  comentario text not null,
  criado_em timestamptz not null default now(),

  constraint comentarios_obras_comentario_tamanho_check
    check (char_length(btrim(comentario)) between 2 and 600)
);

create index if not exists comentarios_obras_obra_criado_em_idx
  on public.comentarios_obras (obra_id, criado_em desc);

create index if not exists comentarios_obras_user_id_idx
  on public.comentarios_obras (user_id);

alter table public.comentarios_obras enable row level security;

drop policy if exists "comentarios_obras_select_publicadas_ou_proprias"
  on public.comentarios_obras;

drop policy if exists "comentarios_obras_insert_proprio"
  on public.comentarios_obras;

drop policy if exists "comentarios_obras_delete_proprio_ou_admin"
  on public.comentarios_obras;

drop policy if exists "comentarios_obras_update_bloqueado"
  on public.comentarios_obras;

create policy "comentarios_obras_select_publicadas_ou_proprias"
  on public.comentarios_obras
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.obras obra
      where obra.id = comentarios_obras.obra_id
        and (
          coalesce(obra.publicado, false) = true
          or (
            auth.uid() is not null
            and obra.user_id = auth.uid()
          )
        )
    )
  );

create policy "comentarios_obras_insert_proprio"
  on public.comentarios_obras
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and char_length(btrim(comentario)) between 2 and 600
    and exists (
      select 1
      from public.obras obra
      where obra.id = comentarios_obras.obra_id
        and (
          coalesce(obra.publicado, false) = true
          or obra.user_id = auth.uid()
        )
    )
  );

create policy "comentarios_obras_delete_proprio_ou_admin"
  on public.comentarios_obras
  for delete
  to authenticated
  using (
    auth.uid() is not null
    and (
      user_id = auth.uid()
      or public.usuario_e_admin()
    )
  );

create policy "comentarios_obras_update_bloqueado"
  on public.comentarios_obras
  for update
  to authenticated
  using (false)
  with check (false);

revoke all on public.comentarios_obras from public;
revoke all on public.comentarios_obras from anon;
revoke all on public.comentarios_obras from authenticated;

grant select on public.comentarios_obras to anon, authenticated;
grant insert, delete on public.comentarios_obras to authenticated;

commit;