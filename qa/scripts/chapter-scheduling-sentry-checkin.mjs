import {pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import {main as runWatchdog} from './chapter-scheduling-watchdog.mjs';

// Apenas execucoes agendadas do workflow real podem renovar o monitor externo.
export function isRealWatchdogRun(env) {
  return env.GITHUB_ACTIONS==='true' && env.GITHUB_EVENT_NAME==='schedule' &&
    env.GITHUB_REF==='refs/heads/main' && env.GITHUB_REPOSITORY==='HistorietasFlow/Historietas' &&
    env.GITHUB_WORKFLOW_REF===
      'HistorietasFlow/Historietas/.github/workflows/agendamento-watchdog.yml@refs/heads/main';
}

function checkinEndpoint(env) {
  const raw=env.AGENDAMENTO_SENTRY_CHECKIN_URL;
  if (typeof raw!=='string')
    throw Error('invalid Sentry check-in configuration');
  const url=new URL(raw);
  if (url.protocol!=='https:' || !/^o\d+\.ingest(?:\.(?:us|de))?\.sentry\.io$/.test(url.hostname) ||
      url.port || url.username || url.password ||
      url.search || url.hash ||
      !/^\/api\/\d+\/crons?\/[a-zA-Z0-9_-]+\/[a-fA-F0-9]{32}\/$/.test(url.pathname) ||
      url.pathname.includes('___MONITOR_SLUG___'))
    throw Error('invalid Sentry check-in configuration');
  return url;
}

async function sendCheckin(fetchImpl,endpoint,status,id) {
  const url=new URL(endpoint);
  url.searchParams.set('status',status);
  url.searchParams.set('check_in_id',id);
  const response=await fetchImpl(url.href,{method:'GET',redirect:'error',signal:AbortSignal.timeout(8000)});
  if (!response.ok) throw Error('Sentry check-in rejected');
}

export async function main(env=process.env,{fetchImpl=fetch,watchdogMain=runWatchdog}={}) {
  if (!isRealWatchdogRun(env)) return watchdogMain(env);

  let endpoint;
  const checkinId=randomUUID().replaceAll('-','');
  let started=false;
  try {
    endpoint=checkinEndpoint(env);
    await sendCheckin(fetchImpl,endpoint,'in_progress',checkinId);
    started=true;
  } catch {
    // Falha do Sentry nao impede o watchdog de alertar no GitHub, mas falha o job.
    console.error('Check-in inicial do Sentry nao confirmado.');
  }

  let result;
  try { result=await watchdogMain(env); }
  catch { result=2; }

  if (!started) return 2;
  try {
    await sendCheckin(fetchImpl,endpoint,result===0?'ok':'error',checkinId);
  } catch {
    console.error('Check-in final do Sentry nao confirmado.');
    return 2;
  }
  return result;
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) process.exitCode=await main();
