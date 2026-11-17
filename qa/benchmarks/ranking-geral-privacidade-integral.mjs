// Experimento EXCLUSIVAMENTE local: RLS anon por linha versus autorizacao em lote.
// Nao edita policies de public nem migrations do Historietas.
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";

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
const schema="qa_rls_conjunto";

const policy=sql("SELECT count(*)::int||'|'||bool_and(qual like '%usuario_pode_ver_registro_biblioteca%')::text "+
 "FROM pg_policies WHERE schemaname='public' AND tablename='obra_avaliacoes' AND "+
 "cmd IN ('SELECT','ALL') AND (roles @> ARRAY['anon'::name] OR roles @> ARRAY['public'::name]);");
assert.equal(policy,"1|true","RLS base das avaliacoes divergiu; interromper");
assert.equal(anon("SELECT auth.uid() IS NULL"),"t","O papel anon deve ter auth.uid() NULL");

sql([
 "CREATE SCHEMA "+schema+";",
 "REVOKE ALL ON SCHEMA "+schema+" FROM PUBLIC;",
 "GRANT USAGE ON SCHEMA "+schema+" TO anon;",
 "CREATE TABLE "+schema+".original (id bigint PRIMARY KEY,user_id uuid NOT NULL,"+
 "visibilidade text,nota numeric NOT NULL,obra_id uuid NOT NULL);",
 "CREATE TABLE "+schema+".conjunto (LIKE "+schema+".original INCLUDING ALL);",
 "ALTER TABLE "+schema+".original ENABLE ROW LEVEL SECURITY;",
 "ALTER TABLE "+schema+".conjunto ENABLE ROW LEVEL SECURITY;",
 "CREATE POLICY qa_original ON "+schema+".original FOR SELECT TO anon USING ("+
 "historietas_privado.usuario_pode_ver_registro_biblioteca(user_id,visibilidade,'obra_avaliacoes'));",
 // Função experimental apenas em schema QA, sem grant de API nem copia para migration.
 "CREATE FUNCTION "+schema+".autores_visiveis_anon() RETURNS TABLE(user_id uuid) "+
 "LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $fn$ "+
 "SELECT p.user_id FROM public.preferencias_privacidade p "+
 "WHERE p.mostrar_avaliacoes IS TRUE AND "+
 "public.usuario_pode_ver_aba_perfil(p.user_id,"+
 "coalesce(p.visibilidade_biblioteca,'somente_eu')) $fn$;",
 "REVOKE ALL ON FUNCTION "+schema+".autores_visiveis_anon() FROM PUBLIC;",
 "GRANT EXECUTE ON FUNCTION "+schema+".autores_visiveis_anon() TO anon;",
 "CREATE POLICY qa_conjunto ON "+schema+".conjunto FOR SELECT TO anon "+
 "USING (visibilidade IN ('publico','parcial') AND user_id IN ("+
 "SELECT v.user_id FROM "+schema+".autores_visiveis_anon() AS v));",
 "GRANT SELECT ON "+schema+".original,"+schema+".conjunto TO anon;",
 "INSERT INTO auth.users(id) SELECT "+uid+" FROM generate_series(1,256) i;",
 "INSERT INTO public.preferencias_privacidade("+
 "user_id,visibilidade_biblioteca,mostrar_avaliacoes,perfil_privado) "+
 "SELECT "+uid+",CASE WHEN i%13=0 THEN 'somente_eu' "+
 "WHEN i%13=1 THEN 'seguidores' WHEN i%13=2 THEN 'seguindo' "+
 "ELSE 'publico' END,(i%9<>0),false "+
 "FROM generate_series(1,256) i WHERE i%17<>0;"
].join("\n"),120000);
console.log("RLS_POLICY_GUARD_OK role=anon publico+parcial com preferencia original privada");

const userUuid=n=>"f8400000-0000-4000-8000-"+String(n).padStart(12,"0");
const workUuid=n=>"f8500000-0000-4000-8000-"+String(n).padStart(12,"0");
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
  "'QA '+i,CASE WHEN i=1 THEN 'autor' ELSE 'leitor' END "+
  "FROM (SELECT i,('f8400000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid AS id "+
  "FROM generate_series(1,256) i) x;");
}
function insertRange(start,end){
 const work="('f8500000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid";
 const voter="('f8400000-0000-4000-8000-'||"+
  "lpad((((i*11+j)%255)+2)::text,12,'0'))::uuid";
 sql("INSERT INTO public.obras(id,user_id,titulo,autor,genero,formato,"+
  "classificacao_indicativa,avisos_conteudo,publicado,arquivo_url,slug) "+
  "SELECT "+work+",'"+userUuid(1)+"'::uuid,'QA RLS '+i,'QA',"+
  "'Fantasia','HQ','Livre',ARRAY[]::text[],true,"+
  "'https://example.invalid/qa.txt','qa-2353-'+i "+
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
function switchToCandidate(){
 const original=sql("SELECT qual FROM pg_policies WHERE schemaname='public'"+
  " AND tablename='obra_avaliacoes' AND policyname='obra_avaliacoes_select_visiveis'");
 assert.ok(original.includes("usuario_pode_ver_registro_biblioteca"));
 sql("ALTER POLICY obra_avaliacoes_select_visiveis "+
  "ON public.obra_avaliacoes TO authenticated;"+
  "CREATE POLICY qa_anon_conjunto_2353 ON public.obra_avaliacoes "+
  "FOR SELECT TO anon USING (visibilidade IN ('publico','parcial') "+
  "AND user_id IN (SELECT user_id FROM "+schema+".autores_visiveis_anon()));");
 assert.equal(original,sql("SELECT qual FROM pg_policies WHERE schemaname='public'"+
  " AND tablename='obra_avaliacoes' AND policyname='obra_avaliacoes_select_visiveis'"),
  "Auth policy predicate changed");
 assert.equal(sql("SELECT has_function_privilege('anon','"+
  schema+".autores_visiveis_anon()','EXECUTE')::text||'|'"+
  "|has_function_privilege('authenticated','"+
  schema+".autores_visiveis_anon()','EXECUTE')::text"),
  "true|false");
 console.log("AUTHENTICATED_SELECT_POLICY_UNCHANGED");
}
function switchToBaseline(){
 sql("DROP POLICY qa_anon_conjunto_2353 ON public.obra_avaliacoes;"+
  "ALTER POLICY obra_avaliacoes_select_visiveis "+
  "ON public.obra_avaliacoes TO anon,authenticated;");
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
 const count=Number(anon("SELECT count(*) FROM "+schema+".autores_visiveis_anon()"));
 assert.ok(count>0,"Missing visible authors");
 assert.ok(anon("SELECT user_id::text FROM "+schema+
  ".autores_visiveis_anon() LIMIT 1").startsWith("f8400000"));
 console.log("SECURITY_FINDING: anon SQL can directly enumerate "+count+
  " user UUIDs via the privileged helper (unresolved design risk)");
 const key=vars.ANON_KEY||vars.PUBLISHABLE_KEY;
 assert.ok(key,"Supabase local anon key missing");
 const resp=await fetch(vars.API_URL+"/rest/v1/rpc/autores_visiveis_anon",{
  method:"POST",headers:{apikey:key,Authorization:"Bearer "+key,
  "Content-Type":"application/json"},body:"{}"});
 assert.notEqual(resp.status,200,"Private helper exposed through Data API");
 console.log("PRIVATE_HELPER_REST_TEST http_status="+resp.status+
  " directly_exposed=false");
}
async function main(){
 addProfiles();insertRange(1,1000);
 sql("INSERT INTO public.obra_avaliacoes(obra_id,user_id,nota,visibilidade) "+
  "VALUES ('"+workUuid(1)+"'::uuid,'"+userUuid(2)+"'::uuid,5,'privado');");
 assert.equal(logged("authenticated","SELECT auth.uid()::text",userUuid(2)),userUuid(2));
 const original4=snapshot(1000),baseline4=bench(1000,"current");
 switchToCandidate();
 equal(original4,snapshot(1000),"4001_votes");
 const candidate4=bench(1000,"set_based");
 assert.ok(Number(logged("authenticated","SELECT count(*) "+
  "FROM public.obra_avaliacoes WHERE user_id='"+userUuid(2)+
  "'::uuid AND visibilidade='privado'",userUuid(2)))>0);
 assert.equal(anon("SELECT count(*) FROM public.obra_avaliacoes "+
  "WHERE user_id='"+userUuid(2)+"'::uuid AND visibilidade='privado'"),"0");
 console.log("OWNER_PRIVATE_VISIBILITY_OK");
 await checkHelperExposure();
 sql("UPDATE public.preferencias_privacidade SET mostrar_avaliacoes=false "+
  "WHERE user_id='"+userUuid(4)+"'::uuid;");
 const revokedCandidate=snapshot(1000);
 switchToBaseline();
 equal(snapshot(1000),revokedCandidate,"revoked_preference");
 sql("UPDATE public.preferencias_privacidade SET mostrar_avaliacoes=true "+
  "WHERE user_id='"+userUuid(4)+"'::uuid;");
 for(let from=1001;from<=5000;from+=1000) insertRange(from,from+999);
 console.log("FIXTURE_20001_VOTES_READY");
 const original20=snapshot(5000),baseline20=bench(5000,"current");
 switchToCandidate();
 equal(original20,snapshot(5000),"20001_votes");
 const candidate20=bench(5000,"set_based");
 console.log("COMPLETE_RPC_RESULTS "+JSON.stringify({baseline4,candidate4,baseline20,candidate20,
  delta4_pct:Number(((candidate4/baseline4-1)*100).toFixed(2)),
  delta20_pct:Number(((candidate20/baseline20-1)*100).toFixed(2)),
  direct_sql_user_id_enumeration:true,
  production_approval:false}));
 console.log("QA_PRIVACY_INTEGRATED_PASS local runner only");
}
main().catch(e=>{console.error("QA_FAIL",String(e));process.exitCode=1;});
