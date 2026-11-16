import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loopback, runnerOnly, intersectionQuery, exactResponse, Api, SafeError, sanitizePlan, parsePendingOutput } from './core.mjs';
import { verifySource, configureLocal, cliEnvironment, safeFailure } from './runner.mjs';
import { API_IDS, runDataApi } from './data-api.mjs';
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const input={a:A,b:B,slugPrefix:'qa-common-1234-'};

test('loopback only, no credentials, alternate origin, path or query',()=>{
  assert.equal(loopback('http://127.0.0.1:54321'),'http://127.0.0.1:54321');
  for(const url of ['https://example.com','http://user:pass@localhost:54321','http://localhost/foo','http://localhost?x=1','http://localhost#x','https://localhost','http://127.0.0.1.example.com']) assert.throws(()=>loopback(url));
});
test('runner guard cannot start local Docker',()=>{
  for(const env of [{},{GITHUB_ACTIONS:'true'},{GITHUB_ACTIONS:'true',RUNNER_ENVIRONMENT:'self-hosted',HISTORIAS_DISPOSABLE:'1'}]) assert.throws(()=>runnerOnly(env));
  assert.doesNotThrow(()=>runnerOnly({GITHUB_ACTIONS:'true',RUNNER_ENVIRONMENT:'github-hosted',HISTORIAS_DISPOSABLE:'1'}));
});
test('both favorite aliases explicit public; eligible works and total-safe ordering',()=>{
  const q=new URL('http://localhost/'+intersectionQuery(input)).searchParams;
  assert.equal(q.get('a.user_id'),`eq.${A}`); assert.equal(q.get('b.user_id'),`eq.${B}`);
  assert.equal(q.get('a.visibilidade'),'eq.publico'); assert.equal(q.get('b.visibilidade'),'eq.publico');
  assert.equal(q.get('publicado'),'eq.true'); assert.ok(!q.get('classificacao_indicativa').includes('18+'));
  assert.equal(q.get('order'),'id.asc'); assert.equal(q.get('limit'),'20');
  assert.equal((q.get('select').match(/favoritos!inner/g)??[]).length,2);
});
test('cursor and limits reject invalid values before HTTP',()=>{
  for(const patch of [{limit:0},{limit:21},{limit:1.5},{a:B},{a:'invalid'},{cursor:'invalid'},{offset:-1},{offset:1001},{slugPrefix:'*'}]) assert.throws(()=>intersectionQuery({...input,...patch}));
  assert.match(intersectionQuery({...input,cursor:B,limit:7}),/id=gt\./);
});
test('exact count mandatory even for empty response; no partial set accepted',()=>{
  assert.deepEqual(exactResponse({status:200,data:[],range:'*/0'},[],0),{rows:0,total:0});
  assert.throws(()=>exactResponse({status:200,data:[],range:'*/1'},[],0));
  assert.throws(()=>exactResponse({status:200,data:[{id:A}],range:'0-0/*'},[A],1));
  assert.throws(()=>exactResponse({status:200,data:[{id:B}],range:'0-0/1'},[A],1));
  assert.deepEqual(exactResponse({status:206,data:[{id:A}],range:'0-0/3'},[A],3),{rows:1,total:3});
});
test('service key cannot validate permissions or call arbitrary admin endpoints',async()=>{
  let calls=0;
  const api=new Api('http://localhost:54321','public-key','service-credential',async()=>{calls++;return new Response('{}',{status:200});});
  for(const [actor,path,options] of [
    [{token:'service-credential'},'rest/v1/obras',{}],
    [null,'rest/v1/obras',{fixtureAdmin:true}],
    [null,'rest/v1/favoritos',{fixtureAdmin:true,method:'GET'}],
    [null,`auth/v1/admin/users/${A}`,{fixtureAdmin:true,method:'GET'}],
    [null,'https://remote.invalid',{}],
    [null,'../auth/v1/user',{}],
  ]) await assert.rejects(api.request(actor,path,options));
  assert.equal(calls,0);
  await api.request(null,'auth/v1/admin/users',{fixtureAdmin:true,method:'POST',body:{}});
  await api.request(null,'rest/v1/favoritos',{fixtureAdmin:true,method:'POST',body:[]});
  assert.equal(calls,2);
});
test('real-session transport uses public apikey, actor token and no retries/redirects',async()=>{
  let calls=0;
  const api=new Api('http://127.0.0.1:54321','public-key','service-credential',async(url,options)=>{
    calls++; assert.equal(options.headers.apikey,'public-key'); assert.equal(options.headers.Authorization,'Bearer real-issued-token');
    assert.equal(options.redirect,'error'); assert.equal(options.cache,'no-store');
    return new Response('[]',{status:200,headers:{'content-range':'*/0'}});
  });
  assert.equal((await api.request({token:'real-issued-token'},'rest/v1/obras')).range,'*/0');
  assert.equal(calls,1);
});
test('Prefer is scoped to reads, table writes and explicit preferences upsert',async()=>{
  const seen=[];
  const api=new Api('http://localhost:54321','public-key','service-key',async(url,options)=>{
    seen.push(options.headers.Prefer);return new Response(null,{status:204});
  });
  await api.request(null,'auth/v1/user');
  await api.request(null,'rest/v1/obras');
  await api.request(null,'rest/v1/favoritos',{method:'HEAD'});
  for(const method of ['POST','PATCH','DELETE']) await api.request(null,'rest/v1/profiles',{method});
  await api.request(null,'rest/v1/rpc/aceitar_termos_publicacao',{method:'POST'});
  await api.request(null,'rest/v1/preferencias_privacidade?on_conflict=user_id',{method:'POST',upsert:true});
  assert.deepEqual(seen,[undefined,'count=exact','count=exact','return=minimal','return=minimal','return=minimal',undefined,'return=minimal,resolution=merge-duplicates']);
  await assert.rejects(api.request(null,'rest/v1/profiles',{method:'POST',upsert:true}));
  assert.equal(seen.length,8);
});

test('fixture diagnostic stage is allowlisted and preserves HTTP without private data',()=>{
  const e=new SafeError('response_error',403); e.fixture_stage='profile_insert';
  assert.deepEqual(safeFailure(e),{reason:'response_error',http:403,fixture_stage:'profile_insert'});
  e.fixture_stage='token cookie password user@example.invalid';
  assert.deepEqual(safeFailure(e),{reason:'response_error',http:403});
  e.pgtap_available_before=0;
  assert.equal(safeFailure(e).pgtap_available_before,0);
});

test('untrusted HTTP errors never become diagnostics',async()=>{
  const secret='password cookie access_token user@example.invalid';
  const api=new Api('http://localhost:54321','public-key','service-credential',async()=>new Response(JSON.stringify({message:secret}),{status:500}));
  await assert.rejects(api.ok({token:'real-token'},'rest/v1/obras'),e=>e.message==='response_error'&&!JSON.stringify(safeFailure(e)).includes(secret));
  assert.deepEqual(safeFailure(new Error(secret)),{reason:'internal_error',http:0});
  const failure=new SafeError('environment_error');failure.phase='cli_start';
  assert.deepEqual(safeFailure(failure),{reason:'environment_error',http:0,phase:'cli_start'});
  failure.phase=secret;
  assert.deepEqual(safeFailure(failure),{reason:'environment_error',http:0});
  failure.pg_code='57014';failure.sql_stage='page1_authenticated';
  assert.deepEqual(safeFailure(failure),{reason:'environment_error',http:0,pg_code:'57014',sql_stage:'page1_authenticated'});
  failure.pg_code=secret;failure.sql_stage=secret;
  assert.deepEqual(safeFailure(failure),{reason:'environment_error',http:0});
});
test('plans retain timing/loops/index allowlist but omit all expressions, PII and session values',()=>{
  const secret='sb_secret_do_not_publish';
  const plan={Plan:{'Node Type':'Index Scan','Relation Name':'favoritos','Index Name':'favoritos_user_id_obra_id_key','Actual Rows':20,'Actual Loops':1,Filter:`cookie=${secret}`,Output:['email@example.invalid'],'Index Cond':`session_id=${secret}`,Plans:[{'Node Type':'Result',password:secret,token:secret}]},'Execution Time':1.2,'Planning Time':0.3,Query:secret};
  const clean=sanitizePlan([plan]);
  const text=JSON.stringify(clean);
  for(const bad of [secret,'cookie','email@','session_id','password','Query','Filter','Output','Index Cond']) assert.ok(!text.includes(bad));
  assert.equal(clean[0].Plan['Actual Rows'],20); assert.equal(clean[0]['Execution Time'],1.2);
  assert.deepEqual(sanitizePlan({'Index Name':'favoritos_sb_secret_token','Node Type':'personal-data'}),{});
});
test('pending parser requires two ok assertions, complete pgTAP and four actual plans',()=>{
  const labels=['page1 authenticated','deep keyset authenticated','exact count authenticated','page1 anon'];
  const sample='ok 1 - cursor\nok 2 - count\n1..2\n'+labels.map(label=>`PLAN ${label}\n${JSON.stringify([{Plan:{'Node Type':'Limit','Actual Rows':20},'Execution Time':1}],null,2)}\n`).join('');
  const result=parsePendingOutput(sample); assert.equal(result.assertions,2);assert.equal(result.plans.length,4);
  assert.throws(()=>parsePendingOutput(sample.replace('ok 1','not ok 1')));
  assert.throws(()=>parsePendingOutput(sample.replace('1..2','')));
  assert.throws(()=>parsePendingOutput(sample.replace('PLAN page1 anon','MISSING')));
});
test('only pending SQL shipped; old 43 checks never included',()=>{
  const sql=readFileSync(new URL('./pending.sql',import.meta.url),'utf8');
  assert.equal((sql.match(/select is\(/g)??[]).length,2);
  assert.equal((sql.match(/explain \(analyze,buffers,format json\)/g)??[]).length,4);
  assert.match(sql,/min\(id::text\)/); assert.doesNotMatch(sql,/min\(id\)::text|OBSERVED: naive/);
  assert.match(sql,/rollback;/); assert.doesNotMatch(sql,/create (?:policy|function|table)|alter table|disable.*rls/i);
  assert.ok(sql.indexOf('begin;')<sql.indexOf('create extension if not exists pgtap with schema extensions;'));
  assert.ok(sql.indexOf('create extension if not exists pgtap with schema extensions;')<sql.indexOf('select no_plan();'));
});
test('init configuration disables unrelated services and seeds without touching schema',()=>{
  const original='project_id = "default"\n'+['db.seed','studio','analytics','inbucket','db.pooler'].map(s=>`[${s}]\nenabled = true\n`).join('');
  const changed=configureLocal(original,'common-123-1');
  assert.match(changed,/project_id = "common-123-1"/);
  assert.equal((changed.match(/enabled = false/g)??[]).length,5);
  assert.doesNotThrow(()=>configureLocal(original.replace('[inbucket]','[local_smtp]'),'common-123-1'));
  assert.throws(()=>configureLocal('project_id = "x"','common-1'));
});
test('CLI environment never accepts hosted database target',()=>{
  const text='API_URL="http://127.0.0.1:54321"\nANON_KEY="public-key"\nSERVICE_ROLE_KEY="service-credential"';
  assert.equal(cliEnvironment(text).url,'http://127.0.0.1:54321');
  assert.throws(()=>cliEnvironment(text.replace('http://127.0.0.1:54321','https://example.supabase.co')));
});
test('planned API checks are unique and safe identifiers; no free-form user titles',()=>{
  assert.equal(new Set(API_IDS).size,API_IDS.length);
  assert.ok(API_IDS.length>=40);
  for(const id of API_IDS) assert.match(id,/^[a-z0-9_.]{1,80}$/);
});
test('failed fixture still cleans tracked account and does not run permission matrix',async()=>{
  const checks=[],deletes=[];
  const api={
    async ok(actor,path,options) {
      if(path==='auth/v1/admin/users'&&options.fixtureAdmin) return {id:A};
      if(path===`auth/v1/admin/users/${A}`) {deletes.push(A);return {};}
      throw new SafeError('response_error',500);
    },
  };
  const check=async(id,fn)=>{checks.push(id);try {await fn();return true;}catch(error){if(id==='fixture.real_auth') assert.equal(safeFailure(error).fixture_stage,'auth_login');return false;}};
  await runDataApi(api,check);
  assert.deepEqual(checks,['fixture.real_auth','cleanup.sessions','cleanup.accounts']);
  assert.deepEqual(deletes,[A]);
});
test('workflow diagnostic creation push only, immutable base, exact artifact allowlist',()=>{
  const yml=readFileSync(new URL('../../.github/workflows/historias-comum-manual.yml',import.meta.url),'utf8');
  assert.match(yml,/^  push:/m); assert.doesNotMatch(yml,/workflow_dispatch:|pull_request:|schedule:/);
  assert.match(yml,/branches:\s*\n\s*- qa\/historias-comum-etapa1-diagnostico-v3\s*\n/);
  for (const guard of ["github.repository == 'HistorietasFlow/Historietas'", "github.event_name == 'push'", "github.ref == 'refs/heads/qa/historias-comum-etapa1-diagnostico-v3'", 'github.event.created == true', 'github.run_attempt == 1']) assert.ok(yml.includes(guard));
  assert.match(yml,/ref: 5b8d439f5bd50d14ab53e0fdddfe8f84d30a5f86/);
  assert.match(yml,/contents: read/); assert.doesNotMatch(yml,/secrets\.|--linked|--project-ref|db push|migration repair|npm ci|supabase test db|\.env/);
  assert.ok(!yml.includes('**'));
  for(const name of ['summary.json','schema.json','plans.json']) assert.ok(yml.includes(name));
});
// Optional offline verification of the extracted 90-migration snapshot.
if(process.env.HISTORIAS_STATIC_BASE) test('main source and CI auxiliary hashes match immutable manifest',()=>{
  assert.doesNotThrow(()=>verifySource(fileURLToPath(new URL(process.env.HISTORIAS_STATIC_BASE))));
});
