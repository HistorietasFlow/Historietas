import {test,expect} from '@playwright/test';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import {execFileSync} from 'node:child_process';
import {randomBytes,randomUUID} from 'node:crypto';
import {criarInvocacaoStatusSupabase} from '../scripts/supabase-cli-invocation.mjs';

// Registrado no spec de agendamento/Diario: um arquivo/worker serializa as
// fixtures globais do gate com os cenarios legados, inclusive na CI Linux.

for(const device of ['desktop','mobile'])test(`consumidor UUID: resposta perdida, replay e reconciliacao (${device})`,async({page,context,baseURL})=>{
  const inv=criarInvocacaoStatusSupabase();
  const raw=execFileSync(inv.comando,inv.argumentos,{encoding:'utf8',stdio:['ignore','pipe','pipe'],windowsHide:true});
  const env=Object.fromEntries(raw.split(/\r?\n/).filter(l=>/^[A-Z0-9_]+=/.test(l)).map(l=>{const i=l.indexOf('='),v=l.slice(i+1).trim();return[l.slice(0,i),v.startsWith('"')?JSON.parse(v):v];}));
  for(const value of [env.API_URL,env.DB_URL,baseURL])expect(['127.0.0.1','localhost','[::1]']).toContain(new URL(value).hostname);
  const container=execFileSync('docker',['ps','--filter',`publish=${new URL(env.DB_URL).port}`,'--format','{{.Names}}'],{encoding:'utf8',windowsHide:true}).trim();
  expect(container).toMatch(/^supabase_db_[^\r\n]+$/);
  const sql=input=>execFileSync('docker',['exec','-i',container,'psql','-U','postgres','-d','postgres','-XqAt','-v','ON_ERROR_STOP=1'],{input,encoding:'utf8',stdio:['pipe','pipe','pipe'],windowsHide:true}).trim();
  const all=name=>JSON.parse(sql(`select coalesce(jsonb_agg(to_jsonb(r) order by to_jsonb(r)::text),'[]') from historietas_privado.${name} r;`));
  const gate=all('capitulo_cache_operacoes_controle')[0],budget=all('capitulo_cache_orcamento')[0],rows=all('capitulo_cache_outbox');
  expect(gate.habilitado).toBe(false);expect(gate.iniciado).toBe(false);expect(gate.pendente).toBeNull();expect(budget.habilitado).toBe(false);
  const operations=[randomUUID(),randomUUID()],event=randomUUID();
  const literal=value=>`'${JSON.stringify(value).replaceAll("'","''")}'::jsonb`;
  const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
  const admin=createClient(env.API_URL,env.SERVICE_ROLE_KEY,options),actor=createClient(env.API_URL,env.ANON_KEY,options);
  const check=r=>{expect(r.error).toBeNull();return r.data;};
  let uid;
  try{
    const email=`qa-consumidor-${randomUUID()}@historietas.test`,password=randomBytes(24).toString('base64url');
    uid=check(await admin.auth.admin.createUser({email,password,email_confirm:true,app_metadata:{role:'admin'}})).user.id;
    const session=check(await actor.auth.signInWithPassword({email,password})).session;
    const cookies=[];
    const ssr=createServerClient(env.API_URL,env.ANON_KEY,{cookies:{getAll:()=>[],setAll:items=>cookies.push(...items)}});
    check(await ssr.auth.setSession({access_token:session.access_token,refresh_token:session.refresh_token}));
    await context.addCookies(cookies.map(({name,value})=>({name,value,url:new URL(baseURL).origin})));
    await page.setViewportSize(device==='mobile'?{width:390,height:844}:{width:1440,height:900});
    await page.goto('/termos-de-uso');
    sql(`begin;update historietas_privado.capitulo_cache_outbox set lease_id=gen_random_uuid(),lease_ate=clock_timestamp()+interval '1 hour';
      insert into historietas_privado.capitulo_cache_outbox(id,capitulo_id,revisao_agendada,obra_id,publicado_em) values('${event}',gen_random_uuid(),1,gen_random_uuid(),clock_timestamp());
      update historietas_privado.capitulo_cache_orcamento set habilitado=true,limite=5,consumidas=0,pausado=false;
      update historietas_privado.capitulo_cache_operacoes_controle set habilitado=true,pausado=false;commit;`);
    const send=async(id,reconcile=false)=>page.evaluate(async({id,reconcile})=>{
      const headers={'Idempotency-Key':id,...reconcile?{'X-Cache-Operation':'reconciliar'}:{}};
      const r=await fetch('/api/admin/cache-capitulos',{method:'POST',headers});return{status:r.status,body:await r.json()};
    },{id,reconcile});
    expect((await send('invalido')).status).toBe(400);
    let discarded;
    await page.route('**/api/admin/cache-capitulos',async route=>{
      const r=await route.fetch();discarded=await r.json();await route.abort('failed');
    },{times:1});
    await expect(send(operations[0])).rejects.toThrow();
    expect(discarded).toMatchObject({estado:'solicitado_sem_confirmacao',confirmadas:0,solicitadas:1,operacaoId:operations[0]});
    const after=all('capitulo_cache_orcamento')[0],lease=all('capitulo_cache_outbox').find(r=>r.id===event);
    expect(after.consumidas).toBe(1);
    expect(await send(operations[0])).toMatchObject({status:202,body:{operacaoId:operations[0],confirmadas:0,solicitadas:1}});
    expect(all('capitulo_cache_orcamento')[0]).toEqual(after);
    expect(all('capitulo_cache_outbox').find(r=>r.id===event)).toEqual(lease);
    expect(await send(operations[1])).toMatchObject({status:503,body:{estado:'admissao_bloqueada'}});
    expect(await send(operations[0],true)).toMatchObject({status:202,body:{confirmadas:0,operacaoId:operations[0]}});
    expect(await send(operations[1],true)).toMatchObject({status:503,body:{estado:'encerrada_sem_claim'}});
    expect(await send(operations[1])).toMatchObject({status:503,body:{estado:'encerrada_sem_claim'}});
    expect(all('capitulo_cache_orcamento')[0]).toEqual(after);
    check(await actor.auth.signOut());
    expect([401,403]).toContain((await send(operations[0])).status);
  }finally{
    // Somente fixture local: preservar todos os eventos e registros anteriores.
    const ids=operations.map(id=>`'${id}'`).join(',');
    sql(`begin;update historietas_privado.capitulo_cache_operacoes_controle set pendente=null;
      alter table historietas_privado.capitulo_cache_operacoes_eventos disable trigger capitulo_cache_vinculo_imutavel;
      alter table historietas_privado.capitulo_cache_operacoes_recibos disable trigger capitulo_cache_recibo_imutavel;
      alter table historietas_privado.capitulo_cache_operacoes disable trigger capitulo_cache_intencao_imutavel;
      delete from historietas_privado.capitulo_cache_operacoes_eventos where operacao_id in (${ids});
      delete from historietas_privado.capitulo_cache_operacoes_recibos where operacao_id in (${ids});
      delete from historietas_privado.capitulo_cache_operacoes where id in (${ids});
      alter table historietas_privado.capitulo_cache_operacoes_eventos enable trigger capitulo_cache_vinculo_imutavel;
      alter table historietas_privado.capitulo_cache_operacoes_recibos enable trigger capitulo_cache_recibo_imutavel;
      alter table historietas_privado.capitulo_cache_operacoes enable trigger capitulo_cache_intencao_imutavel;
      update historietas_privado.capitulo_cache_operacoes_controle g set habilitado=s.habilitado,iniciado=s.iniciado,pausado=s.pausado,revisao=s.revisao,pendente=s.pendente from jsonb_populate_record(null::historietas_privado.capitulo_cache_operacoes_controle,${literal(gate)}) s;
      update historietas_privado.capitulo_cache_orcamento b set habilitado=s.habilitado,limite=s.limite,consumidas=s.consumidas,pausado=s.pausado,revisao=s.revisao from jsonb_populate_record(null::historietas_privado.capitulo_cache_orcamento,${literal(budget)}) s;
      update historietas_privado.capitulo_cache_outbox o set lease_id=s.lease_id,lease_ate=s.lease_ate,tentativas=s.tentativas,solicitada_em=s.solicitada_em from jsonb_populate_recordset(null::historietas_privado.capitulo_cache_outbox,${literal(rows)}) s where o.id=s.id;commit;`);
    expect(all('capitulo_cache_outbox').filter(r=>r.id!==event)).toEqual(rows);
    expect(all('capitulo_cache_operacoes_controle')[0]).toEqual(gate);
    expect(all('capitulo_cache_orcamento')[0]).toEqual(budget);
    if(uid)check(await admin.auth.admin.deleteUser(uid));
  }
});
