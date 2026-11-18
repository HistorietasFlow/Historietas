-- 6D2: leitura privada para verificador externo. Sem LOGIN, job ou ativacao.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';

create role historietas_agendamento_monitor nologin noinherit nosuperuser
  nocreatedb nocreaterole noreplication nobypassrls;
alter role historietas_agendamento_monitor set statement_timeout='5s';
alter role historietas_agendamento_monitor set lock_timeout='500ms';
alter role historietas_agendamento_monitor set idle_in_transaction_session_timeout='5s';
alter role historietas_agendamento_monitor set default_transaction_read_only=on;

create function historietas_privado.snapshot_monitor_capitulos()
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare m historietas_privado.capitulo_runner_monitor; v_fonte boolean := false;
  v_ultima jsonb := null;
begin
  select * into m from historietas_privado.capitulo_runner_monitor where singleton;
  if found then
    v_fonte := historietas_privado.fonte_monitor_capitulos(m.job_id)=m.identidade_job
      and exists(select 1 from pg_extension where oid=m.extensao_oid and extname='pg_cron');
    if v_fonte then
      -- Nenhum comando/erro livre, identidade de usuario ou conteudo no retorno.
      execute 'select jsonb_build_object(''estado'',status,''inicio'',start_time,''fim'',end_time)
        from cron.job_run_details where jobid=$1 order by runid desc limit 1'
        into v_ultima using m.job_id;
    end if;
  end if;
  return jsonb_build_object('versao',1,'agora',clock_timestamp(),
    'saude',historietas_privado.saude_runner_capitulos(),
    'capacidade',historietas_privado.medir_capacidade_capitulos(),
    'fonteValida',coalesce(v_fonte,false),'ultimaExecucaoCron',v_ultima);
end;
$$;
alter function historietas_privado.snapshot_monitor_capitulos() owner to postgres;
revoke all on function historietas_privado.snapshot_monitor_capitulos()
  from public,anon,authenticated,service_role,historietas_capitulo_runner;
grant usage on schema historietas_privado to historietas_agendamento_monitor;
grant execute on function historietas_privado.snapshot_monitor_capitulos()
  to historietas_agendamento_monitor;
comment on function historietas_privado.snapshot_monitor_capitulos() is
  'Somente leitura agregada, sem observacao/pausa/retomada, ACK ou ativacao. Papel dedicado NOLOGIN; acesso SQL/TLS e entrega externa exigem provisionamento separado. Usar transacao repeatable read/read only e timeouts previos.';
do $$ begin
  if exists(select 1 from historietas_privado.capitulo_runner_controle where habilitado) then
    raise exception 'Instalacao exige runner desativado.' using errcode='55000';
  end if;
end $$;
commit;
