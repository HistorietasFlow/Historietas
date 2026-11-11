import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {isRealWatchdogRun,main} from '../scripts/chapter-scheduling-sentry-checkin.mjs';
import {main as runWatchdog} from '../scripts/chapter-scheduling-watchdog.mjs';

const scheduled={GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'schedule',GITHUB_REF:'refs/heads/main',
  GITHUB_REPOSITORY:'HistorietasFlow/Historietas',
  GITHUB_WORKFLOW_REF:'HistorietasFlow/Historietas/.github/workflows/agendamento-watchdog.yml@refs/heads/main',
  AGENDAMENTO_SENTRY_CHECKIN_URL:'https://o123.ingest.us.sentry.io/api/456/crons/watchdog/11111111111111111111111111111111/'};

function transport({failStart=false,failEnd=false,loseStart=false}={}) {
  const calls=[];
  const fetchImpl=async(url,options)=>{
    const parsed=new URL(url);
    const status=parsed.searchParams.get('status');
    calls.push({url,method:options.method,status,id:parsed.searchParams.get('check_in_id'),
      redirect:options.redirect,headers:options.headers,body:options.body});
    if (status==='in_progress') {
      if (loseStart) throw Error('resposta perdida');
      return failStart ? new Response(null,{status:503}) : new Response(null,{status:200});
    }
    return failEnd ? new Response(null,{status:503}) : new Response(null,{status:200});
  };
  return {fetchImpl,calls};
}

test('execucao manual, teste de e-mail, branch ou repo diferente nunca renovam o Sentry',async()=>{
  for (const change of [{GITHUB_EVENT_NAME:'workflow_dispatch'},
    {GITHUB_EVENT_NAME:'pull_request'},{GITHUB_REF:'refs/heads/outra'},
    {GITHUB_REPOSITORY:'outro/projeto'},{GITHUB_ACTIONS:undefined},
    {GITHUB_WORKFLOW_REF:'HistorietasFlow/Historietas/.github/workflows/outro.yml@refs/heads/main'}]) {
    const t=transport();let runs=0;
    const env={...scheduled,...change};
    assert.equal(isRealWatchdogRun(env),false);
    assert.equal(await main(env,{fetchImpl:t.fetchImpl,watchdogMain:async()=>{runs++;return 0;}}),0);
    assert.equal(runs,1);assert.equal(t.calls.length,0);
  }
});

test('Relay recebe mesmo ID gerado localmente: sucesso so depois de verificacao real concluida',async()=>{
  const t=transport();let runs=0;
  assert.equal(await main(scheduled,{fetchImpl:t.fetchImpl,watchdogMain:async()=>{runs++;return 0;}}),0);
  assert.equal(runs,1);
  assert.deepEqual(t.calls.map(c=>[c.method,c.status]),[['GET','in_progress'],['GET','ok']]);
  assert.match(t.calls[0].id,/^[0-9a-f]{32}$/);
  assert.equal(t.calls[1].id,t.calls[0].id);
  assert.ok(t.calls.every(c=>c.redirect==='error' && c.headers===undefined && c.body===undefined &&
    c.url.startsWith(scheduled.AGENDAMENTO_SENTRY_CHECKIN_URL)));
});

test('falha, verificacao ausente e excecao do watchdog terminam em error, nunca ok',async()=>{
  for (const value of [1,2,Error('segredo do GitHub')]) {
    const t=transport();
    const result=await main(scheduled,{fetchImpl:t.fetchImpl,watchdogMain:async()=>{
      if (value instanceof Error) throw value;
      return value;
    }});
    assert.equal(result,value instanceof Error?2:value);
    assert.deepEqual(t.calls.map(c=>c.status),['in_progress','error']);
  }
});

test('indisponibilidade real da API GitHub e observada como error no Sentry',async()=>{
  const t=transport();
  const result=await main(scheduled,{fetchImpl:t.fetchImpl,
    watchdogMain:env=>runWatchdog(env,{fetchImpl:async()=>{throw Error('GitHub indisponivel');}})});
  assert.equal(result,2);
  assert.deepEqual(t.calls.map(c=>c.status),['in_progress','error']);
});

test('falha de rede ou resposta perdida no inicio nao impede watchdog, mas falha fechado',async()=>{
  for (const mode of [{failStart:true},{loseStart:true}]) {
    const t=transport(mode);let runs=0;
    assert.equal(await main(scheduled,{fetchImpl:t.fetchImpl,watchdogMain:async()=>{runs++;return 0;}}),2);
    assert.equal(runs,1);assert.deepEqual(t.calls.map(c=>c.status),['in_progress']);
  }
});

test('falha no check-in final nao confirma sucesso; proxima execucao recupera com novo par',async()=>{
  const bad=transport({failEnd:true});
  assert.equal(await main(scheduled,{fetchImpl:bad.fetchImpl,watchdogMain:async()=>0}),2);
  assert.deepEqual(bad.calls.map(c=>c.status),['in_progress','ok']);
  const good=transport();
  assert.equal(await main(scheduled,{fetchImpl:good.fetchImpl,watchdogMain:async()=>0}),0);
  assert.deepEqual(good.calls.map(c=>c.status),['in_progress','ok']);
});

test('configuracao ausente ou URL insegura nao envia segredos nem cria falso sucesso',async()=>{
  for (const change of [{AGENDAMENTO_SENTRY_CHECKIN_URL:undefined},
    {AGENDAMENTO_SENTRY_CHECKIN_URL:'https://sentry.io/api/0/organizations/org/monitors/watchdog/checkins/'},
    {AGENDAMENTO_SENTRY_CHECKIN_URL:'http://o123.ingest.us.sentry.io/api/456/crons/watchdog/11111111111111111111111111111111/'},
    {AGENDAMENTO_SENTRY_CHECKIN_URL:'https://evil.example/checkins/'},
    {AGENDAMENTO_SENTRY_CHECKIN_URL:'https://o123.ingest.us.sentry.io.evil.example/api/456/crons/watchdog/11111111111111111111111111111111/'},
    {AGENDAMENTO_SENTRY_CHECKIN_URL:`${scheduled.AGENDAMENTO_SENTRY_CHECKIN_URL}?token=segredo`}]) {
    const t=transport();let runs=0;
    assert.equal(await main({...scheduled,...change},{fetchImpl:t.fetchImpl,watchdogMain:async()=>{runs++;return 0;}}),2);
    assert.equal(runs,1);assert.equal(t.calls.length,0);
  }
});

test('aceita a variante singular do Relay e rejeita slug ou chave ausentes',async()=>{
  const t=transport();
  const singular=scheduled.AGENDAMENTO_SENTRY_CHECKIN_URL.replace('/crons/','/cron/');
  assert.equal(await main({...scheduled,AGENDAMENTO_SENTRY_CHECKIN_URL:singular},
    {fetchImpl:t.fetchImpl,watchdogMain:async()=>0}),0);
  assert.equal(t.calls.length,2);
  for (const url of [singular.replace('/watchdog/','/___MONITOR_SLUG___/'),
    singular.replace(/\/[a-f0-9]{32}\/$/,'/')]) {
    const invalid=transport();
    assert.equal(await main({...scheduled,AGENDAMENTO_SENTRY_CHECKIN_URL:url},
      {fetchImpl:invalid.fetchImpl,watchdogMain:async()=>0}),2);
    assert.equal(invalid.calls.length,0);
  }
});

test('workflow permanece manual e secrets sao exclusivos do check-in',()=>{
  const workflow=readFileSync(new URL('../../.github/workflows/agendamento-watchdog.yml',import.meta.url),'utf8');
  const ci=readFileSync(new URL('../../.github/workflows/ci.yml',import.meta.url),'utf8');
  assert.match(workflow,/workflow_dispatch:/);
  assert.doesNotMatch(workflow,/^\s+schedule:/m);
  assert.match(workflow,/run: node qa\/scripts\/chapter-scheduling-sentry-checkin\.mjs/);
  assert.match(workflow,/AGENDAMENTO_SENTRY_CHECKIN_URL: \$\{\{ secrets\.AGENDAMENTO_SENTRY_CHECKIN_URL \}\}/);
  assert.doesNotMatch(workflow,/AGENDAMENTO_SENTRY_DSN/);
  assert.match(ci,/node --test qa\/unit\/chapter-monitor-ca\.test\.mjs qa\/unit\/chapter-scheduling-monitor\.test\.mjs qa\/unit\/chapter-scheduling-watchdog\.test\.mjs qa\/unit\/chapter-scheduling-sentry-checkin\.test\.mjs/);
});

test('watchdog real integrado ao wrapper: teste de transporte verde nao vira ok; SQL falho e recuperacao distinguem-se',async()=>{
  const now=Date.parse('2026-11-11T12:00:00Z');
  const env={...scheduled,GITHUB_TOKEN:'token-sintetico',AGENDAMENTO_ALERT_ISSUE:'123',
    AGENDAMENTO_MONITOR_ESPERADO_DESDE:'2026-11-11T11:00:00Z',
    AGENDAMENTO_MONITOR_MAX_INTERVALO_MS:'600000'}; // Janela sintetica, nao aprovacao.
  for (const scenario of [
    {step:'Testar somente transporte',conclusion:'success',code:1,status:'error',reason:'VERIFICACAO_NAO_COMPROVADA'},
    {step:'Observar banco e entregar alerta',conclusion:'success',code:1,status:'error',reason:'VERIFICACAO_NAO_COMPROVADA'},
    {step:'Comprovar observacao SQL e entrega (v2)',conclusion:'failure',code:1,status:'error',reason:'VERIFICACAO_FALHOU'},
    {step:'Comprovar observacao SQL e entrega (v2)',conclusion:'success',code:0,status:'ok'},
  ]) {
    const t=transport(),comments=[];
    const fetchImpl=async(url,options={})=>{
      assert.equal(new URL(url).origin,'https://api.github.com');
      if (url.includes('/attempts/')) return Response.json({total_count:1,jobs:[{
        name:'verificar',run_id:7,run_attempt:1,status:'completed',conclusion:scenario.conclusion,
        steps:[{name:scenario.step,status:'completed',conclusion:scenario.conclusion,
          started_at:'2026-11-11T11:58:30Z',completed_at:'2026-11-11T11:59:00Z'}]}]});
      if (url.includes('/runs?')) return Response.json({total_count:1,workflow_runs:[{
        id:7,run_attempt:1,head_branch:'main',event:'workflow_dispatch',status:'completed',
        conclusion:scenario.conclusion,created_at:'2026-11-11T11:58:00Z',updated_at:'2026-11-11T11:59:01Z'}]});
      if (url.includes('/workflows/')) return Response.json({state:'active',path:'.github/workflows/agendamento-monitor.yml'});
      if (options.method==='POST') {
        comments.push(JSON.parse(options.body).body);
        return Response.json({id:1},{status:201});
      }
      if (url.includes('/comments')) return Response.json([]);
      return Response.json({state:'open',body:'<!-- historietas-agendamento-monitor:v1 -->',comments:0});
    };
    const watchdogMain=value=>runWatchdog(value,{fetchImpl,now});
    assert.equal(await main(env,{fetchImpl:t.fetchImpl,watchdogMain}),scenario.code);
    assert.deepEqual(t.calls.map(c=>c.status),['in_progress',scenario.status]);
    assert.equal(t.calls[0].id,t.calls[1].id);
    assert.equal(comments.length,1);
    assert.deepEqual(JSON.parse(comments[0].split('\n')[1]).codigos,scenario.reason?[scenario.reason]:[]);
    // Mesmo uma observacao SQL valida nao permite que o dispatch manual renove o Sentry.
    const manual=transport();
    assert.equal(await main({...env,GITHUB_EVENT_NAME:'workflow_dispatch'},
      {fetchImpl:manual.fetchImpl,watchdogMain}),scenario.code);
    assert.equal(manual.calls.length,0);
  }
});
