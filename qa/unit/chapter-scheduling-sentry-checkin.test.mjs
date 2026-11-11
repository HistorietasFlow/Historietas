import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {isRealWatchdogRun,main} from '../scripts/chapter-scheduling-sentry-checkin.mjs';
import {main as runWatchdog} from '../scripts/chapter-scheduling-watchdog.mjs';

const id='11111111-2222-4333-8444-555555555555';
const scheduled={GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'schedule',GITHUB_REF:'refs/heads/main',
  GITHUB_REPOSITORY:'HistorietasFlow/Historietas',
  GITHUB_WORKFLOW_REF:'HistorietasFlow/Historietas/.github/workflows/agendamento-watchdog.yml@refs/heads/main',
  AGENDAMENTO_SENTRY_CHECKIN_URL:'https://sentry.io/api/0/organizations/historietas/monitors/watchdog/checkins/',
  AGENDAMENTO_SENTRY_DSN:'dsn-sintetico'};

function transport({failStart=false,failEnd=false,loseStart=false}={}) {
  const calls=[];
  const fetchImpl=async(url,options)=>{
    calls.push({url,method:options.method,status:JSON.parse(options.body).status,
      auth:options.headers.Authorization,redirect:options.redirect});
    if (options.method==='POST') {
      if (loseStart) throw Error('dsn-sintetico resposta perdida');
      return failStart ? new Response('dsn-sintetico',{status:503}) : Response.json({id},{status:201});
    }
    return failEnd ? new Response('dsn-sintetico',{status:503}) : new Response(null,{status:204});
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

test('inicio e fim usam mesmo ID: sucesso so depois de verificacao real concluida',async()=>{
  const t=transport();let runs=0;
  assert.equal(await main(scheduled,{fetchImpl:t.fetchImpl,watchdogMain:async()=>{runs++;return 0;}}),0);
  assert.equal(runs,1);
  assert.deepEqual(t.calls.map(c=>[c.method,c.status]),[['POST','in_progress'],['PUT','ok']]);
  assert.equal(t.calls[1].url,`${scheduled.AGENDAMENTO_SENTRY_CHECKIN_URL}${id}/`);
  assert.ok(t.calls.every(c=>c.redirect==='error' && c.auth==='DSN dsn-sintetico'));
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
  for (const change of [{AGENDAMENTO_SENTRY_DSN:undefined},
    {AGENDAMENTO_SENTRY_CHECKIN_URL:'http://sentry.io/api/0/organizations/org/monitors/watchdog/checkins/'},
    {AGENDAMENTO_SENTRY_CHECKIN_URL:'https://evil.example/checkins/'},
    {AGENDAMENTO_SENTRY_CHECKIN_URL:`${scheduled.AGENDAMENTO_SENTRY_CHECKIN_URL}?token=segredo`}]) {
    const t=transport();let runs=0;
    assert.equal(await main({...scheduled,...change},{fetchImpl:t.fetchImpl,watchdogMain:async()=>{runs++;return 0;}}),2);
    assert.equal(runs,1);assert.equal(t.calls.length,0);
  }
});

test('workflow permanece manual e secrets sao exclusivos do check-in',()=>{
  const workflow=readFileSync(new URL('../../.github/workflows/agendamento-watchdog.yml',import.meta.url),'utf8');
  const ci=readFileSync(new URL('../../.github/workflows/ci.yml',import.meta.url),'utf8');
  assert.match(workflow,/workflow_dispatch:/);
  assert.doesNotMatch(workflow,/^\s+schedule:/m);
  assert.match(workflow,/run: node qa\/scripts\/chapter-scheduling-sentry-checkin\.mjs/);
  assert.match(workflow,/AGENDAMENTO_SENTRY_CHECKIN_URL: \$\{\{ secrets\.AGENDAMENTO_SENTRY_CHECKIN_URL \}\}/);
  assert.match(workflow,/AGENDAMENTO_SENTRY_DSN: \$\{\{ secrets\.AGENDAMENTO_SENTRY_DSN \}\}/);
  assert.match(ci,/node --test qa\/unit\/chapter-scheduling-monitor\.test\.mjs qa\/unit\/chapter-scheduling-watchdog\.test\.mjs qa\/unit\/chapter-scheduling-sentry-checkin\.test\.mjs/);
});
