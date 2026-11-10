import assert from 'node:assert/strict';
import {execFile,execFileSync,spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import test from 'node:test';
import {createClient} from '@supabase/supabase-js';
import {criarInvocacaoStatusSupabase} from '../scripts/supabase-cli-invocation.mjs';

test('saldo local da outbox: concorrencia, pausa, CAS, rollback e recuperacao',async t=>{
  const inv=criarInvocacaoStatusSupabase();
  const output=execFileSync(inv.comando,inv.argumentos,{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']});
  const env=Object.fromEntries(output.split(/\r?\n/).filter(l=>/^[A-Z0-9_]+=/.test(l)).map(l=>{
    const i=l.indexOf('='),v=l.slice(i+1).trim();return [l.slice(0,i),v.startsWith('"')?JSON.parse(v):v];
  }));
  for(const [value,protocol] of [[env.API_URL,'http:'],[env.DB_URL,'postgresql:']]) {
    const url=new URL(value);assert.equal(url.protocol,protocol);assert.ok(['localhost','127.0.0.1','[::1]'].includes(url.hostname));
  }
  const names=execFileSync('docker',['ps','--filter',`publish=${new URL(env.DB_URL).port}`,'--format','{{.Names}}'],{encoding:'utf8',windowsHide:true}).trim().split(/\r?\n/);
  assert.equal(names.length,1);assert.match(names[0],/^supabase_db_/);
  const args=['exec','-i',names[0],'psql','-U','postgres','-d','postgres','-XqAt','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose'];
  const sql=input=>execFileSync('docker',args,{input,encoding:'utf8',windowsHide:true,stdio:['pipe','pipe','pipe']}).trim();
  const asyncSql=input=>new Promise((resolve,reject)=>{
    const c=execFile('docker',args,{encoding:'utf8',windowsHide:true},(err,out,stderr)=>err?reject(Error(stderr)):resolve(out.trim()));c.stdin.end(input);
  });
  const literal=value=>`'${JSON.stringify(value).replaceAll("'","''")}'::jsonb`;
  const rows=()=>JSON.parse(sql("select coalesce(jsonb_agg(to_jsonb(o) order by id),'[]') from historietas_privado.capitulo_cache_outbox o;"));
  const balance=()=>JSON.parse(sql('select to_jsonb(b) from historietas_privado.capitulo_cache_orcamento b;'));
  const before=rows(),original=balance();
  const history=JSON.parse(sql("select coalesce(jsonb_agg(to_jsonb(r) order by revisao_esperada),'[]') from historietas_privado.capitulo_cache_orcamento_retomadas r;"));
  assert.equal(original.habilitado,false);assert.equal(original.limite,null);assert.equal(original.consumidas,0);assert.equal(history.length,0);
  assert.equal(sql('select habilitado from historietas_privado.capitulo_runner_controle;'),'f');
  const ids=[randomUUID(),randomUUID()];
  const client=key=>createClient(env.API_URL,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const admin=client(env.SERVICE_ROLE_KEY),anon=client(env.ANON_KEY);
  const check=r=>{assert.equal(r.error,null,r.error?.code);return r.data;};
  const claim=async()=>check(await admin.rpc('reivindicar_cache_capitulos',{p_limite:5}));
  const fixtureRevisions=new Set();
  const resume=(revision,limit)=>{
    fixtureRevisions.add(revision);
    return `select historietas_privado.retomar_orcamento_cache_capitulos(${revision},${limit},'capacidade_reavaliada');`;
  };
  t.after(()=>{
    // Somente fixtures locais. Restaurar tambem leases/contadores anteriores;
    // nao apagar nenhuma linha da outbox, inclusive os dois eventos novos.
    sql(`begin;
      update historietas_privado.capitulo_cache_outbox o set lease_id=s.lease_id,lease_ate=s.lease_ate,tentativas=s.tentativas,solicitada_em=s.solicitada_em
        from jsonb_populate_recordset(null::historietas_privado.capitulo_cache_outbox,${literal(before)}) s where o.id=s.id;
      update historietas_privado.capitulo_cache_orcamento b set habilitado=s.habilitado,limite=s.limite,consumidas=s.consumidas,pausado=s.pausado,revisao=s.revisao
        from jsonb_populate_record(null::historietas_privado.capitulo_cache_orcamento,${literal(original)}) s;
      delete from historietas_privado.capitulo_cache_orcamento_retomadas where revisao_esperada in (${[...fixtureRevisions].join(',')});
      commit;`);
    assert.deepEqual(rows().filter(r=>!ids.includes(r.id)),before);
    assert.equal(rows().filter(r=>ids.includes(r.id)).length,2);
    assert.deepEqual(balance(),original);
    assert.equal(sql('select habilitado from historietas_privado.capitulo_runner_controle;'),'f');
  });
  sql(`begin;
    update historietas_privado.capitulo_cache_outbox set lease_id=gen_random_uuid(),lease_ate=clock_timestamp()+interval '1 hour';
    insert into historietas_privado.capitulo_cache_outbox(id,capitulo_id,revisao_agendada,obra_id,publicado_em)
      values ${ids.map(id=>`('${id}',gen_random_uuid(),1,gen_random_uuid(),clock_timestamp())`).join(',')};
    ${resume(1,1)}
    update historietas_privado.capitulo_cache_orcamento set habilitado=true;
    commit;`);
  let first,second;
  await t.test('Data API nega saldo direto, retomada e reivindicacao anonima',async()=>{
    assert.equal((await anon.rpc('reivindicar_cache_capitulos',{p_limite:1})).error?.code,'42501');
    for(const who of [anon,admin])assert.ok((await who.schema('historietas_privado').from('capitulo_cache_orcamento').select('*')).error);
    await assert.rejects(asyncSql(`set role service_role;${resume(2,2)}`),/42501/);
  });
  await t.test('duas chamadas reais disputam ultima unidade; somente uma recebe um evento',async()=>{
    const results=await Promise.all([claim(),claim()]);
    const batches=results.filter(Array.isArray),blocked=results.filter(r=>!Array.isArray(r));
    assert.equal(batches.length,1);assert.equal(batches[0].length,1);first=batches[0][0];
    assert.deepEqual(blocked,[{estado:'orcamento_esgotado'}]);
    assert.equal(balance().consumidas,1);assert.equal(balance().pausado,true);
    const stamp=sql('select ctid from historietas_privado.capitulo_cache_orcamento;');
    assert.deepEqual(await claim(),{estado:'orcamento_esgotado'});
    assert.equal(sql('select ctid from historietas_privado.capitulo_cache_orcamento;'),stamp);
  });
  await t.test('registro idempotente continua possivel durante saturacao, sem novo debito',async()=>{
    const params={p_id:first.id,p_lease_id:first.leaseId};
    assert.equal(check(await admin.rpc('registrar_solicitacao_cache_capitulo',params)),true);
    const stamp=sql(`select ctid::text||solicitada_em::text from historietas_privado.capitulo_cache_outbox where id='${first.id}';`);
    assert.equal(check(await admin.rpc('registrar_solicitacao_cache_capitulo',params)),true);
    assert.equal(sql(`select ctid::text||solicitada_em::text from historietas_privado.capitulo_cache_outbox where id='${first.id}';`),stamp);
    assert.equal(balance().consumidas,1);
  });
  await t.test('CAS e retry administrativo nao reaplicam limite nem removem pausa posterior',async()=>{
    assert.equal(JSON.parse(sql(resume(1,1))).estado,'ja_registrado');assert.equal(balance().pausado,true);
    await assert.rejects(asyncSql(resume(2,2)),/55000/);
    assert.equal(JSON.parse(sql(resume(balance().revisao,2))).estado,'retomada_registrada');
    assert.equal(balance().consumidas,1);
  });
  await t.test('snapshot antigo nao reutiliza saldo apos outra reivindicacao',async()=>{
    const process=spawn('docker',args,{windowsHide:true,stdio:['pipe','pipe','pipe']});let out='',err='';
    const ended=new Promise(resolve=>process.once('exit',resolve));
    let timer;
    const ready=new Promise((resolve,reject)=>{
      timer=setTimeout(()=>reject(Error('Barreira local indisponivel.')),10000);
      process.stdout.on('data',d=>{out+=d;if(out.includes('BUDGET_READY'))resolve();});process.stderr.on('data',d=>{err+=d;});process.once('error',reject);
      process.once('exit',()=>{if(!out.includes('BUDGET_READY'))reject(Error(err||'Transacao encerrou antes da barreira.'));});
    });
    process.stdin.write("begin isolation level repeatable read;select consumidas from historietas_privado.capitulo_cache_orcamento;\n\\echo BUDGET_READY\n");
    try{await ready;second=(await claim())[0];assert.ok(second);}
    finally{clearTimeout(timer);process.stdin.end('select public.reivindicar_cache_capitulos(1);commit;\n');}
    assert.notEqual(await ended,0);assert.match(err,/40001/);assert.equal(balance().consumidas,2);
  });
  await t.test('timeout reverte saldo e lease; retry posterior recupera mesmo ID sem apagar solicitacao',async()=>{
    sql(resume(balance().revisao,3));
    sql(`update historietas_privado.capitulo_cache_outbox set lease_ate=clock_timestamp()-interval '1 second' where id='${first.id}';`);
    const row=()=>rows().find(r=>r.id===first.id),beforeTimeout=row();
    await assert.rejects(asyncSql("begin;select public.reivindicar_cache_capitulos(1);set local statement_timeout='100ms';select pg_sleep(1);commit;"),/57014/);
    assert.deepEqual(row(),beforeTimeout);assert.equal(balance().consumidas,2);
    const recovered=await claim();assert.equal(recovered.length,1);assert.equal(recovered[0].id,first.id);
    assert.notEqual(recovered[0].leaseId,first.leaseId);assert.equal(row().solicitada_em,beforeTimeout.solicitada_em);
    assert.equal(balance().consumidas,3);assert.equal(balance().pausado,true);
    assert.equal((await admin.rpc('registrar_solicitacao_cache_capitulo',{p_id:first.id,p_lease_id:first.leaseId})).error?.code,'55000');
    assert.equal(check(await admin.rpc('registrar_solicitacao_cache_capitulo',{p_id:first.id,p_lease_id:recovered[0].leaseId})),true);
  });
  await t.test('retomadas concorrentes equivalentes registram uma unica ampliacao',async()=>{
    const revision=balance().revisao;
    const result=(await Promise.all([asyncSql(resume(revision,4)),asyncSql(resume(revision,4))])).map(s=>JSON.parse(s).estado).sort();
    assert.deepEqual(result,['ja_registrado','retomada_registrada']);assert.equal(balance().limite,4);assert.equal(balance().consumidas,3);
    assert.equal(balance().revisao,revision+1);
  });
});
