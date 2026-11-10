import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {watchdogPolicy,checkVerification,classifyVerification,main} from '../scripts/chapter-scheduling-watchdog.mjs';
import {deliverAlert} from '../scripts/chapter-scheduling-monitor.mjs';

const now=Date.parse('2026-11-10T12:00:00Z');
// Valores sinteticos de teste, NAO defaults ou aprovacao de cadencia.
const env={GITHUB_TOKEN:'SEGREDO',AGENDAMENTO_ALERT_ISSUE:'123',
  AGENDAMENTO_MONITOR_ESPERADO_DESDE:'2026-11-10T11:00:00Z',AGENDAMENTO_MONITOR_MAX_INTERVALO_MS:'600000'};
const fixture=()=>({state:'active',run:{id:7,run_attempt:2,head_branch:'main',event:'workflow_dispatch',
  status:'completed',conclusion:'success',created_at:'2026-11-10T11:58:00Z',updated_at:'2026-11-10T11:59:01Z'},
  jobs:[{name:'verificar',run_id:7,run_attempt:2,status:'completed',conclusion:'success',
    steps:[{name:'Observar banco e entregar alerta',status:'completed',conclusion:'success',
      started_at:'2026-11-10T11:58:30Z',completed_at:'2026-11-10T11:59:00Z'}]}]});
const classify=f=>classifyVerification(f,watchdogPolicy(env,now),now).codigos;
function api(f=fixture(),failure) {
  const calls=[],comments=[];
  const fetchImpl=async(url,options={})=>{
    calls.push({url,options});
    if (failure && url.includes(failure.path)) {
      if (failure.error) throw Error('SEGREDO TLS servidor');
      return new Response('SEGREDO',{status:failure.status});
    }
    if (url.includes('/attempts/')) return Response.json({total_count:f.jobs.length,jobs:f.jobs});
    if (url.includes('/runs?')) return Response.json({total_count:f.run?1:0,workflow_runs:f.run?[f.run]:[]});
    if (url.includes('/workflows/')) return Response.json({state:f.state,path:'.github/workflows/agendamento-monitor.yml'});
    if (options.method==='POST') {
      comments.push({body:JSON.parse(options.body).body,user:{login:'github-actions[bot]'}});
      if (failure?.lost) throw Error('SEGREDO resposta perdida');
      return Response.json({id:1},{status:201});
    }
    if (url.includes('/comments')) return Response.json(comments);
    return Response.json({state:'open',body:'<!-- historietas-agendamento-monitor:v1 -->',comments:comments.length});
  };
  return {fetchImpl,calls,comments};
}

test('watchdog exige inicio e intervalo aprovados, sem default numerico ou rede em config invalida',async()=>{
  for (const overrides of [{AGENDAMENTO_MONITOR_ESPERADO_DESDE:undefined},
    {AGENDAMENTO_MONITOR_ESPERADO_DESDE:'2026-02-31T00:00:00Z'},
    {AGENDAMENTO_MONITOR_ESPERADO_DESDE:'2027-01-01T00:00:00Z'},
    ...['',undefined,'0','-1','1.5','NaN','9007199254740992'].map(v=>({AGENDAMENTO_MONITOR_MAX_INTERVALO_MS:v}))]) {
    assert.throws(()=>watchdogPolicy({...env,...overrides},now));
    const r=await checkVerification({...env,...overrides},{now,fetchImpl:()=>assert.fail('rede proibida')});
    assert.deepEqual(r.codigos,['CONTRATO_INVALIDO']);
  }
});
test('conclusao SQL recente e unica comprova verificacao; inicio ou teste de e-mail nao comprovam',()=>{
  assert.deepEqual(classify(fixture()),[]);
  for (const mutate of [f=>f.run.status='in_progress',f=>f.run.head_branch='outra',
    f=>f.run.event='pull_request',f=>f.jobs[0].steps[0].name='Testar somente transporte',
    f=>f.jobs[0].steps[0].conclusion='skipped',f=>f.jobs.push(f.jobs[0]),
    f=>f.jobs[0].run_attempt=1,f=>f.jobs[0].run_id=9,
    f=>f.jobs[0].steps[0].completed_at='2026-11-10T13:00:00Z']) {
    const f=fixture();mutate(f);assert.deepEqual(classify(f),['VERIFICACAO_NAO_COMPROVADA']);
  }
});
test('interrupcao, ausencia, desativacao e janela inicial nunca viram recuperacao falsa',()=>{
  const f=fixture();f.run=null;assert.deepEqual(classify(f),['VERIFICACAO_AUSENTE']);
  assert.deepEqual(classifyVerification(f,{since:now,gap:600000},now).codigos,['VERIFICACAO_NAO_COMPROVADA']);
  f.state='disabled_manually';assert.deepEqual(classify(f),['VERIFICADOR_DESATIVADO']);
  delete f.state;assert.deepEqual(classify(f),['VERIFICACAO_NAO_COMPROVADA']);
  const old=fixture();old.run.created_at='2026-11-09T12:00:00Z';
  assert.deepEqual(classify(old),['VERIFICACAO_AUSENTE']);
});
test('atraso usa fim da etapa, nao update recente ou nova tentativa queued',()=>{
  const f=fixture();f.run.created_at='2026-11-10T11:10:00Z';
  Object.assign(f.jobs[0].steps[0],{started_at:'2026-11-10T11:10:00Z',completed_at:'2026-11-10T11:20:00Z'});
  assert.deepEqual(classify(f),['VERIFICACAO_ATRASADA']);
  f.jobs[0].steps[0].conclusion='failure';
  assert.deepEqual(classify(f),['VERIFICACAO_ATRASADA','VERIFICACAO_FALHOU']);
});
test('API usa workflow/branch/attempt fixos, GETs limitados e rejeita redirect sem vazar erros',async()=>{
  const a=api();assert.deepEqual((await checkVerification(env,{now,fetchImpl:a.fetchImpl})).codigos,[]);
  assert.equal(a.calls.length,3);
  assert.ok(a.calls[1].url.endsWith('branch=main&status=completed&per_page=1'));
  assert.ok(a.calls[2].url.endsWith('/7/attempts/2/jobs?per_page=100'));
  assert.ok(a.calls.every(c=>c.options.redirect==='error' && !c.options.body));
  for (const failure of [{path:'/workflows/',status:401},{path:'/workflows/',status:403},
    {path:'/runs?',status:429},{path:'/attempts/',status:503},{path:'/attempts/',error:true}]) {
    const a=api(fixture(),failure),r=await checkVerification(env,{now,fetchImpl:a.fetchImpl});
    assert.deepEqual(r.codigos,['OBSERVACAO_GITHUB_INDISPONIVEL']);assert.doesNotMatch(JSON.stringify(r),/SEGREDO|TLS|servidor/);
  }
});
test('historico truncado, workflow inesperado e JSON invalido nao sao evidencia positiva',async()=>{
  for (const transform of [d=>d.jobs?{...d,total_count:101}:d,
    d=>d.path?{...d,path:'.github/workflows/falso.yml'}:d]) {
    const a=api(),fetchImpl=async(...args)=>{const r=await a.fetchImpl(...args);return Response.json(transform(await r.json()));};
    assert.notDeepEqual((await checkVerification(env,{now,fetchImpl})).codigos,[]);
  }
  assert.deepEqual((await checkVerification(env,{now,fetchImpl:async()=>new Response('SEGREDO')})).codigos,['OBSERVACAO_GITHUB_INDISPONIVEL']);
});
test('latencia da consulta conta no frescor; nao congela relogio antes da rede',async()=>{
  const a=api();let current=now;
  const fetchImpl=async(...args)=>{current+=200001;return a.fetchImpl(...args);};
  const r=await checkVerification(env,{fetchImpl,now:()=>current});
  assert.deepEqual(r.codigos,['VERIFICACAO_ATRASADA']);
  assert.equal(Date.parse(r.observadoEm),now+600003);
});
test('alerta perdido reconcilia por leitura, deduplica e recupera sem apagar alerta do monitor SQL',async()=>{
  const a=api(fixture(),{lost:true}),params={token:'SEGREDO',issue:123,fetchImpl:a.fetchImpl};
  const r={versao:1,observadoEm:new Date(now).toISOString(),codigos:['BANCO_INDISPONIVEL']};
  await assert.rejects(deliverAlert(r,params));
  assert.equal(await deliverAlert(r,params),'unchanged');
  const watchdog={...r,codigos:['VERIFICACAO_ATRASADA']};
  await assert.rejects(deliverAlert(watchdog,{...params,channel:'watchdog'}));
  assert.equal(await deliverAlert(watchdog,{...params,channel:'watchdog'}),'unchanged');
  assert.equal(await deliverAlert(r,params),'unchanged');
  assert.equal(a.calls.filter(c=>c.options.method==='POST').length,2);
  assert.ok(a.comments[1].body.startsWith('<!-- historietas-agendamento-watchdog:v1 -->'));
  await assert.rejects(deliverAlert(r,{...params,channel:'SEGREDO'}),/invalid alert channel/);
});
test('indisponibilidade conjunta falha fechada e sai 2; nao simula entrega independente',async()=>{
  assert.equal(await main(env,{now,fetchImpl:async()=>{throw Error('SEGREDO');}}),2);
  const f=fixture();f.run=null;const a=api(f);
  assert.equal(await main(env,{now,fetchImpl:a.fetchImpl}),1);
  assert.doesNotMatch(a.comments[0].body,/SEGREDO|run_id|github_token/);
  const healthy=api();assert.equal(await main(env,{now,fetchImpl:healthy.fetchImpl}),0);
});
test('fluxos concorrentes isolam alertas e recuperacao, preservando o legado',async()=>{
  const a=api(),params={token:'SEGREDO',issue:123,fetchImpl:a.fetchImpl};
  const r={versao:1,observadoEm:new Date(now).toISOString(),codigos:['BANCO_INDISPONIVEL']};
  await Promise.all([deliverAlert(r,params),deliverAlert({...r,codigos:['VERIFICACAO_FALHOU']},{...params,channel:'watchdog'})]);
  assert.equal(a.comments.length,2);
  assert.equal(await deliverAlert(r,params),'unchanged');
  assert.equal(await deliverAlert({...r,codigos:[]},{...params,channel:'watchdog'}),'delivered');
  assert.equal(await deliverAlert(r,params),'unchanged');
});
test('transporte HTTP local real: resposta POST perdida preserva comentario e retry nao duplica',async()=>{
  const comments=[];let posts=0,lose=true;
  const server=createServer(async(req,res)=>{
    if (req.method==='POST') {
      let body='';for await (const part of req) body+=part;
      posts++;comments.push({body:JSON.parse(body).body,user:{login:'github-actions[bot]'}});
      if (lose) { lose=false;req.socket.destroy();return; }
      res.writeHead(201,{'content-type':'application/json'});res.end('{"id":1}');return;
    }
    res.setHeader('content-type','application/json');
    res.end(JSON.stringify(req.url.includes('/comments') ? comments :
      {state:'open',body:'<!-- historietas-agendamento-monitor:v1 -->',comments:comments.length}));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    const fetchImpl=(url,options)=>{
      const u=new URL(url);assert.equal(u.origin,'https://api.github.com');
      // Somente servidor efemero de loopback; nenhum token ou comentario real.
      return fetch(`http://127.0.0.1:${server.address().port}${u.pathname}${u.search}`,options);
    };
    const params={token:'token-sintetico-local',issue:123,channel:'watchdog',fetchImpl};
    const r={versao:1,observadoEm:new Date(now).toISOString(),codigos:['VERIFICACAO_ATRASADA']};
    await assert.rejects(deliverAlert(r,params));assert.equal(posts,1);
    assert.equal(await deliverAlert(r,params),'unchanged');assert.equal(posts,1);
    assert.equal(await deliverAlert({...r,codigos:[]},params),'delivered');assert.equal(posts,2);
    assert.doesNotMatch(JSON.stringify(comments),/token-sintetico-local|Authorization/);
  } finally { server.closeAllConnections();await new Promise(resolve=>server.close(resolve)); }
});
test('workflows sem schedule, com gates distintos e main; watchdog nunca recebe SQL/secrets do banco',()=>{
  const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
  const monitor=read('../../.github/workflows/agendamento-monitor.yml'),watchdog=read('../../.github/workflows/agendamento-watchdog.yml');
  for (const w of [monitor,watchdog]) {
    assert.doesNotMatch(w,/^\s+schedule:/m);assert.match(w,/workflow_dispatch:/);
    assert.match(w,/github.ref == 'refs\/heads\/main'/);assert.match(w,/cancel-in-progress: false/);
  }
  assert.match(monitor,/AGENDAMENTO_MONITOR_AUTORIZADO/);assert.match(watchdog,/AGENDAMENTO_WATCHDOG_AUTORIZADO/);
  assert.match(watchdog,/actions: read/);assert.doesNotMatch(watchdog,/PGHOST|PGPASSWORD|service_role|secrets\./);
  assert.match(monitor,/if: inputs.teste_entrega/);assert.match(monitor,/if: \$\{\{ !inputs.teste_entrega \}\}/);
  const template=read('../../docs/operacao/agendamento-periodico.patch.example');
  assert.match(template,/__CADENCIA_MONITOR_UTC_APROVADA__/);assert.match(template,/__CADENCIA_WATCHDOG_UTC_APROVADA__/);
});
