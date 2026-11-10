import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import { alertBody, checkDatabase, classifySnapshot, deliverAlert } from '../scripts/chapter-scheduling-monitor.mjs';

const now=Date.parse('2026-11-10T01:00:00Z');
const snapshot=()=>({versao:1,agora:new Date(now).toISOString(),fonteValida:true,
  saude:{habilitado:true,monitorConfigurado:true,pausado:false,falhasConsecutivas:0,incidentesAbertos:0,
    retriesEsgotados:0,atrasados:0,atrasoMaximoSegundos:0,ultimaObservacao:new Date(now-20000).toISOString()},
  capacidade:{pausado:false,alerta:false,bloqueio:null},
  ultimaExecucaoCron:{estado:'succeeded',inicio:new Date(now-30000).toISOString(),fim:new Date(now-20000).toISOString()}});
const report=(items=[])=>({versao:1,observadoEm:new Date(now).toISOString(),codigos:items});
const comment=(r,actor='github-actions[bot]')=>({body:alertBody(r),user:{login:actor}});
function github(comments=[],options={}) {
  const requests=[];
  const fetchImpl=async(url,init)=>{
    requests.push({url,init});
    if (init.method==='POST') {
      comments.push({body:JSON.parse(init.body).body,user:{login:'github-actions[bot]'}});
      if(options.lost) throw Error('token connection secret');
      return Response.json({id:1},{status:201});
    }
    if(url.includes('/comments')) return Response.json(comments);
    return Response.json({body:'<!-- historietas-agendamento-monitor:v1 -->',state:'open',comments:comments.length});
  };
  return {requests,fetchImpl,comments};
}
const config=(api)=>({token:'secret-not-for-logs',issue:123,fetchImpl:api.fetchImpl});

test('saude valida, sem inferir sucesso de uma resposta vazia',()=>{
  assert.deepEqual(classifySnapshot(snapshot(),now).codigos,[]);
  for(const value of [null,{}, {...snapshot(),saude:{}}, {...snapshot(),ultimaExecucaoCron:{estado:'inventado'}}])
    assert.deepEqual(classifySnapshot(value,now).codigos,['CONTRATO_INVALIDO']);
});
test('relogio divergente e evidencia antiga nao confirmam funcionamento',()=>{
  assert.deepEqual(classifySnapshot(snapshot(),now+61000).codigos,['RELOGIO_DIVERGENTE']);
  const s=snapshot();s.saude.ultimaObservacao=new Date(now-181000).toISOString();s.ultimaExecucaoCron.fim=s.saude.ultimaObservacao;
  assert.deepEqual(classifySnapshot(s,now).codigos,['EXECUCAO_ATRASADA','MONITOR_ATRASADO']);
});
test('preparacao desativada nao e apresentada como operacao saudavel',()=>{
  const s=snapshot();Object.assign(s.saude,{habilitado:false,monitorConfigurado:false,ultimaObservacao:null,falhasConsecutivas:null});
  s.fonteValida=false;s.ultimaExecucaoCron=null;
  assert.deepEqual(classifySnapshot(s,now).codigos,['EXECUCAO_AUSENTE','FONTE_INVALIDA','MONITOR_ATRASADO','MONITOR_NAO_CONFIGURADO','RUNNER_DESATIVADO']);
});
test('falhas, pausas, backlog, retries e capacidade geram codigos sem dados privados',()=>{
  const s=snapshot();Object.assign(s.saude,{falhasConsecutivas:3,pausado:true,incidentesAbertos:1,retriesEsgotados:1,atrasados:1,atrasoMaximoSegundos:300});
  Object.assign(s.capacidade,{alerta:true,bloqueio:'banco_bytes'});s.ultimaExecucaoCron.estado='failed';
  const r=classifySnapshot(s,now);
  assert.deepEqual(r.codigos,['BACKLOG_ATRASADO','CAPACIDADE_ALERTA','CAPACIDADE_BLOQUEADA','FALHAS_OBSERVADAS','FALHA_CRON','INCIDENTES_ABERTOS','PAUSA_ATIVA','RETRIES_ESGOTADOS']);
  assert.ok(!alertBody({...r,segredo:'password'}).includes('password'));
});
test('execucao sem desfecho nao e tratada como sucesso nem aborto comprovado',()=>{
  const s=snapshot();s.ultimaExecucaoCron={estado:'failed',inicio:null,fim:null};
  assert.deepEqual(classifySnapshot(s,now).codigos,['EXECUCAO_INCERTA','FALHA_CRON']);
});
test('banco inacessivel ou resposta invalida produzem alerta sanitizado',async()=>{
  const env={PGUSER:'historietas_agendamento_monitor',PGHOST:'fixture.invalid',PGDATABASE:'postgres',PGSSLMODE:'verify-full',PGSSLROOTCERT:'fixture.crt'};
  let called=0;
  const r=await checkDatabase(env,async(cmd,args,opts)=>{
    called++; assert.equal(cmd,'psql');assert.ok(args.at(-1).startsWith('begin isolation level repeatable read read only;'));
    assert.equal(opts.timeout,12000);assert.equal(opts.env.PGCONNECT_TIMEOUT,'5');assert.ok(opts.env.PGOPTIONS.includes('statement_timeout=5000'));
    throw Error('credential password SQL');
  });
  assert.equal(called,1);assert.deepEqual(r.codigos,['BANCO_INDISPONIVEL']);assert.ok(!JSON.stringify(r).includes('credential'));
  await checkDatabase({...env,PGUSER:'postgres'},async()=>assert.fail('Privileged connection forbidden'));
});
test('leitura completa usa SQL fixo e preserva a classificacao da resposta',async()=>{
  const env={PGUSER:'historietas_agendamento_monitor',PGHOST:'fixture.invalid',PGDATABASE:'postgres',PGSSLMODE:'verify-full',PGSSLROOTCERT:'fixture.crt'};
  const s=snapshot(), time=Date.now();
  s.agora=new Date(time).toISOString();s.saude.ultimaObservacao=new Date(time-1000).toISOString();
  s.ultimaExecucaoCron.inicio=new Date(time-2000).toISOString();s.ultimaExecucaoCron.fim=new Date(time-1000).toISOString();
  const r=await checkDatabase(env,async(_cmd,args,options)=>{
    assert.equal(args.at(-2),'-c');assert.equal(options.shell,false);assert.equal(options.maxBuffer,65536);
    assert.ok(!args.join(' ').includes('fixture.invalid'));
    return {stdout:JSON.stringify(s)+'\n'};
  });
  assert.deepEqual(r.codigos,[]);
});
test('entrega, deduplicacao e recuperacao sem reativar nenhum gate',async()=>{
  const api=github();
  assert.equal(await deliverAlert(report(['BANCO_INDISPONIVEL']),config(api)),'delivered');
  assert.equal(await deliverAlert(report(['BANCO_INDISPONIVEL']),config(api)),'unchanged');
  assert.equal(await deliverAlert(report(),config(api)),'delivered');
  assert.equal(api.requests.filter(r=>r.init.method==='POST').length,2);
});
test('POST com resposta perdida nao e repetido e e reconciliado na proxima leitura',async()=>{
  const api=github([],{lost:true});
  await assert.rejects(deliverAlert(report(['FALHA_CRON']),config(api)));
  assert.equal(await deliverAlert(report(['FALHA_CRON']),config(api)),'unchanged');
  assert.equal(api.requests.filter(r=>r.init.method==='POST').length,1);
});
test('relatorio antigo e comentarios forjados nao alteram o estado atual',async()=>{
  const newer={...report(['FALHA_CRON']),observadoEm:new Date(now+1000).toISOString()};
  const api=github([comment(newer)]);
  assert.equal(await deliverAlert(report(),config(api)),'obsolete');
  const forged=github([comment(newer,'untrusted-user')]);
  assert.equal(await deliverAlert(report(['PAUSA_ATIVA']),config(forged)),'delivered');
});
test('paginacao limitada busca ultima pagina e rejeita destinos externos',async()=>{
  const base='https://api.github.com/repos/HistorietasFlow/Historietas/issues/123';
  let count=0;
  const fetchImpl=async(url)=>{
    count++;
    if(url===base)return Response.json({body:'<!-- historietas-agendamento-monitor:v1 -->',state:'open',comments:101});
    if(url.endsWith('page=2'))return Response.json([comment(report())]);
    return Response.json([],{headers:{link:`<${base}/comments?per_page=100&page=2>; rel="last"`}});
  };
  assert.equal(await deliverAlert(report(),{...config({fetchImpl}),fetchImpl}),'unchanged');assert.equal(count,3);
  const bad=async(url)=>url===base?Response.json({body:'<!-- historietas-agendamento-monitor:v1 -->',state:'open',comments:101})
    :Response.json([],{headers:{link:'<https://malicious.invalid/comments>; rel="last"'}});
  await assert.rejects(deliverAlert(report(),config({fetchImpl:bad})),/invalid pagination/);
});
test('permissao negada, canal fechado e payload livre nunca confirmam entrega',async()=>{
  await assert.rejects(deliverAlert(report(),config({fetchImpl:async()=>new Response('',{status:403})})),/unavailable/);
  await assert.rejects(deliverAlert(report(),config({fetchImpl:async()=>Response.json({state:'closed'})})),/unapproved/);
  assert.throws(()=>alertBody(report(['private user name'])),/invalid/);
});
test('workflow permanece manual, gated e sem ativar banco ou runner',()=>{
  const workflow=readFileSync(new URL('../../.github/workflows/agendamento-monitor.yml',import.meta.url),'utf8');
  assert.match(workflow,/workflow_dispatch:/);assert.doesNotMatch(workflow,/^\s+schedule:/m);
  assert.match(workflow,/if: vars\.AGENDAMENTO_MONITOR_AUTORIZADO == 'true'/);
  assert.match(workflow,/timeout-minutes: 2/);assert.match(workflow,/cancel-in-progress: false/);
  assert.match(workflow,/PGUSER: historietas_agendamento_monitor/);assert.match(workflow,/PGSSLMODE: verify-full/);
  assert.doesNotMatch(workflow,/pg_cron|executar_runner|acionar_runner|service_role|supabase db push/);
});
