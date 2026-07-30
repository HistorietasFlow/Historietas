-- 20260730000100_privacidade_posts_comunidade.sql
-- Adiciona visibilidade individual às publicações da Comunidade:
-- publico, seguidores, seguindo ou somente_eu.
-- A proteção é aplicada no banco aos posts e às suas interações.

begin;

do $$
begin
  if to_regclass('public.comunidade_posts') is null then
    raise exception
      'A tabela public.comunidade_posts precisa existir antes desta migration.';
  end if;

  if to_regclass('public.seguindo_usuarios') is null then
    raise exception
      'A tabela public.seguindo_usuarios precisa existir antes desta migration.';
  end if;
end
$$;

alter table public.comunidade_posts
  add column if not exists visibilidade text;

update public.comunidade_posts
set visibilidade = case
  when lower(btrim(coalesce(visibilidade, ''))) in (
    'publico',
    'seguidores',
    'seguindo',
    'somente_eu'
  ) then lower(btrim(visibilidade))
  else 'publico'
end;

alter table public.comunidade_posts
  alter column visibilidade set default 'publico',
  alter column visibilidade set not null;

alter table public.comunidade_posts
  drop constraint if exists comunidade_posts_visibilidade_check;

alter table public.comunidade_posts
  add constraint comunidade_posts_visibilidade_check
  check (
    visibilidade in ('publico', 'seguidores', 'seguindo', 'somente_eu')
  );

create index if not exists comunidade_posts_visibilidade_idx
  on public.comunidade_posts (visibilidade);

create index if not exists comunidade_posts_autor_visibilidade_criado_idx
  on public.comunidade_posts (autor_id, visibilidade, criado_em desc);

comment on column public.comunidade_posts.visibilidade is
  'Quem pode ver a publicação: publico, seguidores, seguindo ou somente_eu.';

-- Retorna true quando a sessão atual pode visualizar a publicação.
-- seguidores: o visitante segue o autor.
-- seguindo: o autor segue o visitante.
create or replace function public.comunidade_pode_ver_post(
  p_post_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.comunidade_posts post
    where post.id = p_post_id
      and (
        post.autor_id = auth.uid()
        or (
          auth.uid() is not null
          and public.comunidade_usuario_e_admin()
        )
        or post.visibilidade = 'publico'
        or (
          post.visibilidade = 'seguidores'
          and auth.uid() is not null
          and exists (
            select 1
            from public.seguindo_usuarios relacao
            where relacao.seguidor_id = auth.uid()
              and relacao.seguido_id = post.autor_id
          )
        )
        or (
          post.visibilidade = 'seguindo'
          and auth.uid() is not null
          and exists (
            select 1
            from public.seguindo_usuarios relacao
            where relacao.seguidor_id = post.autor_id
              and relacao.seguido_id = auth.uid()
          )
        )
      )
  );
$$;

comment on function public.comunidade_pode_ver_post(uuid) is
  'Verifica no servidor se a sessão atual pode visualizar uma publicação da Comunidade.';

revoke all
  on function public.comunidade_pode_ver_post(uuid)
  from public, anon, authenticated;

grant execute
  on function public.comunidade_pode_ver_post(uuid)
  to anon, authenticated;

create or replace function public.comunidade_pode_ver_comentario(
  p_comentario_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.comunidade_comentarios comentario
    where comentario.id = p_comentario_id
      and public.comunidade_pode_ver_post(comentario.post_id)
  );
$$;

comment on function public.comunidade_pode_ver_comentario(uuid) is
  'Verifica se a sessão atual pode visualizar o post que contém o comentário.';

revoke all
  on function public.comunidade_pode_ver_comentario(uuid)
  from public, anon, authenticated;

grant execute
  on function public.comunidade_pode_ver_comentario(uuid)
  to anon, authenticated;

alter table public.comunidade_posts enable row level security;

-- Remove qualquer policy permissiva antiga. Policies permissivas são
-- combinadas com OR e uma regra esquecida poderia reabrir posts privados.
do $$
declare
  v_policy record;
begin
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
end
$$;

create policy "comunidade_posts_select_visibilidade"
  on public.comunidade_posts
  for select
  to anon, authenticated
  using (public.comunidade_pode_ver_post(id));

create policy "comunidade_posts_insert_proprio_visibilidade"
  on public.comunidade_posts
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and autor_id = auth.uid()
    and visibilidade in ('publico', 'seguidores', 'seguindo', 'somente_eu')
  );

create policy "comunidade_posts_update_proprio_ou_admin_visibilidade"
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
    and visibilidade in ('publico', 'seguidores', 'seguindo', 'somente_eu')
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

revoke all on public.comunidade_posts from public, anon, authenticated;
grant select on public.comunidade_posts to anon, authenticated;
grant insert, update, delete on public.comunidade_posts to authenticated;

-- Comentários só podem ser lidos ou criados em posts visíveis.
do $$
declare
  v_policy record;
begin
  if to_regclass('public.comunidade_comentarios') is null then
    return;
  end if;

  alter table public.comunidade_comentarios enable row level security;

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

  create policy "comunidade_comentarios_select_post_visivel"
    on public.comunidade_comentarios
    for select
    to anon, authenticated
    using (public.comunidade_pode_ver_post(post_id));

  create policy "comunidade_comentarios_insert_proprio_post_visivel"
    on public.comunidade_comentarios
    for insert
    to authenticated
    with check (
      auth.uid() is not null
      and autor_id = auth.uid()
      and public.comunidade_pode_ver_post(post_id)
    );

  create policy "comunidade_comentarios_update_proprio_post_visivel"
    on public.comunidade_comentarios
    for update
    to authenticated
    using (
      auth.uid() is not null
      and autor_id = auth.uid()
      and public.comunidade_pode_ver_post(post_id)
    )
    with check (
      auth.uid() is not null
      and autor_id = auth.uid()
      and public.comunidade_pode_ver_post(post_id)
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
end
$$;

-- Curtidas em posts seguem a visibilidade do post.
do $$
declare
  v_policy record;
begin
  if to_regclass('public.comunidade_curtidas') is null then
    return;
  end if;

  alter table public.comunidade_curtidas enable row level security;

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

  create policy "comunidade_curtidas_select_post_visivel"
    on public.comunidade_curtidas
    for select
    to anon, authenticated
    using (public.comunidade_pode_ver_post(post_id));

  create policy "comunidade_curtidas_insert_proprio_post_visivel"
    on public.comunidade_curtidas
    for insert
    to authenticated
    with check (
      auth.uid() is not null
      and usuario_id = auth.uid()
      and public.comunidade_pode_ver_post(post_id)
    );

  create policy "comunidade_curtidas_delete_proprio"
    on public.comunidade_curtidas
    for delete
    to authenticated
    using (
      auth.uid() is not null
      and usuario_id = auth.uid()
    );
end
$$;

-- Curtidas em comentários seguem a visibilidade do post do comentário.
do $$
declare
  v_policy record;
begin
  if to_regclass('public.comunidade_comentario_curtidas') is null then
    return;
  end if;

  alter table public.comunidade_comentario_curtidas enable row level security;

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

  create policy "comunidade_comentario_curtidas_select_post_visivel"
    on public.comunidade_comentario_curtidas
    for select
    to anon, authenticated
    using (public.comunidade_pode_ver_comentario(comentario_id));

  create policy "comunidade_comentario_curtidas_insert_proprio_post_visivel"
    on public.comunidade_comentario_curtidas
    for insert
    to authenticated
    with check (
      auth.uid() is not null
      and usuario_id = auth.uid()
      and public.comunidade_pode_ver_comentario(comentario_id)
    );

  create policy "comunidade_comentario_curtidas_delete_proprio"
    on public.comunidade_comentario_curtidas
    for delete
    to authenticated
    using (
      auth.uid() is not null
      and usuario_id = auth.uid()
    );
end
$$;

-- Votos de enquete não podem revelar nem receber interação em post oculto.
do $$
declare
  v_policy record;
begin
  if to_regclass('public.comunidade_enquete_votos') is null then
    return;
  end if;

  alter table public.comunidade_enquete_votos enable row level security;

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

  create policy "comunidade_enquete_votos_select_post_visivel"
    on public.comunidade_enquete_votos
    for select
    to anon, authenticated
    using (public.comunidade_pode_ver_post(post_id));

  create policy "comunidade_enquete_votos_insert_proprio_post_visivel"
    on public.comunidade_enquete_votos
    for insert
    to authenticated
    with check (
      auth.uid() is not null
      and user_id = auth.uid()
      and public.comunidade_pode_ver_post(post_id)
    );

  create policy "comunidade_enquete_votos_update_proprio_post_visivel"
    on public.comunidade_enquete_votos
    for update
    to authenticated
    using (
      auth.uid() is not null
      and user_id = auth.uid()
      and public.comunidade_pode_ver_post(post_id)
    )
    with check (
      auth.uid() is not null
      and user_id = auth.uid()
      and public.comunidade_pode_ver_post(post_id)
    );

  create policy "comunidade_enquete_votos_delete_proprio"
    on public.comunidade_enquete_votos
    for delete
    to authenticated
    using (
      auth.uid() is not null
      and user_id = auth.uid()
    );
end
$$;

-- Salvar uma publicação exige que ela esteja visível no momento da ação.
do $$
declare
  v_policy record;
begin
  if to_regclass('public.comunidade_salvos') is null then
    return;
  end if;

  alter table public.comunidade_salvos enable row level security;

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
    using (auth.uid() is not null and user_id = auth.uid());

  create policy "comunidade_salvos_insert_proprio_post_visivel"
    on public.comunidade_salvos
    for insert
    to authenticated
    with check (
      auth.uid() is not null
      and user_id = auth.uid()
      and public.comunidade_pode_ver_post(post_id)
    );

  create policy "comunidade_salvos_delete_proprio"
    on public.comunidade_salvos
    for delete
    to authenticated
    using (auth.uid() is not null and user_id = auth.uid());
end
$$;

do $$
declare
  v_policy record;
begin
  if to_regclass('public.comunidade_post_salvos') is null then
    return;
  end if;

  alter table public.comunidade_post_salvos enable row level security;

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
    using (auth.uid() is not null and user_id = auth.uid());

  create policy "comunidade_post_salvos_insert_proprio_post_visivel"
    on public.comunidade_post_salvos
    for insert
    to authenticated
    with check (
      auth.uid() is not null
      and user_id = auth.uid()
      and public.comunidade_pode_ver_post(post_id)
    );

  create policy "comunidade_post_salvos_delete_proprio"
    on public.comunidade_post_salvos
    for delete
    to authenticated
    using (auth.uid() is not null and user_id = auth.uid());
end
$$;

commit;