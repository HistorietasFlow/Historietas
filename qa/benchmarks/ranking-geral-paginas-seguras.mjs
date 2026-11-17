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
const userUuid=n=>"f8400000-0000-4000-8000-"+String(n).padStart(12,"0");
const workUuid=n=>"f8500000-0000-4000-8000-"+String(n).padStart(12,"0");
const schema="qa_rank_page_2353";

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


const migration=readFileSync("supabase/migrations/20261116230000_listar_ranking_geral.sql","utf8");
const st=migration.indexOf("create function public.listar_ranking_geral(");
const ed=migration.indexOf("\n$func$;",st);
assert.ok(st>=0&&ed>st);
const original=migration.slice(st,ed+8);
const vs=original.indexOf("  votos_publicos as materialized (");
const ve=original.indexOf("  calculadas as materialized (");
assert.ok(vs>0&&ve>vs);
const votes="  autores_autorizados as materialized ( "+
 "SELECT p.user_id FROM public.preferencias_privacidade p "+
 "WHERE historietas_privado.usuario_pode_ver_registro_biblioteca"+
 "(p.user_id,'parcial','obra_avaliacoes') ), "+
 "votos_publicos as materialized ( "+
 "SELECT a.obra_id,COUNT(*)::bigint AS total,SUM(a.nota)::numeric AS soma "+
 "FROM public.obra_avaliacoes a "+
 "JOIN obras_publicas o ON o.id=a.obra_id "+
 "JOIN autores_autorizados u ON u.user_id=a.user_id "+
 "WHERE a.visibilidade IN ('publico','parcial') "+
 "AND a.user_id<>o.user_id GROUP BY a.obra_id ),\n  ";
const privateSignature=schema+".listar_pagina(uuid,text,integer)";
const helper=original.replace("create function public.listar_ranking_geral(",
 "create function "+schema+".listar_pagina(")
 .replace("security invoker","security definer")
 .replace("if current_user <> 'anon' then",
 "if current_setting('role',true) IS DISTINCT FROM 'anon' OR auth.uid() IS NOT NULL then")
 .replace("and capitulo.publicado is true",
 "and capitulo.publicado is true AND capitulo.user_id = obra.user_id")
 .replace(original.slice(vs,ve),votes);
assert.ok(helper.includes("SECURITY DEFINER".toLowerCase())&&
 helper.includes("capitulo.user_id = obra.user_id")&&
 helper.includes("historietas_privado.usuario_pode_ver_registro_biblioteca"));
const wrapper="CREATE OR REPLACE FUNCTION public.listar_ranking_geral("+
 "p_apos_obra uuid DEFAULT NULL,p_assinatura text DEFAULT NULL,p_limite integer DEFAULT 20) "+
 "RETURNS TABLE (estado text,obra_id uuid,posicao bigint,nota_media numeric,"+
 "total_avaliacoes bigint,pontuacao numeric,assinatura text,tem_mais boolean) "+
 "LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $wrap$ "+
 "BEGIN IF current_user <> 'anon' OR auth.uid() IS NOT NULL THEN "+
 "RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='O Ranking Geral exige contexto anonimo.';"+
 "END IF; RETURN QUERY SELECT r.* FROM "+schema+
 ".listar_pagina(p_apos_obra,p_assinatura,p_limite) AS r; END $wrap$;";
sql("CREATE SCHEMA "+schema+" AUTHORIZATION postgres;"+
 "REVOKE ALL ON SCHEMA "+schema+" FROM PUBLIC,authenticated,service_role;"+
 "GRANT USAGE ON SCHEMA "+schema+" TO anon;"+helper+
 "REVOKE ALL ON FUNCTION "+privateSignature+" FROM PUBLIC,authenticated,service_role;"+
 "GRANT EXECUTE ON FUNCTION "+privateSignature+" TO anon;");
const contract=sql("SELECT pg_get_function_result('"+privateSignature+"'::regprocedure)");
assert.ok(contract.includes("total_avaliacoes bigint")&&contract.includes("assinatura text")&&
 !contract.includes("user_id")&&!contract.includes("soma numeric"));
const grants=sql("SELECT has_function_privilege('anon','"+privateSignature+
 "','EXECUTE')::text||'|'||has_function_privilege('authenticated','"+
 privateSignature+"','EXECUTE')::text");
assert.equal(grants,"true|false");
const oldQual=sql("SELECT qual FROM pg_policies WHERE schemaname='public' AND "+
 "tablename='obra_avaliacoes' AND policyname='obra_avaliacoes_select_visiveis'");
const oldAcl=sql("SELECT COALESCE(proacl::text,'NULL') FROM pg_proc WHERE oid="+
 "'public.listar_ranking_geral(uuid,text,integer)'::regprocedure");
function assertContracts(){
 assert.equal(sql("SELECT prosecdef::text FROM pg_proc WHERE oid="+
 "'public.listar_ranking_geral(uuid,text,integer)'::regprocedure"),"false");
 assert.equal(sql("SELECT qual FROM pg_policies WHERE schemaname='public' AND "+
  "tablename='obra_avaliacoes' AND policyname='obra_avaliacoes_select_visiveis'"),oldQual);
 assert.equal(sql("SELECT COALESCE(proacl::text,'NULL') FROM pg_proc WHERE oid="+
 "'public.listar_ranking_geral(uuid,text,integer)'::regprocedure"),oldAcl);
}
function candidate(){sql(wrapper);assertContracts()}
function baseline(){sql("CREATE OR REPLACE "+original.slice("create ".length));assertContracts()}
function page(which,after=null,sig=null,limit=50){
 const args=after?"'"+after+"'::uuid,'"+sig+"'::text,"+limit:
  "NULL::uuid,NULL::text,"+limit;
 const name=which==="private"?schema+".listar_pagina":
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
  ".listar_pagina(NULL::uuid,NULL::text,51)","anon"),"Direct helper bypassed page cap");
 assert.ok(denied("SELECT count(*) FROM "+schema+
  ".listar_pagina(NULL::uuid,NULL::text,20)","authenticated",userUuid(3)),
  "Authenticated can call private helper");
 assert.ok(denied("SELECT count(*) FROM "+schema+
  ".listar_pagina(NULL::uuid,NULL::text,20)","anon",userUuid(3)),
  "Claimed user can call private helper");
 const key=vars.ANON_KEY||vars.PUBLISHABLE_KEY;
 assert.ok(key);
 const response=await fetch(vars.API_URL+"/rest/v1/rpc/listar_pagina",{
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
function baselineAggregates(){
 const q="WITH works AS MATERIALIZED ("+
 "SELECT o.id,o.user_id FROM public.obras o WHERE o.publicado IS TRUE "+
 "AND o.classificacao_indicativa IN ('Livre','10+','12+','14+','16+') "+
 "AND (COALESCE(NULLIF(BTRIM(o.arquivo_url),''),'')<>'' OR EXISTS ("+
 "SELECT 1 FROM public.capitulos c WHERE c.obra_id=o.id AND c.publicado IS TRUE))"+
 "), votes AS MATERIALIZED ("+
 "SELECT a.obra_id,COUNT(*)::bigint n,SUM(a.nota)::numeric s "+
 "FROM public.obra_avaliacoes a JOIN works w ON w.id=a.obra_id "+
 "WHERE a.user_id<>w.user_id GROUP BY a.obra_id) "+
 "SELECT json_build_object('rows',"+
 "COALESCE((SELECT json_agg(json_build_object('id',obra_id,'n',n,'s',s::text) "+
 "ORDER BY (s+30::numeric)/(n+10::numeric) DESC,n DESC,obra_id) FROM votes),'[]'::json),"+
 "'signature',(SELECT md5(COALESCE(string_agg(obra_id::text||':'||n::text||':'||s::text,"+
 "'|' ORDER BY obra_id),'')) FROM votes))::text";
 return JSON.parse(anon(q));
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
 const actual=allPages(),expected=baselineAggregates();
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
 assert.ok(ids.includes(workUuid(5005)),"Valid chapter-only missing");
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
 assert.equal(anon("SELECT current_setting('role',true)"),"anon","Role GUC unavailable");
 const old4=perf("baseline_4k");
 candidate();
 global("4k");await surface();
 const new4=perf("candidate_4k");
 const own=Number(logged("authenticated","SELECT count(*) FROM public.obra_avaliacoes "+
  "WHERE user_id='"+userUuid(2)+"'::uuid AND visibilidade='privado'",userUuid(2)));
 assert.ok(own>0,"Owner cannot read private");
 assert.equal(anon("SELECT count(*) FROM public.obra_avaliacoes "+
  "WHERE user_id='"+userUuid(2)+"'::uuid AND visibilidade='privado'"),"0");
 const oldPage=page("public",null,null,20);
 sql("UPDATE public.preferencias_privacidade SET mostrar_avaliacoes=false "+
  "WHERE user_id='"+userUuid(5)+"'::uuid;");
 const stale=page("public",oldPage.at(-1).obra_id,oldPage[0].assinatura,20);
 assert.equal(stale[0]?.estado,"cursor_desatualizado","Revocation must invalidate cursor");
 global("4k_revoked");
 sql("UPDATE public.preferencias_privacidade SET mostrar_avaliacoes=true "+
  "WHERE user_id='"+userUuid(5)+"'::uuid;");
 for(let i=1001;i<=5000;i+=1000)insertRange(i,i+999);
 baseline();const old20=perf("baseline_20k");
 candidate();global("20k");const new20=perf("candidate_20k");
 console.log("RESULT "+JSON.stringify({old4,new4,old20,new20,global_verified:true,
  definer_direct_parity:true,production_approval:false}));
}
main().catch(e=>{console.error("QA_FAILURE",e?.stack||String(e));process.exitCode=1;});
