-- 20260705_comunidade_interacoes_rls.sql
-- RLS das interações da Comunidade.
-- Leitura pública do feed e escrita restrita ao usuário logado dono do registro.
-- Admin/moderador é validado apenas pelo app_metadata do JWT.

begin;

create or replace function public.comunidade_usuario_e_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() is not null
    and coalesce(
      lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')) in ('admin', 'moderador', 'moderator')
      or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'cargo', '')) in ('admin', 'moderador', 'moderator')
      or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'tipo_usuario', '')) in ('admin', 'moderador', 'moderator')
      or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'admin', '')) = 'true'
      or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'is_admin', '')) = 'true'
      or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'moderator', '')) = 'true'
      or coalesce(auth.jwt() -> 'app_metadata' -> 'roles', '[]'::jsonb) ?| array['admin', 'moderador', 'moderator'],
      false
    );
$$;

revoke all on function public.comunidade_usuario_e_admin() from public;
revoke all on function public.comunidade_usuario_e_admin() from anon;
grant execute on function public.comunidade_usuario_e_admin() to authenticated;

alter table if exists public.comunidade_posts enable row level security;
alter table if exists public.comunidade_comentarios enable row level security;
alter table if exists public.comunidade_curtidas enable row level security;
alter table if exists public.comunidade_comentario_curtidas enable row level security;
alter table if exists public.comunidade_enquete_votos enable row level security;
alter table if exists public.comunidade_salvos enable row level security;
alter table if exists public.comunidade_post_salvos enable row level security;
alter table if exists public.comunidade_denuncias enable row level security;

do $$
begin
  if to_regclass('public.comunidade_posts') is not null then
    drop policy if exists "comunidade_posts_select_publico" on public.comunidade_posts;
    drop policy if exists "comunidade_posts_insert_proprio" on public.comunidade_posts;
    drop policy if exists "comunidade_posts_update_proprio" on public.comunidade_posts;
    drop policy if exists "comunidade_posts_delete_proprio" on public.comunidade_posts;

    create policy "comunidade_posts_select_publico"
      on public.comunidade_posts
      for select
      using (true);

    create policy "comunidade_posts_insert_proprio"
      on public.comunidade_posts
      for insert
      to authenticated
      with check (
        auth.uid() is not null
        and autor_id = auth.uid()
      );

    create policy "comunidade_posts_update_proprio"
      on public.comunidade_posts
      for update
      to authenticated
      using (
        auth.uid() is not null
        and (
          autor_id = auth.uid()
          or public.comunidade_usuario_e_admin()
        )
      )
      with check (
        auth.uid() is not null
        and (
          autor_id = auth.uid()
          or public.comunidade_usuario_e_admin()
        )
      );

    create policy "comunidade_posts_delete_proprio"
      on public.comunidade_posts
      for delete
      to authenticated
      using (
        auth.uid() is not null
        and (
          autor_id = auth.uid()
          or public.comunidade_usuario_e_admin()
        )
      );

    revoke all on public.comunidade_posts from public;
    grant select on public.comunidade_posts to anon, authenticated;
    grant insert, update, delete on public.comunidade_posts to authenticated;
  end if;
end $$;

do $$
begin
  if to_regclass('public.comunidade_comentarios') is not null then
    drop policy if exists "comunidade_comentarios_select_publico" on public.comunidade_comentarios;
    drop policy if exists "comunidade_comentarios_insert_proprio" on public.comunidade_comentarios;
    drop policy if exists "comunidade_comentarios_update_proprio" on public.comunidade_comentarios;
    drop policy if exists "comunidade_comentarios_delete_proprio" on public.comunidade_comentarios;

    create policy "comunidade_comentarios_select_publico"
      on public.comunidade_comentarios
      for select
      using (true);

    create policy "comunidade_comentarios_insert_proprio"
      on public.comunidade_comentarios
      for insert
      to authenticated
      with check (
        auth.uid() is not null
        and autor_id = auth.uid()
      );

    create policy "comunidade_comentarios_update_proprio"
      on public.comunidade_comentarios
      for update
      to authenticated
      using (
        auth.uid() is not null
        and autor_id = auth.uid()
      )
      with check (
        auth.uid() is not null
        and autor_id = auth.uid()
      );

    create policy "comunidade_comentarios_delete_proprio"
      on public.comunidade_comentarios
      for delete
      to authenticated
      using (
        auth.uid() is not null
        and (
          autor_id = auth.uid()
          or public.comunidade_usuario_e_admin()
        )
      );

    revoke all on public.comunidade_comentarios from public;
    grant select on public.comunidade_comentarios to anon, authenticated;
    grant insert, update, delete on public.comunidade_comentarios to authenticated;
  end if;
end $$;

do $$
begin
  if to_regclass('public.comunidade_curtidas') is not null then
    drop policy if exists "comunidade_curtidas_select_publico" on public.comunidade_curtidas;
    drop policy if exists "comunidade_curtidas_insert_proprio" on public.comunidade_curtidas;
    drop policy if exists "comunidade_curtidas_delete_proprio" on public.comunidade_curtidas;

    create unique index if not exists comunidade_curtidas_post_usuario_uidx
      on public.comunidade_curtidas (post_id, usuario_id);

    create policy "comunidade_curtidas_select_publico"
      on public.comunidade_curtidas
      for select
      using (true);

    create policy "comunidade_curtidas_insert_proprio"
      on public.comunidade_curtidas
      for insert
      to authenticated
      with check (
        auth.uid() is not null
        and usuario_id = auth.uid()
      );

    create policy "comunidade_curtidas_delete_proprio"
      on public.comunidade_curtidas
      for delete
      to authenticated
      using (
        auth.uid() is not null
        and usuario_id = auth.uid()
      );

    revoke all on public.comunidade_curtidas from public;
    grant select on public.comunidade_curtidas to anon, authenticated;
    grant insert, delete on public.comunidade_curtidas to authenticated;
  end if;
end $$;

do $$
begin
  if to_regclass('public.comunidade_comentario_curtidas') is not null then
    drop policy if exists "comunidade_comentario_curtidas_select_publico" on public.comunidade_comentario_curtidas;
    drop policy if exists "comunidade_comentario_curtidas_insert_proprio" on public.comunidade_comentario_curtidas;
    drop policy if exists "comunidade_comentario_curtidas_delete_proprio" on public.comunidade_comentario_curtidas;

    create unique index if not exists comunidade_comentario_curtidas_comentario_usuario_uidx
      on public.comunidade_comentario_curtidas (comentario_id, usuario_id);

    create policy "comunidade_comentario_curtidas_select_publico"
      on public.comunidade_comentario_curtidas
      for select
      using (true);

    create policy "comunidade_comentario_curtidas_insert_proprio"
      on public.comunidade_comentario_curtidas
      for insert
      to authenticated
      with check (
        auth.uid() is not null
        and usuario_id = auth.uid()
      );

    create policy "comunidade_comentario_curtidas_delete_proprio"
      on public.comunidade_comentario_curtidas
      for delete
      to authenticated
      using (
        auth.uid() is not null
        and usuario_id = auth.uid()
      );

    revoke all on public.comunidade_comentario_curtidas from public;
    grant select on public.comunidade_comentario_curtidas to anon, authenticated;
    grant insert, delete on public.comunidade_comentario_curtidas to authenticated;
  end if;
end $$;

do $$
begin
  if to_regclass('public.comunidade_enquete_votos') is not null then
    drop policy if exists "comunidade_enquete_votos_select_publico" on public.comunidade_enquete_votos;
    drop policy if exists "comunidade_enquete_votos_insert_proprio" on public.comunidade_enquete_votos;
    drop policy if exists "comunidade_enquete_votos_update_proprio" on public.comunidade_enquete_votos;
    drop policy if exists "comunidade_enquete_votos_delete_proprio" on public.comunidade_enquete_votos;

    create unique index if not exists comunidade_enquete_votos_post_usuario_uidx
      on public.comunidade_enquete_votos (post_id, user_id);

    create policy "comunidade_enquete_votos_select_publico"
      on public.comunidade_enquete_votos
      for select
      using (true);

    create policy "comunidade_enquete_votos_insert_proprio"
      on public.comunidade_enquete_votos
      for insert
      to authenticated
      with check (
        auth.uid() is not null
        and user_id = auth.uid()
      );

    create policy "comunidade_enquete_votos_update_proprio"
      on public.comunidade_enquete_votos
      for update
      to authenticated
      using (
        auth.uid() is not null
        and user_id = auth.uid()
      )
      with check (
        auth.uid() is not null
        and user_id = auth.uid()
      );

    create policy "comunidade_enquete_votos_delete_proprio"
      on public.comunidade_enquete_votos
      for delete
      to authenticated
      using (
        auth.uid() is not null
        and user_id = auth.uid()
      );

    revoke all on public.comunidade_enquete_votos from public;
    grant select on public.comunidade_enquete_votos to anon, authenticated;
    grant insert, update, delete on public.comunidade_enquete_votos to authenticated;
  end if;
end $$;

do $$
begin
  if to_regclass('public.comunidade_salvos') is not null then
    drop policy if exists "comunidade_salvos_select_proprio" on public.comunidade_salvos;
    drop policy if exists "comunidade_salvos_insert_proprio" on public.comunidade_salvos;
    drop policy if exists "comunidade_salvos_delete_proprio" on public.comunidade_salvos;

    create unique index if not exists comunidade_salvos_post_usuario_uidx
      on public.comunidade_salvos (post_id, user_id);

    create policy "comunidade_salvos_select_proprio"
      on public.comunidade_salvos
      for select
      to authenticated
      using (
        auth.uid() is not null
        and user_id = auth.uid()
      );

    create policy "comunidade_salvos_insert_proprio"
      on public.comunidade_salvos
      for insert
      to authenticated
      with check (
        auth.uid() is not null
        and user_id = auth.uid()
      );

    create policy "comunidade_salvos_delete_proprio"
      on public.comunidade_salvos
      for delete
      to authenticated
      using (
        auth.uid() is not null
        and user_id = auth.uid()
      );

    revoke all on public.comunidade_salvos from public;
    revoke all on public.comunidade_salvos from anon;
    grant select, insert, delete on public.comunidade_salvos to authenticated;
  end if;
end $$;

do $$
begin
  if to_regclass('public.comunidade_post_salvos') is not null then
    drop policy if exists "comunidade_post_salvos_select_proprio" on public.comunidade_post_salvos;
    drop policy if exists "comunidade_post_salvos_insert_proprio" on public.comunidade_post_salvos;
    drop policy if exists "comunidade_post_salvos_delete_proprio" on public.comunidade_post_salvos;

    create unique index if not exists comunidade_post_salvos_post_usuario_uidx
      on public.comunidade_post_salvos (post_id, user_id);

    create policy "comunidade_post_salvos_select_proprio"
      on public.comunidade_post_salvos
      for select
      to authenticated
      using (
        auth.uid() is not null
        and user_id = auth.uid()
      );

    create policy "comunidade_post_salvos_insert_proprio"
      on public.comunidade_post_salvos
      for insert
      to authenticated
      with check (
        auth.uid() is not null
        and user_id = auth.uid()
      );

    create policy "comunidade_post_salvos_delete_proprio"
      on public.comunidade_post_salvos
      for delete
      to authenticated
      using (
        auth.uid() is not null
        and user_id = auth.uid()
      );

    revoke all on public.comunidade_post_salvos from public;
    revoke all on public.comunidade_post_salvos from anon;
    grant select, insert, delete on public.comunidade_post_salvos to authenticated;
  end if;
end $$;

do $$
begin
  if to_regclass('public.comunidade_denuncias') is not null then
    drop policy if exists "comunidade_denuncias_select_admin" on public.comunidade_denuncias;
    drop policy if exists "comunidade_denuncias_insert_proprio" on public.comunidade_denuncias;
    drop policy if exists "comunidade_denuncias_update_admin" on public.comunidade_denuncias;
    drop policy if exists "comunidade_denuncias_delete_admin" on public.comunidade_denuncias;

    create unique index if not exists comunidade_denuncias_alvo_denunciante_uidx
      on public.comunidade_denuncias (alvo_tipo, alvo_id, denunciante_id);

    create policy "comunidade_denuncias_select_admin"
      on public.comunidade_denuncias
      for select
      to authenticated
      using (
        auth.uid() is not null
        and public.comunidade_usuario_e_admin()
      );

    create policy "comunidade_denuncias_insert_proprio"
      on public.comunidade_denuncias
      for insert
      to authenticated
      with check (
        auth.uid() is not null
        and denunciante_id = auth.uid()
      );

    create policy "comunidade_denuncias_update_admin"
      on public.comunidade_denuncias
      for update
      to authenticated
      using (
        auth.uid() is not null
        and public.comunidade_usuario_e_admin()
      )
      with check (
        auth.uid() is not null
        and public.comunidade_usuario_e_admin()
      );

    create policy "comunidade_denuncias_delete_admin"
      on public.comunidade_denuncias
      for delete
      to authenticated
      using (
        auth.uid() is not null
        and public.comunidade_usuario_e_admin()
      );

    revoke all on public.comunidade_denuncias from public;
    revoke all on public.comunidade_denuncias from anon;
    grant insert on public.comunidade_denuncias to authenticated;
    grant select, update, delete on public.comunidade_denuncias to authenticated;
  end if;
end $$;

commit;