import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';

const execute = promisify(execFile);
const marker = '<!-- historietas-agendamento-monitor:v1 -->';
const repository = 'HistorietasFlow/Historietas';
const sql = 'begin isolation level repeatable read read only; select historietas_privado.snapshot_monitor_capitulos(); rollback;';
const codes = new Set(['BANCO_INDISPONIVEL','CONTRATO_INVALIDO','RELOGIO_DIVERGENTE',
  'RUNNER_DESATIVADO','MONITOR_NAO_CONFIGURADO','FONTE_INVALIDA','MONITOR_ATRASADO',
  'EXECUCAO_AUSENTE','EXECUCAO_ATRASADA','EXECUCAO_INCERTA','FALHA_CRON',
  'PAUSA_ATIVA','FALHAS_OBSERVADAS','INCIDENTES_ABERTOS','RETRIES_ESGOTADOS',
  'BACKLOG_ATRASADO','CAPACIDADE_ALERTA','CAPACIDADE_BLOQUEADA','TESTE_ENTREGA',
  'CAPACIDADE_MEDICAO_INDISPONIVEL','CAPACIDADE_MEDICAO_OBSOLETA',
  'ORCAMENTO_NOTIFICACOES_INDISPONIVEL','ORCAMENTO_NOTIFICACOES_OBSOLETO',
  'ORCAMENTO_NOTIFICACOES_ALERTA','ORCAMENTO_NOTIFICACOES_ESGOTADO',
  'WAL_MEDICAO_INDISPONIVEL','WAL_MEDICAO_OBSOLETA','WAL_ORCAMENTO_NAO_DEFINIDO',
  'DISCO_MEDICAO_INDISPONIVEL','RECURSOS_CONTRATO_INVALIDO','FALHA_OBSERVACAO_RECURSOS',
  'CACHE_OBSERVACAO_INDISPONIVEL','CACHE_OBSERVACAO_OBSOLETA','CACHE_CONTRATO_INVALIDO',
  'CACHE_OPERACAO_SEM_RECIBO','CACHE_ADMISSAO_BLOQUEADA','CACHE_INTEGRIDADE_DIVERGENTE',
  'CACHE_SALDO_INDISPONIVEL','CACHE_SALDO_BLOQUEADO','CACHE_SALDO_ESGOTADO','CACHE_RETENCAO_SEM_ORCAMENTO']);

const number = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const date = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value));
const result = (items, now) => ({ versao:1, observadoEm:new Date(now).toISOString(), codigos:[...new Set(items)].sort() });

function classifyCache(s, server) {
  const integer=v=>Number.isSafeInteger(v)&&v>=0;
  const boolean=v=>typeof v==='boolean';
  if (s?.versao!==1 || s.estado!=='observado') return ['CACHE_OBSERVACAO_INDISPONIVEL'];
  const g=s.protocolo,c=s.contagens,i=s.integridade,b=s.saldo,r=s.retencao;
  if (s.fonte!=='ledger_6d12_saldo_6d10' || !date(s.medidoEm) || !g || !c || !i || !b || !r ||
    !['habilitado','iniciado','pausado','pendencia'].every(k=>boolean(g[k])) ||
    !['admitidas','confirmadas','encerradas','recibos'].every(k=>integer(c[k])) ||
    !integer(i.divergencias) || !boolean(i.gateConsistente) || !boolean(b.habilitado) || !boolean(b.pausado) ||
    !integer(b.consumidas) || !(b.limite===null || integer(b.limite)) ||
    r.politica!=='integral_sem_purga' || !integer(r.relacoesBytes) || r.limiteAprovadoBytes!==null)
    return ['CACHE_CONTRATO_INVALIDO'];
  if (server-Date.parse(s.medidoEm)>60000 || Date.parse(s.medidoEm)>server+1000) return ['CACHE_OBSERVACAO_OBSOLETA'];
  const found=[];
  if (c.admitidas>0) found.push('CACHE_OPERACAO_SEM_RECIBO');
  if ((g.habilitado||g.iniciado) && (g.pausado||g.pendencia)) found.push('CACHE_ADMISSAO_BLOQUEADA');
  if (i.divergencias>0 || !i.gateConsistente || c.admitidas>1 || c.confirmadas!==c.recibos ||
    g.pendencia!==(c.admitidas===1) || (c.admitidas>0 && (!g.pausado||!g.iniciado))) found.push('CACHE_INTEGRIDADE_DIVERGENTE');
  if (g.habilitado||g.iniciado) {
    if (!b.habilitado || b.limite===null) found.push('CACHE_SALDO_INDISPONIVEL');
    else if (b.consumidas>=b.limite) found.push('CACHE_SALDO_ESGOTADO');
    else if (b.pausado) found.push('CACHE_SALDO_BLOQUEADO');
  }
  if (g.iniciado || c.admitidas+c.confirmadas+c.encerradas>0) found.push('CACHE_RETENCAO_SEM_ORCAMENTO');
  return found;
}

// Idade da amostra, nao SLA nem reserva. Relatorio externo so contem codigos.
function classifyCapacity(snapshot, server) {
  const found=[], c=snapshot.capacidade, r=snapshot.recursos;
  const integer=value=>Number.isSafeInteger(value)&&value>=0;
  const fresh=value=>date(value)&&server-Date.parse(value)<=60000&&Date.parse(value)<=server+1000;
  const capacityFields=['eventos','limiteEventos','outboxBytes','limiteOutboxBytes',
    'notificacoesBytes','limiteNotificacoesBytes','bancoBytes','limiteBancoBytes'];
  if (!capacityFields.every(k=>integer(c[k])) || capacityFields.filter(k=>k.startsWith('limite')).some(k=>c[k]===0) || !date(c.medidoEm))
    found.push('CAPACIDADE_MEDICAO_INDISPONIVEL');
  else if (!fresh(c.medidoEm)) found.push('CAPACIDADE_MEDICAO_OBSOLETA');
  else if (c.eventos>=c.limiteEventos || c.outboxBytes>=c.limiteOutboxBytes ||
      c.notificacoesBytes>=c.limiteNotificacoesBytes || c.bancoBytes>=c.limiteBancoBytes)
    found.push('CAPACIDADE_BLOQUEADA');
  if (!r || r.versao!==1) return [...found,'RECURSOS_CONTRATO_INVALIDO'];
  const saldo=r.orcamentoNotificacoes, wal=r.wal;
  if ([saldo,wal].some(m=>m?.estado==='falha')) found.push('FALHA_OBSERVACAO_RECURSOS');
  if (saldo?.estado!=='observado' || saldo.fonte!=='saldo_6d4' ||
      !['linhasAdmitidas','limiteLinhas','payloadAdmitidoBytes','limitePayloadBytes'].every(k=>integer(saldo[k])) ||
      !saldo.limiteLinhas || !saldo.limitePayloadBytes || !date(saldo.medidoEm))
    found.push('ORCAMENTO_NOTIFICACOES_INDISPONIVEL');
  else if (!fresh(saldo.medidoEm)) found.push('ORCAMENTO_NOTIFICACOES_OBSOLETO');
  else if (saldo.linhasAdmitidas>=saldo.limiteLinhas || saldo.payloadAdmitidoBytes>=saldo.limitePayloadBytes)
    found.push('ORCAMENTO_NOTIFICACOES_ESGOTADO');
  else if (saldo.linhasAdmitidas*100>=saldo.limiteLinhas*70 || saldo.payloadAdmitidoBytes*100>=saldo.limitePayloadBytes*70)
    found.push('ORCAMENTO_NOTIFICACOES_ALERTA');
  if (wal?.estado!=='observado' || wal.fonte!=='pg_ls_waldir_pg_stat_wal' ||
      !integer(wal.arquivosBytes) || wal.arquivosBytes===0 || !integer(wal.geradoAcumuladoBytes) ||
      !date(wal.estatisticasReiniciadasEm) || !date(wal.medidoEm) ||
      Date.parse(wal.estatisticasReiniciadasEm)>Date.parse(wal.medidoEm)+1000) found.push('WAL_MEDICAO_INDISPONIVEL');
  else if (!fresh(wal.medidoEm)) found.push('WAL_MEDICAO_OBSOLETA');
  // Nao tratar max_wal_size como teto fisico nem aceitar limite injetado.
  if (wal?.estado==='observado' && wal.limiteAprovadoBytes!==null) found.push('RECURSOS_CONTRATO_INVALIDO');
  found.push('WAL_ORCAMENTO_NAO_DEFINIDO');
  // Nao existe fonte suportada de disco livre nesta fase. Nem mesmo um valor
  // numerico adicionado ao JSON pode ser interpretado como capacidade aprovada.
  if (r.disco?.estado!=='indisponivel' || r.disco?.fonte!=='sem_fonte_suportada' ||
      r.disco?.livreBytes!==null || r.disco?.totalBytes!==null || r.disco?.medidoEm!==null)
    found.push('RECURSOS_CONTRATO_INVALIDO');
  found.push('DISCO_MEDICAO_INDISPONIVEL');
  return found;
}

export function classifySnapshot(snapshot, now = Date.now()) {
  const invalid = () => result(['CONTRATO_INVALIDO'],now);
  const s = snapshot?.saude, c = snapshot?.capacidade;
  if (snapshot?.versao !== 1 || !date(snapshot.agora) || !s || !c ||
      ['habilitado','monitorConfigurado','pausado'].some(k=>typeof s[k]!=='boolean') ||
      ['incidentesAbertos','retriesEsgotados','atrasados','atrasoMaximoSegundos'].some(k=>!number(s[k])) ||
      !(number(s.falhasConsecutivas) || (!s.monitorConfigurado && s.falhasConsecutivas===null)) ||
      typeof snapshot.fonteValida!=='boolean' || typeof c.pausado!=='boolean' || typeof c.alerta!=='boolean' ||
      (c.bloqueio!==null && typeof c.bloqueio!=='string') ||
      (s.ultimaObservacao!==null && !date(s.ultimaObservacao))) return invalid();
  const server = Date.parse(snapshot.agora);
  if (Math.abs(now-server)>60000) return result(['RELOGIO_DIVERGENTE'],now);
  const found=[];
  if (!s.habilitado) found.push('RUNNER_DESATIVADO');
  if (!s.monitorConfigurado) found.push('MONITOR_NAO_CONFIGURADO');
  if (!snapshot.fonteValida) found.push('FONTE_INVALIDA');
  if (!s.ultimaObservacao || server-Date.parse(s.ultimaObservacao)>180000) found.push('MONITOR_ATRASADO');
  if (s.pausado || c.pausado) found.push('PAUSA_ATIVA');
  if (s.falhasConsecutivas>0) found.push('FALHAS_OBSERVADAS');
  if (s.incidentesAbertos>0) found.push('INCIDENTES_ABERTOS');
  if (s.retriesEsgotados>0) found.push('RETRIES_ESGOTADOS');
  if (s.atrasados>0 && s.atrasoMaximoSegundos>=300) found.push('BACKLOG_ATRASADO');
  if (c.alerta) found.push('CAPACIDADE_ALERTA');
  if (c.bloqueio!==null) found.push('CAPACIDADE_BLOQUEADA');
  found.push(...classifyCapacity(snapshot,server));
  found.push(...classifyCache(snapshot.operacoesCache,server));
  const run = snapshot.ultimaExecucaoCron;
  if (run===null) found.push('EXECUCAO_AUSENTE');
  else {
    if (!run || !['succeeded','failed','starting','connecting','sending','running'].includes(run.estado) ||
        (run.inicio!==null&&!date(run.inicio)) || (run.fim!==null&&!date(run.fim))) return invalid();
    if (run.estado==='failed') found.push('FALHA_CRON');
    if (!run.fim) {
      if (!run.inicio || server-Date.parse(run.inicio)>30000) found.push('EXECUCAO_INCERTA');
    } else if (server-Date.parse(run.fim)>180000) found.push('EXECUCAO_ATRASADA');
  }
  return result(found,now);
}

export async function checkDatabase(env = process.env, run = execute) {
  try {
    if (env.PGUSER!=='historietas_agendamento_monitor' || !env.PGHOST || !env.PGDATABASE ||
        env.PGSSLMODE!=='verify-full' || !env.PGSSLROOTCERT) throw Error('configuration');
    const {stdout} = await run('psql',['-XqAt','-w','-v','ON_ERROR_STOP=1','-c',sql],{
      env:{...env,PGCONNECT_TIMEOUT:'5',PGOPTIONS:'-c statement_timeout=5000 -c lock_timeout=500 -c idle_in_transaction_session_timeout=5000 -c default_transaction_read_only=on'},
      timeout:12000,maxBuffer:65536,windowsHide:true,
      // Static SQL only: no credentials in arguments, output or dynamic SQL.
      shell:false,
    });
    return classifySnapshot(JSON.parse(stdout));
  } catch {
    // Never expose psql stderr, connection strings, hosts, SQL errors or secrets.
    return result(['BANCO_INDISPONIVEL'],Date.now());
  }
}

function parseReport(value) {
  if (value?.versao!==1 || !date(value.observadoEm) || !Array.isArray(value.codigos) ||
      value.codigos.some(c=>!codes.has(c))) throw Error('invalid sanitized report');
  return {versao:1,observadoEm:value.observadoEm,codigos:[...new Set(value.codigos)].sort()};
}

export function alertBody(value) {
  const report=parseReport(value);
  return `${marker}\n${JSON.stringify(report)}\n\n${report.codigos.length ? 'Alerta operacional' : 'Recuperacao observada'} do agendamento. Somente diagnostico: nao autoriza ativacao ou retomada.\n`;
}

export async function deliverAlert(value, {token,issue,fetchImpl=fetch,actor='github-actions[bot]'}) {
  const report=parseReport(value);
  if (!token || !Number.isSafeInteger(issue) || issue<=0) throw Error('alert configuration unavailable');
  const base=`https://api.github.com/repos/${repository}/issues/${issue}`;
  const headers={Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
  async function request(url, method='GET', body) {
    const r=await fetchImpl(url,{method,headers,redirect:'error',signal:AbortSignal.timeout(8000),
      ...(body?{body:JSON.stringify(body)}:{})});
    if (!r.ok) throw Error('GitHub delivery unavailable');
    return {data:await r.json(),link:r.headers.get('link')};
  }
  const target=(await request(base)).data;
  if (target.pull_request || target.state!=='open' || !target.body?.startsWith(marker)) throw Error('unapproved alert issue');
  let page=await request(`${base}/comments?per_page=100`);
  const last=page.link?.split(',').find(s=>s.includes('rel="last"'))?.match(/<([^>]+)>/)?.[1];
  if (last) {
    const url=new URL(last);
    if (url.origin!=='https://api.github.com' || url.pathname!==new URL(`${base}/comments`).pathname ||
        url.username || url.password) throw Error('invalid pagination destination');
    page=await request(last);
  }
  if (!Array.isArray(page.data)) throw Error('invalid comments response');
  const previous=page.data.slice().reverse().find(c=>c.user?.login===actor && c.body?.startsWith(marker));
  if (previous) {
    let old;
    try { old=parseReport(JSON.parse(previous.body.split('\n')[1])); } catch { throw Error('invalid previous alert'); }
    if (Date.parse(old.observadoEm)>Date.parse(report.observadoEm)) return 'obsolete';
    if (JSON.stringify(old.codigos)===JSON.stringify(report.codigos)) return 'unchanged';
  } else if (target.comments>100) throw Error('alert history unavailable');
  // No automatic POST retry. A lost response is reconciled by reading history on the next check.
  await request(`${base}/comments`,'POST',{body:alertBody(report)});
  return 'delivered';
}

export async function main(env = process.env) {
  // Test mode exercises transport only; it never connects to any database.
  const report=env.AGENDAMENTO_MONITOR_TESTE==='true'
    ? result(['TESTE_ENTREGA'],Date.now()) : await checkDatabase(env);
  try {
    const delivery=await deliverAlert(report,{token:env.GITHUB_TOKEN,issue:Number(env.AGENDAMENTO_ALERT_ISSUE)});
    console.log(JSON.stringify({codigos:report.codigos,entrega:delivery}));
    return report.codigos.length && !report.codigos.includes('TESTE_ENTREGA') ? 1 : 0;
  } catch {
    console.error('Alerta nao confirmado. Verificar canal e configuracao; nenhuma retomada foi executada.');
    return 2;
  }
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) process.exitCode=await main();
