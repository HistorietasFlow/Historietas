// Experimento EXCLUSIVAMENTE local: RLS anon por linha versus autorizacao em lote.
// Nao edita policies de public nem migrations do Historietas.
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";

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
const userUuid=n=>"f8400000-0000-4000-8000-"+String(n).padStart(12,"0");
const workUuid=n=>"f8500000-0000-4000-8000-"+String(n).padStart(12,"0");
const schema="historietas_privado";

const policy=sql("SELECT count(*)::int||'|'||bool_and(qual like '%usuario_pode_ver_registro_biblioteca%')::text "+
 "FROM pg_policies WHERE schemaname='public' AND tablename='obra_avaliacoes' AND "+
 "cmd IN ('SELECT','ALL') AND (roles @> ARRAY['anon'::name] OR roles @> ARRAY['public'::name]);");
assert.equal(policy,"1|true","RLS base das avaliacoes divergiu; interromper");
assert.equal(anon("SELECT auth.uid() IS NULL"),"t","O papel anon deve ter auth.uid() NULL");

// QA: private aggregate returns only obra_id, count and sum; never voter ids.

function logged(role,query,user){
 let prefix="BEGIN;\nSET LOCAL ROLE "+role+";\n";
 if(user) prefix+="SET LOCAL request.jwt.claim.sub = '"+user+"';\n";
 return sql(prefix+"SET LOCAL statement_timeout='8s';\n"+query+";\nROLLBACK;");
}
function addProfiles(){
 sql("INSERT INTO auth.users(id) SELECT "+uid+" FROM generate_series(1,256) i;");
 sql("INSERT INTO public.profiles(id,user_id,nome,tipo) SELECT x.id,x.id,"+
  "'QA '||i,CASE WHEN i=1 THEN 'autor' ELSE 'leitor' END "+
  "FROM (SELECT i,('f8400000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid AS id "+
  "FROM generate_series(1,256) i) x;");
 sql("INSERT INTO public.preferencias_privacidade("+
  "user_id,visibilidade_biblioteca,mostrar_avaliacoes,perfil_privado) "+
  "SELECT "+uid+",CASE WHEN i%13=0 THEN 'somente_eu' "+
  "WHEN i%13=1 THEN 'seguidores' WHEN i%13=2 THEN 'seguindo' "+
  "ELSE 'publico' END,(i%9<>0),false "+
  "FROM generate_series(1,256) i WHERE i%17<>0;");
 console.log("QA_FIXTURE_PRIVACY_OK synthetic_users=256 "+
  "preferences_inserted=true public_partial_private_variants=true");
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


// Regression executes real migrated functions, never recreates SQL.
const privateSignature=schema+".listar_ranking_geral_nucleo(uuid,text,integer)";
const acl=sql("SELECT has_function_privilege('anon','"+privateSignature+
 "','EXECUTE')::text||'|'||has_function_privilege('authenticated','"+
 privateSignature+"','EXECUTE')::text");
assert.equal(acl,"true|false","The private function must be anon-only");
assert.equal(sql("SELECT prosecdef::text FROM pg_proc WHERE oid='"+
 privateSignature+"'::regprocedure"),"true");
assert.equal(sql("SELECT prosecdef::text FROM pg_proc WHERE oid="+
 "'public.listar_ranking_geral(uuid,text,integer)'::regprocedure"),"false");
const resultType=sql("SELECT pg_get_function_result('"+privateSignature+"'::regprocedure)");
assert.ok(!resultType.includes("user_id")&&!resultType.includes("soma numeric"));
console.log("QA_MIGRATION_CONTRACT_OK anon_privileged_paged_only");

function page(which,after=null,sig=null,limit=50){
 const args=after?"'"+after+"'::uuid,'"+sig+"'::text,"+limit:
  "NULL::uuid,NULL::text,"+limit;
 const name=which==="private"?schema+".listar_ranking_geral_nucleo":
  "public.listar_ranking_geral";
 return JSON.parse(anon("SELECT COALESCE(json_agg(row_to_json(r) ORDER BY r.posicao),"+
 "'[]'::json)::text FROM "+name+"("+args+") r"));
}
function denied(stmt,role,user=null){
 try {logged(role,stmt,user);return false;}catch(e){
  return /ERROR:|permission denied/.test(String(e?.stderr||e));
 }
}
async function surface(){
 assert.deepEqual(page("private",null,null,20),page("public",null,null,20));
 assert.ok(denied("SELECT count(*) FROM "+schema+
  ".listar_ranking_geral_nucleo(NULL::uuid,NULL::text,51)","anon"),"Direct helper bypassed page cap");
 assert.ok(denied("SELECT count(*) FROM "+schema+
  ".listar_ranking_geral_nucleo(NULL::uuid,NULL::text,20)","authenticated",userUuid(3)),
  "Authenticated can call private helper");
 assert.ok(denied("SELECT count(*) FROM "+schema+
  ".listar_ranking_geral_nucleo(NULL::uuid,NULL::text,20)","anon",userUuid(3)),
  "Claimed user can call private helper");
 const key=vars.ANON_KEY||vars.PUBLISHABLE_KEY;
 assert.ok(key);
 const response=await fetch(vars.API_URL+"/rest/v1/rpc/listar_ranking_geral_nucleo",{
  method:"POST",headers:{apikey:key,Authorization:"Bearer "+key,
   "Content-Type":"application/json"},body:"{}"});
 assert.equal(response.status,404);
 console.log("DIRECT_ACCESS_PARITY_OK private_result_identical_to_public_page,anon_cap=50,hidden_REST_404");
}
function extra(){
 const e="('f8500000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid";
 sql("INSERT INTO public.obras(id,user_id,titulo,autor,genero,formato,"+
  "classificacao_indicativa,avisos_conteudo,publicado,arquivo_url,slug) "+
  "SELECT "+e+",'"+userUuid(1)+"'::uuid,'QA exclude '||i,'QA',"+
  "'Fantasia','HQ',CASE WHEN i=5001 THEN '18+' ELSE 'Livre' END,"+
  "CASE WHEN i=5001 THEN ARRAY['violencia_intensa']::text[] ELSE ARRAY[]::text[] END,"+
  "i<>5002,CASE WHEN i=5003 THEN '' ELSE 'https://example.invalid/qa.txt' END,"+
  "'qa-exception-'||i FROM generate_series(5001,5003) i;");
 sql("INSERT INTO public.obras(id,user_id,titulo,autor,genero,formato,"+
  "classificacao_indicativa,avisos_conteudo,publicado,arquivo_url,slug) VALUES "+
  "('"+workUuid(5004)+"'::uuid,'"+userUuid(1)+"'::uuid,"+
  "'QA legacy','QA','Fantasia','HQ','Livre',ARRAY[]::text[],true,'','qa-legacy'),"+
  "('"+workUuid(5005)+"'::uuid,'"+userUuid(1)+"'::uuid,"+
  "'QA good','QA','Fantasia','HQ','Livre',ARRAY[]::text[],true,'','qa-good');");
 // Only disposable QA: simulate a legacy chapter with inconsistent author.
 sql("ALTER TABLE public.capitulos DISABLE TRIGGER USER;"+
  "INSERT INTO public.capitulos(obra_id,user_id,titulo,texto,ordem,publicado) VALUES "+
  "('"+workUuid(5004)+"'::uuid,'"+userUuid(2)+"'::uuid,'Legado','Texto',1,true),"+
  "('"+workUuid(5005)+"'::uuid,'"+userUuid(1)+"'::uuid,'Valido','Texto',1,true);"+
  "ALTER TABLE public.capitulos ENABLE TRIGGER USER;");
 sql("INSERT INTO public.obra_avaliacoes(obra_id,user_id,nota,visibilidade) "+
  "SELECT "+e+",'"+userUuid(5)+"'::uuid,5,'publico' "+
  "FROM generate_series(5001,5005) i;");
 assert.equal(anon("SELECT count(*) FROM public.capitulos c WHERE c.obra_id='"+
  workUuid(5004)+"'::uuid"),"0","Legacy mismatch must be hidden by RLS");
 assert.equal(anon("SELECT count(*) FROM public.capitulos c WHERE c.obra_id='"+
  workUuid(5005)+"'::uuid"),"1","Valid chapter-only must be visible");
 console.log("LEGACY_CHAPTER_POLICY_OK mismatch_hidden=true valid_visible=true");
}
// A referencia usa a RLS anon real em blocos de ate 1.000 obras.
// O resultado e ordenado globalmente com comparacao racional exata.
function sumTenths(value) {
 const x=String(value);
 assert.match(x,/^\d+(?:\.\d+)?$/,"Soma numerica inesperada");
 const [whole,decimal=""] = x.split(".");
 assert.ok(!/[1-9]/.test(decimal.slice(1)),
  "Notas de meia estrela devem ter no maximo um digito decimal nao zero");
 return BigInt(whole)*10n + BigInt(decimal[0]||"0");
}
function baselineAggregates(stage){
 const maxWork=stage==="20k"?5000:1000;
 const ranges=[];
 for(let first=1;first<=maxWork;first+=1000)
  ranges.push([first,Math.min(maxWork,first+999)]);
 ranges.push([5001,5005]); // 18+, draft, vazio, legado, capitulo valido.
 let rows=[];
 for(const [first,last] of ranges){
  const q="WITH works AS MATERIALIZED ("+
   "SELECT o.id,o.user_id FROM public.obras o "+
   "WHERE o.id BETWEEN '"+workUuid(first)+"'::uuid AND '"+
    workUuid(last)+"'::uuid "+
   "AND o.publicado IS TRUE AND "+
   "o.classificacao_indicativa IN ('Livre','10+','12+','14+','16+') "+
   "AND (COALESCE(NULLIF(BTRIM(o.arquivo_url),''),'')<>'' OR EXISTS ("+
   "SELECT 1 FROM public.capitulos c WHERE c.obra_id=o.id "+
   "AND c.publicado IS TRUE))"+
   "), votes AS MATERIALIZED ("+
   "SELECT a.obra_id,COUNT(*)::bigint n,SUM(a.nota)::numeric s "+
   "FROM public.obra_avaliacoes a JOIN works w ON w.id=a.obra_id "+
   "WHERE a.user_id<>w.user_id GROUP BY a.obra_id) "+
   "SELECT COALESCE(json_agg(json_build_object('id',obra_id,'n',n,'s',s::text)),"+
   "'[]'::json)::text FROM votes";
  const fragment=JSON.parse(anon(q));
  assert.ok(Array.isArray(fragment),"Bloco anon deve retornar lista");
  rows.push(...fragment);
 }
 const ids=new Set(rows.map(x=>x.id));
 assert.equal(ids.size,rows.length,"Agregados duplicados entre blocos anon");
 assert.ok(rows.length>0,"Nenhum voto publico na referencia");
 const lexical=[...rows].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
 const signature=createHash("md5").update(
  lexical.map(r=>r.id+":"+String(r.n)+":"+String(r.s)).join("|")
 ).digest("hex");
 const scoreNumber=r=>sumTenths(r.s)+300n;
 rows.sort((a,b)=>{
  const left=scoreNumber(a)*(BigInt(b.n)+10n);
  const right=scoreNumber(b)*(BigInt(a.n)+10n);
  if(left!==right)return left>right?-1:1;
  if(a.n!==b.n)return a.n>b.n?-1:1;
  return a.id<b.id?-1:a.id>b.id?1:0;
 });
 console.log("RLS_REFERENCE_CHUNKS_OK stage="+stage+
  " chunks="+ranges.length+" works="+rows.length+" sql_timeout_s=8");
 return {rows,signature};
}
function allPages(){
 let after=null,sig=null,items=[];
 for(let i=0;i<140;i++){
  const p=page("public",after,sig,50);
  if(!p.length)break;
  assert.ok(p.length<=50&&p.every(r=>r.estado==="ok"),"Invalid page");
  if(sig)assert.equal(p[0].assinatura,sig);
  sig=p[0].assinatura;items.push(...p);
  if(!p[0].tem_mais)break;
  assert.equal(p.length,50,"Full page expected");
  after=p.at(-1).obra_id;
 }
 assert.ok(items.length<7000,"Pagination nonterminating");
 return {items,signature:sig};
}
function global(label){
 const actual=allPages(),expected=baselineAggregates(label);
 assert.ok(expected.rows.length>0,
  "Fixture inválida: nenhuma avaliação pública; comparar ranking vazio não prova equivalência");
 console.log("QA_GLOBAL_DIAGNOSTIC "+JSON.stringify({
  stage:label,expected_works:expected.rows.length,
  returned_works:actual.items.length,
  expected_signature:expected.signature,actual_signature:actual.signature
 }));
 assert.equal(actual.signature,expected.signature,"Signature mismatch "+label);
 assert.equal(actual.items.length,expected.rows.length,"Global rows mismatch "+label);
 for(let i=0;i<expected.rows.length;i++){
  const e=expected.rows[i],a=actual.items[i];
  assert.equal(a.obra_id,e.id,"Work mismatch rank="+i+" "+label);
  assert.equal(a.total_avaliacoes,e.n,"Count mismatch "+e.id);
  assert.ok(Math.abs(Number(a.nota_media)*e.n-Number(e.s))<1e-7,
   "Sum mismatch "+e.id);
  assert.equal(a.posicao,i+1,"Position mismatch "+e.id);
 }
 const ids=actual.items.map(x=>x.obra_id);
 for(const i of [5001,5002,5003,5004])
  assert.ok(!ids.includes(workUuid(i)),"Ineligible work "+i+" leaked");
 // Após revogação, obra válida sem avaliações públicas deve sair do ranking.
 const votingVisible=Number(anon("SELECT count(*) FROM public.obra_avaliacoes "+
  "WHERE obra_id='"+workUuid(5005)+"'::uuid"));
 const expectedPresent=label==="4k_revoked"?false:true;
 assert.equal(votingVisible>0,expectedPresent,
  "Fixture: consentimento sintético do único avaliador inesperado "+label);
 assert.equal(ids.includes(workUuid(5005)),expectedPresent,
  "Chapter-only ranking must follow anonymous vote visibility "+label);
 console.log("GLOBAL_MATCH_OK "+label+" works="+actual.items.length+
  " all_sums_counts_positions_signature=true");
 return actual;
}
function perf(label){
 let t=[];
 for(let i=0;i<5;i++){
  const x=JSON.parse(anon("EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) "+
   "SELECT * FROM public.listar_ranking_geral(NULL::uuid,NULL::text,20)"))[0];
  if(i>=2)t.push(x["Execution Time"]);
 }
 t.sort((a,b)=>a-b);
 const ms=Number(t[1].toFixed(2));
 console.log("RPC_BENCH "+JSON.stringify({variant:label,median_ms:ms,samples_ms:t,
  sql_timeout_s:8,synthetic_local:true}));
 return ms;
}
async function main(){
 addProfiles();insertRange(1,1000);extra();
 sql("INSERT INTO public.obra_avaliacoes(obra_id,user_id,nota,visibilidade) "+
  "VALUES ('"+workUuid(1)+"'::uuid,'"+userUuid(2)+"'::uuid,5,'privado');");
 assert.equal(anon("SELECT current_setting('role',true)"),"anon");
 global("4k");await surface();
 const optimized4=perf("optimized_4k");
 const owner=Number(logged("authenticated","SELECT count(*) "+
  "FROM public.obra_avaliacoes WHERE user_id='"+userUuid(2)+
  "'::uuid AND visibilidade='privado'",userUuid(2)));
 assert.ok(owner>0,"Owner private ratings inaccessible");
 assert.equal(anon("SELECT count(*) FROM public.obra_avaliacoes WHERE user_id='"+
  userUuid(2)+"'::uuid AND visibilidade='privado'"),"0");
 const first=page("public",null,null,20);
 sql("UPDATE public.preferencias_privacidade SET mostrar_avaliacoes=false "+
  "WHERE user_id='"+userUuid(5)+"'::uuid;");
 const stale=page("public",first.at(-1).obra_id,first[0].assinatura,20);
 assert.equal(stale[0]?.estado,"cursor_desatualizado","Must revoke stale cursor");
 global("4k_revoked");
 sql("UPDATE public.preferencias_privacidade SET mostrar_avaliacoes=true "+
  "WHERE user_id='"+userUuid(5)+"'::uuid;");
 for(let i=1001;i<=5000;i+=1000)insertRange(i,i+999);
 global("20k");const optimized20=perf("optimized_20k");
 console.log("SECURITY_QA_RESULT "+JSON.stringify({optimized4,optimized20,
  globalComparison:true,privatePagedOnly:true,legacyChapterChecked:true,
  productionApproval:false}));
}
main().catch(e=>{console.error("QA_FAILURE",e?.stack||String(e));process.exitCode=1;});
