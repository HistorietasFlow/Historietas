-- Fase 6A: somente SQL administrativo. Nenhum job, wrapper ou ativacao.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

create table historietas_privado.capitulo_runner_controle (
  singleton boolean primary key default true check (singleton),
  habilitado boolean not null default false,
  lotes bigint not null default 0 check (lotes >= 0),
  tentativas bigint not null default 0 check (tentativas >= 0),
  sucessos bigint not null default 0 check (sucessos >= 0),
  erros bigint not null default 0 check (erros >= 0),
  ultima_execucao timestamptz,
  ultimo_resultado text check (ultimo_resultado in ('concluido','orcamento_esgotado'))
);
insert into historietas_privado.capitulo_runner_controle(singleton) values (true);

-- Uma linha por intencao atual, sem historico ilimitado ou copias de conteudo.
-- Cascata remove apenas telemetria; recibos e outbox conservam seus contratos.
create table historietas_privado.capitulo_runner_tentativas (
  capitulo_id uuid primary key references historietas_privado.capitulo_agendamentos(capitulo_id) on delete cascade,
  revisao bigint not null check (revisao > 0),
  tentativas integer not null check (tentativas between 1 and 5),
  ultima_em timestamptz not null,
  proxima_em timestamptz not null,
  resultado text not null check (resultado in
    ('publicado','bloqueado','erro','ocupado','ausente','desatualizado','futuro','aguardando_retry'))
);
alter table historietas_privado.capitulo_runner_controle enable row level security;
alter table historietas_privado.capitulo_runner_tentativas enable row level security;
revoke all on table historietas_privado.capitulo_runner_controle,
  historietas_privado.capitulo_runner_tentativas from public,anon,authenticated,service_role;

create function historietas_privado.executar_runner_capitulos(
  p_limite integer default 3, p_orcamento_ms integer default 2000
) returns jsonb language plpgsql volatile security invoker set search_path = '' as $$
declare
  v_inicio timestamptz := clock_timestamp();
  v_item record;
  v_resposta jsonb;
  v_estado text;
  v_num integer;
  v_total integer := 0;
  v_sucessos integer := 0;
  v_erros integer := 0;
  v_fim text := 'concluido';
  v_timeout interval := current_setting('statement_timeout')::interval;
  v_lock_timeout interval := current_setting('lock_timeout')::interval;
begin
  if p_limite is null or p_limite not between 1 and 5
    or p_orcamento_ms is null or p_orcamento_ms not between 10 and 5000 then
    raise exception 'Limite/orcamento invalidos.' using errcode='22023';
  end if;
  -- Lock transacional, nao lease: nenhum takeover enquanto o primeiro pode gravar.
  if not pg_try_advisory_xact_lock(hashtextextended('historietas:runner:capitulos:v1',0)) then
    return jsonb_build_object('estado','ocupado','tentativas',0);
  end if;
  -- Ausencia do singleton tambem falha fechada. Nenhum parametro habilita o gate.
  perform 1 from historietas_privado.capitulo_runner_controle
    where singleton and habilitado for share;
  if not found then return jsonb_build_object('estado','desativado','tentativas',0); end if;
  -- O chamador DEVE configurar estes limites antes da instrucao SELECT.
  -- set_config dentro da funcao nao instala um novo timer de statement_timeout.
  if v_timeout <= interval '0' or v_timeout > interval '10 seconds'
    or v_lock_timeout <= interval '0' or v_lock_timeout > interval '1 second'
    or v_lock_timeout >= v_timeout then
    raise exception 'Timeouts previos obrigatorios (statement <=10s; lock <=1s).' using errcode='22023';
  end if;
  -- Sem lock antecipado nos filhos: o executor preserva a ordem dos pais.
  -- Menos recentemente atendidas primeiro; falhas antigas nao monopolizam o lote.
  for v_item in
    select a.capitulo_id,a.revisao,coalesce(t.tentativas,0) as tentativas
    from historietas_privado.capitulo_agendamentos a
    left join historietas_privado.capitulo_runner_tentativas t
      on t.capitulo_id=a.capitulo_id and t.revisao=a.revisao
    where a.publicar_em <= v_inicio and (a.estado='agendado'
      or (a.estado='erro' and a.executado_em <= v_inicio-interval '1 minute'))
      and (t.capitulo_id is null or (t.tentativas < 5 and t.proxima_em <= v_inicio))
    order by t.ultima_em nulls first,a.publicar_em,a.capitulo_id
    limit p_limite
  loop
    if clock_timestamp() >= v_inicio + p_orcamento_ms * interval '1 millisecond' then
      v_fim := 'orcamento_esgotado'; exit;
    end if;
    begin
      v_resposta := historietas_privado.executar_agendamento_capitulo(v_item.capitulo_id,v_item.revisao);
      v_estado := v_resposta->>'estado';
      if v_estado is null or v_estado not in
        ('publicado','bloqueado','erro','ocupado','ausente','desatualizado','futuro','aguardando_retry') then
        raise exception 'Contrato do executor indisponivel.' using errcode='55000';
      end if;
    exception when others then
      -- Inclui lock_timeout/deadlock/serializacao, com rollback do item inteiro.
      -- query_canceled NAO pertence a OTHERS: timeout global aborta TODO o lote.
      v_estado := 'erro';
    end;
    v_num := v_item.tentativas + 1;
    insert into historietas_privado.capitulo_runner_tentativas
      (capitulo_id,revisao,tentativas,ultima_em,proxima_em,resultado)
      select a.capitulo_id,v_item.revisao,v_num,clock_timestamp(),
        clock_timestamp() + make_interval(secs => 60 * power(2,v_num-1)::integer),v_estado
      from historietas_privado.capitulo_agendamentos a where a.capitulo_id=v_item.capitulo_id
      on conflict (capitulo_id) do update set revisao=excluded.revisao,
        tentativas=excluded.tentativas,ultima_em=excluded.ultima_em,
        proxima_em=excluded.proxima_em,resultado=excluded.resultado;
    v_total := v_total+1;
    if v_estado='publicado' and (v_resposta->>'repetido')::boolean is not true then
      v_sucessos := v_sucessos+1;
    elsif v_estado='erro' then v_erros := v_erros+1; end if;
  end loop;
  if clock_timestamp() >= v_inicio + p_orcamento_ms * interval '1 millisecond' then
    v_fim := 'orcamento_esgotado';
  end if;
  update historietas_privado.capitulo_runner_controle set lotes=lotes+1,
    tentativas=tentativas+v_total,sucessos=sucessos+v_sucessos,erros=erros+v_erros,
    ultima_execucao=clock_timestamp(),ultimo_resultado=v_fim where singleton;
  return jsonb_build_object('estado',v_fim,'tentativas',v_total,'sucessos',v_sucessos,'erros',v_erros);
end;
$$;
revoke all on function historietas_privado.executar_runner_capitulos(integer,integer)
  from public,anon,authenticated,service_role;

-- Consulta administrativa separada: contagens exatas podem custar O(pendencias).
-- Nao executar esta agregacao a cada item nem expor identidades/conteudo.
create function historietas_privado.metricas_runner_capitulos()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'habilitado',coalesce((select habilitado from historietas_privado.capitulo_runner_controle where singleton),false),
    'pendencias',count(*),
    'atrasados',count(*) filter (where a.publicar_em <= statement_timestamp()),
    'atrasoMaximoSegundos',coalesce(greatest(0,extract(epoch from statement_timestamp()-min(a.publicar_em))),0),
    'retriesEsgotados',count(*) filter (where t.tentativas >= 5),
    'lotes',coalesce((select lotes from historietas_privado.capitulo_runner_controle where singleton),0),
    'tentativas',coalesce((select tentativas from historietas_privado.capitulo_runner_controle where singleton),0),
    'sucessos',coalesce((select sucessos from historietas_privado.capitulo_runner_controle where singleton),0),
    'erros',coalesce((select erros from historietas_privado.capitulo_runner_controle where singleton),0),
    'ultimaExecucao',(select ultima_execucao from historietas_privado.capitulo_runner_controle where singleton),
    'outboxSemConfirmacao',(select count(*) from historietas_privado.capitulo_cache_outbox))
  from historietas_privado.capitulo_agendamentos a
  left join historietas_privado.capitulo_runner_tentativas t
    on t.capitulo_id=a.capitulo_id and t.revisao=a.revisao
  where a.estado in ('agendado','erro');
$$;
revoke all on function historietas_privado.metricas_runner_capitulos()
  from public,anon,authenticated,service_role;
comment on function historietas_privado.executar_runner_capitulos(integer,integer) is
  'Desativado por padrao. SQL administrativo, transacao curta e timeouts previos obrigatorios. Sem Cron/API/ACK. Cinco tentativas por revisao, backoff 60..960s; esgotamento exige revisao operacional.';
comment on table historietas_privado.capitulo_runner_controle is
  'Gate privado falso na instalacao. Somente autorizacao operacional explicita pode habilitar. Contadores abrangem apenas transacoes confirmadas; abortos precisam ser observados pelo futuro chamador.';
commit;
