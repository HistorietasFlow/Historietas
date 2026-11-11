import {pathToFileURL} from 'node:url';
import {main as runWatchdog} from './chapter-scheduling-watchdog.mjs';

// Apenas execucoes agendadas do workflow real podem renovar o monitor externo.
export function isRealWatchdogRun(env) {
  return env.GITHUB_EVENT_NAME==='schedule' && env.GITHUB_REF==='refs/heads/main' &&
    env.GITHUB_REPOSITORY==='HistorietasFlow/Historietas';
}

function checkinEndpoint(env) {
  const raw=env.AGENDAMENTO_SENTRY_CHECKIN_URL;
  const dsn=env.AGENDAMENTO_SENTRY_DSN;
  if (typeof raw!=='string' || typeof dsn!=='string' || !dsn.trim() || /[\r\n]/.test(dsn))
    throw Error('invalid Sentry check-in configuration');
  const url=new URL(raw);
  if (url.protocol!=='https:' || !['sentry.io','us.sentry.io','de.sentry.io'].includes(url.hostname) ||
      url.port || url.username || url.password ||
      url.search || url.hash || !/^\/api\/0\/organizations\/[a-zA-Z0-9_-]+\/monitors\/[a-zA-Z0-9_-]+\/checkins\/$/.test(url.pathname))
    throw Error('invalid Sentry check-in configuration');
  return {url:url.href,dsn};
}

async function sendCheckin(fetchImpl,endpoint,method,status,id) {
  const url=id ? `${endpoint.url}${id}/` : endpoint.url;
  const response=await fetchImpl(url,{method,headers:{Authorization:`DSN ${endpoint.dsn}`,
    'Content-Type':'application/json'},body:JSON.stringify({status}),redirect:'error',signal:AbortSignal.timeout(8000)});
  if (!response.ok) throw Error('Sentry check-in rejected');
  if (id) return;
  const data=await response.json();
  if (typeof data?.id!=='string' || !/^[0-9a-fA-F-]{32,36}$/.test(data.id))
    throw Error('Sentry check-in missing id');
  return data.id;
}

export async function main(env=process.env,{fetchImpl=fetch,watchdogMain=runWatchdog}={}) {
  if (!isRealWatchdogRun(env)) return watchdogMain(env);

  let endpoint,checkinId;
  try {
    endpoint=checkinEndpoint(env);
    checkinId=await sendCheckin(fetchImpl,endpoint,'POST','in_progress');
  } catch {
    // Falha do Sentry nao impede o watchdog de alertar no GitHub, mas falha o job.
    console.error('Check-in inicial do Sentry nao confirmado.');
  }

  let result;
  try { result=await watchdogMain(env); }
  catch { result=2; }

  if (!checkinId) return 2;
  try {
    await sendCheckin(fetchImpl,endpoint,'PUT',result===0?'ok':'error',checkinId);
  } catch {
    console.error('Check-in final do Sentry nao confirmado.');
    return 2;
  }
  return result;
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) process.exitCode=await main();
