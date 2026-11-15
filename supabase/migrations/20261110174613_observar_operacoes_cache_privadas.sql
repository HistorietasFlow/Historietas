-- Observacao independente do consumidor, somente leitura. Sem ativacao/ACK.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';

create function historietas_privado.observar_operacoes_cache()
returns jsonb language plpgsql volatile security invoker set search_path='' as $$
declare r jsonb;
begin
  -- Uma instrucao/snapshot: nao combinar contagens de commits diferentes.
  with o as (
    select count(*) filter(where estado='admitida') admitidas,
      count(*) filter(where estado='confirmada') confirmadas,
      count(*) filter(where estado='encerrada_sem_claim') encerradas
    from historietas_privado.capitulo_cache_operacoes
  ), recibos as (
    select count(*) total from historietas_privado.capitulo_cache_operacoes_recibos
  ), erros as (
    select count(*) total from historietas_privado.capitulo_cache_operacoes a
    left join historietas_privado.capitulo_cache_operacoes_recibos b on b.operacao_id=a.id
    where (a.estado='confirmada') is distinct from (b.operacao_id is not null)
      or (b.operacao_id is not null and (b.debito>a.limite or b.debito<>(
        select count(*) from historietas_privado.capitulo_cache_operacoes_eventos e where e.operacao_id=a.id)))
  )
  select jsonb_build_object('versao',1,'estado','observado','fonte','ledger_6d12_saldo_6d10',
    'medidoEm',clock_timestamp(),
    'protocolo',jsonb_build_object('habilitado',g.habilitado,'iniciado',g.iniciado,
      'pausado',g.pausado,'pendencia',g.pendente is not null),
    'contagens',jsonb_build_object('admitidas',o.admitidas,'confirmadas',o.confirmadas,
      'encerradas',o.encerradas,'recibos',recibos.total),
    'integridade',jsonb_build_object('divergencias',erros.total,
      'gateConsistente',case when o.admitidas=0 then g.pendente is null
        else o.admitidas=1 and g.pausado and g.iniciado and exists(
          select 1 from historietas_privado.capitulo_cache_operacoes a where a.id=g.pendente and a.estado='admitida') end),
    'saldo',jsonb_build_object('habilitado',b.habilitado,'pausado',b.pausado,
      'limite',b.limite,'consumidas',b.consumidas),
    'retencao',jsonb_build_object('politica','integral_sem_purga','limiteAprovadoBytes',null,
      'relacoesBytes',(select sum(pg_total_relation_size(t)) from unnest(array[
        'historietas_privado.capitulo_cache_operacoes_controle'::regclass,
        'historietas_privado.capitulo_cache_operacoes'::regclass,
        'historietas_privado.capitulo_cache_operacoes_recibos'::regclass,
        'historietas_privado.capitulo_cache_operacoes_eventos'::regclass,
        'historietas_privado.capitulo_cache_operacoes_retomadas'::regclass]) t)))
    into r from historietas_privado.capitulo_cache_operacoes_controle g
    cross join historietas_privado.capitulo_cache_orcamento b cross join o cross join recibos cross join erros
    where g.singleton and b.singleton;
  return coalesce(r,jsonb_build_object('versao',1,'estado','indisponivel','medidoEm',null));
exception when others then
  -- Cancelamento global propaga. Nao publicar SQLERRM, IDs ou retornar zero.
  return jsonb_build_object('versao',1,'estado','falha','medidoEm',null);
end;
$$;
revoke all on function historietas_privado.observar_operacoes_cache()
  from public,anon,authenticated,service_role,historietas_capitulo_runner,historietas_agendamento_monitor;

-- Reutilizar a unica fronteira definer/ACL existente, sem novo poder de escrita.
do $$declare d text; alvo text:='''recursos'',historietas_privado.recursos_monitor_capitulos(),'; begin
  d:=pg_get_functiondef('historietas_privado.snapshot_monitor_capitulos()'::regprocedure);
  if strpos(d,alvo)=0 or strpos(d,'''operacoesCache''')>0
    or strpos(d,'''agora'',clock_timestamp());')=0 then
    raise exception 'Snapshot privado divergiu; revisar integracao.'; end if;
  execute replace(d,alvo,alvo||chr(10)||'    ''operacoesCache'',historietas_privado.observar_operacoes_cache(),');
  if exists(select 1 from historietas_privado.capitulo_runner_controle where habilitado)
    or exists(select 1 from historietas_privado.capitulo_cache_operacoes_controle where habilitado) then
    raise exception 'Instalacao exige controles desativados.' using errcode='55000'; end if;
end $$;
comment on function historietas_privado.observar_operacoes_cache() is
  'Somente agregados confirmados de intencoes, recibos, saldo e bytes do ledger. Sem locks de escrita, ACK, purga, rearmamento ou prova de entrega HTTP/flush. Ausencia de recibo indica incerteza, nao causa de aborto. Retencao/WAL sem orcamento aprovado.';
commit;
