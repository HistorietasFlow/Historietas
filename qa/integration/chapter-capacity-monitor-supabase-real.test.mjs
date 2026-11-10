import assert from 'node:assert/strict';
import {execFileSync,spawn} from 'node:child_process';
import test from 'node:test';
import {criarInvocacaoStatusSupabase} from '../scripts/supabase-cli-invocation.mjs';
import {classifySnapshot,deliverAlert} from '../scripts/chapter-scheduling-monitor.mjs';

test('monitor de capacidade local: concorrencia, rollback, recuperacao e alerta sanitizado',async t=>{
  const invocation=criarInvocacaoStatusSupabase();
  const raw=execFileSync(invocation.comando,invocation.argumentos,{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']});
  const env=Object.fromEntries(raw.split(/\r?\n/).filter(l=>/^[A-Z0-9_]+=/.test(l)).map(l=>{
    const i=l.indexOf('='),v=l.slice(i+1).trim();return [l.slice(0,i),v.startsWith('"')?JSON.parse(v):v];
  }));
  for(const url of [env.DB_URL,env.API_URL]) assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(url).hostname),'Somente Supabase local.');
  const names=execFileSync('docker',['ps','--filter',`publish=${new URL(env.DB_URL).port}`,'--format','{{.Names}}'],{encoding:'utf8',windowsHide:true}).trim().split(/\r?\n/);
  assert.equal(names.length,1);assert.match(names[0],/^supabase_db_/);
  const args=['exec','-i',names[0],'psql','-U','postgres','-d','postgres','-XqAt','-v','ON_ERROR_STOP=1'];
  const sql=s=>execFileSync('docker',args,{input:s,encoding:'utf8',windowsHide:true,stdio:['pipe','pipe','pipe']}).trim();
  const state=()=>sql(`select jsonb_build_object('runner',(select habilitado from historietas_privado.capitulo_runner_controle),
    'saldo',(select to_jsonb(b) from historietas_privado.capitulo_notificacao_orcamento b),
    'outbox',(select md5(coalesce(jsonb_agg(to_jsonb(b) order by id)::text,'[]')) from historietas_privado.capitulo_cache_outbox b));`);
  const before=state();assert.equal(JSON.parse(before).runner,false);
  const read=()=>JSON.parse(sql(`begin isolation level repeatable read;
    set local statement_timeout='5s'; set local lock_timeout='500ms';
    grant historietas_agendamento_monitor to postgres with set true;
    set local role historietas_agendamento_monitor; select historietas_privado.snapshot_monitor_capitulos(); rollback;`));
  const initial=read();assert.equal(initial.recursos.orcamentoNotificacoes.estado,'observado');
  await t.test('observador nao espera locks de escrita nem ve saldo nao confirmado',async()=>{
    const child=spawn('docker',args,{windowsHide:true,stdio:['pipe','pipe','pipe']});
    let out='',err='',timer;
    const ended=new Promise(resolve=>child.once('exit',resolve));
    const ready=new Promise((resolve,reject)=>{
      timer=setTimeout(()=>reject(Error('Barreira local nao iniciou.')),10000);
      child.stdout.on('data',d=>{out+=d;if(out.includes('QA_READY'))resolve();});
      child.stderr.on('data',d=>{err+=d;});child.once('error',reject);
      child.once('exit',()=>{if(!out.includes('QA_READY'))reject(Error(err));});
    });
    child.stdin.write(`begin; set local idle_in_transaction_session_timeout='15s';
      select pg_advisory_xact_lock(hashtextextended('historietas:runner:capitulos:v1',0));
      update historietas_privado.capitulo_notificacao_orcamento set notificacoes_admitidas=notificacoes_admitidas+1;
      \n\\echo QA_READY\n`);
    try {
      await ready;clearTimeout(timer);
      const seen=read();
      assert.equal(seen.recursos.orcamentoNotificacoes.linhasAdmitidas,initial.recursos.orcamentoNotificacoes.linhasAdmitidas);
    } finally {clearTimeout(timer);child.stdin.end('rollback;\n');assert.equal(await ended,0,err);}
    assert.equal(state(),before);
  });
  await t.test('leituras repetidas e recuperacao nao debitem saldo nem confirmem eventos',async()=>{
    for(let i=0;i<2;i++) {
      const s=read(),r=classifySnapshot(s);
      assert.ok(r.codigos.includes('DISCO_MEDICAO_INDISPONIVEL'));
      assert.ok(r.codigos.includes('WAL_ORCAMENTO_NAO_DEFINIDO'));
      assert.ok(!r.codigos.includes('ORCAMENTO_NOTIFICACOES_INDISPONIVEL'));
    }
    assert.equal(state(),before);
  });
  await t.test('snapshot real entrega somente codigos ao transporte GitHub existente',async()=>{
    const report=classifySnapshot(read()),comments=[];
    const fetchImpl=async(url,init)=>{
      if(init.method==='POST') {comments.push({body:JSON.parse(init.body).body,user:{login:'github-actions[bot]'}});return Response.json({id:1},{status:201});}
      if(url.includes('/comments')) return Response.json(comments);
      return Response.json({state:'open',body:'<!-- historietas-agendamento-monitor:v1 -->',comments:comments.length});
    };
    const config={token:'somente-transporte-local',issue:2252,fetchImpl};
    assert.equal(await deliverAlert(report,config),'delivered');
    assert.equal(await deliverAlert(report,config),'unchanged');assert.equal(comments.length,1);
    assert.doesNotMatch(comments[0].body,/arquivosBytes|geradoAcumuladoBytes|linhasAdmitidas|SERVICE_ROLE|PGPASSWORD/);
    assert.equal(state(),before);
  });
});
