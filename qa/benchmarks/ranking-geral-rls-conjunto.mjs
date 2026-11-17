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
function generate(rows,users) {
  const votante="((i*11)%"+users+"+1)";
  const vis="CASE WHEN i%17=0 THEN NULL::text WHEN i%19=0 THEN 'invalida' "+
    "WHEN i%7=0 THEN 'privado' WHEN i%2=0 THEN 'parcial' ELSE 'publico' END";
  const statements=[
    "TRUNCATE "+schema+".original,"+schema+".conjunto;",
    "INSERT INTO "+schema+".original (id,user_id,visibilidade,nota,obra_id) "+
    "SELECT i,('f8400000-0000-4000-8000-'||lpad("+votante+"::text,12,'0'))::uuid,"+
    vis+",((i%10+1)::numeric/2),"+
    "('f8500000-0000-4000-8000-'||lpad(((i%1000)+1)::text,12,'0'))::uuid "+
    "FROM generate_series(1,"+rows+") i;",
    "INSERT INTO "+schema+".conjunto SELECT * FROM "+schema+".original;",
    "ANALYZE "+schema+".original;",
    "ANALYZE "+schema+".conjunto;"
  ];
  sql(statements.join("\n"),120000);
}
function equality(stage){
  const mismatches=anon("SELECT count(*) FROM ("+
    "(SELECT id FROM "+schema+".original EXCEPT SELECT id FROM "+schema+".conjunto) "+
    "UNION ALL (SELECT id FROM "+schema+".conjunto EXCEPT SELECT id FROM "+schema+".original)"+
    ") AS diffs");
  assert.equal(mismatches,"0","DIVERGENCIA RLS, etapa "+stage);
  const first=anon("SELECT count(*)||'|'||coalesce(sum(nota),0) FROM "+schema+".original");
  const second=anon("SELECT count(*)||'|'||coalesce(sum(nota),0) FROM "+schema+".conjunto");
  assert.equal(first,second,"DIVERGENCIA agregados "+stage);
  const count=Number(first.split("|")[0]);
  assert.ok(count>0 && count<totalRows,"Teste precisa de votos visiveis e ocultos");
  console.log("EQUIVALENCE_OK stage="+stage+" visible="+count+" hidden="+(totalRows-count)+
    " diff=0 values="+first);
}
function explain(table){
  const s=anon("EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) "+
     "SELECT count(*),coalesce(sum(nota),0) FROM "+schema+"."+table);
  const plan=JSON.parse(s)[0];
  return {ms:plan["Execution Time"],
    hit:plan.Plan["Shared Hit Blocks"]??0,read:plan.Plan["Shared Read Blocks"]??0};
}
const sort=a=>[...a].sort((x,y)=>x-y);
const median=a=>sort(a)[Math.floor(a.length/2)];
const p95=a=>sort(a)[Math.ceil(a.length*.95)-1];
const round=n=>Math.round(n*100)/100;
function summary(samples){
  return {median_ms:round(median(samples.map(x=>x.ms))),
    p95_ms:round(p95(samples.map(x=>x.ms))),
    shared_hit_median:median(samples.map(x=>x.hit)),
    shared_read_median:median(samples.map(x=>x.read))};
}
let totalRows=0;
for(const c of [{rows:4000,users:16},{rows:20000,users:16},{rows:20000,users:256}]){
 totalRows=c.rows;
 generate(c.rows,c.users);
 equality("original rows="+c.rows+" users="+c.users);
 const samples={original:[],conjunto:[]};
 for(let iteration=0;iteration<9;iteration++){
   const order=iteration%2===0?["original","conjunto"]:["conjunto","original"];
   for(const type of order){
     const m=explain(type);
     if(iteration>=2)samples[type].push(m);
   }
 }
 const old=summary(samples.original),cand=summary(samples.conjunto);
 console.log("RLS_SET_BENCH "+JSON.stringify({rows:c.rows,users:c.users,
   old,candidate:cand,change_pct:round((cand.median_ms-old.median_ms)/old.median_ms*100),
   sameVisibleRows:true,warmups:2,samples:7}));
 // Confirmar que revogacoes e mudanca de linha sao observadas em nova consulta.
 const changed="('f8400000-0000-4000-8000-'||lpad((i)::text,12,'0'))::uuid";
 sql("UPDATE public.preferencias_privacidade SET mostrar_avaliacoes=false "+
    "WHERE user_id IN (SELECT "+changed+" FROM generate_series(3,"+c.users+",7) i);");
 equality("revoke rows="+c.rows+" users="+c.users);
 sql("UPDATE "+schema+".original SET visibilidade='privado' WHERE id%19=0;"+
     "UPDATE "+schema+".conjunto SET visibilidade='privado' WHERE id%19=0;");
 equality("private rows="+c.rows+" users="+c.users);
 // Reinicia fixtures para proxima carga.
 sql("UPDATE public.preferencias_privacidade SET mostrar_avaliacoes=(i%9<>0) FROM "+
    "generate_series(3,"+c.users+",7) i WHERE user_id="+changed+";");
}
console.log("RLS_SET_EXPERIMENT_PASS no original public policy altered, no remote writes");
