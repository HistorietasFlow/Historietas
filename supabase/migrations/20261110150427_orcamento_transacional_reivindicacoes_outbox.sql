-- 6D10: saldo de reivindicacoes CONFIRMADAS, nao de abortos ou bytes WAL.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';

create table historietas_privado.capitulo_cache_orcamento (
  singleton boolean primary key default true check(singleton),
  habilitado boolean not null default false,
  limite bigint check(limite > 0),
  consumidas bigint not null default 0 check(consumidas >= 0),
  pausado boolean not null default true,
  revisao bigint not null default 1 check(revisao > 0),
  check(limite is null or consumidas <= limite),
  check(not habilitado or limite is not null)
);
-- Nenhum valor operacional e escolhido nesta migration. Desativado preserva
-- o fluxo legado, sem contabilizacao retroativa ou promessa de protecao ativa.
insert into historietas_privado.capitulo_cache_orcamento(singleton) values(true);

create table historietas_privado.capitulo_cache_orcamento_retomadas (
  revisao_esperada bigint primary key check(revisao_esperada > 0),
  limite_anterior bigint,
  limite_novo bigint not null check(limite_novo > 0),
  consumidas bigint not null check(consumidas >= 0 and consumidas < limite_novo),
  justificativa text not null check(justificativa in ('configuracao_validada','capacidade_reavaliada','causa_corrigida')),
  registrada_em timestamptz not null default clock_timestamp()
);
alter table historietas_privado.capitulo_cache_orcamento enable row level security;
alter table historietas_privado.capitulo_cache_orcamento_retomadas enable row level security;
revoke all on table historietas_privado.capitulo_cache_orcamento,
  historietas_privado.capitulo_cache_orcamento_retomadas
  from public,anon,authenticated,service_role,historietas_capitulo_runner,historietas_agendamento_monitor;

-- Operacao SQL administrativa, nao RPC publica. Nao habilita o controle nem o
-- runner. Saldo e acumulado: ampliar o teto nao apaga o consumo anterior.
create function historietas_privado.retomar_orcamento_cache_capitulos(
  p_revisao bigint,p_limite bigint,p_justificativa text)
returns jsonb language plpgsql volatile security invoker set search_path='' as $$
declare b historietas_privado.capitulo_cache_orcamento; r historietas_privado.capitulo_cache_orcamento_retomadas;
begin
  if p_revisao is null or p_revisao <= 0 or p_limite is null or p_limite <= 0
    or p_justificativa is null or p_justificativa not in ('configuracao_validada','capacidade_reavaliada','causa_corrigida') then
    raise exception 'Parametros de retomada invalidos.' using errcode='22023';
  end if;
  select * into b from historietas_privado.capitulo_cache_orcamento where singleton for update;
  if not found then raise exception 'Controle de orcamento indisponivel.' using errcode='55000'; end if;
  select * into r from historietas_privado.capitulo_cache_orcamento_retomadas where revisao_esperada=p_revisao;
  if found then
    if r.limite_novo is distinct from p_limite or r.justificativa is distinct from p_justificativa then
      raise exception 'Retomada anterior divergente.' using errcode='55000';
    end if;
    -- Retry nao remove uma pausa posterior nem reaplica limite antigo.
    return jsonb_build_object('estado','ja_registrado','revisao',b.revisao,'pausado',b.pausado,'habilitado',b.habilitado);
  end if;
  if p_revisao is distinct from b.revisao or not b.pausado or p_limite <= b.consumidas
    or (b.limite is not null and p_limite < b.limite) then
    raise exception 'Revisao ou saldo impedem retomada.' using errcode='55000';
  end if;
  insert into historietas_privado.capitulo_cache_orcamento_retomadas
    (revisao_esperada,limite_anterior,limite_novo,consumidas,justificativa)
    values(p_revisao,b.limite,p_limite,b.consumidas,p_justificativa);
  update historietas_privado.capitulo_cache_orcamento set limite=p_limite,pausado=false,revisao=revisao+1 where singleton;
  return jsonb_build_object('estado','retomada_registrada','revisao',b.revisao+1,'pausado',false,'habilitado',b.habilitado);
end;
$$;
revoke all on function historietas_privado.retomar_orcamento_cache_capitulos(bigint,bigint,text)
  from public,anon,authenticated,service_role,historietas_capitulo_runner,historietas_agendamento_monitor;

create or replace function historietas_privado.reivindicar_cache_capitulos(p_limite integer)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare b historietas_privado.capitulo_cache_orcamento; v_resultado jsonb; v_limite integer; v_total integer;
begin
  if p_limite is null or p_limite not between 1 and 5 then
    raise exception 'Lote invalido.' using errcode='22023';
  end if;
  -- Ordem unica: controle -> eventos. Nenhum lock e mantido durante chamadas
  -- Next/HTTP. UPDATE abaixo e a barreira contra snapshots antigos (40001).
  select * into b from historietas_privado.capitulo_cache_orcamento where singleton for update;
  if not found then raise exception 'Controle de orcamento indisponivel.' using errcode='55000'; end if;
  v_limite:=p_limite;
  if b.habilitado then
    if b.limite is null then return jsonb_build_object('estado','orcamento_nao_configurado'); end if;
    if b.consumidas >= b.limite then
      if not b.pausado then
        update historietas_privado.capitulo_cache_orcamento set pausado=true,revisao=revisao+1 where singleton;
      end if;
      -- Retorno normal permite confirmar a pausa; nao RAISE seguido de rollback.
      return jsonb_build_object('estado','orcamento_esgotado');
    end if;
    if b.pausado then return jsonb_build_object('estado','orcamento_pausado'); end if;
    v_limite:=least(p_limite::bigint,b.limite-b.consumidas)::integer;
  end if;
  with candidatos as (
    select id from historietas_privado.capitulo_cache_outbox
    where lease_ate is null or lease_ate <= clock_timestamp()
    order by tentativas,criado_em,id limit v_limite for update skip locked
  ), reivindicados as (
    update historietas_privado.capitulo_cache_outbox o
    set lease_id=gen_random_uuid(),lease_ate=clock_timestamp()+interval '2 minutes',tentativas=tentativas+1
    from candidatos c where o.id=c.id returning o.*
  ) select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'leaseId',o.lease_id,
    'obraId',o.obra_id,'capituloId',o.capitulo_id,'revisao',o.revisao_agendada,
    'slug',o.slug_publicacao,'slugAtual',w.slug,'numero',o.numero_capitulo)), '[]'::jsonb)
    into v_resultado from reivindicados o left join public.obras w on w.id=o.obra_id;
  v_total:=jsonb_array_length(v_resultado);
  if b.habilitado and v_total > 0 then
    update historietas_privado.capitulo_cache_orcamento
      set consumidas=consumidas+v_total,pausado=(consumidas+v_total >= limite),revisao=revisao+1 where singleton;
  end if;
  return v_resultado;
end;
$$;
-- CREATE OR REPLACE conserva assinatura, owner e grants do unico caminho RPC.
-- Nenhuma alteracao no registro idempotente da #2257 ou no wrapper invoker.
comment on table historietas_privado.capitulo_cache_orcamento is
  'Desativado/sem limite aprovado na instalacao. Saldo acumulado de reivindicacoes confirmadas, nao abortos, chamadas ou bytes WAL. Saturacao preserva a fila. Retomada administrativa CAS nao habilita controle/runner. Sem reset, TTL, ACK ou ativacao automatica.';
comment on table historietas_privado.capitulo_cache_orcamento_retomadas is
  'Historico privado de retomadas por revisao. Retry equivalente nao remove pausa posterior. Sem dados de usuarios, ACK ou purga.';
comment on function historietas_privado.reivindicar_cache_capitulos(integer) is
  'Lote ate cinco, leases de dois minutos e SKIP LOCKED preservados. Com controle ativo, debita somente linhas reivindicadas na mesma transacao; saturacao explicita. Rollback desfaz saldo, nao WAL. Sem garantia de tentativas abortadas/resultados ambiguos.';
do $$begin
  if exists(select 1 from historietas_privado.capitulo_runner_controle where habilitado)
    or exists(select 1 from historietas_privado.capitulo_cache_orcamento where habilitado or limite is not null or consumidas<>0) then
    raise exception 'Instalacao exige controles desativados e saldo nao configurado.' using errcode='55000';
  end if;
end $$;
commit;
