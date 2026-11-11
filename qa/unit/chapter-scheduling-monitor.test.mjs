import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import { alertBody, checkDatabase, classifySnapshot, deliverAlert, main } from '../scripts/chapter-scheduling-monitor.mjs';
import {main as runWatchdog} from '../scripts/chapter-scheduling-watchdog.mjs';
import {main as runSentry} from '../scripts/chapter-scheduling-sentry-checkin.mjs';

const now=Date.parse('2026-11-10T01:00:00Z');
const capacityWarnings=['DISCO_MEDICAO_INDISPONIVEL','WAL_ORCAMENTO_NAO_DEFINIDO'];
const expected=items=>[...capacityWarnings,...items].sort();
const snapshot=()=>({versao:1,agora:new Date(now).toISOString(),fonteValida:true,
  operacoesCache:{versao:1,estado:'observado',fonte:'ledger_6d12_saldo_6d10',medidoEm:new Date(now).toISOString(),
    protocolo:{habilitado:false,iniciado:false,pausado:true,pendencia:false},
    contagens:{admitidas:0,confirmadas:0,encerradas:0,recibos:0},integridade:{divergencias:0,gateConsistente:true},
    saldo:{habilitado:false,pausado:true,limite:null,consumidas:0},
    retencao:{politica:'integral_sem_purga',relacoesBytes:32768,limiteAprovadoBytes:null}},
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

const proofEnv={PGUSER:'historietas_agendamento_monitor',PGHOST:'fixture.invalid',PGDATABASE:'postgres',
  PGSSLMODE:'verify-full',PGSSLROOTCERT:'fixture.crt',GITHUB_TOKEN:'synthetic',AGENDAMENTO_ALERT_ISSUE:'123',
  AGENDAMENTO_MONITOR_COMPROVAR_EXECUCAO:'true',AGENDAMENTO_MONITOR_TESTE:'false'};
function freshSnapshot() {
  const s=snapshot(), stamp=new Date().toISOString();
  s.agora=stamp;s.saude.ultimaObservacao=stamp;s.saude.habilitado=false;
  s.capacidade.medidoEm=stamp;s.recursos.orcamentoNotificacoes.medidoEm=stamp;
  s.recursos.wal.medidoEm=stamp;s.operacoesCache.medidoEm=stamp;
  return s;
}

test('prova v2 separa execucao de saude sem remover alerta; modo legado continua falhando',async()=>{
  const api=github();let reads=0;
  const run=async(cmd,args,options)=>{
    reads++;assert.equal(cmd,'psql');assert.equal(options.shell,false);
    assert.match(args.at(-1),/^begin isolation level repeatable read read only;/);
    assert.match(args.at(-1),/snapshot_monitor_capitulos\(\); rollback;$/);
    return {stdout:JSON.stringify(freshSnapshot())};
  };
  assert.equal(await main(proofEnv,{run,fetchImpl:api.fetchImpl}),0);
  assert.equal(reads,1);
  const codes=JSON.parse(api.comments[0].body.split('\n')[1]).codigos;
  for (const code of [...capacityWarnings,'RUNNER_DESATIVADO']) assert.ok(codes.includes(code));
  assert.match(api.comments[0].body,/Alerta operacional/);
  assert.equal(await main({...proofEnv,AGENDAMENTO_MONITOR_COMPROVAR_EXECUCAO:'false'},
    {run,fetchImpl:api.fetchImpl}),1);
  assert.equal(api.comments.length,1); // Nao emite falsa recuperacao da saude.
});

test('SQL falho, timeout, JSON invalido, contrato incompleto e evidencia obsoleta nunca comprovam execucao',async()=>{
  for (const run of [async()=>{throw Error('timeout senha');},async()=>({stdout:'{}'}),
    async()=>({stdout:'JSON invalido'}),
    ...[s=>delete s.recursos,s=>s.saude.habilitado='true',s=>s.agora='2000-01-01T00:00:00Z',
      s=>s.operacoesCache.medidoEm='2000-01-01T00:00:00Z',s=>s.recursos.wal.limiteAprovadoBytes=123]
      .map(mutate=>async()=>{const s=freshSnapshot();mutate(s);return {stdout:JSON.stringify(s)};})]) {
    const api=github();assert.equal(await main(proofEnv,{run,fetchImpl:api.fetchImpl}),1);
    assert.equal(api.comments.length,1);assert.doesNotMatch(api.comments[0].body,/senha|JSON invalido/);
  }
  const api=github();
  assert.equal(await main({...proofEnv,PGUSER:'postgres'},
    {run:async()=>assert.fail('Nao conectar com privilegio maior'),fetchImpl:api.fetchImpl}),1);
});

test('teste de e-mail nunca prova execucao mesmo quando entrega tem sucesso',async()=>{
  const api=github();
  assert.equal(await main({...proofEnv,AGENDAMENTO_MONITOR_TESTE:'true'},
    {run:async()=>assert.fail('Teste nao consulta SQL'),fetchImpl:api.fetchImpl}),1);
  assert.match(api.comments[0].body,/TESTE_ENTREGA/);
});

test('entrega falha ou resposta perdida nao confirma; nova leitura reconcilia e recupera sem duplicar alerta',async()=>{
  let reads=0;
  const run=async()=>{reads++;return {stdout:JSON.stringify(freshSnapshot())};};
  assert.equal(await main(proofEnv,{run,fetchImpl:async()=>{throw Error('rede');}}),2);
  const api=github([],{lost:true});
  assert.equal(await main(proofEnv,{run,fetchImpl:api.fetchImpl}),2);
  assert.equal(api.comments.length,1);
  assert.equal(await main(proofEnv,{run,fetchImpl:api.fetchImpl}),0);
  assert.equal(reads,3);assert.equal(api.requests.filter(r=>r.init.method==='POST').length,1);
});

test('observacao concorrente obsoleta nao recebe prova de entrega nem apaga alerta mais novo',async()=>{
  const api=github();let unblock;
  const pending=main(proofEnv,{run:()=>new Promise(resolve=>{unblock=resolve;}),fetchImpl:api.fetchImpl});
  const newer={versao:1,observadoEm:new Date(Date.now()+10000).toISOString(),codigos:['PAUSA_ATIVA']};
  assert.equal(await deliverAlert(newer,config(api)),'delivered');
  unblock({stdout:JSON.stringify(freshSnapshot())});
  assert.equal(await pending,2);
  assert.equal(api.comments.length,1);assert.match(api.comments[0].body,/PAUSA_ATIVA/);
});

test('cadeia SQL/entrega -> job v2 -> watchdog -> Sentry distingue saude ruim de falha de verificacao',async()=>{
  for (const sqlFailure of [true,false]) {
    const api=github(), clock=Date.now()+1000, stamp=new Date(clock).toISOString();
    const exit=await main(proofEnv,{fetchImpl:api.fetchImpl,run:async()=>{
      if (sqlFailure) throw Error('conexao interrompida');
      return {stdout:JSON.stringify(freshSnapshot())};
    }});
    const conclusion=exit===0?'success':'failure';
    const fetchImpl=async(url,options)=>{
      if(url.includes('/attempts/')) return Response.json({total_count:1,jobs:[{
        name:'verificar',run_id:7,run_attempt:1,status:'completed',conclusion,
        steps:[{name:'Comprovar observacao SQL e entrega (v2)',status:'completed',conclusion,
          started_at:stamp,completed_at:stamp}]}]});
      if(url.includes('/runs?')) return Response.json({total_count:1,workflow_runs:[{
        id:7,run_attempt:1,head_branch:'main',event:'workflow_dispatch',status:'completed',
        conclusion,created_at:stamp,updated_at:stamp}]});
      if(url.includes('/workflows/')) return Response.json({state:'active',path:'.github/workflows/agendamento-monitor.yml'});
      return api.fetchImpl(url,options);
    };
    const sent=[];
    const env={...proofEnv,GITHUB_ACTIONS:'true',GITHUB_EVENT_NAME:'schedule',GITHUB_REF:'refs/heads/main',
      GITHUB_REPOSITORY:'HistorietasFlow/Historietas',
      GITHUB_WORKFLOW_REF:'HistorietasFlow/Historietas/.github/workflows/agendamento-watchdog.yml@refs/heads/main',
      AGENDAMENTO_MONITOR_ESPERADO_DESDE:new Date(clock-10000).toISOString(),AGENDAMENTO_MONITOR_MAX_INTERVALO_MS:'600000',
      AGENDAMENTO_SENTRY_CHECKIN_URL:'https://o123.ingest.us.sentry.io/api/456/crons/watchdog/11111111111111111111111111111111/'};
    assert.equal(await runSentry(env,{watchdogMain:value=>runWatchdog(value,{now:clock,fetchImpl}),
      fetchImpl:async url=>{sent.push(new URL(url).searchParams.get('status'));return new Response(null,{status:200});}}),sqlFailure?1:0);
    assert.deepEqual(sent,['in_progress',sqlFailure?'error':'ok']);
    assert.match(api.comments[0].body,/Alerta operacional/);
    assert.match(api.comments[0].body,sqlFailure?/BANCO_INDISPONIVEL/:/RUNNER_DESATIVADO/);
    assert.equal(api.comments.filter(c=>c.body.startsWith('<!-- historietas-agendamento-monitor:v1 -->')).length,1);
  }
});

test('saude valida, sem inferir sucesso de uma resposta vazia',()=>{
  assert.deepEqual(classifySnapshot(snapshot(),now).codigos,capacityWarnings);
  for(const value of [null,{}, {...snapshot(),saude:{}}, {...snapshot(),ultimaExecucaoCron:{estado:'inventado'}}])
    assert.deepEqual(classifySnapshot(value,now).codigos,['CONTRATO_INVALIDO']);
});

test('runner desativado e capacidade nao certificada preservam os alertas mesmo com snapshot valido',()=>{
  const value=snapshot();value.saude.habilitado=false;
  assert.deepEqual(classifySnapshot(value,now).codigos,expected(['RUNNER_DESATIVADO']));
  value.saude.habilitado=true;
  assert.deepEqual(classifySnapshot(value,now).codigos,capacityWarnings);
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
  s.capacidade.medidoEm=s.agora;s.recursos.orcamentoNotificacoes.medidoEm=s.agora;s.recursos.wal.medidoEm=s.agora;s.operacoesCache.medidoEm=s.agora;
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

test('intencao sem recibo sinaliza incerteza e gate fechado, nunca motivo de aborto inferido',()=>{
  const s=snapshot(),o=s.operacoesCache;
  Object.assign(o.protocolo,{habilitado:true,iniciado:true,pendencia:true});o.contagens.admitidas=1;
  Object.assign(o.saldo,{habilitado:true,pausado:false,limite:1});
  const r=classifySnapshot(s,now);
  assert.deepEqual(r.codigos,expected(['CACHE_OPERACAO_SEM_RECIBO','CACHE_ADMISSAO_BLOQUEADA','CACHE_RETENCAO_SEM_ORCAMENTO']));
  assert.doesNotMatch(JSON.stringify(r),/usuario|sessao|aborto_confirmado|timeout_confirmado|operacaoId/);
});
test('recibo confirmado nao e entrega HTTP ou ACK e preserva alerta de retencao',()=>{
  const s=snapshot(),o=s.operacoesCache;
  o.contagens.confirmadas=o.contagens.recibos=1;o.protocolo.iniciado=true;
  Object.assign(o.saldo,{habilitado:true,pausado:false,limite:1});
  assert.deepEqual(classifySnapshot(s,now).codigos,expected(['CACHE_ADMISSAO_BLOQUEADA','CACHE_RETENCAO_SEM_ORCAMENTO']));
  o.contagens.confirmadas=o.contagens.recibos=0;o.contagens.encerradas=1;
  assert.deepEqual(classifySnapshot(s,now).codigos,expected(['CACHE_ADMISSAO_BLOQUEADA','CACHE_RETENCAO_SEM_ORCAMENTO']));
});
test('gate, ponteiro e recibos divergentes nao sao declarados saudaveis',()=>{
  for(const mutate of [o=>o.protocolo.pendencia=true,o=>o.contagens.admitidas=2,
    o=>o.contagens.confirmadas=1,o=>o.integridade.gateConsistente=false,o=>o.integridade.divergencias=1]){
    const s=snapshot();mutate(s.operacoesCache);
    assert.ok(classifySnapshot(s,now).codigos.includes('CACHE_INTEGRIDADE_DIVERGENTE'));
  }
});
test('fonte ausente, erro e snapshot anterior nao escondem operacoes do consumidor',()=>{
  for(const o of [undefined,null,{versao:1,estado:'falha'},{versao:1,estado:'indisponivel'}]){
    const s=snapshot();s.operacoesCache=o;
    assert.deepEqual(classifySnapshot(s,now).codigos,expected(['CACHE_OBSERVACAO_INDISPONIVEL']));
  }
});
test('fonte obsoleta/futura e limites fisicos inventados sao rejeitados',()=>{
  for(const age of [-60001,1001]){
    const s=snapshot();s.operacoesCache.medidoEm=new Date(now+age).toISOString();
    assert.deepEqual(classifySnapshot(s,now).codigos,expected(['CACHE_OBSERVACAO_OBSOLETA']));
  }
  for(const mutate of [o=>o.retencao.limiteAprovadoBytes=1,o=>o.saldo.consumidas=-1,
    o=>o.contagens.recibos=Number.MAX_SAFE_INTEGER+1,o=>o.retencao.politica='purgar',o=>o.fonte='estimativa']){
    const s=snapshot();mutate(s.operacoesCache);
    assert.deepEqual(classifySnapshot(s,now).codigos,expected(['CACHE_CONTRATO_INVALIDO']));
  }
});
test('saldo nao configurado, pausado ou esgotado nao significa fila vazia',()=>{
  const s=snapshot(),o=s.operacoesCache;o.protocolo.habilitado=true;o.protocolo.pausado=false;
  assert.deepEqual(classifySnapshot(s,now).codigos,expected(['CACHE_SALDO_INDISPONIVEL']));
  Object.assign(o.saldo,{habilitado:true,limite:2});
  assert.deepEqual(classifySnapshot(s,now).codigos,expected(['CACHE_SALDO_BLOQUEADO']));
  o.saldo.consumidas=2;
  assert.deepEqual(classifySnapshot(s,now).codigos,expected(['CACHE_SALDO_ESGOTADO']));
});
test('alerta independente de cache deduplica e recupera, sem IDs ou medidas externas',async()=>{
  const api=github(),s=snapshot(),o=s.operacoesCache;
  Object.assign(o.protocolo,{habilitado:true,iniciado:true,pendencia:true});o.contagens.admitidas=1;
  const r=classifySnapshot(s,now);
  assert.equal(await deliverAlert(r,config(api)),'delivered');
  assert.equal(await deliverAlert(r,config(api)),'unchanged');
  assert.equal(await deliverAlert(classifySnapshot(snapshot(),now),config(api)),'delivered');
  assert.equal(api.requests.filter(r=>r.init.method==='POST').length,2);
  assert.doesNotMatch(api.comments.map(c=>c.body).join(' '),/relacoesBytes|admitidas|session_id|usuario_id|32768/);
});
