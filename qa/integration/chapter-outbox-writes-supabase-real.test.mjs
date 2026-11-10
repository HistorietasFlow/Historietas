import assert from 'node:assert/strict';
import {execFile,execFileSync,spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import test from 'node:test';
import {createClient} from '@supabase/supabase-js';
import {criarInvocacaoStatusSupabase} from '../scripts/supabase-cli-invocation.mjs';

test('outbox local: registro sem reescritas, concorrencia e recuperacao',async t=>{
  const inv=criarInvocacaoStatusSupabase();
  const raw=execFileSync(inv.comando,inv.argumentos,{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']});
  const env=Object.fromEntries(raw.split(/\r?\n/).filter(l=>/^[A-Z0-9_]+=/.test(l)).map(l=>{
    const i=l.indexOf('='),v=l.slice(i+1).trim();return [l.slice(0,i),v.startsWith('"')?JSON.parse(v):v];
  }));
  for(const url of [env.API_URL,env.DB_URL]) assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(url).hostname),'Somente banco local.');
  assert.equal(new URL(env.API_URL).protocol,'http:');
  assert.equal(new URL(env.DB_URL).protocol,'postgresql:');
  const names=execFileSync('docker',['ps','--filter',`publish=${new URL(env.DB_URL).port}`,'--format','{{.Names}}'],{encoding:'utf8',windowsHide:true}).trim().split(/\r?\n/);
  assert.equal(names.length,1);assert.match(names[0],/^supabase_db_/);
  const args=['exec','-i',names[0],'psql','-U','postgres','-d','postgres','-XqAt','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose'];
  const sql=s=>execFileSync('docker',args,{input:s,encoding:'utf8',windowsHide:true,stdio:['pipe','pipe','pipe']}).trim();
  const asyncSql=s=>new Promise((resolve,reject)=>{
    const child=execFile('docker',args,{encoding:'utf8',windowsHide:true},(err,out,stderr)=>err?reject(Error(stderr)):resolve(out.trim()));child.stdin.end(s);
  });
  const id=randomUUID(),lease=randomUUID(),tag=`qa_6d8_${randomUUID().replaceAll('-','')}`;
  const original=sql(`select md5(coalesce(jsonb_agg(to_jsonb(b) order by id)::text,'[]')) from historietas_privado.capitulo_cache_outbox b;`);
  const immutable=()=>sql(`select md5(coalesce(jsonb_agg(to_jsonb(b) order by id)::text,'[]')) from historietas_privado.capitulo_cache_outbox b where id<>'${id}';`);
  const client=key=>createClient(env.API_URL,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const admin=client(env.SERVICE_ROLE_KEY),anon=client(env.ANON_KEY);
  const register=(currentLease=lease)=>admin.rpc('registrar_solicitacao_cache_capitulo',{p_id:id,p_lease_id:currentLease});
  const check=r=>{assert.equal(r.error,null,r.error?.code);return r.data;};
  const reset=()=>sql(`begin; update historietas_privado.capitulo_cache_outbox set solicitada_em=null,lease_id='${lease}',lease_ate=clock_timestamp()+interval '5 minutes' where id='${id}'; delete from historietas_privado.${tag}; commit;`);
  const writes=()=>Number(sql(`select count(*) from historietas_privado.${tag};`));
  async function barrier(source){
    const child=spawn('docker',args,{windowsHide:true,stdio:['pipe','pipe','pipe']});let out='',err='',timer;
    const ended=new Promise(resolve=>child.once('exit',resolve));
    const ready=new Promise((resolve,reject)=>{
      timer=setTimeout(()=>reject(Error('Barreira local indisponivel.')),10000);
      child.stdout.on('data',d=>{out+=d;if(out.includes('QA_READY'))resolve();});child.stderr.on('data',d=>{err+=d;});child.once('error',reject);
      child.once('exit',()=>{if(!out.includes('QA_READY'))reject(Error(err));});
    });
    child.stdin.write(`${source}\n\\echo QA_READY\n`);
    try{await ready;}catch(error){child.stdin.end('rollback;\n');await ended;throw error;}finally{clearTimeout(timer);}
    return {async finish(end='rollback;'){child.stdin.end(`${end}\n`);return {code:await ended,out,err};}};
  }
  t.after(()=>{
    sql(`drop trigger if exists ${tag} on historietas_privado.capitulo_cache_outbox; drop function if exists historietas_privado.${tag}(); drop table if exists historietas_privado.${tag};`);
    assert.equal(immutable(),original,'Pendencias, IDs e leases anteriores preservados.');
    assert.equal(sql(`select count(*) from historietas_privado.capitulo_cache_outbox where id='${id}';`),'1','Evento da fixture tambem permanece, sem ACK/purga.');
    assert.equal(sql('select habilitado from historietas_privado.capitulo_runner_controle;'),'f');
  });
  sql(`begin;
    create table historietas_privado.${tag}(id bigint generated always as identity);
    revoke all on table historietas_privado.${tag} from public,anon,authenticated,service_role;
    create function historietas_privado.${tag}() returns trigger language plpgsql set search_path='' as $$
      begin if new.id='${id}'::uuid then insert into historietas_privado.${tag} default values; end if; return new; end $$;
    revoke all on function historietas_privado.${tag}() from public,anon,authenticated,service_role;
    create trigger ${tag} after update on historietas_privado.capitulo_cache_outbox for each row execute function historietas_privado.${tag}();
    insert into historietas_privado.capitulo_cache_outbox(id,capitulo_id,revisao_agendada,obra_id,publicado_em,lease_id,lease_ate)
      values('${id}',gen_random_uuid(),1,gen_random_uuid(),clock_timestamp(),'${lease}',clock_timestamp()+interval '5 minutes'); commit;`);
  await t.test('vinte consumidores concorrentes: todos recebem true, apenas um UPDATE',async()=>{
    for(const r of await Promise.all(Array.from({length:20},()=>register())))assert.equal(check(r),true);
    assert.equal(writes(),1);
    const before=sql(`select ctid::text||solicitada_em::text from historietas_privado.capitulo_cache_outbox where id='${id}';`);
    assert.equal(check(await register()),true);assert.equal(writes(),1);
    assert.equal(sql(`select ctid::text||solicitada_em::text from historietas_privado.capitulo_cache_outbox where id='${id}';`),before,'Resposta perdida nao reescreve a tupla.');
  });
  await t.test('rollback e timeout nao confirmam solicitacao; retry e valido',async()=>{
    reset();
    await assert.rejects(asyncSql(`begin; select public.registrar_solicitacao_cache_capitulo('${id}','${lease}'); set local statement_timeout='100ms'; select pg_sleep(1); commit;`),/57014/);
    assert.equal(writes(),0);assert.equal(sql(`select solicitada_em is null from historietas_privado.capitulo_cache_outbox where id='${id}';`),'t');
    assert.equal(check(await register()),true);assert.equal(writes(),1);
  });
  await t.test('lease substituido enquanto consumidor espera nao e aceito',async()=>{
    reset();const next=randomUUID();
    const a=await barrier(`begin; update historietas_privado.capitulo_cache_outbox set lease_id='${next}' where id='${id}';`);
    const pending=Promise.resolve(register());
    try {
      const deadline=Date.now()+10000;let waiting=false;
      while(Date.now()<deadline){
        waiting=(await asyncSql(`select exists(select 1 from pg_stat_activity where wait_event_type='Lock'
          and query like '%registrar_solicitacao_cache_capitulo%');`))==='t';
        if(waiting)break;
        await new Promise(resolve=>setTimeout(resolve,25));
      }
      assert.ok(waiting,'Consumidor real aguardando o lock do lease.');
    } finally {assert.equal((await a.finish('commit;')).code,0);}
    assert.equal((await pending).error?.code,'55000');
    assert.equal(check(await register(next)),true);assert.equal(writes(),2);
    assert.equal((await register()).error?.code,'55000');
  });
  await t.test('snapshot antigo falha por serializacao sem reaplicar escrita',async()=>{
    reset();const old=await barrier(`begin isolation level repeatable read; select solicitada_em from historietas_privado.capitulo_cache_outbox where id='${id}';`);
    assert.equal(check(await register()),true);
    const ended=await old.finish(`select public.registrar_solicitacao_cache_capitulo('${id}','${lease}'); commit;`);
    assert.notEqual(ended.code,0);assert.match(ended.err,/40001/);assert.equal(writes(),1);
  });
  await t.test('lease expirado e anon nao passam; falhas nao escrevem',async()=>{
    sql(`update historietas_privado.capitulo_cache_outbox set lease_ate=clock_timestamp()-interval '1 second' where id='${id}';`);
    const count=writes();assert.equal((await register()).error?.code,'55000');
    assert.equal((await anon.rpc('registrar_solicitacao_cache_capitulo',{p_id:id,p_lease_id:lease})).error?.code,'42501');
    assert.equal(writes(),count);assert.equal(immutable(),original);
  });
});
