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


function sqlInternoRanking() {
  const filename = "supabase/migrations/20261116230000_listar_ranking_geral.sql";
  const source = readFileSync(filename,"utf8");
  const startMarker="  return query\n  with\n";
  const start=source.indexOf(startMarker);
  const end=source.indexOf("\nend;\n$func$;",start);
  assert.ok(start>=0 && end>start, "Nao foi possivel extrair SQL interno da RPC");
  const query=source.slice(start+"  return query\n  ".length,end)
    .replace(/\bp_apos_obra\b/g,"NULL::uuid")
    .replace(/\bp_assinatura\b/g,"NULL::text")
    .replace(/\bv_limite\b/g,"20")
    .trim().replace(/;\s*$/,"");
  assert.match(query,/^with\s+obras_publicas/i);
  return query;
}
function explainAnon(query) {
  const raw=anonSql("EXPLAIN (ANALYZE,BUFFERS,VERBOSE,FORMAT JSON) "+query);
  return JSON.parse(raw)[0];
}
function explainPostgres(query) {
  const raw=psql("EXPLAIN (ANALYZE,BUFFERS,VERBOSE,FORMAT JSON) "+query+";");
  return JSON.parse(raw)[0];
}
function summarizePlan(x) {
  const nodes=[];
  function walk(p,depth) {
    const loops=p["Actual Loops"]||1;
    const item={
      depth,
      node:p["Node Type"],
      relation:p["Relation Name"]||null,
      alias:p.Alias||null,
      cte:p["CTE Name"]||null,
      actual_ms:round((p["Actual Total Time"]||0)*loops),
      rows:p["Actual Rows"]||0,
      loops,
      removed:p["Rows Removed by Filter"]||0,
      hit:p["Shared Hit Blocks"]||0,
      read:p["Shared Read Blocks"]||0,
      filter:typeof p.Filter==="string"?p.Filter.slice(0,210):null
    };
    nodes.push(item);
    for(const sub of p.Plans||[])walk(sub,depth+1);
  }
  walk(x.Plan,0);
  return {total_ms:round(x["Execution Time"]),top_nodes:nodes
    .filter(z=>z.depth>0).sort((a,b)=>b.actual_ms-a.actual_ms).slice(0,14),
    rating_nodes:nodes.filter(z=>z.relation==="obra_avaliacoes").slice(0,8),
    cte_nodes:nodes.filter(z=>z.cte).slice(0,12)};
}
function hashResults(query) {
  return anonSql("select md5(coalesce(string_agg(obra_id::text||':'||posicao::text||':'"
    + "||nota_media::text||':'||total_avaliacoes::text||':'||pontuacao::text||':'"
    + "||tem_mais::text,'|' order by posicao),'')) "
    + "from ("+query+") ranking where estado='ok'");
}
function summaryMedian(values) {
  return round(median(values));
}

const helperOriginal = "historietas_privado.usuario_pode_ver_registro_biblioteca";
const helperCandidate = "historietas_privado.usuario_pode_ver_registro_biblioteca_bench";
const sampleUUID = n => "f8100000-0000-4000-8000-" + String(n).padStart(12,"0");
function userSql(n) { return "'" + sampleUUID(n) + "'::uuid"; }

function configureFixtures() {
  const sql = [
    "UPDATE public.preferencias_privacidade SET",
    " visibilidade_biblioteca=CASE",
    "  WHEN user_id="+userSql(3)+" THEN 'seguidores'",
    "  WHEN user_id="+userSql(4)+" THEN 'seguindo'",
    "  WHEN user_id="+userSql(6)+" THEN 'somente_eu'",
    "  ELSE 'publico' END,",
    " mostrar_favoritos=mod((right(user_id::text,12))::integer,2)=0,",
    " mostrar_concluidas=mod((right(user_id::text,12))::integer,3)=0,",
    " mostrar_quero_ler=mod((right(user_id::text,12))::integer,4)=0,",
    " mostrar_historico_leitura=mod((right(user_id::text,12))::integer,5)=0;",
    "UPDATE public.preferencias_privacidade SET mostrar_avaliacoes=true",
    " WHERE user_id IN ("+[2,3,4,5,6].map(userSql).join(",")+");",
    "INSERT INTO public.seguindo_usuarios(seguidor_id,seguido_id) VALUES",
    " ("+userSql(1)+","+userSql(3)+"),",
    " ("+userSql(4)+","+userSql(1)+"),",
    " ("+userSql(1)+","+userSql(5)+");",
    "INSERT INTO public.usuarios_bloqueados(bloqueador_id,bloqueado_id) VALUES",
    " ("+userSql(5)+","+userSql(1)+");",
  ].join("\n");
  psql(sql);
}
function compareMatrix(label) {
  const views = [null,1,2,3,4,5,22];
  const contexts = [];
  const query = [
    "WITH subjects(user_id) AS (",
    " SELECT id FROM auth.users WHERE id::text LIKE 'f8100000-0000-4000-8000-%'",
    " UNION ALL SELECT NULL::uuid),",
    "visibility(visibilidade) AS (VALUES",
    " ('publico'::text),('parcial'),('privado'),('invalida'),(NULL::text)),",
    "categories(categoria) AS (VALUES",
    " ('favoritos'::text),('concluidas'),('obra_avaliacoes'),",
    " ('seguindo_obras'),('salvos_capitulos'),('invalida'),(NULL::text))",
    "SELECT count(*)::int, count(*) FILTER (WHERE",
    " "+helperOriginal+"(s.user_id,v.visibilidade,c.categoria)",
    " IS DISTINCT FROM",
    " "+helperCandidate+"(s.user_id,v.visibilidade,c.categoria)",
    ")::int",
    " FROM subjects s CROSS JOIN visibility v CROSS JOIN categories c",
  ].join("\n");
  for(const viewer of views){
    const jwt = viewer===null ? "" : sampleUUID(viewer);
    const statement = [
      "BEGIN;",
      "SELECT set_config('request.jwt.claim.sub','"+jwt+"',true);",
      query+";",
      "ROLLBACK;",
    ].join("\n");
    const lines=psql(statement).split("\n").filter(Boolean);
    const raw=lines.at(-1);
    const [cases,mismatches] = raw.split("|").map(Number);
    assert.ok(Number.isInteger(cases) && cases>1000 && mismatches===0,
      "Nao equivalente: "+label+" viewer="+viewer+" resultado="+raw);
    contexts.push({viewer:viewer??"anon",cases,mismatches});
  }
  console.log("HELPER_EQUIVALENCE "+JSON.stringify({phase:label,contexts}));
}
function exactCheck() {
  const q = [
    "BEGIN;",
    "SELECT set_config('request.jwt.claim.sub','',true);",
    "SELECT "+helperOriginal+"("+userSql(2)+",'parcial','obra_avaliacoes');",
    "ROLLBACK;",
  ].join("\n");
  assert.equal(psql(q).split("\n").filter(Boolean).at(-1),"t",
    "Parcial legitimamente publica nao visivel anonimo");
}
function updateAndCompare(){
  psql([
    "UPDATE public.preferencias_privacidade SET mostrar_avaliacoes=false WHERE user_id="+userSql(2)+";",
    "UPDATE public.preferencias_privacidade SET visibilidade_biblioteca='somente_eu' WHERE user_id="+userSql(3)+";",
  ].join("\n"));
  compareMatrix("revogacao");
  psql([
    "DELETE FROM public.usuarios_bloqueados WHERE bloqueador_id="+userSql(5)+" AND bloqueado_id="+userSql(1)+";",
    "DELETE FROM public.seguindo_usuarios WHERE seguidor_id="+userSql(1)+" AND seguido_id="+userSql(3)+";",
    "UPDATE public.preferencias_privacidade SET mostrar_avaliacoes=true, visibilidade_biblioteca='publico' WHERE user_id="+userSql(2)+";",
  ].join("\n"));
  compareMatrix("bloqueio_seguimento_revogado");
}
function evaluateHelper(which,statement) {
  return "SELECT count(*)::bigint,coalesce(sum(nota),0)::numeric FROM public.obra_avaliacoes"+
    " WHERE "+which+"(user_id,visibilidade,'obra_avaliacoes')";
}
function explainHelper(which){
  const query=evaluateHelper(which);
  const out=psql([
    "BEGIN; SELECT set_config('request.jwt.claim.sub','',true);",
    "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) "+query+";",
    "ROLLBACK;"
  ].join("\n"),150000);
  const pos=out.indexOf("[");
  assert.ok(pos>=0,"EXPLAIN nao retornou JSON");
  const plan=JSON.parse(out.slice(pos))[0];
  return {ms:plan["Execution Time"],hits:plan.Plan["Shared Hit Blocks"]||0,
    reads:plan.Plan["Shared Read Blocks"]||0};
}
function comparePopulation(stage) {
  const a=evaluateHelper(helperOriginal),b=evaluateHelper(helperCandidate);
  const out=psql([
    "BEGIN; SELECT set_config('request.jwt.claim.sub','',true);",
    a+";"+b+"; ROLLBACK;",
  ].join("\n")).split("\n").filter(Boolean);
  const last=out.slice(-2);
  assert.deepEqual(last[0],last[1],"Helper divergiu em somas/contagens: "+JSON.stringify(stage));
  const data={old:[],new:[]};
  const methods={old:helperOriginal,new:helperCandidate};
  for(let i=0;i<9;i++){
    const order = i%2===0 ? ["old","new"]:["new","old"];
    for(const k of order){
      const v=explainHelper(methods[k]);
      if(i>=2)data[k].push(v);
    }
  }
  const med=arr=>round(median(arr.map(x=>x.ms)));
  const old=med(data.old),newer=med(data.new);
  console.log("HELPER_BENCH "+JSON.stringify({
    stage,
    count_and_sum:last[0],
    original_median_ms:old,candidate_median_ms:newer,
    diff_pct:round((newer-old)/old*100),
    original_p95_ms:round(p95(data.old.map(x=>x.ms))),
    candidate_p95_ms:round(p95(data.new.map(x=>x.ms))),
    originals:data.old.map(x=>round(x.ms)),candidates:data.new.map(x=>round(x.ms)),
    original_hits:median(data.old.map(x=>x.hits)),
    candidate_hits:median(data.new.map(x=>x.hits)),
    same_results:true,samples_per_variant:7,warmups:2
  }));
}
psql("\nCREATE OR REPLACE FUNCTION historietas_privado.usuario_pode_ver_registro_biblioteca_bench(\n p_user_id uuid, p_visibilidade text, p_categoria text\n) RETURNS boolean\nLANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''\nAS $function$\n SELECT p_user_id IS NOT NULL\n AND (\n   auth.uid() = p_user_id\n   OR (\n      coalesce(p_visibilidade,'privado') in ('publico','parcial')\n      AND public.usuario_pode_ver_aba_perfil(\n        p_user_id, coalesce(pref.visibilidade_biblioteca,'somente_eu')\n      )\n      AND coalesce(CASE p_categoria\n        WHEN 'favoritos' THEN pref.mostrar_favoritos\n        WHEN 'concluidas' THEN pref.mostrar_concluidas\n        WHEN 'obra_avaliacoes' THEN pref.mostrar_avaliacoes\n        WHEN 'seguindo_obras' THEN pref.mostrar_quero_ler\n        WHEN 'salvos_capitulos' THEN pref.mostrar_historico_leitura\n        ELSE false END,false)\n   )\n )\n FROM (SELECT 1) AS anchor\n LEFT JOIN public.preferencias_privacidade AS pref ON pref.user_id=p_user_id\n$function$;\nREVOKE ALL ON FUNCTION historietas_privado.usuario_pode_ver_registro_biblioteca_bench(uuid,text,text) FROM PUBLIC;\n");
seedUsers();
configureFixtures();
compareMatrix("inicial");
exactCheck();
updateAndCompare();
for(const stage of [{obras:1000,votos:4},{obras:1000,votos:20}]) {
  seedWorks(stage.obras,stage.votos);
  comparePopulation(stage);
}
console.log("HELPER_BENCH_ALL_PASS");
