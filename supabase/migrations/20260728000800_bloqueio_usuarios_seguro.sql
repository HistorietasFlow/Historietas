-- 20260728000800_bloqueio_usuarios_seguro.sql
-- Bloqueio seguro entre usuários, remoção de relações sociais e RPCs
-- para o perfil e a página de configurações.

begin;

create extension if not exists pgcrypto;

do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception 'A tabela public.profiles precisa existir.';
  end if;

  if to_regclass('public.seguindo_usuarios') is null then
    raise exception 'A tabela public.seguindo_usuarios precisa existir.';
  end if;

  if to_regclass('public.solicitacoes_seguidores') is null then
    raise exception 'A tabela public.solicitacoes_seguidores precisa existir.';
  end if;
end
$$;

-- ============================================================
-- TABELA
-- ============================================================

create table if not exists public.usuarios_bloqueados (
  id uuid primary key default gen_random_uuid(),
  bloqueador_id uuid not null
    references auth.users(id)
    on delete cascade,
  bloqueado_id uuid not null
    references auth.users(id)
    on delete cascade,
  criado_em timestamptz not null default now(),
  constraint usuarios_bloqueados_usuarios_diferentes_check
    check (bloqueador_id <> bloqueado_id),
  constraint usuarios_bloqueados_relacao_unique
    unique (bloqueador_id, bloqueado_id)
);

delete from public.usuarios_bloqueados
where bloqueador_id is null
   or bloqueado_id is null
   or bloqueador_id = bloqueado_id;

create index if not exists usuarios_bloqueados_bloqueador_idx
  on public.usuarios_bloqueados (bloqueador_id, criado_em desc);

create index if not exists usuarios_bloqueados_bloqueado_idx
  on public.usuarios_bloqueados (bloqueado_id, criado_em desc);

alter table public.usuarios_bloqueados
  enable row level security;

revoke all
  on table public.usuarios_bloqueados
  from public, anon, authenticated;

grant select
  on table public.usuarios_bloqueados
  to authenticated;

drop policy if exists "usuarios_bloqueados_select_proprios"
  on public.usuarios_bloqueados;
drop policy if exists "usuarios_bloqueados_insert_direto_bloqueado"
  on public.usuarios_bloqueados;
drop policy if exists "usuarios_bloqueados_update_bloqueado"
  on public.usuarios_bloqueados;
drop policy if exists "usuarios_bloqueados_delete_direto_bloqueado"
  on public.usuarios_bloqueados;

create policy "usuarios_bloqueados_select_proprios"
  on public.usuarios_bloqueados
  for select
  to authenticated
  using (bloqueador_id = auth.uid());

create policy "usuarios_bloqueados_insert_direto_bloqueado"
  on public.usuarios_bloqueados
  for insert
  to authenticated
  with check (false);

create policy "usuarios_bloqueados_update_bloqueado"
  on public.usuarios_bloqueados
  for update
  to authenticated
  using (false)
  with check (false);

create policy "usuarios_bloqueados_delete_direto_bloqueado"
  on public.usuarios_bloqueados
  for delete
  to authenticated
  using (false);

comment on table public.usuarios_bloqueados is
  'Relações privadas de bloqueio. Somente o bloqueador consulta sua lista.';

-- ============================================================
-- FUNÇÃO INTERNA
-- ============================================================

create or replace function public.usuarios_possuem_bloqueio(
  p_usuario_a uuid,
  p_usuario_b uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
  select
    p_usuario_a is not null
    and p_usuario_b is not null
    and p_usuario_a <> p_usuario_b
    and exists (
      select 1
      from public.usuarios_bloqueados bloqueio
      where (
        bloqueio.bloqueador_id = p_usuario_a
        and bloqueio.bloqueado_id = p_usuario_b
      )
      or (
        bloqueio.bloqueador_id = p_usuario_b
        and bloqueio.bloqueado_id = p_usuario_a
      )
    );
$$;

revoke all
  on function public.usuarios_possuem_bloqueio(uuid, uuid)
  from public, anon, authenticated;

grant execute
  on function public.usuarios_possuem_bloqueio(uuid, uuid)
  to authenticated;

comment on function public.usuarios_possuem_bloqueio(uuid, uuid) is
  'Retorna true quando existe bloqueio em qualquer direção entre dois usuários.';

-- ============================================================
-- ESTADO, BLOQUEAR, DESBLOQUEAR E LISTAR
-- ============================================================

create or replace function public.carregar_estado_bloqueio_usuario(
  p_outro_user_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
  select jsonb_build_object(
    'bloqueadoPorMim',
      auth.uid() is not null
      and p_outro_user_id is not null
      and exists (
        select 1
        from public.usuarios_bloqueados bloqueio
        where bloqueio.bloqueador_id = auth.uid()
          and bloqueio.bloqueado_id = p_outro_user_id
      ),
    'bloqueadoPeloPerfil',
      auth.uid() is not null
      and p_outro_user_id is not null
      and exists (
        select 1
        from public.usuarios_bloqueados bloqueio
        where bloqueio.bloqueador_id = p_outro_user_id
          and bloqueio.bloqueado_id = auth.uid()
      ),
    'existeBloqueio',
      auth.uid() is not null
      and p_outro_user_id is not null
      and public.usuarios_possuem_bloqueio(
        auth.uid(),
        p_outro_user_id
      )
  );
$$;

revoke all
  on function public.carregar_estado_bloqueio_usuario(uuid)
  from public, anon, authenticated;

grant execute
  on function public.carregar_estado_bloqueio_usuario(uuid)
  to authenticated;

create or replace function public.bloquear_usuario(
  p_bloqueado_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare
  v_bloqueador_id uuid := auth.uid();
begin
  if v_bloqueador_id is null then
    raise exception 'Entre na sua conta para bloquear este usuário.'
      using errcode = '42501';
  end if;

  if p_bloqueado_id is null then
    raise exception 'Usuário inválido.'
      using errcode = '22023';
  end if;

  if v_bloqueador_id = p_bloqueado_id then
    raise exception 'Você não pode bloquear o próprio perfil.'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from auth.users usuario
    where usuario.id = p_bloqueado_id
  ) then
    raise exception 'Usuário não encontrado.'
      using errcode = 'P0002';
  end if;

  insert into public.usuarios_bloqueados (
    bloqueador_id,
    bloqueado_id
  )
  values (
    v_bloqueador_id,
    p_bloqueado_id
  )
  on conflict (bloqueador_id, bloqueado_id)
  do nothing;

  -- O bloqueio encerra relações e solicitações nas duas direções.
  delete from public.seguindo_usuarios relacao
  where (
    relacao.seguidor_id = v_bloqueador_id
    and relacao.seguido_id = p_bloqueado_id
  )
  or (
    relacao.seguidor_id = p_bloqueado_id
    and relacao.seguido_id = v_bloqueador_id
  );

  delete from public.solicitacoes_seguidores solicitacao
  where (
    solicitacao.solicitante_id = v_bloqueador_id
    and solicitacao.destinatario_id = p_bloqueado_id
  )
  or (
    solicitacao.solicitante_id = p_bloqueado_id
    and solicitacao.destinatario_id = v_bloqueador_id
  );

  return true;
end;
$$;

revoke all
  on function public.bloquear_usuario(uuid)
  from public, anon, authenticated;

grant execute
  on function public.bloquear_usuario(uuid)
  to authenticated;

create or replace function public.desbloquear_usuario(
  p_bloqueado_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare
  v_bloqueador_id uuid := auth.uid();
begin
  if v_bloqueador_id is null then
    raise exception 'Entre na sua conta para desbloquear este usuário.'
      using errcode = '42501';
  end if;

  if p_bloqueado_id is null then
    raise exception 'Usuário inválido.'
      using errcode = '22023';
  end if;

  delete from public.usuarios_bloqueados bloqueio
  where bloqueio.bloqueador_id = v_bloqueador_id
    and bloqueio.bloqueado_id = p_bloqueado_id;

  return true;
end;
$$;

revoke all
  on function public.desbloquear_usuario(uuid)
  from public, anon, authenticated;

grant execute
  on function public.desbloquear_usuario(uuid)
  to authenticated;

create or replace function public.listar_usuarios_bloqueados(
  p_limite integer default 100
)
returns table (
  user_id uuid,
  nome text,
  username text,
  avatar_url text,
  bloqueado_em timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
  select
    bloqueio.bloqueado_id as user_id,
    coalesce(
      nullif(btrim(perfil.nome), ''),
      'Usuário'
    )::text as nome,
    coalesce(
      nullif(btrim(perfil.username), ''),
      ''
    )::text as username,
    coalesce(
      nullif(btrim(perfil.avatar_url), ''),
      ''
    )::text as avatar_url,
    bloqueio.criado_em as bloqueado_em
  from public.usuarios_bloqueados bloqueio
  left join lateral (
    select
      perfil_linha.nome,
      perfil_linha.username,
      perfil_linha.avatar_url
    from public.profiles perfil_linha
    where perfil_linha.user_id = bloqueio.bloqueado_id
       or perfil_linha.id = bloqueio.bloqueado_id
    order by
      case
        when perfil_linha.user_id = bloqueio.bloqueado_id then 0
        else 1
      end
    limit 1
  ) perfil on true
  where auth.uid() is not null
    and bloqueio.bloqueador_id = auth.uid()
  order by bloqueio.criado_em desc
  limit greatest(1, least(coalesce(p_limite, 100), 200));
$$;

revoke all
  on function public.listar_usuarios_bloqueados(integer)
  from public, anon, authenticated;

grant execute
  on function public.listar_usuarios_bloqueados(integer)
  to authenticated;

-- ============================================================
-- PRIVACIDADE: PERFIL E ABAS NÃO FICAM VISÍVEIS ENTRE BLOQUEADOS
-- ============================================================

create or replace function public.usuario_pode_ver_perfil(
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
  select
    p_user_id is not null
    and (
      auth.uid() = p_user_id
      or (
        not public.usuarios_possuem_bloqueio(
          auth.uid(),
          p_user_id
        )
        and (
          not coalesce(
            (
              select preferencias.perfil_privado
              from public.preferencias_privacidade preferencias
              where preferencias.user_id = p_user_id
            ),
            false
          )
          or exists (
            select 1
            from public.seguindo_usuarios relacao
            where relacao.seguidor_id = auth.uid()
              and relacao.seguido_id = p_user_id
          )
        )
      )
    );
$$;

revoke all
  on function public.usuario_pode_ver_perfil(uuid)
  from public, anon, authenticated;

grant execute
  on function public.usuario_pode_ver_perfil(uuid)
  to anon, authenticated;

create or replace function public.usuario_pode_ver_aba_perfil(
  p_user_id uuid,
  p_visibilidade text
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
  select
    p_user_id is not null
    and p_visibilidade in (
      'publico',
      'seguidores',
      'seguindo',
      'somente_eu'
    )
    and (
      auth.uid() = p_user_id
      or (
        not public.usuarios_possuem_bloqueio(
          auth.uid(),
          p_user_id
        )
        and (
          p_visibilidade = 'publico'
          or (
            p_visibilidade = 'seguidores'
            and auth.uid() is not null
            and exists (
              select 1
              from public.seguindo_usuarios relacao
              where relacao.seguidor_id = auth.uid()
                and relacao.seguido_id = p_user_id
            )
          )
          or (
            p_visibilidade = 'seguindo'
            and auth.uid() is not null
            and exists (
              select 1
              from public.seguindo_usuarios relacao
              where relacao.seguidor_id = p_user_id
                and relacao.seguido_id = auth.uid()
            )
          )
        )
      )
    );
$$;

revoke all
  on function public.usuario_pode_ver_aba_perfil(uuid, text)
  from public, anon, authenticated;

grant execute
  on function public.usuario_pode_ver_aba_perfil(uuid, text)
  to anon, authenticated;

-- ============================================================
-- SEGUIR E SOLICITAR: BLOQUEIO É VERIFICADO NO BANCO
-- ============================================================

drop policy if exists "seguindo_usuarios_insert_proprio"
  on public.seguindo_usuarios;

create policy "seguindo_usuarios_insert_proprio"
  on public.seguindo_usuarios
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and seguidor_id = auth.uid()
    and seguido_id <> auth.uid()
    and not public.usuarios_possuem_bloqueio(
      seguidor_id,
      seguido_id
    )
  );

drop policy if exists "solicitacoes_seguidores_insert_propria"
  on public.solicitacoes_seguidores;

create policy "solicitacoes_seguidores_insert_propria"
  on public.solicitacoes_seguidores
  for insert
  to authenticated
  with check (
    auth.uid() = solicitante_id
    and solicitante_id <> destinatario_id
    and not public.usuarios_possuem_bloqueio(
      solicitante_id,
      destinatario_id
    )
    and not exists (
      select 1
      from public.seguindo_usuarios relacao
      where relacao.seguidor_id = solicitante_id
        and relacao.seguido_id = destinatario_id
    )
    and coalesce(
      (
        select preferencias.perfil_privado
        from public.preferencias_privacidade preferencias
        where preferencias.user_id = destinatario_id
      ),
      false
    )
    and coalesce(
      (
        select preferencias.aprovar_novos_seguidores
        from public.preferencias_privacidade preferencias
        where preferencias.user_id = destinatario_id
      ),
      false
    )
  );

create or replace function public.solicitar_ou_seguir_usuario(
  p_seguido_id uuid
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare
  v_seguidor_id uuid := auth.uid();
  v_perfil_privado boolean := false;
  v_exige_aprovacao boolean := false;
begin
  if v_seguidor_id is null then
    raise exception 'É necessário entrar na conta para seguir usuários.'
      using errcode = '42501';
  end if;

  if p_seguido_id is null then
    raise exception 'Usuário inválido.'
      using errcode = '22023';
  end if;

  if v_seguidor_id = p_seguido_id then
    return 'proprio_perfil';
  end if;

  if not exists (
    select 1
    from auth.users usuario
    where usuario.id = p_seguido_id
  ) then
    raise exception 'Usuário não encontrado.'
      using errcode = 'P0002';
  end if;

  if public.usuarios_possuem_bloqueio(
    v_seguidor_id,
    p_seguido_id
  ) then
    raise exception
      'Não é possível seguir este perfil porque existe um bloqueio.'
      using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.seguindo_usuarios relacao
    where relacao.seguidor_id = v_seguidor_id
      and relacao.seguido_id = p_seguido_id
  ) then
    delete from public.solicitacoes_seguidores solicitacao
    where solicitacao.solicitante_id = v_seguidor_id
      and solicitacao.destinatario_id = p_seguido_id;

    return 'seguindo';
  end if;

  select
    coalesce(preferencias.perfil_privado, false),
    coalesce(preferencias.aprovar_novos_seguidores, false)
  into
    v_perfil_privado,
    v_exige_aprovacao
  from public.preferencias_privacidade preferencias
  where preferencias.user_id = p_seguido_id;

  if not found then
    v_perfil_privado := false;
    v_exige_aprovacao := false;
  end if;

  if not v_perfil_privado or not v_exige_aprovacao then
    insert into public.seguindo_usuarios (
      seguidor_id,
      seguido_id
    )
    values (
      v_seguidor_id,
      p_seguido_id
    )
    on conflict do nothing;

    delete from public.solicitacoes_seguidores solicitacao
    where solicitacao.solicitante_id = v_seguidor_id
      and solicitacao.destinatario_id = p_seguido_id;

    return 'seguindo';
  end if;

  insert into public.solicitacoes_seguidores (
    solicitante_id,
    destinatario_id,
    criado_em,
    atualizado_em
  )
  values (
    v_seguidor_id,
    p_seguido_id,
    now(),
    now()
  )
  on conflict (solicitante_id, destinatario_id)
  do update set atualizado_em = excluded.atualizado_em;

  return 'solicitado';
end;
$$;

revoke all
  on function public.solicitar_ou_seguir_usuario(uuid)
  from public, anon, authenticated;

grant execute
  on function public.solicitar_ou_seguir_usuario(uuid)
  to authenticated;

create or replace function public.responder_solicitacao_seguidor(
  p_solicitacao_id uuid,
  p_aceitar boolean
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare
  v_destinatario_id uuid := auth.uid();
  v_solicitante_id uuid;
begin
  if v_destinatario_id is null then
    raise exception
      'É necessário entrar na conta para responder solicitações.'
      using errcode = '42501';
  end if;

  if p_solicitacao_id is null then
    return 'nao_encontrada';
  end if;

  select solicitacao.solicitante_id
  into v_solicitante_id
  from public.solicitacoes_seguidores solicitacao
  where solicitacao.id = p_solicitacao_id
    and solicitacao.destinatario_id = v_destinatario_id
  for update;

  if not found then
    return 'nao_encontrada';
  end if;

  if public.usuarios_possuem_bloqueio(
    v_solicitante_id,
    v_destinatario_id
  ) then
    delete from public.solicitacoes_seguidores solicitacao
    where solicitacao.id = p_solicitacao_id;

    return 'recusada';
  end if;

  if coalesce(p_aceitar, false) then
    insert into public.seguindo_usuarios (
      seguidor_id,
      seguido_id
    )
    values (
      v_solicitante_id,
      v_destinatario_id
    )
    on conflict do nothing;
  end if;

  delete from public.solicitacoes_seguidores solicitacao
  where solicitacao.id = p_solicitacao_id
    and solicitacao.destinatario_id = v_destinatario_id;

  return case
    when coalesce(p_aceitar, false) then 'aceita'
    else 'recusada'
  end;
end;
$$;

revoke all
  on function public.responder_solicitacao_seguidor(uuid, boolean)
  from public, anon, authenticated;

grant execute
  on function public.responder_solicitacao_seguidor(uuid, boolean)
  to authenticated;

-- Comentários no Diário também respeitam o bloqueio.
do $$
begin
  if to_regclass('public.diario_anotacao_comentarios') is not null then
    drop policy if exists "diario_anotacao_comentarios_insert_proprio"
      on public.diario_anotacao_comentarios;

    create policy "diario_anotacao_comentarios_insert_proprio"
      on public.diario_anotacao_comentarios
      for insert
      to authenticated
      with check (
        auth.uid() is not null
        and user_id = auth.uid()
        and exists (
          select 1
          from public.diario_anotacoes anotacao
          left join public.preferencias_privacidade preferencias
            on preferencias.user_id = anotacao.user_id
          where anotacao.id =
            diario_anotacao_comentarios.anotacao_id
            and not public.usuarios_possuem_bloqueio(
              auth.uid(),
              anotacao.user_id
            )
            and public.usuario_pode_ver_perfil(anotacao.user_id)
            and (
              anotacao.user_id = auth.uid()
              or coalesce(
                preferencias.quem_pode_comentar_diario,
                'todos'
              ) = 'todos'
              or (
                coalesce(
                  preferencias.quem_pode_comentar_diario,
                  'todos'
                ) = 'seguidores'
                and exists (
                  select 1
                  from public.seguindo_usuarios relacao
                  where relacao.seguidor_id = auth.uid()
                    and relacao.seguido_id = anotacao.user_id
                )
              )
            )
        )
      );
  end if;
end
$$;

commit;