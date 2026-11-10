import assert from 'node:assert/strict';
import {execFileSync,execFile,spawn} from 'node:child_process';
import {randomUUID,randomBytes} from 'node:crypto';
import test from 'node:test';
import {createClient} from '@supabase/supabase-js';
import {criarInvocacaoStatusSupabase} from '../scripts/supabase-cli-invocation.mjs';

test('operacoes privadas locais: intencao, recibo atomico, concorrencia e reconciliacao',async t=>{
  const inv=criarInvocacaoStatusSupabase();
  const output=execFileSync(inv.comando,inv.argumentos,{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']});
  const env=Object.fromEntries(output.split(/\r?\n/).filter(l=>/^[A-Z0-9_]+=/.test(l)).map(l=>{
    const i=l.indexOf('='),v=l.slice(i+1).trim();return [l.slice(0,i),v.startsWith('"')?JSON.parse(v):v];
  }));
  for(const [value,protocol] of [[env.API_URL,'http:'],[env.DB_URL,'postgresql:']]){
    const url=new URL(value);assert.equal(url.protocol,protocol);assert.ok(['localhost','127.0.0.1','[::1]'].includes(url.hostname));
  }
  const names=execFileSync('docker',['ps','--filter',`publish=${new URL(env.DB_URL).port}`,'--format','{{.Names}}'],{encoding:'utf8',windowsHide:true}).trim().split(/\r?\n/);
  assert.equal(names.length,1);assert.match(names[0],/^supabase_db_/);
  const args=['exec','-i',names[0],'psql','-U','postgres','-d','postgres','-XqAt','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose'];
  const sql=input=>execFileSync('docker',args,{input,encoding:'utf8',windowsHide:true,stdio:['pipe','pipe','pipe']}).trim();
  const asyncSql=input=>new Promise((resolve,reject)=>{
    const c=execFile('docker',args,{encoding:'utf8',windowsHide:true},(error,out,err)=>error?reject(Error(err)):resolve(out.trim()));c.stdin.end(input);
  });
  const literal=value=>`'${JSON.stringify(value).replaceAll("'","''")}'::jsonb`;
  const all=table=>JSON.parse(sql(`select coalesce(jsonb_agg(to_jsonb(r) order by to_jsonb(r)::text),'[]') from historietas_privado.${table} r;`));
  const rows=()=>all('capitulo_cache_outbox'),budget=()=>all('capitulo_cache_orcamento')[0],gate=()=>all('capitulo_cache_operacoes_controle')[0];
  const originalRows=rows(),originalBudget=budget(),originalGate=gate();
  const tables=['capitulo_cache_operacoes','capitulo_cache_operacoes_recibos','capitulo_cache_operacoes_eventos','capitulo_cache_operacoes_retomadas'];
  const previous=Object.fromEntries(tables.map(name=>[name,all(name)]));
  assert.equal(originalGate.habilitado,false);assert.equal(originalGate.iniciado,false);assert.equal(originalGate.pendente,null);
  assert.equal(originalBudget.habilitado,false);assert.equal(sql('select habilitado from historietas_privado.capitulo_runner_controle;'),'f');
  const user=randomUUID(),session=randomUUID(),ids=[randomUUID(),randomUUID()],operations=[],resumes=new Set();
  const params=id=>`'${id}','${user}','${session}',1`;
  const call=(name,id)=>`select historietas_privado.${name}(${params(id)});`;
  const result=(name,id)=>JSON.parse(sql(call(name,id)));
  const newId=()=>{const id=randomUUID();operations.push(id);return id;};
  const resume=()=>{const rev=gate().revisao;resumes.add(rev);return `select historietas_privado.retomar_operacoes_cache(${rev},'causa_corrigida');`;};
  const admit=()=>{sql(resume());const id=newId();assert.equal(result('admitir_operacao_cache',id).estado,'admitida');return id;};
  async function hold(source){
    const child=spawn('docker',args,{windowsHide:true,stdio:['pipe','pipe','pipe']});let out='',err='',timer;
    const ended=new Promise((resolve,reject)=>{child.once('exit',resolve);child.once('error',reject);});
    const ready=new Promise((resolve,reject)=>{
      timer=setTimeout(()=>reject(Error('Barreira local indisponivel.')),15000);
      child.stdout.on('data',d=>{out+=d;if(out.includes('RECOVERY_READY'))resolve();});child.stderr.on('data',d=>{err+=d;});
      child.once('error',reject);child.once('exit',()=>{if(!out.includes('RECOVERY_READY'))reject(Error('Conexao encerrou antes da barreira.'));});
    });
    child.stdin.write(`${source}\n\\echo RECOVERY_READY\n`);
    try{await ready;}catch(error){child.stdin.end('rollback;\n');await ended;throw error;}finally{clearTimeout(timer);}
    return {output:()=>out,async finish(command='rollback;'){child.stdin.end(`${command}\n`);return {code:await ended,err};}};
  }
  async function waitForLock(tag){
    const deadline=Date.now()+15000;
    while(Date.now()<deadline){
      if(sql(`select count(*) from pg_stat_activity where application_name='${tag}' and wait_event_type='Lock';`)==='1')return;
      await new Promise(resolve=>setTimeout(resolve,20));
    }
    assert.fail('Segunda conexao nao atingiu o lock da barreira controlada.');
  }
  t.after(()=>{
    // Cleanup exclusivamente de fixtures loopback, sob o owner SQL do harness.
    // Asserts de imutabilidade sao executados antes. Nao remove eventos, IDs,
    // recibos/intencoes anteriores nem altera permissao de qualquer papel.
    const own=operations.map(id=>`'${id}'`).join(',')||'null';
    sql(`begin;
      update historietas_privado.capitulo_cache_operacoes_controle set pendente=null;
      alter table historietas_privado.capitulo_cache_operacoes_eventos disable trigger capitulo_cache_vinculo_imutavel;
      alter table historietas_privado.capitulo_cache_operacoes_recibos disable trigger capitulo_cache_recibo_imutavel;
      alter table historietas_privado.capitulo_cache_operacoes disable trigger capitulo_cache_intencao_imutavel;
      alter table historietas_privado.capitulo_cache_operacoes_retomadas disable trigger capitulo_cache_retomada_imutavel;
      delete from historietas_privado.capitulo_cache_operacoes_eventos where operacao_id in (${own});
      delete from historietas_privado.capitulo_cache_operacoes_recibos where operacao_id in (${own});
      delete from historietas_privado.capitulo_cache_operacoes where id in (${own});
      delete from historietas_privado.capitulo_cache_operacoes_retomadas where revisao_esperada in (${[...resumes].join(',')||'null'});
      alter table historietas_privado.capitulo_cache_operacoes_eventos enable trigger capitulo_cache_vinculo_imutavel;
      alter table historietas_privado.capitulo_cache_operacoes_recibos enable trigger capitulo_cache_recibo_imutavel;
      alter table historietas_privado.capitulo_cache_operacoes enable trigger capitulo_cache_intencao_imutavel;
      alter table historietas_privado.capitulo_cache_operacoes_retomadas enable trigger capitulo_cache_retomada_imutavel;
      update historietas_privado.capitulo_cache_operacoes_controle g set habilitado=s.habilitado,iniciado=s.iniciado,pausado=s.pausado,revisao=s.revisao,pendente=s.pendente
        from jsonb_populate_record(null::historietas_privado.capitulo_cache_operacoes_controle,${literal(originalGate)}) s;
      update historietas_privado.capitulo_cache_orcamento b set habilitado=s.habilitado,limite=s.limite,consumidas=s.consumidas,pausado=s.pausado,revisao=s.revisao
        from jsonb_populate_record(null::historietas_privado.capitulo_cache_orcamento,${literal(originalBudget)}) s;
      update historietas_privado.capitulo_cache_outbox o set lease_id=s.lease_id,lease_ate=s.lease_ate,tentativas=s.tentativas,solicitada_em=s.solicitada_em
        from jsonb_populate_recordset(null::historietas_privado.capitulo_cache_outbox,${literal(originalRows)}) s where o.id=s.id;
      delete from auth.users where id='${user}';commit;`);
    assert.deepEqual(gate(),originalGate);assert.deepEqual(budget(),originalBudget);
    assert.deepEqual(rows().filter(r=>!ids.includes(r.id)),originalRows);
    assert.equal(rows().filter(r=>ids.includes(r.id)).length,2);
    for(const name of tables)assert.deepEqual(all(name),previous[name]);
    assert.equal(sql("select count(*) from pg_trigger where tgname in ('capitulo_cache_intencao_imutavel','capitulo_cache_recibo_imutavel','capitulo_cache_vinculo_imutavel','capitulo_cache_retomada_imutavel') and tgenabled='O';"),'4');
    assert.equal(sql('select habilitado from historietas_privado.capitulo_runner_controle;'),'f');
  });
  sql(`begin;insert into auth.users(id,raw_app_meta_data) values('${user}','{"role":"admin"}');
    insert into auth.sessions(id,user_id) values('${session}','${user}');
    update historietas_privado.capitulo_cache_outbox set lease_id=gen_random_uuid(),lease_ate=clock_timestamp()+interval '1 hour';
    insert into historietas_privado.capitulo_cache_outbox(id,capitulo_id,revisao_agendada,obra_id,publicado_em)
      values ${ids.map(id=>`('${id}',gen_random_uuid(),1,gen_random_uuid(),clock_timestamp())`).join(',')};
    update historietas_privado.capitulo_cache_orcamento set habilitado=true,limite=20,consumidas=0,pausado=false;
    update historietas_privado.capitulo_cache_operacoes_controle set habilitado=true;commit;`);
  let first,receipt;
  await t.test('admissoes concorrentes: uma intencao; replay nao modifica parametros nem pausa',async()=>{
    sql(resume());const a=newId(),b=newId();
    const values=(await Promise.all([asyncSql(call('admitir_operacao_cache',a)),asyncSql(call('admitir_operacao_cache',b))])).map(s=>JSON.parse(s));
    assert.deepEqual(values.map(r=>r.estado).sort(),['admissao_bloqueada','admitida']);
    first=values.find(r=>r.estado==='admitida').operacaoId;
    assert.equal(result('admitir_operacao_cache',first).estado,'admitida');assert.equal(gate().pausado,true);
    await assert.rejects(asyncSql(`select historietas_privado.admitir_operacao_cache('${first}','${user}','${session}',2);`),/55000/);
    await assert.rejects(asyncSql('select public.reivindicar_cache_capitulos(1);'),/55000/);
  });
  await t.test('dois executores e resposta perdida: mesmo recibo, um debito e mesmo lease',async()=>{
    const values=(await Promise.all([asyncSql(call('executar_operacao_cache',first)),asyncSql(call('executar_operacao_cache',first))])).map(s=>JSON.parse(s));
    assert.deepEqual(values[0],values[1]);receipt=values[0].recibo;
    assert.equal(receipt.debito,1);assert.equal(budget().consumidas,1);assert.equal(gate().pausado,true);
    assert.deepEqual(result('executar_operacao_cache',first).recibo,receipt);
    assert.equal(budget().consumidas,1);assert.equal(result('reconciliar_operacao_cache',first).estado,'confirmada');
    await assert.rejects(asyncSql(`update historietas_privado.capitulo_cache_operacoes_recibos set debito=0,resultado='[]' where operacao_id='${first}';`),/55000/);
  });
  await t.test('recibo nao renova lease vencido nem reembolsa; #2257 continua idempotente',async()=>{
    const e=receipt.resultado[0];
    assert.equal(sql(`select public.registrar_solicitacao_cache_capitulo('${e.id}','${e.leaseId}');`),'t');
    const stamp=sql(`select ctid::text||solicitada_em::text from historietas_privado.capitulo_cache_outbox where id='${e.id}';`);
    assert.equal(sql(`select public.registrar_solicitacao_cache_capitulo('${e.id}','${e.leaseId}');`),'t');
    assert.equal(sql(`select ctid::text||solicitada_em::text from historietas_privado.capitulo_cache_outbox where id='${e.id}';`),stamp);
    sql(`update historietas_privado.capitulo_cache_outbox set lease_ate=clock_timestamp()-interval '1 second' where id='${e.id}';`);
    const retry=result('executar_operacao_cache',first);assert.equal(retry.leasesValidos,false);assert.deepEqual(retry.recibo,receipt);assert.equal(budget().consumidas,1);
  });
  await t.test('COMMIT com resposta descartada e recuperado pelo mesmo UUID sem nova cobranca',async()=>{
    const id=admit(),before=budget().consumidas;
    execFileSync('docker',args,{input:`begin;${call('executar_operacao_cache',id)}commit;`,windowsHide:true,stdio:['pipe','ignore','pipe']});
    const recovered=result('executar_operacao_cache',id);assert.equal(recovered.estado,'confirmada');
    assert.equal(budget().consumidas,before+1);const stamp=budget();
    assert.deepEqual(result('executar_operacao_cache',id).recibo,recovered.recibo);assert.deepEqual(budget(),stamp);
  });
  await t.test('timeout depois do claim desfaz recibo/debito; intencao independente bloqueia novos IDs',async()=>{
    const id=admit(),before=budget(),events=rows();
    await assert.rejects(asyncSql(`begin;${call('executar_operacao_cache',id)}set local statement_timeout='100ms';select pg_sleep(1);commit;`),/57014/);
    assert.deepEqual(budget(),before);assert.deepEqual(rows(),events);
    assert.equal(all('capitulo_cache_operacoes_recibos').filter(r=>r.operacao_id===id).length,0);
    assert.equal(result('admitir_operacao_cache',newId()).estado,'admissao_bloqueada');
    assert.equal(result('reconciliar_operacao_cache',id).estado,'encerrada_sem_claim');
    assert.equal(result('executar_operacao_cache',id).estado,'encerrada_sem_claim');assert.deepEqual(budget(),before);
  });
  await t.test('terminar backend antes do commit reverte execucao; reconciliacao impede escritor tardio',async()=>{
    const id=admit(),before=budget();const p=await hold(`begin;select pg_backend_pid();${call('executar_operacao_cache',id)}`);
    const pid=Number(p.output().split(/\r?\n/).find(s=>/^\d+$/.test(s)));assert.ok(Number.isSafeInteger(pid)&&pid>0);
    sql(`select pg_terminate_backend(${pid});`);const exit=await p.finish('commit;');assert.notEqual(exit.code,0);
    assert.deepEqual(budget(),before);assert.equal(gate().pendente,id);
    assert.equal(result('reconciliar_operacao_cache',id).estado,'encerrada_sem_claim');
    assert.equal(result('executar_operacao_cache',id).estado,'encerrada_sem_claim');
  });
  await t.test('execucao ganha lock: reconciliacao espera commit e encontra recibo sem cancelar',async()=>{
    const id=admit(),p=await hold(`begin;${call('executar_operacao_cache',id)}`);
    const tag=`qa_6d12_${randomUUID().replaceAll('-','')}`;
    const reconciliation=asyncSql(`set application_name='${tag}';${call('reconciliar_operacao_cache',id)}`);
    try{await waitForLock(tag);}finally{assert.equal((await p.finish('commit;')).code,0);}
    assert.equal(JSON.parse(await reconciliation).estado,'confirmada');
    assert.equal(result('executar_operacao_cache',id).estado,'confirmada');
  });
  await t.test('reconciliacao ganha lock: execucao atrasada nao reivindica nem debita',async()=>{
    const id=admit(),before=budget(),p=await hold(`begin;${call('reconciliar_operacao_cache',id)}`);
    const tag=`qa_6d12_${randomUUID().replaceAll('-','')}`;
    const execution=asyncSql(`set application_name='${tag}';${call('executar_operacao_cache',id)}`);
    try{await waitForLock(tag);}finally{assert.equal((await p.finish('commit;')).code,0);}
    assert.equal(JSON.parse(await execution).estado,'encerrada_sem_claim');assert.deepEqual(budget(),before);
  });
  await t.test('reconciliacao de UUID ausente impede admissao atrasada; retry antigo de CAS nao reabre pausa',async()=>{
    const id=newId();assert.equal(result('reconciliar_operacao_cache',id).estado,'encerrada_sem_claim');
    assert.equal(result('admitir_operacao_cache',id).estado,'encerrada_sem_claim');
    assert.equal(JSON.parse(sql(`select historietas_privado.retomar_operacoes_cache(${[...resumes][0]},'causa_corrigida');`)).estado,'ja_registrado');
    assert.equal(gate().pausado,true);
    await assert.rejects(asyncSql('select historietas_privado.retomar_operacoes_cache(999999999,\'causa_corrigida\');'),/55000/);
  });
  await t.test('autorizacao atual e logout: nem outro usuario/sessao nem token legado assumem operacao',async()=>{
    const id=admit();
    await assert.rejects(asyncSql(`select historietas_privado.executar_operacao_cache('${id}','${randomUUID()}','${session}',1);`),/55000/);
    sql(`delete from auth.sessions where id='${session}';`);
    await assert.rejects(asyncSql(call('executar_operacao_cache',id)),/42501/);
    assert.equal(result('reconciliar_operacao_cache',id).estado,'encerrada_sem_claim');
    sql(`insert into auth.sessions(id,user_id) values('${session}','${user}');`);
  });
  await t.test('Data API nao expoe contratos novos; service_role nao chama nucleo nem prepara intencao',async()=>{
    for(const role of ['anon','authenticated','service_role']){
      await assert.rejects(asyncSql(`set role ${role};${call('admitir_operacao_cache',newId())}`),/42501/);
      await assert.rejects(asyncSql(`set role ${role};select historietas_privado.reivindicar_cache_capitulos_nucleo(1);`),/42501/);
    }
    const client=createClient(env.API_URL,env.SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    assert.ok((await client.rpc('admitir_operacao_cache',{p_id:newId(),p_usuario:user,p_sessao:session,p_limite:1})).error);
  });
  await t.test('admissao em SAVEPOINT da mesma transacao nao substitui commit independente',async()=>{
    sql(resume());const id=newId();
    await assert.rejects(asyncSql(`begin;savepoint admissao;${call('admitir_operacao_cache',id)}release savepoint admissao;${call('executar_operacao_cache',id)}commit;`),/55000/);
    assert.equal(all('capitulo_cache_operacoes').some(o=>o.id===id),false);
    sql('update historietas_privado.capitulo_cache_operacoes_controle set pausado=true;');
  });
  await t.test('saldo pausado preserva intencao e bloqueia novos IDs sem criar recibo ou debitar',async()=>{
    const id=admit(),before=budget();sql('update historietas_privado.capitulo_cache_orcamento set pausado=true;');
    assert.equal(result('executar_operacao_cache',id).estado,'orcamento_bloqueado');
    assert.equal(budget().consumidas,before.consumidas);assert.equal(gate().pendente,id);
    assert.equal(result('admitir_operacao_cache',newId()).estado,'admissao_bloqueada');
    assert.equal(result('reconciliar_operacao_cache',id).estado,'encerrada_sem_claim');
    sql('update historietas_privado.capitulo_cache_orcamento set pausado=false;');
  });
  await t.test('sessao que expira enquanto aguarda saldo nao confirma recibo ou debito',async()=>{
    const id=admit(),before=budget();
    const p=await hold('begin;select 1 from historietas_privado.capitulo_cache_orcamento for update;');
    sql(`update auth.sessions set not_after=clock_timestamp()+interval '2 seconds' where id='${session}';`);
    const tag=`qa_6d12_${randomUUID().replaceAll('-','')}`;
    const execution=asyncSql(`set application_name='${tag}';${call('executar_operacao_cache',id)}`);
    // Instalar o handler antes de soltar a barreira evita rejeicao nao observada.
    const rejected=assert.rejects(execution,/42501/);
    try{
      await waitForLock(tag);
      sql(`select pg_sleep(greatest(0,extract(epoch from (select not_after-clock_timestamp() from auth.sessions where id='${session}')))+0.02);`);
    }finally{assert.equal((await p.finish('rollback;')).code,0);}
    await rejected;assert.deepEqual(budget(),before);assert.equal(gate().pendente,id);
    assert.equal(result('reconciliar_operacao_cache',id).estado,'encerrada_sem_claim');
    sql(`update auth.sessions set not_after=null where id='${session}';`);
  });
  await t.test('retomadas CAS concorrentes nao duplicam historico e nao habilitam controles',async()=>{
    const rev=gate().revisao;resumes.add(rev);
    const command=`select historietas_privado.retomar_operacoes_cache(${rev},'causa_corrigida');`;
    const results=(await Promise.all([asyncSql(command),asyncSql(command)])).map(s=>JSON.parse(s).estado).sort();
    assert.deepEqual(results,['ja_registrado','retomada_registrada']);assert.equal(gate().revisao,rev+1);
    assert.equal(all('capitulo_cache_operacoes_retomadas').filter(r=>r.revisao_esperada===rev).length,1);
    sql('update historietas_privado.capitulo_cache_operacoes_controle set pausado=true;');
  });
  await t.test('recibo de lote vazio permanece vazio mesmo quando outro evento se torna elegivel',async()=>{
    sql("update historietas_privado.capitulo_cache_outbox set lease_id=gen_random_uuid(),lease_ate=clock_timestamp()+interval '1 hour';");
    const id=admit(),before=budget(),r=result('executar_operacao_cache',id);
    assert.deepEqual(r.recibo.resultado,[]);assert.equal(r.recibo.debito,0);assert.deepEqual(budget(),before);
    sql(`update historietas_privado.capitulo_cache_outbox set lease_ate=clock_timestamp()-interval '1 second' where id='${ids[0]}';`);
    assert.deepEqual(result('executar_operacao_cache',id).recibo,r.recibo);assert.deepEqual(budget(),before);
  });
  await t.test('desativacao nao e bypass do gate; retomada nao habilita runner nem devolve saldo',async()=>{
    const before=budget();sql('update historietas_privado.capitulo_cache_operacoes_controle set habilitado=false;');
    await assert.rejects(asyncSql('select public.reivindicar_cache_capitulos(1);'),/55000/);
    const rev=gate().revisao;resumes.add(rev);
    assert.equal(JSON.parse(sql(`select historietas_privado.retomar_operacoes_cache(${rev},'causa_corrigida');`)).habilitado,false);
    assert.deepEqual(budget(),before);assert.equal(sql('select habilitado from historietas_privado.capitulo_runner_controle;'),'f');
  });
  await t.test('6D13 Data API: JWT real, recibo, retry, logout e isolamento de sessao',async t=>{
    const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
    const admin=createClient(env.API_URL,env.SERVICE_ROLE_KEY,options),actor=createClient(env.API_URL,env.ANON_KEY,options);
    const other=createClient(env.API_URL,env.ANON_KEY,options),anon=createClient(env.API_URL,env.ANON_KEY,options);
    const email=`qa-6d13-${randomUUID()}@historietas.test`,password=randomBytes(24).toString('base64url');
    const check=r=>{assert.equal(r.error,null,r.error?.message);return r.data;};
    const uid=check(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{role:'admin'}})).user.id;
    t.after(async()=>{check(await admin.auth.admin.deleteUser(uid));});
    check(await actor.auth.signInWithPassword({email,password}));
    const rpc=(client,p_id,p_acao)=>client.rpc('operar_cache_capitulos',{p_id,p_acao});
    await t.test('anon/service_role negados e metadata editavel nao autoriza',async()=>{
      for(const c of [anon,admin,actor])assert.equal((await rpc(c,null,'preparar')).error?.code,'42501');
      check(await admin.auth.admin.updateUserById(uid,{app_metadata:{role:'admin'}}));
      // Autorizacao fresca do banco, sem confiar no app_metadata antigo do JWT.
      sql('update historietas_privado.capitulo_cache_operacoes_controle set habilitado=false,iniciado=false,pausado=true;');
      assert.equal(check(await rpc(actor,null,'preparar')).estado,'legado');
      assert.equal(check(await rpc(actor,null,'executar')).estado,'protocolo_desativado');
      sql('update historietas_privado.capitulo_cache_operacoes_controle set habilitado=true,iniciado=true;');
    });
    let operation,r;
    await t.test('admissoes concorrentes compartilham UUID e apenas uma resposta e nova',async()=>{
      sql(resume());operation=newId();
      const out=(await Promise.all([rpc(actor,operation,'preparar'),rpc(actor,operation,'preparar')])).map(check);
      assert.deepEqual(out.map(r=>r.nova).sort(),[false,true]);assert.equal(gate().pendente,operation);
      assert.equal(check(await rpc(actor,newId(),'preparar')).estado,'admissao_bloqueada');
      assert.equal(check(await rpc(actor,null,'preparar')).estado,'identificador_obrigatorio');
    });
    await t.test('execucoes concorrentes e resposta descartada: mesmo recibo, lease e debito',async()=>{
      const before=budget().consumidas;
      const out=(await Promise.all([rpc(actor,operation,'executar'),rpc(actor,operation,'executar')])).map(check);
      r=out[0];assert.equal(r.estado,'confirmada');assert.deepEqual(out[1].recibo,r.recibo);
      assert.equal(budget().consumidas-before,r.recibo.debito);assert.equal(r.recibo.debito,1);
      const after=budget();assert.deepEqual(check(await rpc(actor,operation,'executar')).recibo,r.recibo);
      assert.deepEqual(check(await rpc(actor,operation,'reconciliar')).recibo,r.recibo);assert.deepEqual(budget(),after);
    });
    await t.test('outra sessao, revogacao e lease vencido nao autorizam usar recibo antigo',async()=>{
      check(await other.auth.signInWithPassword({email,password}));
      assert.equal((await rpc(other,operation,'executar')).error?.code,'42501');
      sql(`update historietas_privado.capitulo_cache_outbox set lease_ate=clock_timestamp()-interval '1 second' where id='${r.recibo.resultado[0].id}';`);
      const before=budget();assert.equal(check(await rpc(actor,operation,'executar')).leasesValidos,false);assert.deepEqual(budget(),before);
      check(await admin.auth.admin.updateUserById(uid,{app_metadata:{role:'autor'}}));
      assert.equal((await rpc(actor,operation,'executar')).error?.code,'42501');
      check(await admin.auth.admin.updateUserById(uid,{app_metadata:{role:'admin'}}));
    });
    await t.test('falha depois do claim faz rollback; reconciliacao sela e impede execucao tardia',async()=>{
      sql(resume());const id=newId();check(await rpc(actor,id,'preparar'));const before=budget();
      sql(`create function historietas_privado.qa_6d13_falha() returns trigger language plpgsql as $$begin raise exception 'Falha sintetica antes do commit.' using errcode='XX000';end$$;
        create trigger qa_6d13_falha before insert on historietas_privado.capitulo_cache_operacoes_recibos for each row execute function historietas_privado.qa_6d13_falha();`);
      try{assert.equal((await rpc(actor,id,'executar')).error?.code,'XX000');}
      finally{sql('drop trigger qa_6d13_falha on historietas_privado.capitulo_cache_operacoes_recibos;drop function historietas_privado.qa_6d13_falha();');}
      assert.deepEqual(budget(),before);assert.equal(gate().pendente,id);
      assert.equal(check(await rpc(actor,id,'preparar')).nova,false);
      assert.equal(check(await rpc(actor,id,'reconciliar')).estado,'encerrada_sem_claim');
      assert.equal(check(await rpc(actor,id,'executar')).estado,'encerrada_sem_claim');assert.deepEqual(budget(),before);
    });
    await t.test('resposta de admissao perdida/UUID ausente e logout: recuperar sem nova reivindicacao',async()=>{
      const unknown=newId();assert.equal(check(await rpc(actor,unknown,'reconciliar')).estado,'encerrada_sem_claim');
      assert.equal(check(await rpc(actor,unknown,'preparar')).estado,'encerrada_sem_claim');
      sql(resume());const id=newId();check(await rpc(actor,id,'preparar'));const before=budget();
      check(await actor.auth.signOut({scope:'local'}));
      assert.equal((await rpc(actor,id,'executar')).error?.code,'42501');assert.deepEqual(budget(),before);
      assert.equal(gate().pendente,id); // Sem sessao original: somente recuperacao SQL restrita.
      sql(`select historietas_privado.reconciliar_operacao_cache('${id}',usuario_id,sessao_id,limite) from historietas_privado.capitulo_cache_operacoes where id='${id}';`);
      assert.equal(gate().pendente,null);assert.equal(gate().pausado,true);
    });
  });
});
