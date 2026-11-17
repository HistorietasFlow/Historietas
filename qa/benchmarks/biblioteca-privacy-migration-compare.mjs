// Benchmark isolado: banco Supabase local descartavel. Nunca usar URL remota.
// Fases: "capture" antes da migration candidata; "verify"/"bench" depois.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const original = "historietas_privado.usuario_pode_ver_registro_biblioteca";
const baseline = "historietas_privado.qa_privacy_original";
const roleTest = "anon";
const raw = execFileSync("supabase", ["status", "-o", "env"], { encoding: "utf8" });
const env = Object.fromEntries(raw.split(/\r?\n/).map(x =>
  /^([A-Z0-9_]+)=(.*)$/.exec(x.trim())).filter(Boolean)
  .map(x => [x[1], x[2].replace(/^["']|["']$/g, "")]));
assert.ok(env.DB_URL, "Supabase local obrigatorio");
const dbUrl = new URL(env.DB_URL);
assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(dbUrl.hostname),
  "PROIBIDO EXECUTAR CONTRA BANCO REMOTO");
const names = execFileSync("docker", ["ps", "--filter", "publish=" + dbUrl.port,
  "--format", "{{.Names}}"], { encoding: "utf8" }).trim().split(/\r?\n/);
const matches = names.filter(x => /^supabase_db_/.test(x));
assert.equal(matches.length, 1, "Deve existir somente um container PostgreSQL local");
const db = matches[0];

function psql(source, timeout = 150000) {
  const result = execFileSync("docker", ["exec", "-i", db, "psql", "-U",
    "postgres", "-d", "postgres", "-X", "-q", "-A", "-t", "-v",
    "ON_ERROR_STOP=1"], { input: source + "\n", encoding: "utf8", timeout,
      maxBuffer: 1024 * 1024 * 5 });
  return result.trim();
}
function anon(query) {
  return psql("BEGIN;\nSET LOCAL ROLE " + roleTest +
    ";\nSET LOCAL statement_timeout='8s';\n" + query + ";\nROLLBACK;");
}
const quote = s => "'" + s.replaceAll("'", "''") + "'";
const fingerprint = name => psql("SELECT md5(prosrc) FROM pg_proc " +
  "WHERE oid=" + quote(name + "(uuid,text,text)") + "::regprocedure;");

function capture() {
  const definition = psql("SELECT pg_get_functiondef(" +
    quote(original + "(uuid,text,text)") + "::regprocedure);");
  const oldName = "FUNCTION " + original + "(";
  assert.ok(definition.includes(oldName), "Definicao original nao localizada");
  const clone = definition.replace(oldName, "FUNCTION " + baseline + "(");
  assert.notEqual(clone, definition);
  const terminatedClone = clone.trimEnd().endsWith(";") ? clone : clone.trimEnd() + ";";
  psql(terminatedClone + "\nREVOKE ALL ON FUNCTION " + baseline +
    "(uuid,text,text) FROM PUBLIC;\nGRANT EXECUTE ON FUNCTION " + baseline +
    "(uuid,text,text) TO anon,authenticated;");
  assert.equal(fingerprint(original), fingerprint(baseline),
    "A copia original divergiu antes da migration");
  console.log("PRIVACY_BASELINE_CAPTURED");
}
function verify() {
  const oldHash = fingerprint(baseline);
  const newHash = fingerprint(original);
  assert.ok(oldHash && newHash, "Funcoes nao encontradas");
  assert.notEqual(oldHash, newHash,
    "Migration nao alterou o corpo da funcao de privacidade");
  const metadata = psql("SELECT prosecdef::text||'|'||provolatile||'|'||" +
    "coalesce(array_to_string(proconfig,','),'') FROM pg_proc WHERE oid=" +
    quote(original + "(uuid,text,text)") + "::regprocedure;");
  assert.ok(metadata.startsWith("true|s|") || metadata.startsWith("t|s|"),
    "A funcao perdeu SECURITY DEFINER ou STABLE");
  console.log("PRIVACY_MIGRATION_VERIFIED");
}
function uuid(n) {
  return "f9100000-0000-4000-8000-" + String(n).padStart(12, "0");
}
function setup() {
  const gen = "('f9100000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid";
  psql([
    "INSERT INTO auth.users(id) SELECT " + gen + " FROM generate_series(1,21) i;",
    "INSERT INTO public.profiles(id,user_id,nome,tipo) SELECT " + gen + "," + gen +
      ",'QA helper privacidade','leitor' FROM generate_series(1,21) i;",
    "INSERT INTO public.preferencias_privacidade(user_id,visibilidade_biblioteca,",
    "mostrar_avaliacoes,perfil_privado) SELECT " + gen + ",",
    "CASE WHEN i=20 THEN 'somente_eu' ELSE 'publico' END,i<>21,false",
    "FROM generate_series(1,21) i;",
    "CREATE SCHEMA qa_privacy_bench;",
    "REVOKE ALL ON SCHEMA qa_privacy_bench FROM PUBLIC;",
    "GRANT USAGE ON SCHEMA qa_privacy_bench TO anon;",
    "CREATE TABLE qa_privacy_bench.baseline(user_id uuid NOT NULL,",
    "visibilidade text NOT NULL, nota numeric NOT NULL);",
    "CREATE TABLE qa_privacy_bench.candidate",
    "(LIKE qa_privacy_bench.baseline INCLUDING ALL);",
    "ALTER TABLE qa_privacy_bench.baseline ENABLE ROW LEVEL SECURITY;",
    "ALTER TABLE qa_privacy_bench.candidate ENABLE ROW LEVEL SECURITY;",
    "CREATE POLICY priv_select ON qa_privacy_bench.baseline",
    "FOR SELECT TO anon USING (" + baseline +
      "(user_id,visibilidade,'obra_avaliacoes'));",
    "CREATE POLICY priv_select ON qa_privacy_bench.candidate",
    "FOR SELECT TO anon USING (" + original +
      "(user_id,visibilidade,'obra_avaliacoes'));",
    "GRANT SELECT ON qa_privacy_bench.baseline,qa_privacy_bench.candidate TO anon;"
  ].join("\n"));
}
const metric = table => "SELECT count(*)::bigint, coalesce(sum(nota),0)::numeric" +
  " FROM qa_privacy_bench." + table;
const query = table => "EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) " + metric(table);
function measure(table) {
  const output = anon(query(table));
  const plan = JSON.parse(output)[0];
  return { ms: plan["Execution Time"],
    hit: plan.Plan["Shared Hit Blocks"] || 0,
    read: plan.Plan["Shared Read Blocks"] || 0 };
}
const sorted = xs => [...xs].sort((a,b)=>a-b);
const median = xs => sorted(xs)[Math.floor(xs.length/2)];
const p95 = xs => sorted(xs)[Math.ceil(xs.length*.95)-1];
const round = n => Math.round(n*100)/100;
const summarise = samples => ({
  median_ms:round(median(samples.map(s=>s.ms))),
  p95_ms:round(p95(samples.map(s=>s.ms))),
  max_ms:round(Math.max(...samples.map(s=>s.ms))),
  shared_hit_median:median(samples.map(s=>s.hit)),
  shared_read_median:median(samples.map(s=>s.read))
});
function seed(works,votes) {
  psql([
    "TRUNCATE qa_privacy_bench.baseline,qa_privacy_bench.candidate;",
    "INSERT INTO qa_privacy_bench.baseline(user_id,visibilidade,nota)",
    "SELECT ('f9100000-0000-4000-8000-'||lpad(j::text,12,'0'))::uuid,",
    "CASE WHEN j%11=0 THEN 'privado' WHEN j%2=0 THEN 'parcial'",
    "ELSE 'publico' END,",
    "((1+(i*3+j*7)%10)::numeric / 2)::numeric",
    "FROM generate_series(1," + works + ") i CROSS JOIN",
    "generate_series(1," + votes + ") j;",
    "INSERT INTO qa_privacy_bench.candidate",
    "SELECT * FROM qa_privacy_bench.baseline;",
    "ANALYZE qa_privacy_bench.baseline;",
    "ANALYZE qa_privacy_bench.candidate;"
  ].join("\n"),240000);
}
function bench() {
  verify();
  setup();
  for (const stage of [{obras:1000,votos:4},{obras:1000,votos:20}]) {
    seed(stage.obras,stage.votos);
    const before = anon(metric("baseline"));
    const after = anon(metric("candidate"));
    assert.equal(before,after, "Diferenca entre autorizacoes RLS");
    const results={baseline:[],candidate:[]};
    for(let i=0;i<9;i++){
      const order=i%2===0?["baseline","candidate"]:["candidate","baseline"];
      for(const key of order){
        const sample=measure(key);
        if(i>=2)results[key].push(sample);
      }
    }
    const a=summarise(results.baseline),b=summarise(results.candidate);
    console.log("PRIVACY_BENCH_RESULT " + JSON.stringify({
      works:stage.obras,ratings:stage.obras*stage.votos,
      old:a,new:b,change_pct:round((b.median_ms-a.median_ms)/a.median_ms*100),
      same_results:true,warmups:2,samples_per_variant:7
    }));
  }
  console.log("PRIVACY_BENCH_ALL_PASS");
}
const phase=process.argv[2];
if (phase==="capture") capture();
else if (phase==="verify") verify();
else if (phase==="bench") bench();
else throw new Error("Fase obrigatoria: capture | verify | bench");
