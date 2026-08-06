-- Exclusão de conta durável
-- A operação precisa sobreviver à remoção do usuário em auth.users.
-- Por isso, subject_user_id é intencionalmente armazenado SEM foreign key.

begin;

create table if not exists public.operacoes_exclusao_conta (
  id uuid primary key default gen_random_uuid(),

  -- Não adicionar FK para auth.users.
  subject_user_id uuid not null,

  status text not null default 'solicitada',

  buckets_pendentes text[] not null default array[
    'avatars',
    'capas-obras',
    'arquivos-obras'
  ]::text[],

  buckets_concluidos text[] not null default '{}'::text[],

  arquivos_removidos_por_bucket jsonb not null default '{}'::jsonb,

  tentativas_storage integer not null default 0,
  tentativas_auth integer not null default 0,

  ultimo_erro_codigo text,
  ultimo_erro_mensagem text,
  ultima_falha_em timestamptz,

  -- Trava temporária para impedir duas execuções simultâneas.
  lock_token uuid,
  lock_expira_em timestamptz,

  criada_em timestamptz not null default now(),
  iniciada_em timestamptz,
  atualizada_em timestamptz not null default now(),
  storage_limpo_em timestamptz,
  auth_excluido_em timestamptz,
  concluida_em timestamptz,

  constraint operacoes_exclusao_conta_subject_user_id_key
    unique (subject_user_id),

  constraint operacoes_exclusao_conta_status_check
    check (
      status in (
        'solicitada',
        'limpando_storage',
        'storage_limpo',
        'excluindo_auth',
        'concluida',
        'falhou'
      )
    ),

  constraint operacoes_exclusao_conta_tentativas_storage_check
    check (tentativas_storage >= 0),

  constraint operacoes_exclusao_conta_tentativas_auth_check
    check (tentativas_auth >= 0),

  constraint operacoes_exclusao_conta_buckets_pendentes_check
    check (
      buckets_pendentes <@ array[
        'avatars',
        'capas-obras',
        'arquivos-obras'
      ]::text[]
    ),

  constraint operacoes_exclusao_conta_buckets_concluidos_check
    check (
      buckets_concluidos <@ array[
        'avatars',
        'capas-obras',
        'arquivos-obras'
      ]::text[]
    ),

  constraint operacoes_exclusao_conta_buckets_sem_conflito_check
    check (
      not (buckets_pendentes && buckets_concluidos)
    ),

  constraint operacoes_exclusao_conta_arquivos_removidos_check
    check (
      jsonb_typeof(arquivos_removidos_por_bucket) = 'object'
    ),

  constraint operacoes_exclusao_conta_erro_codigo_check
    check (
      ultimo_erro_codigo is null
      or char_length(ultimo_erro_codigo) <= 100
    ),

  constraint operacoes_exclusao_conta_erro_mensagem_check
    check (
      ultimo_erro_mensagem is null
      or char_length(ultimo_erro_mensagem) <= 4000
    ),

  constraint operacoes_exclusao_conta_lock_check
    check (
      (lock_token is null) = (lock_expira_em is null)
    ),

  constraint operacoes_exclusao_conta_storage_limpo_check
    check (
      status not in (
        'storage_limpo',
        'excluindo_auth',
        'concluida'
      )
      or (
        cardinality(buckets_pendentes) = 0
        and storage_limpo_em is not null
      )
    ),

  constraint operacoes_exclusao_conta_concluida_check
    check (
      status <> 'concluida'
      or (
        auth_excluido_em is not null
        and concluida_em is not null
      )
    ),

  constraint operacoes_exclusao_conta_falhou_check
    check (
      status <> 'falhou'
      or nullif(btrim(ultimo_erro_mensagem), '') is not null
    )
);

comment on table public.operacoes_exclusao_conta is
  'Registra e permite retomar exclusões de conta interrompidas. O UUID do usuário não possui FK para auth.users porque precisa sobreviver à exclusão do Auth.';

comment on column public.operacoes_exclusao_conta.subject_user_id is
  'UUID original do usuário. Intencionalmente sem foreign key para auth.users.';

comment on column public.operacoes_exclusao_conta.lock_token is
  'Token temporário usado para impedir processamento concorrente da mesma exclusão.';

create index if not exists operacoes_exclusao_conta_status_atualizada_idx
  on public.operacoes_exclusao_conta (
    status,
    atualizada_em
  );

create index if not exists operacoes_exclusao_conta_lock_expira_idx
  on public.operacoes_exclusao_conta (lock_expira_em)
  where lock_expira_em is not null;

create or replace function public.validar_operacao_exclusao_conta()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'solicitada' then
      raise exception
        using
          errcode = '23514',
          message = 'Uma operação de exclusão deve começar com o status solicitada.';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id then
      raise exception
        using
          errcode = '23514',
          message = 'O identificador da operação não pode ser alterado.';
    end if;

    if new.subject_user_id is distinct from old.subject_user_id then
      raise exception
        using
          errcode = '23514',
          message = 'O usuário da operação não pode ser alterado.';
    end if;

    if new.criada_em is distinct from old.criada_em then
      raise exception
        using
          errcode = '23514',
          message = 'A data de criação da operação não pode ser alterada.';
    end if;

    if old.status = 'concluida' then
      raise exception
        using
          errcode = '23514',
          message = 'Uma operação concluída não pode ser alterada.';
    end if;

    if new.status is distinct from old.status then
      if not (
        (
          old.status = 'solicitada'
          and new.status in (
            'limpando_storage',
            'falhou'
          )
        )
        or (
          old.status = 'limpando_storage'
          and new.status in (
            'storage_limpo',
            'falhou'
          )
        )
        or (
          old.status = 'storage_limpo'
          and new.status in (
            'excluindo_auth',
            'falhou'
          )
        )
        or (
          old.status = 'excluindo_auth'
          and new.status in (
            'concluida',
            'falhou'
          )
        )
        or (
          old.status = 'falhou'
          and new.status in (
            'limpando_storage',
            'excluindo_auth'
          )
        )
      ) then
        raise exception
          using
            errcode = '23514',
            message = format(
              'Transição inválida da exclusão: %s para %s.',
              old.status,
              new.status
            );
      end if;
    end if;
  end if;

  new.atualizada_em := now();

  if new.status = 'limpando_storage' then
    new.iniciada_em := coalesce(
      new.iniciada_em,
      now()
    );
  end if;

  if new.status = 'storage_limpo' then
    if cardinality(new.buckets_pendentes) <> 0 then
      raise exception
        using
          errcode = '23514',
          message = 'Ainda existem buckets pendentes de limpeza.';
    end if;

    new.storage_limpo_em := coalesce(
      new.storage_limpo_em,
      now()
    );
  end if;

  if new.status = 'excluindo_auth' then
    if new.storage_limpo_em is null then
      raise exception
        using
          errcode = '23514',
          message = 'O Auth não pode ser excluído antes da limpeza do Storage.';
    end if;
  end if;

  if new.status = 'falhou' then
    if nullif(
      btrim(new.ultimo_erro_mensagem),
      ''
    ) is null then
      raise exception
        using
          errcode = '23514',
          message = 'Uma operação com falha precisa registrar o erro.';
    end if;

    new.ultima_falha_em := now();
    new.lock_token := null;
    new.lock_expira_em := null;
  end if;

  if new.status = 'concluida' then
    if new.storage_limpo_em is null then
      raise exception
        using
          errcode = '23514',
          message = 'A operação não pode ser concluída sem limpar o Storage.';
    end if;

    if new.auth_excluido_em is null then
      raise exception
        using
          errcode = '23514',
          message = 'A operação não pode ser concluída sem excluir o Auth.';
    end if;

    new.concluida_em := coalesce(
      new.concluida_em,
      now()
    );

    new.lock_token := null;
    new.lock_expira_em := null;
  end if;

  return new;
end;
$$;

drop trigger if exists validar_operacao_exclusao_conta_trigger
  on public.operacoes_exclusao_conta;

create trigger validar_operacao_exclusao_conta_trigger
before insert or update
on public.operacoes_exclusao_conta
for each row
execute function public.validar_operacao_exclusao_conta();

alter table public.operacoes_exclusao_conta
  enable row level security;

revoke all
  on table public.operacoes_exclusao_conta
  from public, anon, authenticated;

grant all
  on table public.operacoes_exclusao_conta
  to service_role;

revoke all
  on function public.validar_operacao_exclusao_conta()
  from public, anon, authenticated;

grant execute
  on function public.validar_operacao_exclusao_conta()
  to service_role;

create or replace function public.reivindicar_operacao_exclusao_conta(
  p_subject_user_id uuid,
  p_lock_token uuid,
  p_lock_duracao_segundos integer default 180
)
returns public.operacoes_exclusao_conta
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  operacao public.operacoes_exclusao_conta;
  duracao_segundos integer;
begin
  if p_subject_user_id is null then
    raise exception
      using
        errcode = '22023',
        message = 'O usuário da exclusão é obrigatório.';
  end if;

  if p_lock_token is null then
    raise exception
      using
        errcode = '22023',
        message = 'O token de processamento é obrigatório.';
  end if;

  duracao_segundos := greatest(
    30,
    least(
      coalesce(p_lock_duracao_segundos, 180),
      900
    )
  );

  insert into public.operacoes_exclusao_conta (
    subject_user_id
  )
  values (
    p_subject_user_id
  )
  on conflict (subject_user_id) do nothing;

  update public.operacoes_exclusao_conta
  set
    lock_token = p_lock_token,
    lock_expira_em =
      clock_timestamp()
      + make_interval(secs => duracao_segundos)
  where subject_user_id = p_subject_user_id
    and status <> 'concluida'
    and (
      lock_token is null
      or lock_expira_em is null
      or lock_expira_em <= clock_timestamp()
      or lock_token = p_lock_token
    )
  returning *
  into operacao;

  if not found then
    raise exception
      using
        errcode = '55P03',
        message = 'operacao_exclusao_em_andamento';
  end if;

  return operacao;
end;
$$;

comment on function public.reivindicar_operacao_exclusao_conta(
  uuid,
  uuid,
  integer
) is
  'Cria ou recupera uma operação de exclusão e adquire uma trava temporária para impedir processamento concorrente. Disponível somente para service_role.';

revoke all
  on function public.reivindicar_operacao_exclusao_conta(
    uuid,
    uuid,
    integer
  )
  from public, anon, authenticated;

grant execute
  on function public.reivindicar_operacao_exclusao_conta(
    uuid,
    uuid,
    integer
  )
  to service_role;

commit;