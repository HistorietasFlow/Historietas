import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const STAGES = [
  { obras: 100, votos: 1 },
  { obras: 1000, votos: 4 },
  { obras: 5000, votos: 4 },
  { obras: 1000, votos: 20 },
];
const INVOCATIONS = 7;
const WARMUPS = 2;
const PREFIX = "f8200000-0000-4000-8000-";
const uid = (id, n) => id + String(n).padStart(12, "0");

function findLocalContainer() {
  const raw = execFileSync("supabase", ["status", "-o", "env"], { encoding: "utf8" });
  const env = Object.fromEntries(raw.split(/\r?\n/)
    .map(line => /^([A-Z0-9_]+)=(.*)$/.exec(line.trim()))
    .filter(Boolean).map(x => [x[1], x[2].replace(/^["']|["']$/g, "")]));
  const url = new URL(env.DB_URL);
  assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(url.hostname),
    "BENCHMARK PROIBIDO FORA DE SUPABASE LOCAL");
  const list = execFileSync("docker", ["ps", "--filter", "publish=" + url.port,
    "--format", "{{.Names}}"], { encoding: "utf8" }).trim().split(/\r?\n/);
  const containers = list.filter(name => /^supabase_db_/.test(name));
  assert.equal(containers.length, 1, "Um banco Supabase local deve estar ativo");
  return containers[0];
}

const localDb = findLocalContainer();
function psql(sql, timeoutMs = 150000) {
  const output = execFileSync("docker",
    ["exec", "-i", localDb, "psql", "-U", "postgres", "-d", "postgres",
      "-X", "-A", "-t", "-q", "-v", "ON_ERROR_STOP=1"],
    { input: sql, encoding: "utf8", timeout: timeoutMs, maxBuffer: 1024 * 1024 * 6 });
  return output.trim();
}
function anonSql(sql) {
  return psql("BEGIN;\nSET LOCAL ROLE anon;\nSET LOCAL statement_timeout = '90s';\n"
    + sql + ";\nROLLBACK;\n");
}

function installComparableVariants() {
  const filename = "supabase/migrations/20261116230000_listar_ranking_geral.sql";
  const migration = readFileSync(filename, "utf8");
  const start = migration.indexOf("create function public.listar_ranking_geral(");
  const end = migration.indexOf("\nrevoke all on function", start);
  assert.ok(start !== -1 && end > start, "Origem da RPC nao encontrada");
  const source = migration.slice(start, end).replace(/^create function/, "create or replace function");
  const pattern = /identificacao as materialized \(\s*select md5\([\s\S]*?\)\s+as valor\s+from calculadas\s*\),/;
  assert.ok(pattern.test(source), "CTE da assinatura diferente do esperado");
  const constant = "identificacao as materialized (\n    select '00000000000000000000000000000000'::text as valor\n  ),";
  const no = source.replace("public.listar_ranking_geral", "public.bench_ranking_sem")
    .replace(pattern, constant);
  const yes = source.replace("public.listar_ranking_geral", "public.bench_ranking_com");
  assert.ok(!no.includes("string_agg(") && yes.includes("string_agg("));
  psql(no + "\n" + yes + "\n"
    + "REVOKE ALL ON FUNCTION public.bench_ranking_sem(uuid,text,integer) FROM PUBLIC, anon, authenticated, service_role;\n"
    + "REVOKE ALL ON FUNCTION public.bench_ranking_com(uuid,text,integer) FROM PUBLIC, anon, authenticated, service_role;\n"
    + "GRANT EXECUTE ON FUNCTION public.bench_ranking_sem(uuid,text,integer) TO anon;\n"
    + "GRANT EXECUTE ON FUNCTION public.bench_ranking_com(uuid,text,integer) TO anon;\n");
}

function seedUsers() {
  const sql = [
    "BEGIN;",
    "INSERT INTO auth.users(id) SELECT ('f8100000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid",
    "  FROM generate_series(1,31) i;",
    "INSERT INTO public.profiles(id,user_id,nome,tipo)",
    " SELECT u.id,u.id,'QA ranking isolado', CASE WHEN right(u.id::text,12)::integer > 21 THEN 'autor' ELSE 'leitor' END",
    " FROM auth.users u WHERE u.id::text LIKE 'f8100000-0000-4000-8000-%';",
    "INSERT INTO public.preferencias_privacidade(user_id,visibilidade_biblioteca,mostrar_avaliacoes,perfil_privado)",
    " SELECT ('f8100000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,",
    " CASE WHEN i=20 THEN 'somente_eu' ELSE 'publico' END, i<>21, false",
    " FROM generate_series(1,21) i;",
    "COMMIT;",
  ].join("\n");
  psql(sql);
}

function seedWorks(obras, votos) {
  const sql = [
    "BEGIN;",
    "DELETE FROM public.obra_avaliacoes WHERE obra_id::text LIKE 'f8200000-0000-4000-8000-%';",
    "DELETE FROM public.obras WHERE id::text LIKE 'f8200000-0000-4000-8000-%';",
    "INSERT INTO public.obras",
    " (id,user_id,titulo,autor,genero,formato,classificacao_indicativa,avisos_conteudo,arquivo_url,publicado,slug)",
    " SELECT ('f8200000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,",
    " ('f8100000-0000-4000-8000-'||lpad((22+i%10)::text,12,'0'))::uuid,",
    " 'QA Rank Focado '||i,'QA Autor','Fantasia','HQ','Livre','{}'::text[],",
    " 'https://example.invalid/qa.txt', true,'qa-rank-focado-'||i",
    " FROM generate_series(1," + obras + ") i;",
    "INSERT INTO public.obra_avaliacoes(obra_id,user_id,nota,visibilidade)",
    " SELECT ('f8200000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,",
    " ('f8100000-0000-4000-8000-'||lpad(j::text,12,'0'))::uuid,",
    " (((1 + (i*3+j*7)%10)::numeric)/2)::numeric(2,1),",
    " CASE WHEN j%2=0 THEN 'parcial' ELSE 'publico' END",
    " FROM generate_series(1," + obras + ") i CROSS JOIN generate_series(1," + votos + ") j;",
    "COMMIT;",
    "ANALYZE public.obras;",
    "ANALYZE public.obra_avaliacoes;",
    "ANALYZE public.preferencias_privacidade;",
  ].join("\n");
  psql(sql, 240000);
}

function cursor(fn) {
  const raw = anonSql("SELECT obra_id::text||'|'||assinatura FROM public." + fn
    + "(null::uuid,null::text,20) ORDER BY posicao DESC LIMIT 1");
  const [id, token] = raw.split("|");
  assert.ok(id && token, "Cursor ausente");
  return { id, token };
}
function callSql(fn, after = null) {
  const args = after
    ? "'" + after.id + "'::uuid,'" + after.token + "'::text,20"
    : "null::uuid,null::text,20";
  return "SELECT * FROM public." + fn + "(" + args + ")";
}
function resultHash(fn, after = null) {
  const query = callSql(fn, after);
  return anonSql("SELECT md5(coalesce(string_agg("
    + "obra_id::text||':'||posicao::text||':'||nota_media::text||':'||total_avaliacoes::text"
    + "||':'||pontuacao::text||':'||tem_mais::text,'|' ORDER BY posicao),''))"
    + " FROM (" + query + ") resultado WHERE estado='ok'");
}
function profile(fn, after = null) {
  const output = anonSql("EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) " + callSql(fn, after));
  const plan = JSON.parse(output)[0];
  return { ms: Number(plan["Execution Time"]),
    sharedHit: plan.Plan["Shared Hit Blocks"] || 0,
    sharedRead: plan.Plan["Shared Read Blocks"] || 0 };
}
function median(v) {
  const a = [...v].sort((x,y) => x - y);
  return a[Math.floor(a.length / 2)];
}
function p95(v) {
  const a = [...v].sort((x,y) => x - y);
  return a[Math.ceil(a.length * 0.95) - 1];
}
const round = n => Math.round(n * 100) / 100;
function summary(values) {
  return {median_ms:round(median(values.map(x => x.ms))),
    p95_ms:round(p95(values.map(x => x.ms))),
    max_ms:round(Math.max(...values.map(x => x.ms))),
    shared_hit_median:median(values.map(x => x.sharedHit)),
    shared_read_median:median(values.map(x => x.sharedRead))};
}



function internal(cursor=null) {
  const source=readFileSync("supabase/migrations/20261116230000_listar_ranking_geral.sql","utf8");
  const start=source.indexOf("  return query\n  with\n");
  const end=source.indexOf("\nend;\n$func$;",start);
  assert.ok(start>=0&&end>start,"SQL interno nao localizado");
  const id=cursor?"'"+cursor.id+"'::uuid":"NULL::uuid";
  const token=cursor?"'"+cursor.signature+"'::text":"NULL::text";
  return source.slice(start+"  return query\n  ".length,end)
    .replace(/\bp_apos_obra\b/g,id).replace(/\bp_assinatura\b/g,token)
    .replace(/\bv_limite\b/g,"20").trim().replace(/;\s*$/,"");
}
function variants(cursor=null) {
  const original=internal(cursor);
  const changed=original.replace("obras_publicas as materialized (","obras_publicas as (");
  assert.notEqual(original,changed);
  return {original,inline:changed};
}
function firstPageCursor() {
  const value=anonSql("SELECT obra_id::text||'|'||assinatura FROM public.listar_ranking_geral(null::uuid,null::text,20) ORDER BY posicao DESC LIMIT 1");
  const [id,signature]=value.split("|");
  assert.ok(id&&signature);
  return {id,signature};
}
function hashSqlResults(q) {
  return anonSql("SELECT md5(coalesce(string_agg("
    +"obra_id::text||':'||posicao::text||':'||nota_media::text||':'||total_avaliacoes::text"
    +"||':'||pontuacao::text||':'||tem_mais::text,'|' order by posicao),'')) "
    +"FROM ("+q+") rows WHERE estado='ok'");
}
function run(q) {
  const raw=anonSql("EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) "+q);
  const p=JSON.parse(raw)[0];
  return {ms:p["Execution Time"],hit:p.Plan["Shared Hit Blocks"]||0,
     read:p.Plan["Shared Read Blocks"]||0};
}
function stats(v) {
  const a=v.map(x=>x.ms).sort((x,y)=>x-y);
  return {median_ms:round(median(a)),p95_ms:round(a[Math.ceil(a.length*.95)-1]),
    max_ms:round(a.at(-1)),shared_hit_median:median(v.map(x=>x.hit)),
    shared_read_median:median(v.map(x=>x.read))};
}
installComparableVariants();
seedUsers();
for(const stage of [{obras:1000,votos:4},{obras:1000,votos:20}]) {
  seedWorks(stage.obras,stage.votos);
  for(const page of ["first","second"]) {
    const cursor=page==="second"?firstPageCursor():null;
    const q=variants(cursor);
    assert.equal(hashSqlResults(q.original),hashSqlResults(q.inline),"Resultado diferente");
    const data={original:[],inline:[]};
    for(let i=0;i<9;i++) {
      const order=i%2===0?["original","inline"]:["inline","original"];
      for(const key of order) {
        const value=run(q[key]);
        if(i>=2)data[key].push(value);
      }
    }
    const a=stats(data.original),b=stats(data.inline);
    console.log("CTE_BENCH_RESULT "+JSON.stringify({
      stage,page,baseline:a,inline:b,same_results:true,
      diff_pct:round((b.median_ms-a.median_ms)/a.median_ms*100),
      samples_per_variant:7,warmups:2
    }));
  }
}
console.log("CTE_BENCH_PASS");
