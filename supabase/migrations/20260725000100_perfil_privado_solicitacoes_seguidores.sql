-- Perfil privado e solicitações de seguidores.
-- Obras publicadas continuam públicas. Diário, biblioteca e atividades pessoais
-- podem ser exibidos apenas ao dono do perfil e aos seguidores aprovados.

begin;

alter table public.preferencias_privacidade
  add column if not exists perfil_privado boolean not null default false,
  add column if not exists aprovar_novos_seguidores boolean not null default false;

create table if not exists public.solicitacoes_seguidores (
  id uuid primary key default gen_random_uuid(),
  solicitante_id uuid not null references auth.users(id) on delete cascade,
  destinatario_id uuid not null references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint solicitacoes_seguidores_usuarios_diferentes_check
    check (solicitante_id <> destinatario_id),
  constraint solicitacoes_seguidores_relacao_unique
    unique (solicitante_id, destinatario_id)
);

create index if not exists solicitacoes_seguidores_solicitante_idx
  on public.solicitacoes_seguidores (solicitante_id, criado_em desc);

create index if not exists solicitacoes_seguidores_destinatario_idx
  on public.solicitacoes_seguidores (destinatario_id, criado_em desc);

alter table public.solicitacoes_seguidores enable row level security;

grant select, insert, delete
  on table public.solicitacoes_seguidores
  to authenticated;

revoke all
  on table public.solicitacoes_seguidores
  from anon;

drop policy if exists "solicitacoes_seguidores_select_participantes"
  on public.solicitacoes_seguidores;
drop policy if exists "solicitacoes_seguidores_insert_propria"
  on public.solicitacoes_seguidores;
drop policy if exists "solicitacoes_seguidores_delete_participantes"
  on public.solicitacoes_seguidores;

create policy "solicitacoes_seguidores_select_participantes"
  on public.solicitacoes_seguidores
  for select
  to authenticated
  using (
    auth.uid() = solicitante_id
    or auth.uid() = destinatario_id
  );

create policy "solicitacoes_seguidores_insert_propria"
  on public.solicitacoes_seguidores
  for insert
  to authenticated
  with check (
    auth.uid() = solicitante_id
    and solicitante_id <> destinatario_id
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

create policy "solicitacoes_seguidores_delete_participantes"
  on public.solicitacoes_seguidores
  for delete
  to authenticated
  using (
    auth.uid() = solicitante_id
    or auth.uid() = destinatario_id
  );

create or replace function public.usuario_pode_ver_perfil(
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    p_user_id is not null
    and (
      auth.uid() = p_user_id
      or not coalesce(
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
    );
$$;

revoke all
  on function public.usuario_pode_ver_perfil(uuid)
  from public;

grant execute
  on function public.usuario_pode_ver_perfil(uuid)
  to anon, authenticated;

create or replace function public.solicitar_ou_seguir_usuario(
  p_seguido_id uuid
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_seguidor_id uuid := auth.uid();
  v_perfil_privado boolean := false;
  v_exige_aprovacao boolean := false;
begin
  if v_seguidor_id is null then
    raise exception 'É necessário entrar na conta para seguir usuários.';
  end if;

  if p_seguido_id is null then
    raise exception 'Usuário inválido.';
  end if;

  if v_seguidor_id = p_seguido_id then
    return 'proprio_perfil';
  end if;

  if not exists (
    select 1
    from auth.users usuario
    where usuario.id = p_seguido_id
  ) then
    raise exception 'Usuário não encontrado.';
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
  from public;

grant execute
  on function public.solicitar_ou_seguir_usuario(uuid)
  to authenticated;

create or replace function public.cancelar_solicitacao_seguidor(
  p_seguido_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_seguidor_id uuid := auth.uid();
  v_removidos integer := 0;
begin
  if v_seguidor_id is null or p_seguido_id is null then
    return false;
  end if;

  delete from public.solicitacoes_seguidores solicitacao
  where solicitacao.solicitante_id = v_seguidor_id
    and solicitacao.destinatario_id = p_seguido_id;

  get diagnostics v_removidos = row_count;

  return v_removidos > 0;
end;
$$;

revoke all
  on function public.cancelar_solicitacao_seguidor(uuid)
  from public;

grant execute
  on function public.cancelar_solicitacao_seguidor(uuid)
  to authenticated;

create or replace function public.responder_solicitacao_seguidor(
  p_solicitacao_id uuid,
  p_aceitar boolean
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_destinatario_id uuid := auth.uid();
  v_solicitante_id uuid;
begin
  if v_destinatario_id is null then
    raise exception 'É necessário entrar na conta para responder solicitações.';
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
  from public;

grant execute
  on function public.responder_solicitacao_seguidor(uuid, boolean)
  to authenticated;

create or replace function public.deixar_de_seguir_usuario(
  p_seguido_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_seguidor_id uuid := auth.uid();
  v_removidos integer := 0;
begin
  if v_seguidor_id is null or p_seguido_id is null then
    return false;
  end if;

  delete from public.seguindo_usuarios relacao
  where relacao.seguidor_id = v_seguidor_id
    and relacao.seguido_id = p_seguido_id;

  get diagnostics v_removidos = row_count;

  delete from public.solicitacoes_seguidores solicitacao
  where solicitacao.solicitante_id = v_seguidor_id
    and solicitacao.destinatario_id = p_seguido_id;

  return v_removidos > 0;
end;
$$;

revoke all
  on function public.deixar_de_seguir_usuario(uuid)
  from public;

grant execute
  on function public.deixar_de_seguir_usuario(uuid)
  to authenticated;

create or replace function public.remover_seguidor(
  p_seguidor_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_seguido_id uuid := auth.uid();
  v_removidos integer := 0;
begin
  if v_seguido_id is null or p_seguidor_id is null then
    return false;
  end if;

  delete from public.seguindo_usuarios relacao
  where relacao.seguidor_id = p_seguidor_id
    and relacao.seguido_id = v_seguido_id;

  get diagnostics v_removidos = row_count;

  delete from public.solicitacoes_seguidores solicitacao
  where solicitacao.solicitante_id = p_seguidor_id
    and solicitacao.destinatario_id = v_seguido_id;

  return v_removidos > 0;
end;
$$;

revoke all
  on function public.remover_seguidor(uuid)
  from public;

grant execute
  on function public.remover_seguidor(uuid)
  to authenticated;

-- Proteção do Diário no próprio banco. O dono sempre mantém acesso.
drop policy if exists "diario_atividades_select_visiveis"
  on public.diario_atividades;

create policy "diario_atividades_select_visiveis"
  on public.diario_atividades
  for select
  using (
    user_id = auth.uid()
    or (
      public.usuario_pode_ver_perfil(user_id)
      and coalesce(visibilidade, 'privado') in ('publico', 'parcial')
      and coalesce(
        (
          select preferencias.mostrar_diario_perfil
          from public.preferencias_privacidade preferencias
          where preferencias.user_id = diario_atividades.user_id
        ),
        true
      )
      and coalesce(
        (
          select preferencias.mostrar_atividades_leitura
          from public.preferencias_privacidade preferencias
          where preferencias.user_id = diario_atividades.user_id
        ),
        true
      )
      and case
        when tipo in ('leu_capitulo', 'comecou_ler') then coalesce(
          (
            select preferencias.mostrar_historico_leitura
            from public.preferencias_privacidade preferencias
            where preferencias.user_id = diario_atividades.user_id
          ),
          false
        )
        when tipo = 'favoritou_obra' then coalesce(
          (
            select preferencias.mostrar_favoritos
            from public.preferencias_privacidade preferencias
            where preferencias.user_id = diario_atividades.user_id
          ),
          true
        )
        when tipo = 'concluiu_obra' then coalesce(
          (
            select preferencias.mostrar_concluidas
            from public.preferencias_privacidade preferencias
            where preferencias.user_id = diario_atividades.user_id
          ),
          true
        )
        when tipo in ('avaliou_obra', 'publicou_review') then coalesce(
          (
            select preferencias.mostrar_avaliacoes
            from public.preferencias_privacidade preferencias
            where preferencias.user_id = diario_atividades.user_id
          ),
          true
        )
        when tipo = 'salvou_obra' then coalesce(
          (
            select preferencias.mostrar_quero_ler
            from public.preferencias_privacidade preferencias
            where preferencias.user_id = diario_atividades.user_id
          ),
          false
        )
        else true
      end
    )
  );

drop policy if exists "diario_anotacoes_select_visiveis"
  on public.diario_anotacoes;

create policy "diario_anotacoes_select_visiveis"
  on public.diario_anotacoes
  for select
  using (
    user_id = auth.uid()
    or (
      public.usuario_pode_ver_perfil(user_id)
      and coalesce(visibilidade, 'privado') in ('publico', 'parcial')
      and coalesce(
        (
          select preferencias.mostrar_diario_perfil
          from public.preferencias_privacidade preferencias
          where preferencias.user_id = diario_anotacoes.user_id
        ),
        true
      )
    )
  );

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
      where anotacao.id = diario_anotacao_comentarios.anotacao_id
        and public.usuario_pode_ver_perfil(anotacao.user_id)
        and (
          anotacao.user_id = auth.uid()
          or coalesce(preferencias.quem_pode_comentar_diario, 'todos') = 'todos'
          or (
            coalesce(preferencias.quem_pode_comentar_diario, 'todos') = 'seguidores'
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

commit;