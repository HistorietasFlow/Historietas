begin;

create or replace function public.comunidade_pode_ver_post(
  p_post_id uuid
)
returns boolean
language sql
stable
security definer
set search_path to 'pg_catalog', 'public', 'auth', 'pg_temp'
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
        or (
          (
            auth.uid() is null
            or not exists (
              select 1
              from public.usuarios_bloqueados bloqueio
              where (
                bloqueio.bloqueador_id = auth.uid()
                and bloqueio.bloqueado_id = post.autor_id
              )
              or (
                bloqueio.bloqueador_id = post.autor_id
                and bloqueio.bloqueado_id = auth.uid()
              )
            )
          )
          and (
            post.visibilidade = 'publico'
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
        )
      )
  );
$$;

create or replace function public.comunidade_pode_ver_comentario(
  p_comentario_id uuid
)
returns boolean
language sql
stable
security definer
set search_path to 'pg_catalog', 'public', 'auth', 'pg_temp'
as $$
  select exists (
    select 1
    from public.comunidade_comentarios comentario
    where comentario.id = p_comentario_id
      and public.comunidade_pode_ver_post(comentario.post_id)
      and (
        auth.uid() is null
        or comentario.autor_id = auth.uid()
        or public.comunidade_usuario_e_admin()
        or not exists (
          select 1
          from public.usuarios_bloqueados bloqueio
          where (
            bloqueio.bloqueador_id = auth.uid()
            and bloqueio.bloqueado_id = comentario.autor_id
          )
          or (
            bloqueio.bloqueador_id = comentario.autor_id
            and bloqueio.bloqueado_id = auth.uid()
          )
        )
      )
  );
$$;

drop policy if exists "comunidade_comentarios_select_post_visivel"
  on public.comunidade_comentarios;

create policy "comunidade_comentarios_select_visivel_sem_bloqueio"
on public.comunidade_comentarios
for select
to authenticated, anon
using (
  public.comunidade_pode_ver_comentario(id)
);

drop policy if exists "comunidade_comentarios_insert_proprio_post_visivel"
  on public.comunidade_comentarios;

create policy "comunidade_comentarios_insert_proprio_sem_bloqueio"
on public.comunidade_comentarios
for insert
to authenticated
with check (
  auth.uid() is not null
  and autor_id = auth.uid()
  and public.comunidade_pode_ver_post(post_id)
  and (
    comentario_pai_id is null
    or public.comunidade_pode_ver_comentario(comentario_pai_id)
  )
);

drop policy if exists "comunidade_comentarios_salvos_insert_proprio"
  on public.comunidade_comentarios_salvos;

create policy "comunidade_comentarios_salvos_insert_proprio_visivel"
on public.comunidade_comentarios_salvos
for insert
to authenticated
with check (
  auth.uid() is not null
  and usuario_id = auth.uid()
  and public.comunidade_pode_ver_comentario(comentario_id)
);

drop policy if exists "comunidade_comentarios_salvos_select_publico"
  on public.comunidade_comentarios_salvos;

create policy "comunidade_comentarios_salvos_select_proprio_visivel"
on public.comunidade_comentarios_salvos
for select
to authenticated
using (
  auth.uid() is not null
  and usuario_id = auth.uid()
  and public.comunidade_pode_ver_comentario(comentario_id)
);

revoke all on table public.comunidade_comentarios_salvos
  from anon;

comment on function public.comunidade_pode_ver_post(uuid) is
  'Verifica visibilidade da publicacao e impede acesso entre usuarios bloqueados, preservando acesso proprio e administrativo.';

comment on function public.comunidade_pode_ver_comentario(uuid) is
  'Verifica visibilidade do post e impede acesso ao comentario quando existe bloqueio com seu autor, preservando moderacao administrativa.';

commit;
