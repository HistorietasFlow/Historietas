-- 20260728001000_problemas_tecnicos_separados.sql
-- Cria um canal próprio para problemas técnicos.
-- Este registro é separado das denúncias de conteúdo, perfis e violações das regras.

begin;

create extension if not exists pgcrypto;

-- ============================================================
-- ADMINISTRAÇÃO
-- ============================================================

create or replace function public.suporte_usuario_e_admin()
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog
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

revoke all
  on function public.suporte_usuario_e_admin()
  from public, anon, authenticated;

grant execute
  on function public.suporte_usuario_e_admin()
  to authenticated;

-- ============================================================
-- TABELA DE PROBLEMAS TÉCNICOS
-- ============================================================

create table if not exists public.problemas_tecnicos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null
    references auth.users(id)
    on delete cascade,
  email_contato text not null default '',
  categoria text not null default 'outro',
  titulo text not null,
  descricao text not null,
  pagina_url text not null default '',
  navegador text not null default '',
  dispositivo text not null default '',
  status text not null default 'aberto',
  prioridade text not null default 'normal',
  observacao_admin text not null default '',
  analisado_por uuid
    references auth.users(id)
    on delete set null,
  analisado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint problemas_tecnicos_categoria_check
    check (
      categoria in (
        'conta_acesso',
        'publicacao',
        'leitura',
        'comunidade',
        'diario',
        'notificacoes',
        'privacidade',
        'desempenho',
        'outro'
      )
    ),
  constraint problemas_tecnicos_status_check
    check (
      status in (
        'aberto',
        'em_analise',
        'aguardando_usuario',
        'resolvido',
        'fechado'
      )
    ),
  constraint problemas_tecnicos_prioridade_check
    check (
      prioridade in (
        'baixa',
        'normal',
        'alta',
        'urgente'
      )
    ),
  constraint problemas_tecnicos_titulo_tamanho_check
    check (
      char_length(titulo) between 8 and 120
    ),
  constraint problemas_tecnicos_descricao_tamanho_check
    check (
      char_length(descricao) between 20 and 3000
    ),
  constraint problemas_tecnicos_email_tamanho_check
    check (
      char_length(email_contato) <= 320
    ),
  constraint problemas_tecnicos_pagina_url_tamanho_check
    check (
      char_length(pagina_url) <= 700
    ),
  constraint problemas_tecnicos_navegador_tamanho_check
    check (
      char_length(navegador) <= 500
    ),
  constraint problemas_tecnicos_dispositivo_tamanho_check
    check (
      char_length(dispositivo) <= 160
    ),
  constraint problemas_tecnicos_observacao_tamanho_check
    check (
      char_length(observacao_admin) <= 3000
    )
);

create index if not exists problemas_tecnicos_usuario_data_idx
  on public.problemas_tecnicos (
    user_id,
    criado_em desc
  );

create index if not exists problemas_tecnicos_status_data_idx
  on public.problemas_tecnicos (
    status,
    criado_em desc
  );

create index if not exists problemas_tecnicos_categoria_data_idx
  on public.problemas_tecnicos (
    categoria,
    criado_em desc
  );

alter table public.problemas_tecnicos
  enable row level security;

-- ============================================================
-- VALIDAÇÃO
-- ============================================================

create or replace function public.validar_problema_tecnico()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_service_role boolean :=
    coalesce(auth.role() = 'service_role', false);
  v_admin boolean :=
    coalesce(public.suporte_usuario_e_admin(), false);
  v_total_ultima_hora integer := 0;
  v_total_ultimo_dia integer := 0;
begin
  if tg_op = 'INSERT' then
    new.email_contato :=
      lower(btrim(coalesce(new.email_contato, '')));
    new.categoria :=
      lower(btrim(coalesce(new.categoria, 'outro')));
    new.titulo :=
      btrim(coalesce(new.titulo, ''));
    new.descricao :=
      btrim(coalesce(new.descricao, ''));
    new.pagina_url :=
      btrim(coalesce(new.pagina_url, ''));
    new.navegador :=
      btrim(coalesce(new.navegador, ''));
    new.dispositivo :=
      btrim(coalesce(new.dispositivo, ''));

    if not v_service_role and v_usuario_id is null then
      raise exception
        'Entre na sua conta para relatar um problema técnico.'
        using errcode = '42501';
    end if;

    if not v_service_role
      and new.user_id is distinct from v_usuario_id
    then
      raise exception
        'O chamado precisa pertencer ao usuário autenticado.'
        using errcode = '42501';
    end if;

    if new.categoria not in (
      'conta_acesso',
      'publicacao',
      'leitura',
      'comunidade',
      'diario',
      'notificacoes',
      'privacidade',
      'desempenho',
      'outro'
    ) then
      raise exception
        'Categoria do problema técnico inválida.'
        using errcode = '22023';
    end if;

    if char_length(new.titulo) < 8
      or char_length(new.titulo) > 120
    then
      raise exception
        'O título precisa ter entre 8 e 120 caracteres.'
        using errcode = '22023';
    end if;

    if char_length(new.descricao) < 20
      or char_length(new.descricao) > 3000
    then
      raise exception
        'A descrição precisa ter entre 20 e 3000 caracteres.'
        using errcode = '22023';
    end if;

    if char_length(new.email_contato) > 320
      or char_length(new.pagina_url) > 700
      or char_length(new.navegador) > 500
      or char_length(new.dispositivo) > 160
    then
      raise exception
        'Uma das informações do ambiente excedeu o limite permitido.'
        using errcode = '22001';
    end if;

    if not v_service_role and not v_admin then
      select count(*)::integer
      into v_total_ultima_hora
      from public.problemas_tecnicos problema
      where problema.user_id = new.user_id
        and problema.criado_em >=
          now() - interval '1 hour';

      select count(*)::integer
      into v_total_ultimo_dia
      from public.problemas_tecnicos problema
      where problema.user_id = new.user_id
        and problema.criado_em >=
          now() - interval '24 hours';

      if v_total_ultima_hora >= 5
        or v_total_ultimo_dia >= 12
      then
        raise exception
          'Limite temporário de chamados atingido. Tente novamente mais tarde.'
          using errcode = 'P0001';
      end if;
    end if;

    if new.status is distinct from 'aberto'
      or new.prioridade is distinct from 'normal'
      or btrim(coalesce(new.observacao_admin, '')) <> ''
      or new.analisado_por is not null
      or new.analisado_em is not null
    then
      raise exception
        'Campos administrativos não podem ser definidos ao criar o chamado.'
        using errcode = '42501';
    end if;

    new.status := 'aberto';
    new.prioridade := 'normal';
    new.observacao_admin := '';
    new.analisado_por := null;
    new.analisado_em := null;
    new.criado_em := now();
    new.atualizado_em := now();

    return new;
  end if;

  if tg_op = 'UPDATE' then
    if not v_service_role and not v_admin then
      raise exception
        'Somente administradores e moderadores podem atualizar chamados técnicos.'
        using errcode = '42501';
    end if;

    if new.user_id is distinct from old.user_id
      or new.email_contato is distinct from old.email_contato
      or new.categoria is distinct from old.categoria
      or new.titulo is distinct from old.titulo
      or new.descricao is distinct from old.descricao
      or new.pagina_url is distinct from old.pagina_url
      or new.navegador is distinct from old.navegador
      or new.dispositivo is distinct from old.dispositivo
      or new.criado_em is distinct from old.criado_em
    then
      raise exception
        'As informações originais do chamado não podem ser alteradas.'
        using errcode = '42501';
    end if;

    new.observacao_admin :=
      btrim(coalesce(new.observacao_admin, ''));

    if new.status not in (
      'aberto',
      'em_analise',
      'aguardando_usuario',
      'resolvido',
      'fechado'
    ) then
      raise exception
        'Status do chamado técnico inválido.'
        using errcode = '22023';
    end if;

    if new.prioridade not in (
      'baixa',
      'normal',
      'alta',
      'urgente'
    ) then
      raise exception
        'Prioridade do chamado técnico inválida.'
        using errcode = '22023';
    end if;

    if char_length(new.observacao_admin) > 3000 then
      raise exception
        'A observação administrativa pode ter no máximo 3000 caracteres.'
        using errcode = '22001';
    end if;

    if new.status is distinct from old.status
      or new.prioridade is distinct from old.prioridade
      or new.observacao_admin is distinct from old.observacao_admin
    then
      if not v_service_role and v_usuario_id is not null then
        new.analisado_por := v_usuario_id;
      end if;

      new.analisado_em := now();
    end if;

    new.atualizado_em := now();
    return new;
  end if;

  return new;
end;
$$;

revoke all
  on function public.validar_problema_tecnico()
  from public, anon, authenticated;

drop trigger if exists
  validar_problema_tecnico_trigger
  on public.problemas_tecnicos;

create trigger validar_problema_tecnico_trigger
before insert or update
on public.problemas_tecnicos
for each row
execute function public.validar_problema_tecnico();

-- ============================================================
-- POLÍTICAS
-- ============================================================

drop policy if exists
  "problemas_tecnicos_select_proprio_ou_admin"
  on public.problemas_tecnicos;

drop policy if exists
  "problemas_tecnicos_insert_bloqueado"
  on public.problemas_tecnicos;

drop policy if exists
  "problemas_tecnicos_update_admin"
  on public.problemas_tecnicos;

drop policy if exists
  "problemas_tecnicos_delete_admin"
  on public.problemas_tecnicos;

create policy
  "problemas_tecnicos_select_proprio_ou_admin"
  on public.problemas_tecnicos
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.suporte_usuario_e_admin()
  );

create policy
  "problemas_tecnicos_insert_bloqueado"
  on public.problemas_tecnicos
  for insert
  to authenticated
  with check (false);

create policy
  "problemas_tecnicos_update_admin"
  on public.problemas_tecnicos
  for update
  to authenticated
  using (public.suporte_usuario_e_admin())
  with check (public.suporte_usuario_e_admin());

create policy
  "problemas_tecnicos_delete_admin"
  on public.problemas_tecnicos
  for delete
  to authenticated
  using (public.suporte_usuario_e_admin());

revoke all
  on table public.problemas_tecnicos
  from public, anon, authenticated;

grant select, update, delete
  on table public.problemas_tecnicos
  to authenticated;

-- ============================================================
-- RPC PARA CRIAR CHAMADO
-- ============================================================

create or replace function public.criar_problema_tecnico(
  p_categoria text,
  p_titulo text,
  p_descricao text,
  p_pagina_url text default '',
  p_navegador text default '',
  p_dispositivo text default ''
)
returns table (
  problema_id uuid,
  problema_status text,
  problema_criado_em timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_email text := '';
  v_categoria text :=
    lower(btrim(coalesce(p_categoria, 'outro')));
  v_titulo text :=
    btrim(coalesce(p_titulo, ''));
  v_descricao text :=
    btrim(coalesce(p_descricao, ''));
  v_pagina_url text :=
    btrim(coalesce(p_pagina_url, ''));
  v_navegador text :=
    btrim(coalesce(p_navegador, ''));
  v_dispositivo text :=
    btrim(coalesce(p_dispositivo, ''));
  v_id uuid;
  v_status text;
  v_criado_em timestamptz;
begin
  if v_usuario_id is null then
    raise exception
      'Entre na sua conta para relatar um problema técnico.'
      using errcode = '42501';
  end if;

  select lower(btrim(coalesce(usuario.email, '')))
  into v_email
  from auth.users usuario
  where usuario.id = v_usuario_id;

  insert into public.problemas_tecnicos (
    user_id,
    email_contato,
    categoria,
    titulo,
    descricao,
    pagina_url,
    navegador,
    dispositivo
  )
  values (
    v_usuario_id,
    coalesce(v_email, ''),
    v_categoria,
    v_titulo,
    v_descricao,
    v_pagina_url,
    v_navegador,
    v_dispositivo
  )
  returning
    id,
    status,
    criado_em
  into
    v_id,
    v_status,
    v_criado_em;

  return query
  select
    v_id,
    v_status,
    v_criado_em;
end;
$$;

revoke all
  on function public.criar_problema_tecnico(
    text,
    text,
    text,
    text,
    text,
    text
  )
  from public, anon, authenticated;

grant execute
  on function public.criar_problema_tecnico(
    text,
    text,
    text,
    text,
    text,
    text
  )
  to authenticated;

-- ============================================================
-- RPC PARA O USUÁRIO CONSULTAR OS PRÓPRIOS CHAMADOS
-- ============================================================

create or replace function public.listar_meus_problemas_tecnicos(
  p_limite integer default 30
)
returns table (
  problema_id uuid,
  categoria text,
  titulo text,
  descricao text,
  pagina_url text,
  status text,
  prioridade text,
  observacao_admin text,
  criado_em timestamptz,
  atualizado_em timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
  select
    problema.id,
    problema.categoria,
    problema.titulo,
    problema.descricao,
    problema.pagina_url,
    problema.status,
    problema.prioridade,
    problema.observacao_admin,
    problema.criado_em,
    problema.atualizado_em
  from public.problemas_tecnicos problema
  where auth.uid() is not null
    and problema.user_id = auth.uid()
  order by problema.criado_em desc
  limit greatest(
    1,
    least(coalesce(p_limite, 30), 100)
  );
$$;

revoke all
  on function public.listar_meus_problemas_tecnicos(integer)
  from public, anon, authenticated;

grant execute
  on function public.listar_meus_problemas_tecnicos(integer)
  to authenticated;

comment on table public.problemas_tecnicos is
  'Chamados de falhas técnicas separados das denúncias de violações das regras.';

comment on function public.criar_problema_tecnico(
  text,
  text,
  text,
  text,
  text,
  text
) is
  'Cria um chamado técnico autenticado, validado e limitado por frequência.';

comment on function public.listar_meus_problemas_tecnicos(integer) is
  'Lista somente os chamados técnicos pertencentes ao usuário autenticado.';

commit;