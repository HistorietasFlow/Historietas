import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { freemem } from 'node:os';
import { performance } from 'node:perf_hooks';
import { BASE_SHA, AUX_VERSION, SafeError, requireThat, runnerOnly, digest, loopback, Api, parsePendingOutput } from './core.mjs';
import { API_IDS, runDataApi } from './data-api.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const expected=JSON.parse(readFileSync(join(here,'expected-schema.json'),'utf8'));
export function verifySource(source) {
  requireThat(expected.sha===BASE_SHA&&expected.migrations.length===90,'schema_mismatch');
  const paths=readdirSync(join(source,'supabase/migrations')).filter(n=>n.endsWith('.sql')).sort();
  requireThat(JSON.stringify(paths)===JSON.stringify(expected.migrations.map(m=>m.name)),'schema_mismatch');
  for (const m of expected.migrations) requireThat(digest(readFileSync(join(source,'supabase/migrations',m.name)))===m.sha256,'schema_mismatch');
  const aux=join(source,'qa/integration/supabase/20260826000637_normalizar_acl_baseline_local.sql');
  requireThat(digest(readFileSync(aux))===expected.auxiliary_sha256,'schema_mismatch');
  return aux;
}
export function configureLocal(text,project) {
  requireThat(/^[a-z0-9-]{1,60}$/.test(project),'unsafe_environment');
  requireThat(/^project_id = ".*"$/m.test(text),'environment_error');
  let changed=text.replace(/^project_id = ".*"$/m,`project_id = "${project}"`);
  // Keep CI's init + same ACL bootstrap + start, but omit unrelated seed,
  // dashboard/analytics/email UI/pooler. No schema or migration SQL is edited.
  const mailSection = text.includes('[inbucket]') ? 'inbucket' : 'local_smtp';
  for (const section of ['db.seed','studio','analytics',mailSection,'db.pooler']) {
    const pattern=new RegExp(`(\\[${section.replaceAll('.','\\.')}\\]\\r?\\n)([\\s\\S]*?)(?=\\n\\[|$)`);
    requireThat(pattern.test(changed),'environment_error');
    changed=changed.replace(pattern,(_,header,body)=>{
      requireThat(/^enabled = (?:true|false)$/m.test(body),'environment_error');
      return header+body.replace(/^enabled = (?:true|false)$/m,'enabled = false');
    });
  }
  return changed;
}
export function cliEnvironment(text) {
  const values={};
  for (const line of text.split(/\r?\n/)) {
    const m=/^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m) { try { values[m[1]]=m[2].startsWith('"')?JSON.parse(m[2]):m[2]; } catch { throw new SafeError('environment_error'); } }
  }
  const url=loopback(values.API_URL ?? values.SUPABASE_URL);
  requireThat(Boolean(values.ANON_KEY&&values.SERVICE_ROLE_KEY)&&values.ANON_KEY!==values.SERVICE_ROLE_KEY,'environment_error');
  return {url,key:values.ANON_KEY,service:values.SERVICE_ROLE_KEY};
}
const REASONS=new Set(['unsafe_environment','unsafe_destination','environment_error','schema_mismatch','invalid_query','admin_scope','transport_error','response_error','unexpected_rows','unexpected_count','auth_mismatch','fixture_error','cleanup_error','sql_assertion','sql_plan','memory_pressure']);
export function safeFailure(error) {
  const result={reason:error instanceof SafeError&&REASONS.has(error.code)?error.code:'internal_error',http:Number.isInteger(error?.http)&&error.http>=100&&error.http<=599?error.http:0};
  if(error instanceof SafeError&&['source_checkout','cli_version','cli_init','cli_start','cli_status','cli_stop','schema_sql'].includes(error.phase)) result.phase=error.phase;
  if(error instanceof SafeError&&['57014','42501','23505','23503','42883','42P01','42703','42601','08006','P0001'].includes(error.pg_code)) result.pg_code=error.pg_code;
  if(error instanceof SafeError&&['setup_or_metadata','page1_authenticated','deep_keyset_authenticated','exact_count_authenticated','page1_anon'].includes(error.sql_stage)) result.sql_stage=error.sql_stage;
  return result;
}
export async function main(source) {
  runnerOnly();
  const reports=resolve(process.env.HISTORIAS_REPORT_DIR ?? join(here,'results'));
  mkdirSync(reports,{recursive:true});
  const IDs=['environment.bootstrap','environment.schema','environment.api_credentials',...API_IDS,'sql.pending','sql.rollback','cleanup.stack'];
  const results=new Map(IDs.map(id=>[id,{id,status:'NOT_RUN'}]));
  const plans=[];
  const check=async(id,fn)=>{
    requireThat(results.has(id)&&results.get(id).status==='NOT_RUN','invalid_query');
    const start=performance.now();
    let result;
    try {
      const value=await fn(); result={id,status:'PASS'};
      for (const key of ['http','rows','total','accounts','works','resources','assertions','plans']) {
        if (Number.isSafeInteger(value?.[key])&&value[key]>=0) result[key]=value[key];
      }
    } catch(error) { result={id,status:'FAIL',...safeFailure(error)}; }
    result.duration_ms=Math.round(performance.now()-start);
    results.set(id,result);
    // Persist only predefined states/counts after each phase, including failure.
    writeFileSync(join(reports,'summary.json'),JSON.stringify({base_sha:BASE_SHA,workers:1,retries:0,original_sql_assertions_rerun:0,complete:false,checks:[...results.values()]},null,2));
    return result.status==='PASS';
  };
  let runtime,container,started=false,bootstrapOK=false;
  const exec=(command,args,{cwd=runtime,input}={})=>{
    const r=spawnSync(command,args,{cwd,input,encoding:'utf8',maxBuffer:16*1024*1024,stdio:['pipe','pipe','pipe'],env:{...process.env,SUPABASE_ACCESS_TOKEN:'',SUPABASE_DB_PASSWORD:''}});
    if(r.status!==0||r.error) {
      const error=new SafeError('environment_error');
      error.phase=command==='docker'?'schema_sql':command==='git'?'source_checkout':({'--version':'cli_version',init:'cli_init',start:'cli_start',status:'cli_status',stop:'cli_stop'}[args[0]]);
      if(command==='docker') {
        error.pg_code=r.stderr?.match(/(?:ERROR|FATAL):\s+([0-9A-Z]{5}):/)?.[1];
        const markers=[...(r.stdout??'').matchAll(/^PLAN (page1 authenticated|deep keyset authenticated|exact count authenticated|page1 anon)$/gm)];
        error.sql_stage=markers.at(-1)?.[1].replaceAll(' ','_')??'setup_or_metadata';
      }
      throw error;
    }
    return r.stdout; // NEVER print stderr/stdout from tools/status/Auth
  };
  const sql=text=>exec('docker',['exec','-i',container,'psql','-U','postgres','-d','postgres','-XqAt','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose'],{input:text});
  const historySql="select coalesce(json_agg(version order by version),'[]'::json) from supabase_migrations.schema_migrations;";
  let history;
  try {
    bootstrapOK=await check('environment.bootstrap',async()=>{
      requireThat(freemem()>=3*1024**3,'memory_pressure');
      requireThat(/^[0-9]+$/.test(process.env.GITHUB_RUN_ID??'')&&/^[0-9]+$/.test(process.env.GITHUB_RUN_ATTEMPT??''),'unsafe_environment');
      source=resolve(source);
      requireThat(exec('git',['rev-parse','HEAD'],{cwd:source}).trim()===BASE_SHA,'schema_mismatch');
      const aux=verifySource(source);
      const project=`common-${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT}`;
      runtime=resolve(process.env.RUNNER_TEMP,project);
      requireThat(!existsSync(runtime),'unsafe_environment');
      mkdirSync(runtime);
      container=`supabase_db_${project}`;
      requireThat(exec('supabase',['--version']).trim()==='2.116.0','environment_error');
      exec('supabase',['init','--help']); exec('supabase',['start','--help']); exec('supabase',['status','--help']); exec('supabase',['stop','--help']);
      exec('supabase',['init']);
      const target=join(runtime,'supabase/migrations'); mkdirSync(target,{recursive:true});
      for (const migration of expected.migrations) copyFileSync(join(source,'supabase/migrations',migration.name),join(target,migration.name));
      copyFileSync(aux,join(target,`${AUX_VERSION}_normalizar_acl_baseline_local.sql`));
      const config=join(runtime,'supabase/config.toml');
      writeFileSync(config,configureLocal(readFileSync(config,'utf8'),project));
      started=true; exec('supabase',['start']); // exactly one attempt; capture logs in memory only
      requireThat(freemem()>=1024**3,'memory_pressure');
      return {resources:91};
    });
    if(bootstrapOK) {
      const schemaOK=await check('environment.schema',async()=>{
        history=JSON.parse(sql(historySql));
        const versions=[...expected.migrations.map(m=>m.name.slice(0,14)),AUX_VERSION].sort();
        requireThat(JSON.stringify(history)===JSON.stringify(versions),'schema_mismatch');
        const metadata=JSON.parse(sql(`select json_build_object(
          'rls',(select bool_and(relrowsecurity) from pg_class where oid in ('public.favoritos'::regclass,'public.obras'::regclass,'public.preferencias_privacidade'::regclass)),
          'read_grants',has_table_privilege('anon','public.favoritos','select') and has_table_privilege('authenticated','public.favoritos','select') and has_table_privilege('anon','public.obras','select') and has_table_privilege('authenticated','public.obras','select'),
          'roles',(select json_object_agg(rolname,rolconfig) from pg_roles where rolname in ('anon','authenticated')),
          'indexes',(select json_agg(indexname order by indexname) from pg_indexes where schemaname='public' and tablename='favoritos'),
          'sql_fixture_collision',(select count(*) from auth.users where id::text like 'ce100000-0000-4000-8000-%'));
        `));
        requireThat(metadata.rls&&metadata.read_grants&&metadata.sql_fixture_collision===0,'schema_mismatch');
        requireThat(metadata.roles.anon.includes('statement_timeout=3s')&&metadata.roles.authenticated.includes('statement_timeout=8s'),'schema_mismatch');
        requireThat(metadata.indexes.includes('favoritos_user_id_obra_id_key')&&metadata.indexes.includes('favoritos_obra_id_idx'),'schema_mismatch');
        writeFileSync(join(reports,'schema.json'),JSON.stringify({base_sha:BASE_SHA,source_migrations:90,ci_auxiliaries:1,local_history:history.length,rls:true,read_grants:true,indexes:metadata.indexes.filter(n=>/^favoritos_[a-z0-9_]+$/.test(n))},null,2));
        return {resources:history.length};
      });
      if(schemaOK) {
        let env;
        const credentialsOK=await check('environment.api_credentials',async()=>{
          env=cliEnvironment(exec('supabase',['status','-o','env']));return {resources:1};
        });
        if(credentialsOK) {
          try { await runDataApi(new Api(env.url,env.key,env.service),check); }
          catch(error) { if(results.get('fixture.real_auth').status==='NOT_RUN') await check('fixture.real_auth',()=>{throw error;}); }
        }
        await check('sql.pending',async()=>{
          requireThat(freemem()>=1024**3,'memory_pressure');
          const input=readFileSync(join(here,'pending.sql'),'utf8');
          requireThat((input.match(/select is\(/g)??[]).length===2&&(input.match(/explain \(analyze,buffers,format json\)/g)??[]).length===4,'sql_assertion');
          const parsed=parsePendingOutput(sql(input)); plans.push(...parsed.plans);
          writeFileSync(join(reports,'plans.json'),JSON.stringify({plans},null,2));
          return {assertions:parsed.assertions,plans:parsed.plans.length};
        });
        await check('sql.rollback',async()=>{
          const count=Number(sql("select (select count(*) from auth.users where id::text like 'ce100000-0000-4000-8000-%')+(select count(*) from public.obras where id::text like 'ce200000-0000-4000-8000-%');").trim());
          requireThat(count===0&&JSON.stringify(JSON.parse(sql(historySql)))===JSON.stringify(history),'cleanup_error');
          return {rows:count};
        });
      }
    }
  } finally {
    if(started) await check('cleanup.stack',async()=>{exec('supabase',['stop']);return {resources:1};});
    for(const value of results.values()) if(value.status==='NOT_RUN') value.status='BLOCKED';
    const checks=[...results.values()];
    writeFileSync(join(reports,'plans.json'),JSON.stringify({plans},null,2));
    writeFileSync(join(reports,'summary.json'),JSON.stringify({base_sha:BASE_SHA,workers:1,retries:0,original_sql_assertions_rerun:0,complete:checks.every(c=>c.status!=='BLOCKED'),passed:checks.every(c=>c.status==='PASS'),checks,pass:checks.filter(c=>c.status==='PASS').length,fail:checks.filter(c=>c.status==='FAIL').length,blocked:checks.filter(c=>c.status==='BLOCKED').length},null,2));
    if(checks.some(c=>c.status!=='PASS')) process.exitCode=1;
  }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  main(process.argv[2]).catch(()=>{process.stderr.write('isolated_harness_failed\n');process.exitCode=1;});
}
