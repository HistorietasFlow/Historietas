-- 20260728000700_denuncias_perfis_rpc_segura.sql
-- Protege o envio de denúncias de perfis e cria a RPC usada pelo DenunciaModal.

begin;

-- ============================================================
-- PRÉ-REQUISITOS
-- ============================================================

do $$
begin
  if to_regclass('public.denuncias_perfis') is null then
    raise exception 'A tabela public.denuncias_perfis precisa existir.';
  end if;

  if to_regclass('public.profiles') is null then
    raise exception 'A tabela public.profiles precisa existir.';
  end if;

  if to_regprocedure('public.usuario_e_admin()') is null then
    raise exception 'A função public.usuario_e_admin() precisa existir.';
  end if;
end
$$;

-- ============================================================
-- MOTIVOS VÁLIDOS
-- Mantém os códigos antigos para não invalidar denúncias históricas.
-- ============================================================

create or replace function public.perfil_motivo_denuncia_valido(
  p_motivo text
)
returns boolean
language sql
immutable
set search_path = pg_catalog, public
as $$
  select lower(btrim(coalesce(p_motivo, ''))) in (
    'conteudo_inadequado',
    'spam',
    'assedio',
    'odio_discriminacao',
    'ameaca_violencia',
    'conteudo_sexual',
    'risco_menor',
    'informacoes_pessoais',
    'fraude',
    'perfil_falso',
    'outro',

    -- Códigos legados
    'ofensivo',
    'improprio'
  );
$$;

revoke all
  on function public.perfil_motivo_denuncia_valido(text)
  from public, anon, authenticated;

-- ============================================================
-- NORMALIZAÇÃO DOS DADOS EXISTENTES
-- ============================================================

update public.denuncias_perfis
set
  perfil_nome = left(btrim(coalesce(perfil_nome, '')), 120),
  perfil_url = left(btrim(coalesce(perfil_url, '')), 1000),
  motivo = case
    when public.perfil_motivo_denuncia_valido(motivo)
      then lower(btrim(motivo))
    else 'outro'
  end,
  descricao = left(btrim(coalesce(descricao, '')), 1200),
  status = case
    when lower(btrim(coalesce(status, ''))) in (
      'pendente',
      'analisada',
      'ignorada',
      'resolvida'
    )
      then lower(btrim(status))
    else 'pendente'
  end,
  criado_em = coalesce(criado_em, now()),
  atualizado_em = coalesce(atualizado_em, criado_em, now());

delete from public.denuncias_perfis
where denunciante_id is null
   or denunciado_id is null
   or denunciante_id = denunciado_id;

alter table public.denuncias_perfis
  alter column denunciante_id set not null,
  alter column denunciado_id set not null,
  alter column perfil_nome set default '',
  alter column perfil_nome set not null,
  alter column perfil_url set default '',
  alter column perfil_url set not null,
  alter column motivo set default 'outro',
  alter column motivo set not null,
  alter column descricao set default '',
  alter column descricao set not null,
  alter column status set default 'pendente',
  alter column status set not null,
  alter column criado_em set default now(),
  alter column criado_em set not null,
  alter column atualizado_em set default now(),
  alter column atualizado_em set not null;

alter table public.denuncias_perfis
  drop constraint if exists denuncias_perfis_status_check,
  drop constraint if exists denuncias_perfis_motivo_check,
  drop constraint if exists denuncias_perfis_perfil_nome_length_check,
  drop constraint if exists denuncias_perfis_perfil_url_length_check,
  drop constraint if exists denuncias_perfis_descricao_length_check,
  drop constraint if exists denuncias_perfis_usuarios_diferentes_check;

alter table public.denuncias_perfis
  add constraint denuncias_perfis_status_check
  check (
    status in ('pendente', 'analisada', 'ignorada', 'resolvida')
  ),
  add constraint denuncias_perfis_motivo_check
  check (public.perfil_motivo_denuncia_valido(motivo)),
  add constraint denuncias_perfis_perfil_nome_length_check
  check (char_length(perfil_nome) <= 120),
  add constraint denuncias_perfis_perfil_url_length_check
  check (char_length(perfil_url) <= 1000),
  add constraint denuncias_perfis_descricao_length_check
  check (char_length(descricao) <= 1200),
  add constraint denuncias_perfis_usuarios_diferentes_check
  check (denunciante_id <> denunciado_id);

-- Permite uma nova denúncia futura depois que a anterior for
-- ignorada ou resolvida, mas impede duas denúncias ativas iguais.
drop index if exists public.denuncias_perfis_unica_idx;
drop index if exists public.denuncias_perfis_ativa_uidx;

create unique index denuncias_perfis_ativa_uidx
  on public.denuncias_perfis (denunciante_id, denunciado_id)
  where status in ('pendente', 'analisada');

-- ============================================================
-- TRIGGER DE INTEGRIDADE
-- ============================================================

create or replace function public.validar_denuncia_perfil()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare
  v_usuario_atual uuid := auth.uid();
  v_service_role boolean := coalesce(auth.role() = 'service_role', false);
  v_e_admin boolean := coalesce(public.usuario_e_admin(), false);
  v_nome_perfil text := '';
  v_total_ultima_hora integer := 0;
begin
  if tg_op = 'INSERT' then
    if not v_service_role and v_usuario_atual is null then
      raise exception 'Entre na sua conta para enviar uma denúncia.'
        using errcode = '42501';
    end if;

    if not v_service_role then
      if new.denunciante_id is distinct from v_usuario_atual then
        raise exception 'O denunciante precisa ser o usuário autenticado.'
          using errcode = '42501';
      end if;
    elsif new.denunciante_id is null then
      raise exception 'A denúncia precisa informar o denunciante.'
        using errcode = '23502';
    end if;

    if new.denunciado_id is null then
      raise exception 'A denúncia precisa informar o perfil denunciado.'
        using errcode = '23502';
    end if;

    if new.denunciante_id = new.denunciado_id then
      raise exception 'Você não pode denunciar o próprio perfil.'
        using errcode = '22023';
    end if;

    if not exists (
      select 1
      from auth.users usuario
      where usuario.id = new.denunciado_id
    ) then
      raise exception 'O perfil denunciado não existe mais.'
        using errcode = 'P0002';
    end if;

    new.motivo := lower(btrim(coalesce(new.motivo, 'outro')));
    new.descricao := left(btrim(coalesce(new.descricao, '')), 1200);
    new.perfil_url := left(btrim(coalesce(new.perfil_url, '')), 1000);

    if not public.perfil_motivo_denuncia_valido(new.motivo) then
      raise exception 'Motivo da denúncia inválido.'
        using errcode = '22023';
    end if;

    select coalesce(nullif(btrim(perfil.nome), ''), '')
    into v_nome_perfil
    from public.profiles perfil
    where perfil.user_id = new.denunciado_id
       or perfil.id = new.denunciado_id
    order by
      case when perfil.user_id = new.denunciado_id then 0 else 1 end
    limit 1;

    new.perfil_nome := left(
      coalesce(
        nullif(v_nome_perfil, ''),
        nullif(btrim(coalesce(new.perfil_nome, '')), ''),
        'Usuário denunciado'
      ),
      120
    );

    if new.perfil_url = ''
      or not new.perfil_url ~ '^/[^/]'
    then
      new.perfil_url :=
        '/perfil-autor?userId=' || new.denunciado_id::text;
    end if;

    if not v_service_role and not v_e_admin then
      select count(*)::integer
      into v_total_ultima_hora
      from public.denuncias_perfis denuncia
      where denuncia.denunciante_id = new.denunciante_id
        and denuncia.criado_em >= now() - interval '1 hour';

      if v_total_ultima_hora >= 20 then
        raise exception
          'Limite temporário de denúncias atingido. Tente novamente mais tarde.'
          using errcode = 'P0001';
      end if;
    end if;

    if new.status is distinct from 'pendente' then
      raise exception
        'O status inicial da denúncia precisa ser pendente.'
        using errcode = '42501';
    end if;

    new.status := 'pendente';
    new.criado_em := now();
    new.atualizado_em := now();

    return new;
  end if;

  if tg_op = 'UPDATE' then
    if not v_service_role and not v_e_admin then
      raise exception
        'Somente administradores e moderadores podem atualizar denúncias.'
        using errcode = '42501';
    end if;

    if new.denunciante_id is distinct from old.denunciante_id
      or new.denunciado_id is distinct from old.denunciado_id
      or new.perfil_nome is distinct from old.perfil_nome
      or new.perfil_url is distinct from old.perfil_url
      or new.motivo is distinct from old.motivo
      or new.descricao is distinct from old.descricao
      or new.criado_em is distinct from old.criado_em
    then
      raise exception
        'Os dados originais da denúncia não podem ser alterados.'
        using errcode = '42501';
    end if;

    if new.status not in (
      'pendente',
      'analisada',
      'ignorada',
      'resolvida'
    ) then
      raise exception 'Status da denúncia inválido.'
        using errcode = '22023';
    end if;

    new.atualizado_em := now();
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists denuncias_perfis_validar_integridade
  on public.denuncias_perfis;

create trigger denuncias_perfis_validar_integridade
before insert or update
on public.denuncias_perfis
for each row
execute function public.validar_denuncia_perfil();

comment on function public.validar_denuncia_perfil() is
  'Valida identidade, alvo, motivo, limite e campos administrativos de denúncias de perfis.';

revoke all
  on function public.validar_denuncia_perfil()
  from public, anon, authenticated;

-- ============================================================
-- RPC SEGURA USADA PELO MODAL COMPARTILHADO
-- ============================================================

create or replace function public.criar_denuncia_perfil(
  p_denunciado_id uuid,
  p_perfil_nome text default '',
  p_perfil_url text default '',
  p_motivo text default 'outro',
  p_descricao text default ''
)
returns table (
  denuncia_id uuid,
  denuncia_status text,
  denuncia_criado_em timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_motivo text := lower(btrim(coalesce(p_motivo, 'outro')));
  v_denuncia_id uuid;
  v_denuncia_status text;
  v_denuncia_criado_em timestamptz;
begin
  if v_usuario_id is null then
    raise exception 'Entre na sua conta para enviar uma denúncia.'
      using errcode = '42501';
  end if;

  if p_denunciado_id is null then
    raise exception 'A denúncia precisa informar o perfil denunciado.'
      using errcode = '23502';
  end if;

  if v_usuario_id = p_denunciado_id then
    raise exception 'Você não pode denunciar o próprio perfil.'
      using errcode = '22023';
  end if;

  if not public.perfil_motivo_denuncia_valido(v_motivo) then
    raise exception 'Motivo da denúncia inválido.'
      using errcode = '22023';
  end if;

  if char_length(btrim(coalesce(p_descricao, ''))) > 1200 then
    raise exception
      'A explicação da denúncia pode ter no máximo 1200 caracteres.'
      using errcode = '22001';
  end if;

  if exists (
    select 1
    from public.denuncias_perfis denuncia
    where denuncia.denunciante_id = v_usuario_id
      and denuncia.denunciado_id = p_denunciado_id
      and denuncia.status in ('pendente', 'analisada')
  ) then
    raise exception 'Você já possui uma denúncia ativa para este perfil.'
      using
        errcode = '23505',
        constraint = 'denuncias_perfis_ativa_uidx';
  end if;

  insert into public.denuncias_perfis (
    denunciante_id,
    denunciado_id,
    perfil_nome,
    perfil_url,
    motivo,
    descricao,
    status
  )
  values (
    v_usuario_id,
    p_denunciado_id,
    left(btrim(coalesce(p_perfil_nome, '')), 120),
    left(btrim(coalesce(p_perfil_url, '')), 1000),
    v_motivo,
    btrim(coalesce(p_descricao, '')),
    'pendente'
  )
  returning
    id,
    status,
    criado_em
  into
    v_denuncia_id,
    v_denuncia_status,
    v_denuncia_criado_em;

  return query
  select
    v_denuncia_id,
    v_denuncia_status,
    v_denuncia_criado_em;

exception
  when unique_violation then
    raise exception 'Você já possui uma denúncia ativa para este perfil.'
      using
        errcode = '23505',
        constraint = 'denuncias_perfis_ativa_uidx';
end;
$$;

comment on function public.criar_denuncia_perfil(
  uuid,
  text,
  text,
  text,
  text
) is
  'Cria uma denúncia de perfil usando auth.uid(), sem aceitar o denunciante informado pelo cliente.';

revoke all
  on function public.criar_denuncia_perfil(uuid, text, text, text, text)
  from public, anon, authenticated;

grant execute
  on function public.criar_denuncia_perfil(uuid, text, text, text, text)
  to authenticated;

-- O navegador não pode mais inserir diretamente na tabela.
drop policy if exists "denuncias_perfis_insert_propria"
  on public.denuncias_perfis;
drop policy if exists "denuncias_perfis_insert"
  on public.denuncias_perfis;

revoke insert
  on table public.denuncias_perfis
  from public, anon, authenticated;

commit;