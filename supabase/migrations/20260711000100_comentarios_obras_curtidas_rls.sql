-- 20260711000100_comentarios_obras_curtidas_rls.sql
-- Curtidas em comentários de obras.
-- Cada usuário autenticado pode curtir uma vez e remover somente a própria
-- curtida. A leitura é pública em obras publicadas e também permitida ao
-- proprietário da obra durante a edição de um rascunho.

begin;

create extension if not exists pgcrypto;

do $$
declare
  v_policy record;
begin
  if to_regclass('public.comentarios_obras') is null
    or to_regclass('public.obras') is null
  then
    return;
  end if;

  create table if not exists public.comentarios_obras_curtidas (
    id uuid primary key default gen_random_uuid(),
    comentario_id uuid not null
      references public.comentarios_obras(id)
      on delete cascade,
    usuario_id uuid not null
      references auth.users(id)
      on delete cascade,
    criado_em timestamptz not null default now()
  );

  -- Remove registros inválidos de instalações antigas antes de reforçar
  -- restrições e unicidade.
  delete from public.comentarios_obras_curtidas curtida
  where curtida.comentario_id is null
     or curtida.usuario_id is null
     or not exists (
       select 1
       from public.comentarios_obras comentario
       where comentario.id = curtida.comentario_id
     )
     or not exists (
       select 1
       from auth.users usuario
       where usuario.id = curtida.usuario_id
     );

  delete from public.comentarios_obras_curtidas a
  using public.comentarios_obras_curtidas b
  where a.ctid < b.ctid
    and a.comentario_id = b.comentario_id
    and a.usuario_id = b.usuario_id;

  alter table public.comentarios_obras_curtidas
    alter column comentario_id set not null,
    alter column usuario_id set not null,
    alter column criado_em set default now(),
    alter column criado_em set not null;

  -- Mantém apenas uma garantia de unicidade.
  alter table public.comentarios_obras_curtidas
    drop constraint if exists
      comentarios_obras_curtidas_comentario_usuario_unique;

  create unique index if not exists
    comentarios_obras_curtidas_comentario_usuario_uidx
    on public.comentarios_obras_curtidas (comentario_id, usuario_id);

  create index if not exists
    comentarios_obras_curtidas_comentario_id_idx
    on public.comentarios_obras_curtidas (comentario_id);

  create index if not exists
    comentarios_obras_curtidas_usuario_id_idx
    on public.comentarios_obras_curtidas (usuario_id);

  alter table public.comentarios_obras_curtidas
    enable row level security;

  -- Policies permissivas são combinadas com OR. Remove todas as regras antigas
  -- para impedir que uma policy esquecida reabra INSERT, UPDATE ou DELETE.
  for v_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'comentarios_obras_curtidas'
  loop
    execute format(
      'drop policy if exists %I on public.comentarios_obras_curtidas',
      v_policy.policyname
    );
  end loop;

  create policy "comentarios_obras_curtidas_select_publico"
    on public.comentarios_obras_curtidas
    for select
    to anon, authenticated
    using (
      exists (
        select 1
        from public.comentarios_obras comentario
        join public.obras obra
          on obra.id = comentario.obra_id
        where comentario.id =
          comentarios_obras_curtidas.comentario_id
          and (
            coalesce(obra.publicado, false) = true
            or (
              auth.uid() is not null
              and obra.user_id = auth.uid()
            )
          )
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
        join public.obras obra
          on obra.id = comentario.obra_id
        where comentario.id =
          comentarios_obras_curtidas.comentario_id
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

  revoke all
    on public.comentarios_obras_curtidas
    from public, anon, authenticated;

  grant select
    on public.comentarios_obras_curtidas
    to anon, authenticated;

  grant insert, delete
    on public.comentarios_obras_curtidas
    to authenticated;
end
$$;

commit;