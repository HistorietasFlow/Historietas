-- Fase 6B2: observacao administrativa independente. SEM instalar/agendar Cron.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

create table historietas_privado.capitulo_runner_monitor (
  singleton boolean primary key default true check(singleton),
  job_id bigint not null,
  extensao_oid oid not null,
  identidade_job jsonb not null,
  intervalo_segundos integer not null check(intervalo_segundos between 15 and 60),
  configurado_em timestamptz not null default clock_timestamp(),
  observado_em timestamptz,
  ultimo_run bigint not null default 0,
  falhas_consecutivas integer not null default 0 check(falhas_consecutivas >= 0),
  pausado boolean not null default true,
  revisao bigint not null default 1 check(revisao > 0)
);
create table historietas_privado.capitulo_runner_observacoes (
  run_id bigint primary key,
  estado text not null check(estado in ('failed','succeeded')),
  inicio timestamptz,
  fim timestamptz not null,
  observado_em timestamptz not null default clock_timestamp()
);
create table historietas_privado.capitulo_runner_incidentes (
  revisao bigint primary key,
  motivo text not null check(motivo in ('configuracao','tres_falhas','fonte_indisponivel',
    'historico_incompleto','silencio','capacidade')),
  aberto_em timestamptz not null default clock_timestamp(),
  retomado_em timestamptz,
  justificativa text check(justificativa in ('configuracao_validada','causa_corrigida'))
);
alter table historietas_privado.capitulo_runner_monitor enable row level security;
alter table historietas_privado.capitulo_runner_observacoes enable row level security;
alter table historietas_privado.capitulo_runner_incidentes enable row level security;
revoke all on table historietas_privado.capitulo_runner_monitor,
  historietas_privado.capitulo_runner_observacoes,historietas_privado.capitulo_runner_incidentes
  from public,anon,authenticated,service_role,historietas_capitulo_runner;

-- Identidade do job, nao texto de erros/comandos arbitrarios nos logs privados.
-- SQL dinamico constante permite instalar SEM a extensao pg_cron.
create function historietas_privado.fonte_monitor_capitulos(p_job bigint)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare v_job jsonb;
begin
  if not exists(select 1 from pg_extension where extname='pg_cron' and extversion='1.6.4')
    or current_setting('cron.log_run',true) is distinct from 'on'
    or current_setting('cron.use_background_workers',true) is distinct from 'off' then
    return null;
  end if;
  execute 'select to_jsonb(j)-''active'' from cron.job j where jobid=$1
    and username=''historietas_capitulo_runner'' and database=current_database()
    and command=''select historietas_privado.acionar_runner_capitulos()''
    and nodename in (''localhost'',''127.0.0.1'') and nodeport=current_setting(''port'')::integer'
    into v_job using p_job;
  return v_job;
exception when undefined_table or invalid_schema_name or insufficient_privilege then
  return null;
end;
$$;

create function historietas_privado.configurar_monitor_capitulos(p_job bigint,p_intervalo_segundos integer)
returns void language plpgsql volatile security invoker set search_path='' as $$
declare v_job jsonb; v_usado boolean;
begin
  if not pg_try_advisory_xact_lock(hashtextextended('historietas:runner:capitulos:v1',0)) then
    raise exception 'Runner ocupado.' using errcode='55P03';
  end if;
  if exists(select 1 from historietas_privado.capitulo_runner_controle where habilitado)
    or exists(select 1 from historietas_privado.capitulo_runner_monitor) then
    raise exception 'Configuracao exige gate fechado e monitor novo.' using errcode='55000';
  end if;
  v_job := historietas_privado.fonte_monitor_capitulos(p_job);
  if v_job is null then raise exception 'Fonte operacional indisponivel.' using errcode='55000'; end if;
  if p_intervalo_segundos is null or p_intervalo_segundos not between 15 and 60
    or v_job->>'schedule' is distinct from (case when p_intervalo_segundos=60 then '* * * * *'
      else p_intervalo_segundos::text || ' seconds' end) then
    raise exception 'Cadencia observada invalida.' using errcode='22023';
  end if;
  execute 'select exists(select 1 from cron.job where jobid=$1 and active)
    or exists(select 1 from cron.job_run_details where jobid=$1)' into v_usado using p_job;
  if v_usado then raise exception 'Exige job novo e inativo.' using errcode='55000'; end if;
  insert into historietas_privado.capitulo_runner_monitor(job_id,extensao_oid,identidade_job,intervalo_segundos)
    select p_job,oid,v_job,p_intervalo_segundos from pg_extension where extname='pg_cron';
  insert into historietas_privado.capitulo_runner_incidentes(revisao,motivo) values(1,'configuracao');
end;
$$;

-- Chamado somente com o mesmo lock transacional do runner adquirido.
create function historietas_privado.pausar_monitor_capitulos(p_motivo text)
returns void language plpgsql volatile security invoker set search_path='' as $$
declare v_revisao bigint;
begin
  if not pg_try_advisory_xact_lock(hashtextextended('historietas:runner:capitulos:v1',0)) then
    raise exception 'Runner ocupado.' using errcode='55P03';
  end if;
  update historietas_privado.capitulo_runner_monitor set pausado=true,revisao=revisao+1
    where not pausado returning revisao into v_revisao;
  if v_revisao is not null then
    insert into historietas_privado.capitulo_runner_incidentes(revisao,motivo) values(v_revisao,p_motivo);
  end if;
  update historietas_privado.capitulo_runner_controle set habilitado=false where singleton;
end;
$$;

create function historietas_privado.observar_runner_capitulos(p_limite integer default 100)
returns jsonb language plpgsql volatile security invoker set search_path='' as $$
declare
  m historietas_privado.capitulo_runner_monitor%rowtype;
  r record; v_ancora jsonb; v_ok boolean; v_total integer := 0; v_incerteza boolean := false;
begin
  if p_limite is null or p_limite not between 1 and 100 then
    raise exception 'Limite invalido.' using errcode='22023';
  end if;
  if not pg_try_advisory_xact_lock(hashtextextended('historietas:runner:capitulos:v1',0)) then
    return jsonb_build_object('estado','ocupado');
  end if;
  select * into m from historietas_privado.capitulo_runner_monitor where singleton for update;
  if not found then return jsonb_build_object('estado','nao_configurado'); end if;
  if historietas_privado.fonte_monitor_capitulos(m.job_id) is distinct from m.identidade_job
    or not exists(select 1 from pg_extension where oid=m.extensao_oid and extname='pg_cron') then
    perform historietas_privado.pausar_monitor_capitulos('fonte_indisponivel');
    return jsonb_build_object('estado','fonte_indisponivel');
  end if;
  if m.ultimo_run > 0 then
    execute 'select jsonb_build_object(''estado'',status,''inicio'',start_time,''fim'',end_time)
      from cron.job_run_details where jobid=$1 and runid=$2' into v_ancora using m.job_id,m.ultimo_run;
    select v_ancora = jsonb_build_object('estado',estado,'inicio',inicio,'fim',fim)
      into v_ok from historietas_privado.capitulo_runner_observacoes where run_id=m.ultimo_run;
    if v_ok is distinct from true then
      perform historietas_privado.pausar_monitor_capitulos('historico_incompleto');
      return jsonb_build_object('estado','historico_incompleto');
    end if;
  end if;
  -- Retencao limitada, nunca apagar incidentes, falhas ou a ancora atual.
  delete from historietas_privado.capitulo_runner_observacoes where run_id in
    (select run_id from historietas_privado.capitulo_runner_observacoes
      where estado='succeeded' and observado_em < clock_timestamp()-interval '1 hour'
        and run_id <> m.ultimo_run order by run_id limit 100);
  for r in execute 'select runid,status,start_time,end_time from cron.job_run_details
      where jobid=$1 and runid>$2 order by runid limit $3' using m.job_id,m.ultimo_run,p_limite loop
    -- Nunca ultrapassar uma execucao cujo desfecho ainda e desconhecido.
    if r.status not in ('failed','succeeded') or r.end_time is null then v_incerteza := true; exit; end if;
    if (select count(*) from historietas_privado.capitulo_runner_observacoes) >= 1000 then
      perform historietas_privado.pausar_monitor_capitulos('capacidade');
      return jsonb_build_object('estado','capacidade','observados',v_total);
    end if;
    insert into historietas_privado.capitulo_runner_observacoes(run_id,estado,inicio,fim)
      values(r.runid,r.status,r.start_time,r.end_time);
    m.falhas_consecutivas := case when r.status='failed' then m.falhas_consecutivas+1 else 0 end;
    m.ultimo_run := r.runid;
    update historietas_privado.capitulo_runner_monitor set ultimo_run=m.ultimo_run,
      falhas_consecutivas=m.falhas_consecutivas where singleton;
    if m.falhas_consecutivas >= 3 then perform historietas_privado.pausar_monitor_capitulos('tres_falhas'); end if;
    v_total := v_total+1;
  end loop;
  -- Silencio nao e sucesso nem prova de aborto: exige intervencao conservadora.
  if coalesce((select fim from historietas_privado.capitulo_runner_observacoes where run_id=m.ultimo_run),m.configurado_em)
    < clock_timestamp()-make_interval(secs=>greatest(60,m.intervalo_segundos*3)) then
    perform historietas_privado.pausar_monitor_capitulos('silencio');
  end if;
  update historietas_privado.capitulo_runner_monitor set observado_em=clock_timestamp() where singleton;
  return jsonb_build_object('estado',case when v_incerteza then 'execucao_indeterminada' else 'observado' end,
    'observados',v_total,'pausado',(select pausado from historietas_privado.capitulo_runner_monitor));
end;
$$;

create function historietas_privado.retomar_monitor_capitulos(p_revisao bigint,p_justificativa text)
returns jsonb language plpgsql volatile security invoker set search_path='' as $$
declare m historietas_privado.capitulo_runner_monitor%rowtype; v_pendente boolean; v_observacao jsonb;
begin
  if p_justificativa is null or p_justificativa not in ('configuracao_validada','causa_corrigida') then
    raise exception 'Justificativa operacional obrigatoria.' using errcode='22023';
  end if;
  if not pg_try_advisory_xact_lock(hashtextextended('historietas:runner:capitulos:v1',0)) then
    return jsonb_build_object('estado','ocupado');
  end if;
  select * into m from historietas_privado.capitulo_runner_monitor where singleton for update;
  if not found then raise exception 'Monitor ausente.' using errcode='55000'; end if;
  -- Resposta perdida: confirmar a retomada anterior, NUNCA remover uma pausa nova.
  if exists(select 1 from historietas_privado.capitulo_runner_incidentes
    where revisao=p_revisao and retomado_em is not null) then
    return jsonb_build_object('estado','ja_registrado','pausado',m.pausado,'revisaoAtual',m.revisao);
  end if;
  if p_revisao is distinct from m.revisao or not m.pausado
    or exists(select 1 from historietas_privado.capitulo_runner_controle where habilitado)
    or (select count(*) from historietas_privado.capitulo_runner_incidentes) >= 100
    or (select count(*) from historietas_privado.capitulo_runner_observacoes) >= 1000 then
    raise exception 'Revisao/gate/capacidade impedem retomada.' using errcode='55000';
  end if;
  v_observacao := historietas_privado.observar_runner_capitulos(100);
  if v_observacao->>'estado' <> 'observado' then
    raise exception 'Observacao inconclusiva impede retomada.' using errcode='55000';
  end if;
  if historietas_privado.fonte_monitor_capitulos(m.job_id) is distinct from m.identidade_job
    or not exists(select 1 from pg_extension where oid=m.extensao_oid) then
    raise exception 'Fonte indisponivel para retomada.' using errcode='55000';
  end if;
  -- Requer observacao anterior confirmada; nao consumir falhas na propria retomada.
  if m.ultimo_run <> (select ultimo_run from historietas_privado.capitulo_runner_monitor) then
    raise exception 'Observe e revise os novos resultados antes de retomar.' using errcode='55000';
  end if;
  execute 'select exists(select 1 from cron.job where jobid=$1 and active)
    or exists(select 1 from cron.job_run_details where jobid=$1 and runid>$2)'
    into v_pendente using m.job_id,m.ultimo_run;
  if v_pendente then
    raise exception 'Job ativo ou historico pendente.' using errcode='55000';
  end if;
  update historietas_privado.capitulo_runner_incidentes set retomado_em=clock_timestamp(),justificativa=p_justificativa
    where revisao=p_revisao;
  update historietas_privado.capitulo_runner_monitor set pausado=false,falhas_consecutivas=0 where singleton;
  return jsonb_build_object('estado','retomada_registrada','habilitado',false);
end;
$$;

-- A pausa persiste inclusive diante de sucesso SQL posterior ou habilitacao isolada.
create function historietas_privado.proteger_pausa_runner_capitulos()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if new.habilitado and not old.habilitado then
    if not pg_try_advisory_xact_lock(hashtextextended('historietas:runner:capitulos:v1',0)) then
      raise exception 'Runner ocupado.' using errcode='55P03';
    end if;
    if exists(select 1 from historietas_privado.capitulo_runner_monitor where pausado) then
      raise exception 'Retomada administrativa obrigatoria.' using errcode='55000';
    end if;
  end if;
  return new;
end;
$$;
create trigger capitulo_runner_pausa before update of habilitado on historietas_privado.capitulo_runner_controle
  for each row execute function historietas_privado.proteger_pausa_runner_capitulos();

create function historietas_privado.saude_runner_capitulos()
returns jsonb language sql stable security invoker set search_path='' as $$
  select historietas_privado.metricas_runner_capitulos() || jsonb_build_object(
    'monitorConfigurado',exists(select 1 from historietas_privado.capitulo_runner_monitor),
    'pausado',coalesce((select pausado from historietas_privado.capitulo_runner_monitor),true),
    'falhasConsecutivas',(select falhas_consecutivas from historietas_privado.capitulo_runner_monitor),
    'revisaoOperacional',(select revisao from historietas_privado.capitulo_runner_monitor),
    'ultimaObservacao',(select observado_em from historietas_privado.capitulo_runner_monitor),
    'incidentesAbertos',(select count(*) from historietas_privado.capitulo_runner_incidentes where retomado_em is null),
    'falhasGlobaisRetidas',(select count(*) from historietas_privado.capitulo_runner_observacoes where estado='failed'),
    'observacoesRetidas',(select count(*) from historietas_privado.capitulo_runner_observacoes));
$$;

revoke all on function historietas_privado.fonte_monitor_capitulos(bigint),
  historietas_privado.configurar_monitor_capitulos(bigint,integer),
  historietas_privado.pausar_monitor_capitulos(text),historietas_privado.observar_runner_capitulos(integer),
  historietas_privado.retomar_monitor_capitulos(bigint,text),historietas_privado.proteger_pausa_runner_capitulos(),
  historietas_privado.saude_runner_capitulos() from public,anon,authenticated,service_role,historietas_capitulo_runner;
do $$ begin
  if exists(select 1 from historietas_privado.capitulo_runner_controle where habilitado) then
    raise exception 'Instalacao exige runner desativado.' using errcode='55000';
  end if;
end $$;
comment on table historietas_privado.capitulo_runner_monitor is
  'Administrativo, sem jobs. Observador precisa de transacao independente e fonte integra. Nao prova ausencia de abortos nao registrados/apagados; nao garante pausa antes da quarta execucao. Sem ativacao automatica.';
comment on table historietas_privado.capitulo_runner_observacoes is
  'Ate 1000 resultados observados; sucesso SQL NAO significa publicacao. Reter falhas/ancora; podar apenas sucessos >1 hora em lotes de 100. Saturacao pausa; nao descartar evidencia.';
commit;
