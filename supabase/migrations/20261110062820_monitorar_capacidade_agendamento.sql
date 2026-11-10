-- 6D5: somente observacao privada. Sem admissao, ACK, jobs ou ativacao.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';

create function historietas_privado.recursos_monitor_capitulos()
returns jsonb language plpgsql volatile security invoker set search_path='' as $$
declare c historietas_privado.capitulo_notificacao_orcamento;
  saldo jsonb; wal jsonb; arquivos bigint; gerado numeric; reiniciado timestamptz;
begin
  begin
    select * into c from historietas_privado.capitulo_notificacao_orcamento where singleton;
    if found then
      saldo:=jsonb_build_object('estado','observado','fonte','saldo_6d4','medidoEm',clock_timestamp(),
        'linhasAdmitidas',c.notificacoes_admitidas,'limiteLinhas',c.limite_total,
        'payloadAdmitidoBytes',c.payload_admitido_bytes,'limitePayloadBytes',c.limite_total_bytes);
    else
      saldo:=jsonb_build_object('estado','indisponivel','medidoEm',null);
    end if;
  exception when others then
    saldo:=jsonb_build_object('estado','falha','medidoEm',null);
  end;
  begin
    -- Somente total agregado; nunca nomes/caminhos dos arquivos ou slots.
    -- Arquivos WAL ocupados NAO sao disco livre nem wal_bytes acumulado.
    select sum(size) into arquivos from pg_catalog.pg_ls_waldir();
    select wal_bytes,stats_reset into gerado,reiniciado from pg_catalog.pg_stat_wal;
    if arquivos is null or gerado is null or reiniciado is null then
      wal:=jsonb_build_object('estado','indisponivel','medidoEm',null);
    else
      wal:=jsonb_build_object('estado','observado','fonte','pg_ls_waldir_pg_stat_wal',
        'medidoEm',clock_timestamp(),'arquivosBytes',arquivos,
        'geradoAcumuladoBytes',gerado,'estatisticasReiniciadasEm',reiniciado,
        'limiteAprovadoBytes',null);
    end if;
  exception when others then
    -- Sem SQLERRM/SQLSTATE livre. query_canceled aborta a leitura inteira.
    wal:=jsonb_build_object('estado','falha','medidoEm',null);
  end;
  return jsonb_build_object('versao',1,'orcamentoNotificacoes',saldo,'wal',wal,
    'disco',jsonb_build_object('estado','indisponivel','fonte','sem_fonte_suportada',
      'medidoEm',null,'livreBytes',null,'totalBytes',null));
end;
$$;
revoke all on function historietas_privado.recursos_monitor_capitulos()
  from public,anon,authenticated,service_role,historietas_capitulo_runner,historietas_agendamento_monitor;

-- Preserva owner, ACL, assinatura e o contrato v1; extensao aditiva do snapshot.
-- A unica fronteira definer continua sendo o snapshot agregado ja autorizado.
do $migration$
declare d text; alvo text := '''capacidade'',historietas_privado.medir_capacidade_capitulos(),';
begin
  d:=pg_get_functiondef('historietas_privado.snapshot_monitor_capitulos()'::regprocedure);
  if strpos(d,alvo)=0 or strpos(d,'''recursos''')>0
    or strpos(d,'v_ultima jsonb := null;')=0
    or strpos(d,'return jsonb_build_object(''versao'',1,')=0
    or strpos(d,'''ultimaExecucaoCron'',v_ultima);')=0 then
    raise exception 'Contrato do monitor divergiu; revisar extensao.';
  end if;
  d:=replace(d,alvo,alvo||chr(10)||'    ''recursos'',historietas_privado.recursos_monitor_capitulos(),');
  d:=replace(d,'v_ultima jsonb := null;','v_ultima jsonb := null; v_snapshot jsonb;');
  d:=replace(d,'return jsonb_build_object(''versao'',1,','v_snapshot := jsonb_build_object(''versao'',1,');
  -- Carimbar o envelope DEPOIS das observacoes: consulta lenta nao gera datas
  -- aparentemente futuras em relacao ao timestamp capturado antes da coleta.
  d:=replace(d,'''ultimaExecucaoCron'',v_ultima);',
    '''ultimaExecucaoCron'',v_ultima);'||chr(10)||'  return v_snapshot || jsonb_build_object(''agora'',clock_timestamp());');
  execute d;
  if exists(select 1 from historietas_privado.capitulo_runner_controle where habilitado) then
    raise exception 'Instalacao exige runner desativado.' using errcode='55000';
  end if;
end;
$migration$;
comment on function historietas_privado.recursos_monitor_capitulos() is
  'Somente agregados de observacao. WAL ocupado e cumulativo separados, sem teto fisico aprovado. Disco livre indisponivel, nunca inferido de pg_database_size. Sem escrita, pausa, ACK ou autorizacao de ativacao.';
commit;
