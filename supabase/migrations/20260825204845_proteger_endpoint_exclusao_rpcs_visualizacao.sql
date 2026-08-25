-- Limita operações sensíveis de forma atômica e retira os contadores de
-- visualização do acesso direto do navegador.

create schema if not exists historietas_privado authorization postgres;

create table if not exists historietas_privado.limites_requisicao (
  escopo text not null,
  chave_hash text not null,
  janela_iniciada_em timestamptz not null,
  contador integer not null default 0,
  bloqueado_ate timestamptz,
  atualizado_em timestamptz not null default clock_timestamp(),
  constraint limites_requisicao_pkey primary key (escopo, chave_hash),
  constraint limites_requisicao_escopo_check check (
    char_length(escopo) between 1 and 64
    and escopo ~ '^[a-z0-9:_-]+$'
  ),
  constraint limites_requisicao_chave_hash_check check (
    chave_hash ~ '^[0-9a-f]{64}$'
  ),
  constraint limites_requisicao_contador_check check (
    contador between 0 and 1000000
  )
);

alter table historietas_privado.limites_requisicao owner to postgres;
alter table historietas_privado.limites_requisicao enable row level security;

revoke all privileges
on table historietas_privado.limites_requisicao
from public, anon, authenticated, service_role;

create index if not exists limites_requisicao_atualizado_em_idx
on historietas_privado.limites_requisicao (atualizado_em);

comment on table historietas_privado.limites_requisicao is
  'Buckets privados e atômicos de limitação. As chaves são HMACs gerados exclusivamente no servidor.';

create or replace function historietas_privado.consumir_limite_requisicao(
  p_escopo text,
  p_chave_hash text,
  p_limite integer,
  p_janela_segundos integer,
  p_bloqueio_segundos integer
)
returns table (
  permitido boolean,
  restante integer,
  tentar_novamente_segundos integer
)
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_agora timestamptz := clock_timestamp();
  v_registro historietas_privado.limites_requisicao%rowtype;
  v_fim_janela timestamptz;
  v_bloqueado_ate timestamptz;
  v_permitido boolean := false;
  v_restante integer := 0;
  v_tentar_novamente integer := 0;
begin
  if p_escopo is null
    or char_length(p_escopo) not between 1 and 64
    or p_escopo !~ '^[a-z0-9:_-]+$'
  then
    raise exception using
      errcode = '22023',
      message = 'Escopo inválido para o limitador.';
  end if;

  if p_chave_hash is null or p_chave_hash !~ '^[0-9a-f]{64}$' then
    raise exception using
      errcode = '22023',
      message = 'Chave inválida para o limitador.';
  end if;

  if p_limite is null
    or p_janela_segundos is null
    or p_bloqueio_segundos is null
    or p_limite not between 1 and 10000
    or p_janela_segundos not between 1 and 604800
    or p_bloqueio_segundos not between 0 and 604800
  then
    raise exception using
      errcode = '22023',
      message = 'Parâmetros inválidos para o limitador.';
  end if;

  insert into historietas_privado.limites_requisicao (
    escopo,
    chave_hash,
    janela_iniciada_em,
    contador,
    bloqueado_ate,
    atualizado_em
  )
  values (
    p_escopo,
    p_chave_hash,
    v_agora,
    0,
    null,
    v_agora
  )
  on conflict (escopo, chave_hash) do nothing;

  select limite.*
  into strict v_registro
  from historietas_privado.limites_requisicao as limite
  where limite.escopo = p_escopo
    and limite.chave_hash = p_chave_hash
  for update;

  v_fim_janela :=
    v_registro.janela_iniciada_em
    + pg_catalog.make_interval(secs => p_janela_segundos);

  if v_registro.bloqueado_ate is not null
    and v_registro.bloqueado_ate > v_agora
  then
    v_bloqueado_ate := v_registro.bloqueado_ate;
    v_permitido := false;
    v_restante := 0;
  elsif v_fim_janela <= v_agora then
    update historietas_privado.limites_requisicao as limite
    set
      janela_iniciada_em = v_agora,
      contador = 1,
      bloqueado_ate = null,
      atualizado_em = v_agora
    where limite.escopo = p_escopo
      and limite.chave_hash = p_chave_hash;

    v_fim_janela :=
      v_agora + pg_catalog.make_interval(secs => p_janela_segundos);
    v_bloqueado_ate := null;
    v_permitido := true;
    v_restante := p_limite - 1;
  elsif v_registro.contador >= p_limite then
    v_bloqueado_ate := case
      when p_bloqueio_segundos > 0 then
        v_agora + pg_catalog.make_interval(secs => p_bloqueio_segundos)
      else v_fim_janela
    end;

    update historietas_privado.limites_requisicao as limite
    set
      bloqueado_ate = v_bloqueado_ate,
      atualizado_em = v_agora
    where limite.escopo = p_escopo
      and limite.chave_hash = p_chave_hash;

    v_permitido := false;
    v_restante := 0;
  else
    update historietas_privado.limites_requisicao as limite
    set
      contador = limite.contador + 1,
      bloqueado_ate = null,
      atualizado_em = v_agora
    where limite.escopo = p_escopo
      and limite.chave_hash = p_chave_hash;

    v_bloqueado_ate := null;
    v_permitido := true;
    v_restante := greatest(p_limite - v_registro.contador - 1, 0);
  end if;

  if not v_permitido then
    v_tentar_novamente := greatest(
      1,
      ceil(
        extract(
          epoch from coalesce(v_bloqueado_ate, v_fim_janela) - v_agora
        )
      )::integer
    );
  end if;

  -- Uma limpeza pequena e não bloqueante evita crescimento ilimitado sem
  -- adicionar uma dependência operacional de pg_cron.
  if pg_catalog.random() < 0.01 then
    delete from historietas_privado.limites_requisicao as limite
    using (
      select antigo.escopo, antigo.chave_hash
      from historietas_privado.limites_requisicao as antigo
      where antigo.atualizado_em < v_agora - interval '8 days'
      order by antigo.atualizado_em
      limit 100
      for update skip locked
    ) as expirado
    where limite.escopo = expirado.escopo
      and limite.chave_hash = expirado.chave_hash;
  end if;

  return query
  select v_permitido, v_restante, v_tentar_novamente;
end;
$$;

alter function historietas_privado.consumir_limite_requisicao(
  text,
  text,
  integer,
  integer,
  integer
) owner to postgres;

revoke all on function historietas_privado.consumir_limite_requisicao(
  text,
  text,
  integer,
  integer,
  integer
) from public, anon, authenticated, service_role;

comment on function historietas_privado.consumir_limite_requisicao(
  text,
  text,
  integer,
  integer,
  integer
) is
  'Serializa um bucket de limite e devolve permissão, saldo e Retry-After. Uso exclusivo por funções proprietárias.';

create or replace function public.consumir_limite_requisicao(
  p_escopo text,
  p_chave_hash text,
  p_limite integer,
  p_janela_segundos integer,
  p_bloqueio_segundos integer
)
returns table (
  permitido boolean,
  restante integer,
  tentar_novamente_segundos integer
)
language sql
volatile
security definer
set search_path = ''
as $$
  select resultado.permitido,
         resultado.restante,
         resultado.tentar_novamente_segundos
  from historietas_privado.consumir_limite_requisicao(
    p_escopo,
    p_chave_hash,
    p_limite,
    p_janela_segundos,
    p_bloqueio_segundos
  ) as resultado;
$$;

alter function public.consumir_limite_requisicao(
  text,
  text,
  integer,
  integer,
  integer
) owner to postgres;

revoke all on function public.consumir_limite_requisicao(
  text,
  text,
  integer,
  integer,
  integer
) from public, anon, authenticated, service_role;

grant execute on function public.consumir_limite_requisicao(
  text,
  text,
  integer,
  integer,
  integer
) to service_role;

comment on function public.consumir_limite_requisicao(
  text,
  text,
  integer,
  integer,
  integer
) is
  'Entrada server-only do limitador persistente. Nunca recebe IP, e-mail ou UUID em claro.';

create or replace function public.registrar_visualizacao_obra(
  p_obra_id uuid,
  p_chave_visitante text
)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_total integer := 0;
  v_inseridas integer := 0;
  v_permitida_minuto boolean := false;
  v_permitida_dia boolean := false;
begin
  if p_obra_id is null
    or p_chave_visitante is null
    or p_chave_visitante !~ '^[0-9a-f]{64}$'
  then
    raise exception using
      errcode = '22023',
      message = 'Parâmetros inválidos para registrar a visualização.';
  end if;

  select coalesce(obra.visualizacoes, 0)
  into v_total
  from public.obras as obra
  where obra.id = p_obra_id
    and coalesce(obra.publicado, false) = true
  limit 1;

  if not found then
    return 0;
  end if;

  select resultado.permitido
  into v_permitida_minuto
  from historietas_privado.consumir_limite_requisicao(
    'visualizacao:minuto',
    p_chave_visitante,
    60,
    60,
    60
  ) as resultado;

  if not coalesce(v_permitida_minuto, false) then
    return v_total;
  end if;

  select resultado.permitido
  into v_permitida_dia
  from historietas_privado.consumir_limite_requisicao(
    'visualizacao:dia',
    p_chave_visitante,
    500,
    86400,
    0
  ) as resultado;

  if not coalesce(v_permitida_dia, false) then
    return v_total;
  end if;

  insert into public.obra_visualizacoes_unicas (
    obra_id,
    chave_visitante,
    dia
  )
  values (
    p_obra_id,
    'servidor:' || p_chave_visitante,
    current_date
  )
  on conflict (obra_id, chave_visitante, dia) do nothing;

  get diagnostics v_inseridas = row_count;

  if v_inseridas = 0 then
    return v_total;
  end if;

  update public.obras as obra
  set visualizacoes = coalesce(obra.visualizacoes, 0) + 1
  where obra.id = p_obra_id
    and coalesce(obra.publicado, false) = true
  returning coalesce(obra.visualizacoes, 0)
  into v_total;

  return coalesce(v_total, 0);
end;
$$;

alter function public.registrar_visualizacao_obra(uuid, text)
owner to postgres;

revoke all on function public.registrar_visualizacao_obra(uuid, text)
from public, anon, authenticated, service_role;

grant execute on function public.registrar_visualizacao_obra(uuid, text)
to service_role;

comment on function public.registrar_visualizacao_obra(uuid, text) is
  'Registra visualização deduplicada após limites globais por visitante. Entrada exclusiva do servidor.';

create or replace function public.registrar_visualizacao_capitulo(
  p_capitulo_id uuid,
  p_chave_visitante text
)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_total integer := 0;
  v_inseridas integer := 0;
  v_permitida_minuto boolean := false;
  v_permitida_dia boolean := false;
begin
  if p_capitulo_id is null
    or p_chave_visitante is null
    or p_chave_visitante !~ '^[0-9a-f]{64}$'
  then
    raise exception using
      errcode = '22023',
      message = 'Parâmetros inválidos para registrar a visualização.';
  end if;

  select coalesce(capitulo.visualizacoes, 0)
  into v_total
  from public.capitulos as capitulo
  inner join public.obras as obra
    on obra.id = capitulo.obra_id
  where capitulo.id = p_capitulo_id
    and coalesce(capitulo.publicado, false) = true
    and coalesce(obra.publicado, false) = true
  limit 1;

  if not found then
    return 0;
  end if;

  select resultado.permitido
  into v_permitida_minuto
  from historietas_privado.consumir_limite_requisicao(
    'visualizacao:minuto',
    p_chave_visitante,
    60,
    60,
    60
  ) as resultado;

  if not coalesce(v_permitida_minuto, false) then
    return v_total;
  end if;

  select resultado.permitido
  into v_permitida_dia
  from historietas_privado.consumir_limite_requisicao(
    'visualizacao:dia',
    p_chave_visitante,
    500,
    86400,
    0
  ) as resultado;

  if not coalesce(v_permitida_dia, false) then
    return v_total;
  end if;

  insert into public.capitulo_visualizacoes_unicas (
    capitulo_id,
    chave_visitante,
    dia
  )
  values (
    p_capitulo_id,
    'servidor:' || p_chave_visitante,
    current_date
  )
  on conflict (capitulo_id, chave_visitante, dia) do nothing;

  get diagnostics v_inseridas = row_count;

  if v_inseridas = 0 then
    return v_total;
  end if;

  update public.capitulos as capitulo
  set visualizacoes = coalesce(capitulo.visualizacoes, 0) + 1
  where capitulo.id = p_capitulo_id
    and coalesce(capitulo.publicado, false) = true
    and exists (
      select 1
      from public.obras as obra
      where obra.id = capitulo.obra_id
        and coalesce(obra.publicado, false) = true
    )
  returning coalesce(capitulo.visualizacoes, 0)
  into v_total;

  return coalesce(v_total, 0);
end;
$$;

alter function public.registrar_visualizacao_capitulo(uuid, text)
owner to postgres;

revoke all on function public.registrar_visualizacao_capitulo(uuid, text)
from public, anon, authenticated, service_role;

grant execute on function public.registrar_visualizacao_capitulo(uuid, text)
to service_role;

comment on function public.registrar_visualizacao_capitulo(uuid, text) is
  'Registra visualização deduplicada após limites globais por visitante. Entrada exclusiva do servidor.';

-- Os RPCs antigos aceitavam chamadas diretas e cabeçalhos escolhidos pelo
-- cliente. Eles permanecem definidos apenas para facilitar rollback, sem
-- qualquer privilégio de execução pelos papéis da API.
revoke all on function public.incrementar_visualizacao_obra(uuid)
from public, anon, authenticated, service_role;

revoke all on function public.incrementar_visualizacao_capitulo(uuid)
from public, anon, authenticated, service_role;

comment on function public.incrementar_visualizacao_obra(uuid) is
  'RPC legado desativado: a visualização deve passar por /api/visualizacoes.';

comment on function public.incrementar_visualizacao_capitulo(uuid) is
  'RPC legado desativado: a visualização deve passar por /api/visualizacoes.';

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_class as classe
    inner join pg_catalog.pg_namespace as esquema
      on esquema.oid = classe.relnamespace
    where esquema.nspname = 'historietas_privado'
      and classe.relname = 'limites_requisicao'
      and classe.relkind = 'r'
      and classe.relrowsecurity = true
  ) then
    raise exception 'A tabela privada do limitador não está protegida por RLS.';
  end if;

  if has_table_privilege(
    'anon',
    'historietas_privado.limites_requisicao',
    'SELECT,INSERT,UPDATE,DELETE'
  ) or has_table_privilege(
    'authenticated',
    'historietas_privado.limites_requisicao',
    'SELECT,INSERT,UPDATE,DELETE'
  ) then
    raise exception 'Papéis clientes ainda acessam a tabela privada do limitador.';
  end if;

  if has_function_privilege(
    'anon',
    'public.incrementar_visualizacao_obra(uuid)',
    'EXECUTE'
  ) or has_function_privilege(
    'authenticated',
    'public.incrementar_visualizacao_obra(uuid)',
    'EXECUTE'
  ) or has_function_privilege(
    'anon',
    'public.incrementar_visualizacao_capitulo(uuid)',
    'EXECUTE'
  ) or has_function_privilege(
    'authenticated',
    'public.incrementar_visualizacao_capitulo(uuid)',
    'EXECUTE'
  ) then
    raise exception 'Os RPCs legados de visualização ainda são executáveis pelo cliente.';
  end if;

  if has_function_privilege(
    'anon',
    'public.registrar_visualizacao_obra(uuid,text)',
    'EXECUTE'
  ) or has_function_privilege(
    'authenticated',
    'public.registrar_visualizacao_obra(uuid,text)',
    'EXECUTE'
  ) or has_function_privilege(
    'anon',
    'public.registrar_visualizacao_capitulo(uuid,text)',
    'EXECUTE'
  ) or has_function_privilege(
    'authenticated',
    'public.registrar_visualizacao_capitulo(uuid,text)',
    'EXECUTE'
  ) then
    raise exception 'Os novos RPCs de visualização estão expostos a papéis clientes.';
  end if;

  if not has_function_privilege(
    'service_role',
    'public.consumir_limite_requisicao(text,text,integer,integer,integer)',
    'EXECUTE'
  ) or not has_function_privilege(
    'service_role',
    'public.registrar_visualizacao_obra(uuid,text)',
    'EXECUTE'
  ) or not has_function_privilege(
    'service_role',
    'public.registrar_visualizacao_capitulo(uuid,text)',
    'EXECUTE'
  ) then
    raise exception 'O servidor não recebeu os privilégios mínimos dos novos RPCs.';
  end if;
end;
$$;
