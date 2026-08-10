begin;

create or replace function public.pode_interagir_capitulo(
  p_capitulo_id uuid
)
returns boolean
language sql
stable
security definer
set search_path to 'pg_catalog', 'public', 'auth', 'pg_temp'
as $$
  select
    auth.uid() is not null
    and exists (
      select 1
      from public.capitulos capitulo
      join public.obras obra
        on obra.id = capitulo.obra_id
      where capitulo.id = p_capitulo_id
        and not public.usuarios_possuem_bloqueio(
          auth.uid(),
          capitulo.user_id
        )
        and not public.usuarios_possuem_bloqueio(
          auth.uid(),
          obra.user_id
        )
    );
$$;

create or replace function public.pode_interagir_comentario_capitulo(
  p_comentario_id uuid
)
returns boolean
language sql
stable
security definer
set search_path to 'pg_catalog', 'public', 'auth', 'pg_temp'
as $$
  select
    auth.uid() is not null
    and exists (
      select 1
      from public.comentarios_capitulos comentario
      join public.capitulos capitulo
        on capitulo.id = comentario.capitulo_id
      join public.obras obra
        on obra.id = capitulo.obra_id
      where comentario.id = p_comentario_id
        and not public.usuarios_possuem_bloqueio(
          auth.uid(),
          comentario.user_id
        )
        and not public.usuarios_possuem_bloqueio(
          auth.uid(),
          capitulo.user_id
        )
        and not public.usuarios_possuem_bloqueio(
          auth.uid(),
          obra.user_id
        )
    );
$$;

create or replace function public.pode_interagir_obra(
  p_obra_id uuid
)
returns boolean
language sql
stable
security definer
set search_path to 'pg_catalog', 'public', 'auth', 'pg_temp'
as $$
  select
    auth.uid() is not null
    and exists (
      select 1
      from public.obras obra
      where obra.id = p_obra_id
        and not public.usuarios_possuem_bloqueio(
          auth.uid(),
          obra.user_id
        )
    );
$$;

create or replace function public.pode_interagir_comentario_obra(
  p_comentario_id uuid
)
returns boolean
language sql
stable
security definer
set search_path to 'pg_catalog', 'public', 'auth', 'pg_temp'
as $$
  select
    auth.uid() is not null
    and exists (
      select 1
      from public.comentarios_obras comentario
      join public.obras obra
        on obra.id = comentario.obra_id
      where comentario.id = p_comentario_id
        and not public.usuarios_possuem_bloqueio(
          auth.uid(),
          comentario.user_id
        )
        and not public.usuarios_possuem_bloqueio(
          auth.uid(),
          obra.user_id
        )
    );
$$;

revoke all on function public.pode_interagir_capitulo(uuid)
  from public, anon;
revoke all on function public.pode_interagir_comentario_capitulo(uuid)
  from public, anon;
revoke all on function public.pode_interagir_obra(uuid)
  from public, anon;
revoke all on function public.pode_interagir_comentario_obra(uuid)
  from public, anon;

grant execute on function public.pode_interagir_capitulo(uuid)
  to authenticated;
grant execute on function public.pode_interagir_comentario_capitulo(uuid)
  to authenticated;
grant execute on function public.pode_interagir_obra(uuid)
  to authenticated;
grant execute on function public.pode_interagir_comentario_obra(uuid)
  to authenticated;

drop policy if exists "comentarios_capitulos_insert_proprio"
  on public.comentarios_capitulos;

create policy "comentarios_capitulos_insert_proprio_sem_bloqueio"
on public.comentarios_capitulos
for insert
to authenticated
with check (
  auth.uid() is not null
  and user_id = auth.uid()
  and public.pode_interagir_capitulo(capitulo_id)
  and (
    comentario_pai_id is null
    or public.pode_interagir_comentario_capitulo(comentario_pai_id)
  )
);

drop policy if exists "comentarios_capitulos_update_proprio"
  on public.comentarios_capitulos;

create policy "comentarios_capitulos_update_proprio_sem_bloqueio"
on public.comentarios_capitulos
for update
to authenticated
using (
  auth.uid() is not null
  and user_id = auth.uid()
  and public.pode_interagir_capitulo(capitulo_id)
  and (
    comentario_pai_id is null
    or public.pode_interagir_comentario_capitulo(comentario_pai_id)
  )
)
with check (
  auth.uid() is not null
  and user_id = auth.uid()
  and public.pode_interagir_capitulo(capitulo_id)
  and (
    comentario_pai_id is null
    or public.pode_interagir_comentario_capitulo(comentario_pai_id)
  )
);

drop policy if exists "comentarios_capitulos_curtidas_insert_proprio"
  on public.comentarios_capitulos_curtidas;

drop policy if exists "comentarios_capitulos_curtidas_insert_proprio_usuario"
  on public.comentarios_capitulos_curtidas;

create policy "comentarios_capitulos_curtidas_insert_sem_bloqueio"
on public.comentarios_capitulos_curtidas
for insert
to authenticated
with check (
  auth.uid() is not null
  and usuario_id = auth.uid()
  and public.pode_interagir_comentario_capitulo(comentario_id)
);

drop policy if exists "comentarios_obras_insert_proprio"
  on public.comentarios_obras;

create policy "comentarios_obras_insert_proprio_sem_bloqueio"
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
  and public.pode_interagir_obra(obra_id)
  and (
    comentario_pai_id is null
    or public.pode_interagir_comentario_obra(comentario_pai_id)
  )
);

drop policy if exists "comentarios_obras_curtidas_insert_proprio"
  on public.comentarios_obras_curtidas;

create policy "comentarios_obras_curtidas_insert_sem_bloqueio"
on public.comentarios_obras_curtidas
for insert
to authenticated
with check (
  auth.uid() is not null
  and usuario_id = auth.uid()
  and public.pode_interagir_comentario_obra(comentario_id)
  and exists (
    select 1
    from public.comentarios_obras comentario
    join public.obras obra
      on obra.id = comentario.obra_id
    where comentario.id = comentarios_obras_curtidas.comentario_id
      and (
        coalesce(obra.publicado, false) = true
        or obra.user_id = auth.uid()
      )
  )
);

drop policy if exists "curtidas_capitulos_insert_proprio"
  on public.curtidas_capitulos;

create policy "curtidas_capitulos_insert_proprio_sem_bloqueio"
on public.curtidas_capitulos
for insert
to authenticated
with check (
  auth.uid() is not null
  and user_id = auth.uid()
  and public.pode_interagir_capitulo(capitulo_id)
);

comment on function public.pode_interagir_capitulo(uuid) is
  'Impede interacao com capitulo quando existe bloqueio com o autor do capitulo ou da obra.';

comment on function public.pode_interagir_comentario_capitulo(uuid) is
  'Impede interacao com comentario de capitulo quando existe bloqueio com o comentarista ou autores relacionados.';

comment on function public.pode_interagir_obra(uuid) is
  'Impede interacao com obra quando existe bloqueio com seu autor.';

comment on function public.pode_interagir_comentario_obra(uuid) is
  'Impede interacao com comentario de obra quando existe bloqueio com o comentarista ou autor da obra.';

commit;
