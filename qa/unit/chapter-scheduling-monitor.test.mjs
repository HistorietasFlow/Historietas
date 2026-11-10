import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import { alertBody, checkDatabase, classifySnapshot, deliverAlert } from '../scripts/chapter-scheduling-monitor.mjs';

const now=Date.parse('2026-11-10T01:00:00Z');
const capacityWarnings=['DISCO_MEDICAO_INDISPONIVEL','WAL_ORCAMENTO_NAO_DEFINIDO'];
const expected=items=>[...capacityWarnings,...items].sort();
const snapshot=()=>({versao:1,agora:new Date(now).toISOString(),fonteValida:true,
  saude:{habilitado:true,monitorConfigurado:true,pausado:false,falhasConsecutivas:0,incidentesAbertos:0,
    retriesEsgotados:0,atrasados:0,atrasoMaximoSegundos:0,ultimaObservacao:new Date(now-20000).toISOString()},
  capacidade:{pausado:false,alerta:false,bloqueio:null,medidoEm:new Date(now).toISOString(),
    eventos:10,limiteEventos:10000,outboxBytes:32768,limiteOutboxBytes:16777216,
    notificacoesBytes:204800,limiteNotificacoesBytes:67108864,bancoBytes:23000000,limiteBancoBytes:419430400},
  recursos:{versao:1,orcamentoNotificacoes:{estado:'observado',fonte:'saldo_6d4',medidoEm:new Date(now).toISOString(),
    linhasAdmitidas:0,limiteLinhas:1000,payloadAdmitidoBytes:0,limitePayloadBytes:2097152},
    wal:{estado:'observado',fonte:'pg_ls_waldir_pg_stat_wal',medidoEm:new Date(now).toISOString(),
      arquivosBytes:67108864,geradoAcumuladoBytes:100000000,estatisticasReiniciadasEm:'2026-05-07T00:00:00Z',limiteAprovadoBytes:null},
    disco:{estado:'indisponivel',fonte:'sem_fonte_suportada',medidoEm:null,livreBytes:null,totalBytes:null}},
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
  assert.deepEqual(classifySnapshot(snapshot(),now).codigos,capacityWarnings);
  for(const value of [null,{}, {...snapshot(),saude:{}}, {...snapshot(),ultimaExecucaoCron:{estado:'inventado'}}])
    assert.deepEqual(classifySnapshot(value,now).codigos,['CONTRATO_INVALIDO']);
});
test('relogio divergente e evidencia antiga nao confirmam funcionamento',()=>{
  assert.deepEqual(classifySnapshot(snapshot(),now+61000).codigos,['RELOGIO_DIVERGENTE']);
  const s=snapshot();s.saude.ultimaObservacao=new Date(now-181000).toISOString();s.ultimaExecucaoCron.fim=s.saude.ultimaObservacao;
  assert.deepEqual(classifySnapshot(s,now).codigos,expected(['EXECUCAO_ATRASADA','MONITOR_ATRASADO']));
});
test('preparacao desativada nao e apresentada como operacao saudavel',()=>{
  const s=snapshot();Object.assign(s.saude,{habilitado:false,monitorConfigurado:false,ultimaObservacao:null,falhasConsecutivas:null});
  s.fonteValida=false;s.ultimaExecucaoCron=null;
  assert.deepEqual(classifySnapshot(s,now).codigos,expected(['EXECUCAO_AUSENTE','FONTE_INVALIDA','MONITOR_ATRASADO','MONITOR_NAO_CONFIGURADO','RUNNER_DESATIVADO']));
});
test('falhas, pausas, backlog, retries e capacidade geram codigos sem dados privados',()=>{
  const s=snapshot();Object.assign(s.saude,{falhasConsecutivas:3,pausado:true,incidentesAbertos:1,retriesEsgotados:1,atrasados:1,atrasoMaximoSegundos:300});
  Object.assign(s.capacidade,{alerta:true,bloqueio:'banco_bytes'});s.ultimaExecucaoCron.estado='failed';
  const r=classifySnapshot(s,now);
  assert.deepEqual(r.codigos,expected(['BACKLOG_ATRASADO','CAPACIDADE_ALERTA','CAPACIDADE_BLOQUEADA','FALHAS_OBSERVADAS','FALHA_CRON','INCIDENTES_ABERTOS','PAUSA_ATIVA','RETRIES_ESGOTADOS']));
  assert.ok(!alertBody({...r,segredo:'password'}).includes('password'));
});
test('execucao sem desfecho nao e tratada como sucesso nem aborto comprovado',()=>{
  const s=snapshot();s.ultimaExecucaoCron={estado:'failed',inicio:null,fim:null};
  assert.deepEqual(classifySnapshot(s,now).codigos,expected(['EXECUCAO_INCERTA','FALHA_CRON']));
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
  s.capacidade.medidoEm=s.agora;s.recursos.orcamentoNotificacoes.medidoEm=s.agora;s.recursos.wal.medidoEm=s.agora;
  const r=await checkDatabase(env,async(_cmd,args,options)=>{
    assert.equal(args.at(-2),'-c');assert.equal(options.shell,false);assert.equal(options.maxBuffer,65536);
    assert.ok(!args.join(' ').includes('fixture.invalid'));
    return {stdout:JSON.stringify(s)+'\n'};
  });
  assert.deepEqual(r.codigos,capacityWarnings);
});

test('saldo 6D4 alerta em 70% e esgota por linhas OU payload, sem mudar limites',()=>{
  for (const [field,limit] of [['linhasAdmitidas',1000],['payloadAdmitidoBytes',2097152]]) {
    const s=snapshot(), b=s.recursos.orcamentoNotificacoes;
    b[field]=Math.ceil(limit*0.7)-1;
    assert.deepEqual(classifySnapshot(s,now).codigos,capacityWarnings);
    b[field]++;
    assert.deepEqual(classifySnapshot(s,now).codigos,expected(['ORCAMENTO_NOTIFICACOES_ALERTA']));
    b[field]=limit;
    assert.deepEqual(classifySnapshot(s,now).codigos,expected(['ORCAMENTO_NOTIFICACOES_ESGOTADO']));
  }
});

test('outbox e bytes saturados sao detectados mesmo com flags inconsistentes',()=>{
  for(const [field,limit] of [['eventos','limiteEventos'],['outboxBytes','limiteOutboxBytes'],
    ['notificacoesBytes','limiteNotificacoesBytes'],['bancoBytes','limiteBancoBytes']]) {
    const s=snapshot();s.capacidade[field]=s.capacidade[limit];
    assert.deepEqual(classifySnapshot(s,now).codigos,expected(['CAPACIDADE_BLOQUEADA']));
  }
});

test('amostras antigas, futuras, ausentes e falhas parciais nao viram saude',()=>{
  for(const [component,code] of [['capacidade','CAPACIDADE_MEDICAO_OBSOLETA'],
    ['orcamentoNotificacoes','ORCAMENTO_NOTIFICACOES_OBSOLETO'],['wal','WAL_MEDICAO_OBSOLETA']]) {
    for (const age of [-60001,1001]) {
      const s=snapshot(), target=s[component]??s.recursos[component];
      target.medidoEm=new Date(now+age).toISOString();
      assert.deepEqual(classifySnapshot(s,now).codigos,expected([code]));
    }
  }
  const s=snapshot();delete s.recursos;
  assert.deepEqual(classifySnapshot(s,now).codigos,['RECURSOS_CONTRATO_INVALIDO']);
  const partial=snapshot();partial.recursos.wal={estado:'falha',medidoEm:null};
  assert.deepEqual(classifySnapshot(partial,now).codigos,expected(['FALHA_OBSERVACAO_RECURSOS','WAL_MEDICAO_INDISPONIVEL']));
  partial.recursos.orcamentoNotificacoes={estado:'indisponivel',medidoEm:null};
  assert.ok(classifySnapshot(partial,now).codigos.includes('ORCAMENTO_NOTIFICACOES_INDISPONIVEL'));
});

test('WAL acumulado nao e ocupacao, reset antigo nao envelhece a amostra e disco nao e inferido',()=>{
  const s=snapshot();s.recursos.wal.geradoAcumuladoBytes=1000000000000;
  assert.deepEqual(classifySnapshot(s,now).codigos,capacityWarnings);
  for (const [key,value] of [['arquivosBytes',-1],['arquivosBytes',0],['geradoAcumuladoBytes','100'],
    ['medidoEm',null],['estatisticasReiniciadasEm',new Date(now+1001).toISOString()]]) {
    const bad=snapshot();bad.recursos.wal[key]=value;
    assert.ok(classifySnapshot(bad,now).codigos.includes('WAL_MEDICAO_INDISPONIVEL'));
  }
  s.recursos.disco={estado:'observado',livreBytes:1000000000,totalBytes:2000000000,medidoEm:s.agora};
  assert.deepEqual(classifySnapshot(s,now).codigos,expected(['RECURSOS_CONTRATO_INVALIDO']));
});

test('alertas de capacidade deduplicam e recuperam sem vazar medidas ou reativar',async()=>{
  const api=github(), s=snapshot();s.recursos.orcamentoNotificacoes.linhasAdmitidas=1000;
  const saturated=classifySnapshot(s,now);
  assert.equal(await deliverAlert(saturated,config(api)),'delivered');
  assert.equal(await deliverAlert(saturated,config(api)),'unchanged');
  assert.equal(await deliverAlert(classifySnapshot(snapshot(),now),config(api)),'delivered');
  assert.equal(api.requests.filter(r=>r.init.method==='POST').length,2);
  assert.doesNotMatch(api.comments.map(c=>c.body).join(' '),/linhasAdmitidas|2097152|100000000|arquivosBytes|password/);
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
