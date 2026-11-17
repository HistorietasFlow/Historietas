// Experimento EXCLUSIVAMENTE local: RLS anon por linha versus autorizacao em lote.
// Nao edita policies de public nem migrations do Historietas.
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";

const envText=execFileSync("supabase",["status","-o","env"],{encoding:"utf8"});
const vars=Object.fromEntries(envText.split(/\r?\n/).map(line=>
  /^([A-Z0-9_]+)=(.*)$/.exec(line.trim())).filter(Boolean).map(m=>[m[1],
  m[2].startsWith('"')?JSON.parse(m[2]):m[2].replace(/^'|'$/g,"")]));
assert.ok(vars.API_URL && vars.DB_URL, "Supabase local obrigatorio");
for(const key of ["API_URL","DB_URL"]){
  const url=new URL(vars[key]);
  assert.ok(["localhost","127.0.0.1","[::1]"].includes(url.hostname),
    "PROIBIDO acessar banco remoto");
}
const port=new URL(vars.DB_URL).port;
const dbs=execFileSync("docker",["ps","--filter","publish="+port,"--format","{{.Names}}"],
  {encoding:"utf8"}).trim().split(/\r?\n/).filter(n=>/^supabase_db_/.test(n));
assert.equal(dbs.length,1,"Esperado um container PostgreSQL local");
function sql(code,timeout=60000){
  return execFileSync("docker",["exec","-i",dbs[0],"psql","-U","postgres","-d",
    "postgres","-X","-q","-A","-t","-v","ON_ERROR_STOP=1"],{
    input:code+"\n",encoding:"utf8",timeout,maxBuffer:8*1024*1024
  }).trim();
}
function anon(query) {
  return sql("BEGIN;\nSET LOCAL ROLE anon;\nSET LOCAL statement_timeout='8s';\n"+
    query+";\nROLLBACK;",60000);
}
const uid="('f8400000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid";
const schema="qa_rank_aggregate_2353";

const policy=sql("SELECT count(*)::int||'|'||bool_and(qual like '%usuario_pode_ver_registro_biblioteca%')::text "+
 "FROM pg_policies WHERE schemaname='public' AND tablename='obra_avaliacoes' AND "+
 "cmd IN ('SELECT','ALL') AND (roles @> ARRAY['anon'::name] OR roles @> ARRAY['public'::name]);");
assert.equal(policy,"1|true","RLS base das avaliacoes divergiu; interromper");
assert.equal(anon("SELECT auth.uid() IS NULL"),"t","O papel anon deve ter auth.uid() NULL");

// QA: private aggregate returns only obra_id, count and sum; never voter ids.
const schemaDDL=[
 "CREATE SCHEMA "+schema+" AUTHORIZATION postgres;",
 "REVOKE ALL ON SCHEMA "+schema+" FROM PUBLIC,authenticated,service_role;",
 "GRANT USAGE ON SCHEMA "+schema+" TO anon;",
 "CREATE FUNCTION "+schema+".votos_publicos() "+
 "RETURNS TABLE(obra_id uuid,total bigint,soma numeric) "+
 "LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $agg$ "+
 "WITH autores AS MATERIALIZED ( "+
 "SELECT p.user_id FROM public.preferencias_privacidade p "+
 "WHERE p.mostrar_avaliacoes IS TRUE AND "+
 "public.usuario_pode_ver_aba_perfil(p.user_id,"+
 "COALESCE(p.visibilidade_biblioteca,'somente_eu')) "+
 "), obras AS MATERIALIZED ( "+
 "SELECT o.id,o.user_id FROM public.obras o "+
 "WHERE o.publicado IS TRUE AND "+
 "o.classificacao_indicativa IN ('Livre','10+','12+','14+','16+') "+
 "AND (COALESCE(NULLIF(BTRIM(o.arquivo_url),''),'')<>'' "+
 "OR EXISTS (SELECT 1 FROM public.capitulos c "+
 "WHERE c.obra_id=o.id AND c.publicado IS TRUE)) "+
 ") SELECT a.obra_id,COUNT(*)::bigint,SUM(a.nota)::numeric "+
 "FROM public.obra_avaliacoes a "+
 "JOIN autores p ON p.user_id=a.user_id "+
 "JOIN obras o ON o.id=a.obra_id "+
 "WHERE (SELECT auth.uid()) IS NULL "+
 "AND a.visibilidade IN ('publico','parcial') "+
 "AND a.user_id<>o.user_id "+
 "GROUP BY a.obra_id $agg$;",
 "REVOKE ALL ON FUNCTION "+schema+".votos_publicos() "+
 "FROM PUBLIC,authenticated,service_role;",
 "GRANT EXECUTE ON FUNCTION "+schema+".votos_publicos() TO anon;",
 "INSERT INTO auth.users(id) SELECT "+uid+" FROM generate_series(1,256) i;",
 "INSERT INTO public.preferencias_privacidade("+
 "user_id,visibilidade_biblioteca,mostrar_avaliacoes,perfil_privado) "+
 "SELECT "+uid+",CASE WHEN i%13=0 THEN 'somente_eu' "+
 "WHEN i%13=1 THEN 'seguidores' WHEN i%13=2 THEN 'seguindo' "+
 "ELSE 'publico' END,(i%9<>0),false "+
 "FROM generate_series(1,256) i WHERE i%17<>0;"
].join("\n");
sql(schemaDDL);
const returnType=sql("SELECT pg_get_function_result('"+schema+
 ".votos_publicos()'::regprocedure)");
assert.ok(returnType.includes("obra_id uuid")&&returnType.includes("total bigint")&&
 returnType.includes("soma numeric")&&!returnType.includes("user_id"),
 "Function must not return evaluator UUIDs");
const acl=sql("SELECT has_function_privilege('anon','"+
 schema+".votos_publicos()','EXECUTE')::text||'|'||"+
 "has_function_privilege('authenticated','"+
 schema+".votos_publicos()','EXECUTE')::text");
assert.equal(acl,"true|false");
console.log("AGG_HELPER_PRIVACY_CONTRACT_OK no_voter_ids,anon_only");
function logged(role,query,user){
 let prefix="BEGIN;\nSET LOCAL ROLE "+role+";\n";
 if(user) prefix+="SET LOCAL request.jwt.claim.sub = '"+user+"';\n";
 return sql(prefix+"SET LOCAL statement_timeout='8s';\n"+query+";\nROLLBACK;");
}
const call=(role,query)=>role==="anon"?anon(query):
 role==="service_role"?logged("service_role",query):
 logged("authenticated",query,role);
function addProfiles(){
 sql("INSERT INTO public.profiles(id,user_id,nome,tipo) SELECT x.id,x.id,"+
  "'QA '||i,CASE WHEN i=1 THEN 'autor' ELSE 'leitor' END "+
  "FROM (SELECT i,('f8400000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid AS id "+
  "FROM generate_series(1,256) i) x;");
}
function insertRange(start,end){
 const work="('f8500000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid";
 const voter="('f8400000-0000-4000-8000-'||"+
  "lpad((((i*11+j)%255)+2)::text,12,'0'))::uuid";
 sql("INSERT INTO public.obras(id,user_id,titulo,autor,genero,formato,"+
  "classificacao_indicativa,avisos_conteudo,publicado,arquivo_url,slug) "+
  "SELECT "+work+",'"+userUuid(1)+"'::uuid,'QA RLS '||i,'QA',"+
  "'Fantasia','HQ','Livre',ARRAY[]::text[],true,"+
  "'https://example.invalid/qa.txt','qa-2353-'||i "+
  "FROM generate_series("+start+","+end+") i;");
 sql("INSERT INTO public.obra_avaliacoes(obra_id,user_id,nota,visibilidade) "+
  "SELECT "+work+","+voter+",(((i+j)%10+1)::numeric/2),"+
  "CASE WHEN (i+j)%7=0 THEN 'privado' "+
  "WHEN (i+j)%2=0 THEN 'parcial' ELSE 'publico' END "+
  "FROM generate_series("+start+","+end+") i "+
  "CROSS JOIN generate_series(0,3) j;");
}
function digest(role,n){
 const list=[];
 for(let i=1;i<=n;i+=1000){
  const stop=Math.min(n,i+999);
  list.push(call(role,"SELECT count(*)::text||'/'||"+
   "coalesce(md5(string_agg(id::text||':'||nota::text||':'||visibilidade,"+
   "'|' ORDER BY id)),'') FROM public.obra_avaliacoes "+
   "WHERE obra_id BETWEEN '"+workUuid(i)+"'::uuid AND '"+
   workUuid(stop)+"'::uuid"));
 }
 return list;
}
function rpc(){
 return anon("SELECT md5(coalesce(string_agg(row_to_json(r)::text,'|' "+
  "ORDER BY r.posicao),'')) FROM "+
  "public.listar_ranking_geral(NULL::uuid,NULL::text,20) r");
}
function snapshot(n){
 const roles=["anon",userUuid(2),userUuid(3),userUuid(253),"service_role"];
 return {allRoles:Object.fromEntries(roles.map(role=>[role,digest(role,n)])),
  fullRpc:rpc()};
}
function equal(a,b,label){
 assert.deepEqual(b,a,"Changed RLS visibility or RPC output: "+label);
 console.log("INTEGRATED_EQUIVALENCE_OK "+label+" roles=5,full_rpc=true");
}
const baselineMigration=readFileSync(
 "supabase/migrations/20261116230000_listar_ranking_geral.sql","utf8");
const oldStart=baselineMigration.indexOf("  votos_publicos as materialized (");
const oldEnd=baselineMigration.indexOf("  calculadas as materialized (");
assert.ok(oldStart>0&&oldEnd>oldStart);
const oldBlock=baselineMigration.slice(oldStart,oldEnd);
assert.ok(oldBlock.includes("public.obra_avaliacoes")&&oldBlock.includes("join obras_publicas"));
const newBlock="  votos_publicos as materialized ( "+
 "SELECT a.obra_id,a.total,a.soma "+
 "FROM "+schema+".votos_publicos() a "+
 "JOIN obras_publicas ob ON ob.id=a.obra_id ),\n  ";
const baseDdl=baselineMigration.replace("create function public.listar_ranking_geral(",
 "create or replace function public.listar_ranking_geral(");
const candidateDdl=baseDdl.replace(oldBlock,newBlock);
assert.ok(candidateDdl!==baseDdl && candidateDdl.includes("security invoker"));
const policyQual=sql("SELECT qual FROM pg_policies WHERE schemaname='public'"+
 " AND tablename='obra_avaliacoes' AND policyname='obra_avaliacoes_select_visiveis'");
function applySql(ddl){
 sql(ddl);
 assert.equal(sql("SELECT prosecdef::text FROM pg_proc "+
  "WHERE oid='public.listar_ranking_geral(uuid,text,integer)'::regprocedure"),
  "false","Public RPC must stay SECURITY INVOKER");
 assert.equal(sql("SELECT qual FROM pg_policies WHERE schemaname='public'"+
  " AND tablename='obra_avaliacoes' AND policyname='obra_avaliacoes_select_visiveis'"),
  policyQual,"Never change the original RLS policy");
}
function switchToCandidate(){
 applySql(candidateDdl);
 console.log("RPC_QA_AGGREGATE_ACTIVE raw_RLS_unchanged=true");
}
function switchToBaseline(){
 applySql(baseDdl);
}
function bench(n,variant){
 const ms=[];
 for(let i=0;i<5;i++){
  const plan=JSON.parse(anon("EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) "+
   "SELECT * FROM public.listar_ranking_geral(NULL::uuid,NULL::text,20)"))[0];
  if(i>=2) ms.push(plan["Execution Time"]);
 }
 const sorted=[...ms].sort((a,b)=>a-b),median=Number(sorted[1].toFixed(2));
 console.log("RPC_FULL_BENCH "+JSON.stringify({works:n,votes:n*4+1,variant,
  median_ms:median,samples_ms:ms.map(v=>Number(v.toFixed(2))),
  warmups:2,samples:3,sql_timeout_seconds:8,fixture:"synthetic_local"}));
 return median;
}
async function checkHelperExposure(){
 const count=Number(anon("SELECT count(*) FROM "+schema+".votos_publicos()"));
 assert.ok(count>0,"Expected public ranking aggregates");
 assert.equal(anon("SELECT count(*) FROM "+schema+".votos_publicos() "+
  "WHERE obra_id IN ('"+workUuid(5001)+"'::uuid,'"+
  workUuid(5002)+"'::uuid,'"+workUuid(5003)+"'::uuid)"),"0",
  "No adult, draft or unfilled work should be published by helper");
 const colInfo=sql("SELECT pg_get_function_result('"+schema+
  ".votos_publicos()'::regprocedure)");
 assert.ok(!colInfo.includes("user_id")&&!colInfo.includes("avaliador"),
  "Never return evaluator identifiers");
 const noAnonIdentity=logged("anon","SELECT count(*) FROM "+
  schema+".votos_publicos()",userUuid(3));
 assert.equal(noAnonIdentity,"0","Helper must reject claimed authenticated ID");
 assert.equal(logged("authenticated","SELECT has_function_privilege(current_user,'"+
  schema+".votos_publicos()','EXECUTE')::text",userUuid(3)),"false",
  "Authenticated cannot invoke helper");
 const key=vars.ANON_KEY||vars.PUBLISHABLE_KEY;
 assert.ok(key,"Local anon key missing");
 const resp=await fetch(vars.API_URL+"/rest/v1/rpc/votos_publicos",{
  method:"POST",headers:{apikey:key,Authorization:"Bearer "+key,
  "Content-Type":"application/json"},body:"{}"});
 assert.equal(resp.status,404,"Aggregate must not be exposed by Data API");
 console.log("PRIVATE_AGGREGATE_ACCESS_OK anon_sql_can_fetch_work_aggregate=true,"+
  "direct_voter_ids_exposed=false,data_api_http=404,authenticated_denied=true");
}
async function main(){
 addProfiles();insertRange(1,1000);
 // Explicitly rejected adult, draft and empty-content works.
 const exclusion="('f8500000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid";
 sql("INSERT INTO public.obras(id,user_id,titulo,autor,genero,formato,"+
  "classificacao_indicativa,avisos_conteudo,publicado,arquivo_url,slug) "+
  "SELECT "+exclusion+",'"+userUuid(1)+"'::uuid,'QA excluded '||i,"+
  "'QA','Fantasia','HQ',CASE WHEN i=5001 THEN '18+' ELSE 'Livre' END,"+
  "CASE WHEN i=5001 THEN ARRAY['violencia_intensa']::text[] "+
  "ELSE ARRAY[]::text[] END,i<>5002,"+
  "CASE WHEN i=5003 THEN '' ELSE 'https://example.invalid/qa.txt' END,"+
  "'qa-excluded-2353-'||i FROM generate_series(5001,5003) i;");
 sql("INSERT INTO public.obra_avaliacoes(obra_id,user_id,nota,visibilidade) "+
  "SELECT "+exclusion+",'"+userUuid(2)+"'::uuid,5,'publico' "+
  "FROM generate_series(5001,5003) i;");
 sql("INSERT INTO public.obra_avaliacoes(obra_id,user_id,nota,visibilidade) "+
  "VALUES ('"+workUuid(1)+"'::uuid,'"+userUuid(2)+"'::uuid,5,'privado');");
 assert.equal(logged("authenticated","SELECT auth.uid()::text",userUuid(2)),userUuid(2));
 const original4=snapshot(1000),baseline4=bench(1000,"current");
 await checkHelperExposure();
 switchToCandidate();
 equal(original4,snapshot(1000),"4001_votes");
 const candidate4=bench(1000,"aggregate_only");
 const owner=Number(logged("authenticated","SELECT count(*) "+
  "FROM public.obra_avaliacoes WHERE user_id='"+userUuid(2)+
  "'::uuid AND visibilidade='privado'",userUuid(2)));
 assert.ok(owner>0);
 assert.equal(anon("SELECT count(*) FROM public.obra_avaliacoes "+
  "WHERE user_id='"+userUuid(2)+"'::uuid AND visibilidade='privado'"),"0");
 console.log("OWNER_PRIVATE_VISIBILITY_OK");
 sql("UPDATE public.preferencias_privacidade SET mostrar_avaliacoes=false "+
  "WHERE user_id='"+userUuid(4)+"'::uuid;");
 const revokedCandidate=snapshot(1000);
 switchToBaseline();
 equal(snapshot(1000),revokedCandidate,"revoked_preference");
 sql("UPDATE public.preferencias_privacidade SET mostrar_avaliacoes=true "+
  "WHERE user_id='"+userUuid(4)+"'::uuid;");
 for(let from=1001;from<=5000;from+=1000)insertRange(from,from+999);
 console.log("FIXTURE_20001_VOTES_READY");
 const original20=snapshot(5000),baseline20=bench(5000,"current");
 switchToCandidate();
 equal(original20,snapshot(5000),"20001_votes");
 const candidate20=bench(5000,"aggregate_only");
 console.log("COMPLETE_RPC_RESULTS "+JSON.stringify({baseline4,candidate4,baseline20,candidate20,
  delta4_pct:Number(((candidate4/baseline4-1)*100).toFixed(2)),
  delta20_pct:Number(((candidate20/baseline20-1)*100).toFixed(2)),
  direct_voter_id_enumeration:false,
  privileged_aggregate_bypasses_vote_RLS:true,
  production_approval:false}));
 console.log("QA_AGGREGATE_PRIVACY_DONE no_data_or_migrations_persisted");
}
main().catch(e=>{console.error("QA_FAIL",String(e));process.exitCode=1;});
