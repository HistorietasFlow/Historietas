-- 20260705_comunidade_interacoes_rls.sql
-- RLS das interações da Comunidade.
-- Mantém leitura pública do feed e restringe alterações ao dono do registro.
-- Admin/moderador é validado exclusivamente pelo app_metadata do JWT.

begin;

create or replace function public.comunidade_usuario_e_admin()
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  with contexto as (
    select
      auth.uid() as usuario_id,
      coalesce(
        auth.jwt() -> 'app_metadata',
        '{}'::jsonb
      ) as app_metadata
  )
  select
    usuario_id is not null
    and (
      lower(btrim(coalesce(app_metadata ->> 'role', '')))
        in ('admin', 'moderador', 'moderator')
      or lower(btrim(coalesce(app_metadata ->> 'cargo', '')))
        in ('admin', 'moderador', 'moderator')
      or lower(btrim(coalesce(app_metadata ->> 'tipo_usuario', '')))
        in ('admin', 'moderador', 'moderator')
      or lower(btrim(coalesce(app_metadata ->> 'admin', '')))
        in ('true', '1', 'sim', 'yes')
      or lower(btrim(coalesce(app_metadata ->> 'is_admin', '')))
        in ('true', '1', 'sim', 'yes')
      or lower(btrim(coalesce(app_metadata ->> 'moderator', '')))
        in ('true', '1', 'sim', 'yes')
      or exists (
        select 1
        from jsonb_array_elements_text(
          case
            when jsonb_typeof(app_metadata -> 'roles') = 'array'
              then app_metadata -> 'roles'
            else '[]'::jsonb
          end
        ) as papel(valor)
        where lower(btrim(papel.valor))
          in ('admin', 'moderador', 'moderator')
      )
    )
  from contexto;
$$;

comment on function public.comunidade_usuario_e_admin() is
  'Retorna true somente para usuários autenticados com privilégio administrativo em app_metadata.';

revoke all
  on function public.comunidade_usuario_e_admin()
  from public, anon, authenticated;

grant execute
  on function public.comunidade_usuario_e_admin()
  to authenticated;

alter table if exists public.comunidade_posts
  enable row level security;

alter table if exists public.comunidade_comentarios
  enable row level security;

alter table if exists public.comunidade_curtidas
  enable row level security;

alter table if exists public.comunidade_comentario_curtidas
  enable row level security;

alter table if exists public.comunidade_enquete_votos
  enable row level security;

alter table if exists public.comunidade_salvos
  enable row level security;

alter table if exists public.comunidade_post_salvos
  enable row level security;

alter table if exists public.comunidade_denuncias
  enable row level security;

-- ============================================================
-- POSTS
-- ============================================================
do $$
declare
  v_policy record;
begin
  if to_regclass('public.comunidade_posts') is null then
    return;
  end if;

  -- Policies permissivas são combinadas com OR. Remove todas as regras
  -- anteriores para impedir que uma policy antiga reabra o acesso.
  for v_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'comunidade_posts'
  loop
    execute format(
      'drop policy if exists %I on public.comunidade_posts',
      v_policy.policyname
    );
  end loop;

  create policy "comunidade_posts_select_publico"
    on public.comunidade_posts
    for select
    to anon, authenticated
    using (true);

  create policy "comunidade_posts_insert_proprio"
    on public.comunidade_posts
    for insert
    to authenticated
    with check (
      auth.uid() is not null
      and autor_id = auth.uid()
    );

  create policy "comunidade_posts_update_proprio_ou_admin"
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

  create policy "comunidade_posts_delete_proprio_ou_admin"
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

  revoke all
    on public.comunidade_posts
    from public, anon, authenticated;

  grant select
    on public.comunidade_posts
    to anon, authenticated;

  grant insert, update, delete
    on public.comunidade_posts
    to authenticated;
end
$$;

-- ============================================================
-- COMENTÁRIOS
-- ============================================================
do $$
declare
  v_policy record;
begin
  if to_regclass('public.comunidade_comentarios') is null then
    return;
  end if;

  for v_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'comunidade_comentarios'
  loop
    execute format(
      'drop policy if exists %I on public.comunidade_comentarios',
      v_policy.policyname
    );
  end loop;

  create policy "comunidade_comentarios_select_publico"
    on public.comunidade_comentarios
    for select
    to anon, authenticated
    using (true);

  create policy "comunidade_comentarios_insert_proprio"
    on public.comunidade_comentarios
    for insert
    to authenticated
    with check (
      auth.uid() is not null
      and autor_id = auth.uid()
      and exists (
        select 1
        from public.comunidade_posts post
        where post.id = comunidade_comentarios.post_id
      )
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
      and exists (
        select 1
        from public.comunidade_posts post
        where post.id = comunidade_comentarios.post_id
      )
    );

  create policy "comunidade_comentarios_delete_proprio_ou_admin"
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

  revoke all
    on public.comunidade_comentarios
    from public, anon, authenticated;

  grant select
    on public.comunidade_comentarios
    to anon, authenticated;

  grant insert, update, delete
    on public.comunidade_comentarios
    to authenticated;
end
$$;

-- ============================================================
-- CURTIDAS EM POSTS
-- ============================================================
do $$
declare
  v_policy record;
begin
  if to_regclass('public.comunidade_curtidas') is null then
    return;
  end if;

  delete from public.comunidade_curtidas a
  using public.comunidade_curtidas b
  where a.ctid < b.ctid
    and a.post_id = b.post_id
    and a.usuario_id = b.usuario_id;

  create unique index if not exists
    comunidade_curtidas_post_usuario_uidx
    on public.comunidade_curtidas (post_id, usuario_id);

  for v_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'comunidade_curtidas'
  loop
    execute format(
      'drop policy if exists %I on public.comunidade_curtidas',
      v_policy.policyname
    );
  end loop;

  create policy "comunidade_curtidas_select_publico"
    on public.comunidade_curtidas
    for select
    to anon, authenticated
    using (true);

  create policy "comunidade_curtidas_insert_proprio"
    on public.comunidade_curtidas
    for insert
    to authenticated
    with check (
      auth.uid() is not null
      and usuario_id = auth.uid()
      and exists (
        select 1
        from public.comunidade_posts post
        where post.id = comunidade_curtidas.post_id
      )
    );

  create policy "comunidade_curtidas_delete_proprio"
    on public.comunidade_curtidas
    for delete
    to authenticated
    using (
      auth.uid() is not null
      and usuario_id = auth.uid()
    );

  revoke all
    on public.comunidade_curtidas
    from public, anon, authenticated;

  grant select
    on public.comunidade_curtidas
    to anon, authenticated;

  grant insert, delete
    on public.comunidade_curtidas
    to authenticated;
end
$$;

-- ============================================================
-- CURTIDAS EM COMENTÁRIOS
-- ============================================================
do $$
declare
  v_policy record;
begin
  if to_regclass('public.comunidade_comentario_curtidas') is null then
    return;
  end if;

  delete from public.comunidade_comentario_curtidas a
  using public.comunidade_comentario_curtidas b
  where a.ctid < b.ctid
    and a.comentario_id = b.comentario_id
    and a.usuario_id = b.usuario_id;

  create unique index if not exists
    comunidade_comentario_curtidas_comentario_usuario_uidx
    on public.comunidade_comentario_curtidas (
      comentario_id,
      usuario_id
    );

  for v_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'comunidade_comentario_curtidas'
  loop
    execute format(
      'drop policy if exists %I on public.comunidade_comentario_curtidas',
      v_policy.policyname
    );
  end loop;

  create policy "comunidade_comentario_curtidas_select_publico"
    on public.comunidade_comentario_curtidas
    for select
    to anon, authenticated
    using (true);

  create policy "comunidade_comentario_curtidas_insert_proprio"
    on public.comunidade_comentario_curtidas
    for insert
    to authenticated
    with check (
      auth.uid() is not null
      and usuario_id = auth.uid()
      and exists (
        select 1
        from public.comunidade_comentarios comentario
        where comentario.id =
          comunidade_comentario_curtidas.comentario_id
      )
    );

  create policy "comunidade_comentario_curtidas_delete_proprio"
    on public.comunidade_comentario_curtidas
    for delete
    to authenticated
    using (
      auth.uid() is not null
      and usuario_id = auth.uid()
    );

  revoke all
    on public.comunidade_comentario_curtidas
    from public, anon, authenticated;

  grant select
    on public.comunidade_comentario_curtidas
    to anon, authenticated;

  grant insert, delete
    on public.comunidade_comentario_curtidas
    to authenticated;
end
$$;

-- ============================================================
-- VOTOS EM ENQUETES
-- ============================================================
do $$
declare
  v_policy record;
begin
  if to_regclass('public.comunidade_enquete_votos') is null then
    return;
  end if;

  delete from public.comunidade_enquete_votos a
  using public.comunidade_enquete_votos b
  where a.ctid < b.ctid
    and a.post_id = b.post_id
    and a.user_id = b.user_id;

  create unique index if not exists
    comunidade_enquete_votos_post_usuario_uidx
    on public.comunidade_enquete_votos (post_id, user_id);

  for v_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'comunidade_enquete_votos'
  loop
    execute format(
      'drop policy if exists %I on public.comunidade_enquete_votos',
      v_policy.policyname
    );
  end loop;

  create policy "comunidade_enquete_votos_select_publico"
    on public.comunidade_enquete_votos
    for select
    to anon, authenticated
    using (true);

  create policy "comunidade_enquete_votos_insert_proprio"
    on public.comunidade_enquete_votos
    for insert
    to authenticated
    with check (
      auth.uid() is not null
      and user_id = auth.uid()
      and exists (
        select 1
        from public.comunidade_posts post
        where post.id = comunidade_enquete_votos.post_id
      )
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
      and exists (
        select 1
        from public.comunidade_posts post
        where post.id = comunidade_enquete_votos.post_id
      )
    );

  create policy "comunidade_enquete_votos_delete_proprio"
    on public.comunidade_enquete_votos
    for delete
    to authenticated
    using (
      auth.uid() is not null
      and user_id = auth.uid()
    );

  revoke all
    on public.comunidade_enquete_votos
    from public, anon, authenticated;

  grant select
    on public.comunidade_enquete_votos
    to anon, authenticated;

  grant insert, update, delete
    on public.comunidade_enquete_votos
    to authenticated;
end
$$;

-- ============================================================
-- POSTS SALVOS — TABELA LEGADA
-- ============================================================
do $$
declare
  v_policy record;
begin
  if to_regclass('public.comunidade_salvos') is null then
    return;
  end if;

  delete from public.comunidade_salvos a
  using public.comunidade_salvos b
  where a.ctid < b.ctid
    and a.post_id = b.post_id
    and a.user_id = b.user_id;

  create unique index if not exists
    comunidade_salvos_post_usuario_uidx
    on public.comunidade_salvos (post_id, user_id);

  for v_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'comunidade_salvos'
  loop
    execute format(
      'drop policy if exists %I on public.comunidade_salvos',
      v_policy.policyname
    );
  end loop;

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
      and exists (
        select 1
        from public.comunidade_posts post
        where post.id = comunidade_salvos.post_id
      )
    );

  create policy "comunidade_salvos_delete_proprio"
    on public.comunidade_salvos
    for delete
    to authenticated
    using (
      auth.uid() is not null
      and user_id = auth.uid()
    );

  revoke all
    on public.comunidade_salvos
    from public, anon, authenticated;

  grant select, insert, delete
    on public.comunidade_salvos
    to authenticated;
end
$$;

-- ============================================================
-- POSTS SALVOS — TABELA ATUAL
-- ============================================================
do $$
declare
  v_policy record;
begin
  if to_regclass('public.comunidade_post_salvos') is null then
    return;
  end if;

  delete from public.comunidade_post_salvos a
  using public.comunidade_post_salvos b
  where a.ctid < b.ctid
    and a.post_id = b.post_id
    and a.user_id = b.user_id;

  create unique index if not exists
    comunidade_post_salvos_post_usuario_uidx
    on public.comunidade_post_salvos (post_id, user_id);

  for v_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'comunidade_post_salvos'
  loop
    execute format(
      'drop policy if exists %I on public.comunidade_post_salvos',
      v_policy.policyname
    );
  end loop;

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
      and exists (
        select 1
        from public.comunidade_posts post
        where post.id = comunidade_post_salvos.post_id
      )
    );

  create policy "comunidade_post_salvos_delete_proprio"
    on public.comunidade_post_salvos
    for delete
    to authenticated
    using (
      auth.uid() is not null
      and user_id = auth.uid()
    );

  revoke all
    on public.comunidade_post_salvos
    from public, anon, authenticated;

  grant select, insert, delete
    on public.comunidade_post_salvos
    to authenticated;
end
$$;

-- ============================================================
-- DENÚNCIAS
-- ============================================================
do $$
declare
  v_policy record;
begin
  if to_regclass('public.comunidade_denuncias') is null then
    return;
  end if;

  delete from public.comunidade_denuncias a
  using public.comunidade_denuncias b
  where a.ctid < b.ctid
    and a.alvo_tipo = b.alvo_tipo
    and a.alvo_id = b.alvo_id
    and a.denunciante_id = b.denunciante_id;

  create unique index if not exists
    comunidade_denuncias_alvo_denunciante_uidx
    on public.comunidade_denuncias (
      alvo_tipo,
      alvo_id,
      denunciante_id
    );

  for v_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'comunidade_denuncias'
  loop
    execute format(
      'drop policy if exists %I on public.comunidade_denuncias',
      v_policy.policyname
    );
  end loop;

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

  revoke all
    on public.comunidade_denuncias
    from public, anon, authenticated;

  grant insert
    on public.comunidade_denuncias
    to authenticated;

  grant select, update, delete
    on public.comunidade_denuncias
    to authenticated;
end
$$;

commit;