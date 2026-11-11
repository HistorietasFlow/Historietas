import {pathToFileURL} from 'node:url';
import {deliverAlert} from './chapter-scheduling-monitor.mjs';

const base='https://api.github.com/repos/HistorietasFlow/Historietas/actions';
const workflow='agendamento-monitor.yml';
// Nao aceitar conclusoes de workflows antigos com outro contrato de saida.
const observationStep='Comprovar observacao SQL e entrega (v2)';
const workflowProblem=state=>state==='active' ? null
  : ['deleted','disabled_fork','disabled_inactivity','disabled_manually'].includes(state)
    ? ['VERIFICADOR_DESATIVADO'] : ['VERIFICACAO_NAO_COMPROVADA'];
const report=(codigos,now)=>({versao:1,observadoEm:new Date(now).toISOString(),codigos:[...new Set(codigos)].sort()});
const time=value=>typeof value==='string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,19)===value.slice(0,19)
  ? Date.parse(value) : NaN;

// Sem cadencia/default operacional inventado. Configuracao e aprovacao externas.
export function watchdogPolicy(env,now) {
  const since=time(env.AGENDAMENTO_MONITOR_ESPERADO_DESDE);
  const raw=env.AGENDAMENTO_MONITOR_MAX_INTERVALO_MS;
  const gap=typeof raw==='string' && /^[1-9]\d*$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isFinite(now) || !Number.isFinite(since) || since>now ||
      !Number.isSafeInteger(gap) || gap<=0 || !Number.isSafeInteger(since+gap)) throw Error('invalid policy');
  return {since,gap};
}

export function classifyVerification({state,run,jobs},policy,now) {
  const result=items=>report(items,now);
  if (workflowProblem(state)) return result(workflowProblem(state));
  if (run===null) return result([now-policy.since>policy.gap ? 'VERIFICACAO_AUSENTE' : 'VERIFICACAO_NAO_COMPROVADA']);
  const completed=time(run.updated_at), created=time(run.created_at);
  if (!Number.isSafeInteger(run.id) || run.id<=0 || !Number.isSafeInteger(run.run_attempt) || run.run_attempt<=0 ||
      run.status!=='completed' || run.head_branch!=='main' || !['workflow_dispatch','schedule'].includes(run.event) ||
      !Number.isFinite(created) || !Number.isFinite(completed) || created>completed || completed>now ||
      !Array.isArray(jobs)) return result(['VERIFICACAO_NAO_COMPROVADA']);
  if (created<policy.since) return result([now-policy.since>policy.gap ? 'VERIFICACAO_AUSENTE' : 'VERIFICACAO_NAO_COMPROVADA']);
  // Requer exatamente o job real e a etapa SQL, nunca teste de e-mail ou job skipped.
  const candidates=jobs.filter(j=>j.name==='verificar' || j.name?.endsWith(' / verificar'));
  if (candidates.length!==1) return result(['VERIFICACAO_NAO_COMPROVADA']);
  const job=candidates[0], steps=job.steps?.filter(s=>s.name===observationStep);
  if (job.run_id!==run.id || job.run_attempt!==run.run_attempt || job.status!=='completed' ||
      !Array.isArray(steps) || steps.length!==1 || steps[0].status!=='completed' ||
      !['success','failure'].includes(steps[0].conclusion)) return result(['VERIFICACAO_NAO_COMPROVADA']);
  const end=time(steps[0].completed_at), start=time(steps[0].started_at);
  if (!Number.isFinite(end) || !Number.isFinite(start) || start<created || start>end || end>completed)
    return result(['VERIFICACAO_NAO_COMPROVADA']);
  const found=[];
  if (now-end>policy.gap) found.push('VERIFICACAO_ATRASADA');
  if (steps[0].conclusion!=='success' || job.conclusion!=='success' || run.conclusion!=='success')
    found.push('VERIFICACAO_FALHOU');
  return result(found);
}

export async function checkVerification(env=process.env,{fetchImpl=fetch,now=Date.now}={}) {
  const clock=typeof now==='function' ? now : ()=>now;
  let policy;
  try { policy=watchdogPolicy(env,clock()); } catch { return report(['CONTRATO_INVALIDO'],clock()); }
  if (!env.GITHUB_TOKEN) return report(['OBSERVACAO_GITHUB_INDISPONIVEL'],clock());
  const headers={Authorization:`Bearer ${env.GITHUB_TOKEN}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
  const get=async path=>{
    const r=await fetchImpl(`${base}/${path}`,{headers,redirect:'error',signal:AbortSignal.timeout(8000)});
    if (!r.ok) throw Error('GitHub unavailable');
    return r.json();
  };
  try {
    const w=await get(`workflows/${workflow}`);
    if (w.path!==`.github/workflows/${workflow}`) return report(['VERIFICACAO_NAO_COMPROVADA'],clock());
    if (workflowProblem(w.state)) return report(workflowProblem(w.state),clock());
    // Ultima conclusao, nao inicio: execucoes queued/running nao renovam heartbeat.
    const list=await get(`workflows/${workflow}/runs?branch=main&status=completed&per_page=1`);
    if (!Number.isSafeInteger(list.total_count) || list.total_count<0 || !Array.isArray(list.workflow_runs) ||
        list.workflow_runs.length!==Math.min(1,list.total_count)) throw Error('invalid runs');
    const run=list.workflow_runs[0]??null;
    let jobs=[];
    if (run) {
      if (!Number.isSafeInteger(run.id) || run.id<=0 || !Number.isSafeInteger(run.run_attempt) || run.run_attempt<=0)
        throw Error('invalid run');
      const data=await get(`runs/${run.id}/attempts/${run.run_attempt}/jobs?per_page=100`);
      if (!Number.isSafeInteger(data.total_count) || data.total_count<0 || !Array.isArray(data.jobs) ||
          data.total_count!==data.jobs.length) throw Error('incomplete jobs');
      jobs=data.jobs;
    }
    return classifyVerification({state:w.state,run,jobs},policy,clock());
  } catch { return report(['OBSERVACAO_GITHUB_INDISPONIVEL'],clock()); }
}

export async function main(env=process.env,deps={}) {
  const result=await checkVerification(env,deps);
  try {
    const entrega=await deliverAlert(result,{token:env.GITHUB_TOKEN,issue:Number(env.AGENDAMENTO_ALERT_ISSUE),channel:'watchdog',
      ...(deps.fetchImpl?{fetchImpl:deps.fetchImpl}:{})});
    console.log(JSON.stringify({codigos:result.codigos,entrega}));
    if (!['delivered','unchanged'].includes(entrega)) return 2;
    return result.codigos.length ? 1 : 0;
  } catch {
    console.error('Watchdog sem entrega confirmada. Nenhuma ativacao ou retomada executada.');
    return 2; // Host externo pode observar isto mesmo quando o GitHub nao responde.
  }
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) process.exitCode=await main();
