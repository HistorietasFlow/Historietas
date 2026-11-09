-- Fase 6B3: freio privado de capacidade. SEM Cron, ACK, purga ou ativacao.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

create table historietas_privado.capitulo_runner_capacidade (
  singleton boolean primary key default true check(singleton),
  limite_eventos integer not null default 10000 check(limite_eventos between 1 and 10000),
  limite_outbox_bytes bigint not null default 16777216 check(limite_outbox_bytes between 1 and 16777216),
  limite_notificacoes_bytes bigint not null default 67108864 check(limite_notificacoes_bytes between 1 and 67108864),
  limite_banco_bytes bigint not null default 419430400 check(limite_banco_bytes between 1 and 419430400),
  alerta_percentual integer not null default 70 check(alerta_percentual between 1 and 90),
  admissoes bigint not null default 0 check(admissoes >= 0),
  pausado boolean not null default false,
  revisao bigint not null default 1 check(revisao > 0),
  motivo text check(motivo in ('eventos','outbox_bytes','notificacoes_bytes','banco_bytes','medicao_indisponivel','incidentes')),
  pausado_em timestamptz
);
insert into historietas_privado.capitulo_runner_capacidade(singleton) values(true);
create table historietas_privado.capitulo_capacidade_incidentes (
  revisao bigint primary key,
  motivo text not null,
  aberto_em timestamptz not null default clock_timestamp(),
  medidas jsonb not null,
  retomado_em timestamptz,
  justificativa text check(justificativa in ('causa_corrigida','capacidade_revisada')),
  medidas_retomada jsonb
);
alter table historietas_privado.capitulo_runner_capacidade enable row level security;
alter table historietas_privado.capitulo_capacidade_incidentes enable row level security;
revoke all on table historietas_privado.capitulo_runner_capacidade,
  historietas_privado.capitulo_capacidade_incidentes from public,anon,authenticated,service_role,historietas_capitulo_runner;

-- Medidas instantaneas, nao uma reserva de disco/WAL. O fan-out de notificacoes
-- e outros escritores continuam impedindo certificar o orcamento fisico global.
create function historietas_privado.medir_capacidade_capitulos()
returns jsonb language plpgsql volatile security invoker set search_path='' as $$
declare c historietas_privado.capitulo_runner_capacidade; n bigint; b bigint; o bigint; i bigint; f bigint; motivo text;
begin
  select * into strict c from historietas_privado.capitulo_runner_capacidade where singleton;
  select count(*) into n from (select 1 from historietas_privado.capitulo_cache_outbox limit c.limite_eventos+1) x;
  o := pg_table_size('historietas_privado.capitulo_cache_outbox'::regclass);
  i := pg_indexes_size('historietas_privado.capitulo_cache_outbox'::regclass);
  f := pg_total_relation_size('public.notificacoes'::regclass);
  b := pg_database_size(current_database());
  motivo := case when n >= c.limite_eventos then 'eventos'
    when o+i >= c.limite_outbox_bytes then 'outbox_bytes'
    when f >= c.limite_notificacoes_bytes then 'notificacoes_bytes'
    when b >= c.limite_banco_bytes then 'banco_bytes' end;
  return jsonb_build_object('eventos',n,'contagemLimitada',true,'limiteEventos',c.limite_eventos,
    'outboxTabelaBytes',o,'outboxIndicesBytes',i,'outboxBytes',o+i,'limiteOutboxBytes',c.limite_outbox_bytes,
    'notificacoesBytes',f,'limiteNotificacoesBytes',c.limite_notificacoes_bytes,
    'bancoBytes',b,'limiteBancoBytes',c.limite_banco_bytes,'bloqueio',motivo,
    'alerta',n*100 >= c.limite_eventos::bigint*c.alerta_percentual
      or (o+i)::numeric*100 >= c.limite_outbox_bytes::numeric*c.alerta_percentual
      or f::numeric*100 >= c.limite_notificacoes_bytes::numeric*c.alerta_percentual
      or b::numeric*100 >= c.limite_banco_bytes::numeric*c.alerta_percentual,
    'pausado',c.pausado,'revisao',c.revisao,'medidoEm',clock_timestamp());
end;
$$;

-- Todos os INSERTs da outbox, inclusive pelo executor administrativo antigo,
-- compartilham o lock ate COMMIT/ROLLBACK. Nao e admissao HTTP separada do IO.
-- Contagem limitada, snapshot novo apos o lock, sem contador que possa divergir.
create function historietas_privado.proteger_limite_eventos_outbox()
returns trigger language plpgsql volatile security invoker set search_path='' as $$
declare v_limite integer; v_total bigint;
begin
  if not pg_try_advisory_xact_lock(hashtextextended('historietas:capacidade:capitulos:v1',0)) then
    raise exception 'Capacidade ocupada; repetir a transacao.' using errcode='55P03';
  end if;
  -- Conflito idempotente nao cria evento novo; unicidade/imutabilidade continuam
  -- sendo verificadas pelos contratos originais.
  if exists(select 1 from historietas_privado.capitulo_cache_outbox
    where id=new.id or (capitulo_id=new.capitulo_id and revisao_agendada=new.revisao_agendada)) then return new; end if;
  -- A escrita da barreira tambem provoca 40001 em snapshots REPEATABLE READ
  -- antigos. Advisory lock sozinho nao atualizaria esse snapshot.
  update historietas_privado.capitulo_runner_capacidade set admissoes=admissoes+1
    where singleton returning limite_eventos into v_limite;
  if not found then raise exception 'Capacidade indisponivel.' using errcode='55000'; end if;
  select count(*) into v_total from (select 1 from historietas_privado.capitulo_cache_outbox limit v_limite) x;
  if v_total >= v_limite then
    raise exception 'Capacidade de eventos esgotada.' using errcode='54000';
  end if;
  return new;
end;
$$;
create trigger capitulo_cache_limite_eventos before insert on historietas_privado.capitulo_cache_outbox
  for each row execute function historietas_privado.proteger_limite_eventos_outbox();

create function historietas_privado.verificar_capacidade_runner_capitulos()
returns jsonb language plpgsql volatile security invoker set search_path='' as $$
declare c historietas_privado.capitulo_runner_capacidade; m jsonb; v_motivo text; incidentes bigint;
begin
  if not pg_try_advisory_xact_lock(hashtextextended('historietas:runner:capitulos:v1',0))
    or not pg_try_advisory_xact_lock(hashtextextended('historietas:capacidade:capitulos:v1',0)) then
    return jsonb_build_object('estado','ocupado');
  end if;
  select * into c from historietas_privado.capitulo_runner_capacidade where singleton for update;
  if not found then
    update historietas_privado.capitulo_runner_controle set habilitado=false where singleton;
    return jsonb_build_object('estado','capacidade_indisponivel');
  end if;
  if c.pausado then return jsonb_build_object('estado','capacidade','motivo',c.motivo,'revisao',c.revisao); end if;
  begin
    m := historietas_privado.medir_capacidade_capitulos(); v_motivo := m->>'bloqueio';
  exception when others then
    -- Sem SQLERRM, identidade ou erro livre. query_canceled ainda aborta o lote.
    m := '{}'::jsonb; v_motivo := 'medicao_indisponivel';
  end;
  select count(*) into incidentes from historietas_privado.capitulo_capacidade_incidentes;
  if incidentes >= 100 then v_motivo := 'incidentes'; end if;
  if v_motivo is null then return jsonb_build_object('estado','disponivel','alerta',m->'alerta'); end if;
  update historietas_privado.capitulo_runner_capacidade set pausado=true,revisao=revisao+1,
    motivo=v_motivo,pausado_em=clock_timestamp() where singleton returning * into c;
  if incidentes < 100 then
    insert into historietas_privado.capitulo_capacidade_incidentes(revisao,motivo,medidas) values(c.revisao,v_motivo,m);
  end if;
  update historietas_privado.capitulo_runner_controle set habilitado=false where singleton;
  return jsonb_build_object('estado','capacidade','motivo',v_motivo,'revisao',c.revisao);
end;
$$;

create function historietas_privado.retomar_capacidade_runner_capitulos(p_revisao bigint,p_justificativa text)
returns jsonb language plpgsql volatile security invoker set search_path='' as $$
declare c historietas_privado.capitulo_runner_capacidade; m jsonb;
begin
  if p_revisao is null or p_revisao < 1 or p_justificativa is null
    or p_justificativa not in ('causa_corrigida','capacidade_revisada') then
    raise exception 'Revisao/justificativa invalidas.' using errcode='22023';
  end if;
  if not pg_try_advisory_xact_lock(hashtextextended('historietas:runner:capitulos:v1',0))
    or not pg_try_advisory_xact_lock(hashtextextended('historietas:capacidade:capitulos:v1',0)) then
    return jsonb_build_object('estado','ocupado');
  end if;
  select * into strict c from historietas_privado.capitulo_runner_capacidade where singleton for update;
  if exists(select 1 from historietas_privado.capitulo_capacidade_incidentes where revisao=p_revisao and retomado_em is not null) then
    return jsonb_build_object('estado','ja_registrado','pausado',c.pausado,'revisaoAtual',c.revisao);
  end if;
  if c.revisao <> p_revisao or not c.pausado
    or exists(select 1 from historietas_privado.capitulo_runner_controle where habilitado)
    or (select count(*) from historietas_privado.capitulo_capacidade_incidentes) >= 100 then
    raise exception 'Revisao/gate/incidentes impedem retomada.' using errcode='55000';
  end if;
  m := historietas_privado.medir_capacidade_capitulos();
  if m->>'bloqueio' is not null then raise exception 'Capacidade ainda indisponivel.' using errcode='55000'; end if;
  update historietas_privado.capitulo_capacidade_incidentes set retomado_em=clock_timestamp(),
    justificativa=p_justificativa,medidas_retomada=m where revisao=p_revisao;
  if not found then raise exception 'Incidente indisponivel.' using errcode='55000'; end if;
  update historietas_privado.capitulo_runner_capacidade set pausado=false where singleton;
  return jsonb_build_object('estado','retomada_registrada','habilitado',false);
end;
$$;

create function historietas_privado.proteger_pausa_capacidade_capitulos()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if new.habilitado and not old.habilitado then
    if not pg_try_advisory_xact_lock(hashtextextended('historietas:runner:capitulos:v1',0))
      or not pg_try_advisory_xact_lock(hashtextextended('historietas:capacidade:capitulos:v1',0)) then
      raise exception 'Capacidade ocupada.' using errcode='55P03';
    end if;
    if not exists(select 1 from historietas_privado.capitulo_runner_capacidade where singleton and not pausado) then
      raise exception 'Retomada administrativa de capacidade obrigatoria.' using errcode='55000';
    end if;
  end if;
  return new;
end;
$$;
create trigger capitulo_runner_capacidade before update of habilitado on historietas_privado.capitulo_runner_controle
  for each row execute function historietas_privado.proteger_pausa_capacidade_capitulos();

create function historietas_privado.proteger_orcamento_capitulos()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if not pg_try_advisory_xact_lock(hashtextextended('historietas:runner:capitulos:v1',0))
    or not pg_try_advisory_xact_lock(hashtextextended('historietas:capacidade:capitulos:v1',0)) then
    raise exception 'Capacidade ocupada.' using errcode='55P03';
  end if;
  if exists(select 1 from historietas_privado.capitulo_runner_controle where habilitado) then
    raise exception 'Revisao do orcamento exige runner desativado.' using errcode='55000';
  end if;
  return new;
end;
$$;
create trigger capitulo_capacidade_orcamento before update of limite_eventos,limite_outbox_bytes,
  limite_notificacoes_bytes,limite_banco_bytes,alerta_percentual on historietas_privado.capitulo_runner_capacidade
  for each row execute function historietas_privado.proteger_orcamento_capitulos();

-- Preserva o corpo/ACL do runner; acrescenta somente admissao antes do lote e
-- de cada item. Sem falha de publicacao/retry artificial por capacidade cheia.
do $migration$
declare d text;
begin
  d := pg_get_functiondef('historietas_privado.executar_runner_capitulos(integer,integer)'::regprocedure);
  if strpos(d,'  v_inicio timestamptz := clock_timestamp();')=0
    or strpos(d,'  -- Sem lock antecipado nos filhos:')=0
    or strpos(d,'  loop'||chr(10)||'    if clock_timestamp()')=0
    or strpos(d,'''estado'',v_fim,''tentativas''')=0 then
    raise exception 'Contrato do runner divergiu; revisar admissao de capacidade.';
  end if;
  d := replace(d,'  v_inicio timestamptz := clock_timestamp();','  v_capacidade jsonb;'||chr(10)||'  v_inicio timestamptz := clock_timestamp();');
  d := replace(d,'  -- Sem lock antecipado nos filhos:',
    '  v_capacidade := historietas_privado.verificar_capacidade_runner_capitulos();'||chr(10)||
    '  if v_capacidade->>''estado'' <> ''disponivel'' then return v_capacidade || jsonb_build_object(''tentativas'',0); end if;'||chr(10)||
    '  -- Sem lock antecipado nos filhos:');
  d := replace(d,'  loop'||chr(10)||'    if clock_timestamp()',
    '  loop'||chr(10)||'    v_capacidade := historietas_privado.verificar_capacidade_runner_capitulos();'||chr(10)||
    '    if v_capacidade->>''estado'' <> ''disponivel'' then exit; end if;'||chr(10)||'    if clock_timestamp()');
  d := replace(d,'''estado'',v_fim,''tentativas''',
    '''estado'',case when v_capacidade->>''estado'' <> ''disponivel'' then v_capacidade->>''estado'' else v_fim end,''tentativas''');
  execute d;
end;
$migration$;

-- Saude continua privada; alerta e um sinal consultavel, nao entrega de alerta.
do $migration$
declare d text;
begin
  d := pg_get_functiondef('historietas_privado.saude_runner_capitulos()'::regprocedure);
  if strpos(d,'historietas_privado.metricas_runner_capitulos() || jsonb_build_object(')=0 then
    raise exception 'Contrato de saude divergiu.';
  end if;
  d := replace(d,'historietas_privado.metricas_runner_capitulos() || jsonb_build_object(',
    'historietas_privado.metricas_runner_capitulos() || jsonb_build_object(''capacidade'',historietas_privado.medir_capacidade_capitulos()) || jsonb_build_object(');
  execute d;
end;
$migration$;

revoke all on function historietas_privado.medir_capacidade_capitulos(),
  historietas_privado.proteger_limite_eventos_outbox(),historietas_privado.verificar_capacidade_runner_capitulos(),
  historietas_privado.retomar_capacidade_runner_capitulos(bigint,text),historietas_privado.proteger_pausa_capacidade_capitulos(),
  historietas_privado.proteger_orcamento_capitulos()
  from public,anon,authenticated,service_role,historietas_capitulo_runner;
do $$ begin
  if not exists(select 1 from historietas_privado.capitulo_runner_controle where singleton and not habilitado) then
    raise exception 'Instalacao exige runner desativado.' using errcode='55000';
  end if;
end $$;
comment on table historietas_privado.capitulo_runner_capacidade is
  'Limite transacional de eventos; freios de bytes sao instantaneos, NAO reserva de disco/WAL. Limites conservadores para revisao; ativacao bloqueada por fan-out, outros escritores, observacao/alertas e certificacao do plano. Sem ACK/purga.';
comment on table historietas_privado.capitulo_capacidade_incidentes is
  'Ate 100 incidentes no fluxo operacional, sem purga; saturacao impede retomada. Somente contagens/bytes e enums, nenhuma identidade ou mensagem livre.';
commit;
