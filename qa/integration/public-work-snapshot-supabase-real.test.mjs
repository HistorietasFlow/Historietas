import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { criarInvocacaoStatusSupabase } from "../scripts/supabase-cli-invocation.mjs";

const USER = "d0100000-0000-4000-8000-000000000001", THIRD = "d0100000-0000-4000-8000-000000000002";
const WORK = "d0200000-0000-4000-8000-000000000001", CHAPTER = "d0300000-0000-4000-8000-000000000001";
const check = r => { assert.equal(r.error, null, r.error?.message); return r.data; };

test("snapshot leve: Data API local, isolamento, concorrência e transferência", async t => {
  const inv = criarInvocacaoStatusSupabase();
  const out = execFileSync(inv.comando, inv.argumentos, { encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  const env = Object.fromEntries(out.split(/\r?\n/).filter(s => /^[A-Z0-9_]+=/.test(s)).map(s => {
    const i = s.indexOf("="), v = s.slice(i + 1).trim(); return [s.slice(0, i), v.startsWith('"') ? JSON.parse(v) : v];
  }));
  for (const value of [env.API_URL, env.DB_URL]) assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(new URL(value).hostname), "Somente Supabase local");
  const containers = execFileSync("docker", ["ps", "--filter", `publish=${new URL(env.DB_URL).port}`, "--format", "{{.Names}}"], { encoding: "utf8", windowsHide: true }).trim().split(/\r?\n/);
  assert.equal(containers.length, 1); assert.match(containers[0], /^supabase_db_/);
  const args = ["exec", "-i", containers[0], "psql", "-U", "postgres", "-d", "postgres", "-XqAt", "-v", "ON_ERROR_STOP=1"];
  const sql = s => execFileSync("docker", args, { input: s, encoding: "utf8", windowsHide: true, stdio: ["pipe", "pipe", "pipe"] }).trim();
  const cleanup = () => sql(`delete from public.obras where id in ('${WORK}','d0200000-0000-4000-8000-000000000002','d0200000-0000-4000-8000-000000000003','d0200000-0000-4000-8000-000000000004'); delete from auth.users where id in ('${USER}','${THIRD}');`);
  cleanup(); t.after(cleanup); // Nunca apagar tombstones/revisões.
  const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
  const measurements = [];
  const anon = createClient(env.API_URL, env.ANON_KEY, { ...options, global: { fetch: async (input, init) => {
    assert.equal(new URL(typeof input === "string" ? input : input.url).origin, new URL(env.API_URL).origin);
    const start = performance.now(), response = await fetch(input, init);
    const text = await response.clone().text();
    measurements.push({ endpoint: new URL(typeof input === "string" ? input : input.url).pathname.split("/").at(-1), bytes: Buffer.byteLength(text), ms: Math.round(performance.now() - start), status: response.status });
    return response;
  } } });
  const admin = createClient(env.API_URL, env.SERVICE_ROLE_KEY, options);
  const author = createClient(env.API_URL, env.ANON_KEY, options), third = createClient(env.API_URL, env.ANON_KEY, options);
  for (const [id, client, who] of [[USER, author, "author"], [THIRD, third, "third"]]) {
    const email = `qa-light-${who}@historietas.test`, password = randomBytes(24).toString("base64url");
    check(await admin.auth.admin.createUser({ id, email, password, email_confirm: true }));
    check(await client.auth.signInWithPassword({ email, password }));
  }
  const fixture = readFileSync(new URL("../../supabase/tests/database/obra_snapshot_leve.test.sql", import.meta.url), "utf8");
  sql(`begin; ${fixture.slice(fixture.indexOf("\n", fixture.indexOf("-- BEGIN LIGHT SNAPSHOT FIXTURE")), fixture.indexOf("-- END LIGHT SNAPSHOT FIXTURE"))} commit;`);
  const projection = async (slug = "qa-snapshot-leve") => check(await anon.rpc("obter_projecao_publica_obra", { p_slug: slug, p_numero: null }));
  const page = async (p, client = anon, cursor = null, limit = 500) => check(await client.rpc("listar_capitulos_leves_projecao_publica", {
    p_slug: p.slug, p_geracao: p.geracao, p_revisao: p.revisao,
    p_depois_ordem: cursor?.ordem ?? null, p_depois_id: cursor?.id ?? null, p_limite: limit,
  }));
  await t.test("anon, autor e terceiro recebem o mesmo payload, sem textos/caminhos/URLs", async () => {
    const p = await projection(), result = await page(p);
    assert.deepEqual(await page(p, author), result); assert.deepEqual(await page(p, third), result);
    assert.deepEqual(result.capitulos.map(c => c.ordem), [2, 7]);
    assert.deepEqual(result.anexo, { nome: "Legado.pdf", tipo: "application/pdf", tamanho: 123, categoria: "documento" });
    for (const forbidden of ["TEXTO_NAO", "DRAFT_NAO", "privado/", "arquivo_url", "user_id", "comentario"]) assert.ok(!JSON.stringify(result).includes(forbidden));
    for (const slug of ["qa-snapshot-draft", "qa-snapshot-adulto", "inexistente"]) {
      for (const client of [anon, author, third]) assert.equal((await page({ ...p, slug }, client)).valida, false);
    }
    const empty = await page(await projection("qa-snapshot-vazio")); assert.equal(empty.valida, true); assert.deepEqual(empty.capitulos, []);
    assert.ok((await anon.rpc("listar_capitulos_leves_projecao_publica", { p_slug: p.slug, p_geracao: "forjado", p_revisao: p.revisao, p_depois_ordem: null, p_depois_id: null, p_limite: 500 })).error);
    const unauthorized = await third.from("capitulos").update({ titulo: "Forjado" }).eq("id", CHAPTER).select("id");
    assert.ok(unauthorized.error || unauthorized.data?.length === 0);
    assert.equal((await page(p)).capitulos[0].titulo, "Dois");
  });
  await t.test("edição não commitada, rollback e resposta perdida não misturam versões", async () => {
    const p = await projection();
    const writer = spawn("docker", args, { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let output = "", errors = "", ready;
    writer.stdout.on("data", d => { output += d; ready?.(); }); writer.stderr.on("data", d => { errors += d; });
    const exit = new Promise((resolve, reject) => { writer.on("error", reject); writer.on("exit", code => code === 0 ? resolve() : reject(new Error(errors))); }); exit.catch(() => {});
    t.after(async () => { if (writer.exitCode === null) { writer.stdin.end("rollback;\n"); await exit; } });
    const barrier = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Writer não atingiu barreira")), 10000);
      ready = () => { if (output.includes("EDIT_READY")) { clearTimeout(timer); resolve(); } };
    });
    writer.stdin.write(`begin; select set_config('request.jwt.claim.sub','${USER}',true); update public.capitulos set titulo='Edição concorrente' where id='${CHAPTER}';\n\\echo EDIT_READY\n`);
    await barrier; assert.equal((await page(p)).capitulos[0].titulo, "Dois");
    writer.stdin.end("commit;\n"); await exit;
    assert.equal((await page(p)).valida, false);
    const current = await projection(), once = await page(current); assert.deepEqual(await page(current), once);
    assert.equal(once.capitulos[0].titulo, "Edição concorrente");
    sql(`begin; select set_config('request.jwt.claim.sub','${USER}',true); update public.capitulos set titulo='Rollback' where id='${CHAPTER}'; rollback;`);
    assert.deepEqual(await projection(), current);
  });
  await t.test("501 capítulos: cursor, RLS e comparação com a consulta leve anterior e o leitor completo", async () => {
    sql(`begin; select set_config('request.jwt.claim.sub','${USER}',true);
      insert into public.capitulos(id,obra_id,user_id,titulo,texto,ordem,publicado)
      select gen_random_uuid(),'${WORK}','${USER}','Página '||n,repeat('Texto ilustrativo. ',100),n*3+10,true from generate_series(1,501) n; commit;`);
    const p = await projection(); measurements.length = 0;
    const first = await page(p), second = await page(p, anon, first.capitulos.at(-1));
    const light = [...measurements], rows = [...first.capitulos, ...second.capitulos];
    assert.equal(rows.length, 503); assert.equal(new Set(rows.map(c => c.id)).size, 503);
    assert.equal(rows.at(-1).ordem, 1513);
    measurements.length = 0;
    for (const start of [0, 500]) check(await anon.from("capitulos").select("id,obra_id,user_id,titulo,ordem,publicado,criado_em,atualizado_em").eq("obra_id", WORK).eq("publicado", true).order("ordem").order("id").range(start, start + 499));
    const previous = [...measurements]; measurements.length = 0;
    for (const start of [0, 500]) check(await anon.rpc("listar_capitulos_projecao_publica", { p_slug: p.slug, p_geracao: p.geracao, p_revisao: p.revisao, p_inicio: start, p_limite: 500 }));
    const full = [...measurements];
    const summarize = samples => ({ requests: samples.length, bytes: samples.reduce((n, r) => n + r.bytes, 0), ms: samples.reduce((n, r) => n + r.ms, 0) });
    assert.ok(summarize(light).bytes < summarize(full).bytes);
    console.log(JSON.stringify({ medicaoDataApiLocal: { anteriorListaObra: summarize(previous), listaVersionadaLeve: summarize(light), leitorComTextos: summarize(full) } }));
    sql("create policy qa_snapshot_deny on public.capitulos as restrictive for select to anon using(false);");
    try { assert.deepEqual((await page(p)).capitulos, []); } finally { sql("drop policy qa_snapshot_deny on public.capitulos;"); }
  });
  await t.test("renomeação, despublicação, exclusão e reutilização de slug/UUID rejeitam geração anterior", async () => {
    const p = await projection();
    check(await author.from("obras").update({ slug: "qa-snapshot-renomeado" }).eq("id", WORK));
    assert.equal((await page(p)).valida, false);
    const renamed = await projection("qa-snapshot-renomeado"); assert.equal(renamed.obraId, p.obraId);
    check(await author.from("obras").update({ publicado: false }).eq("id", WORK));
    assert.equal((await page(renamed)).valida, false);
    sql(`delete from public.obras where id='${WORK}'; begin; select set_config('request.jwt.claim.sub','${USER}',true);
      insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,publicado,slug) values('${WORK}','${USER}','Recriada','QA','Fantasia','Romance','Livre',true,'qa-snapshot-leve'); commit;`);
    const recreated = await projection(); assert.notEqual(recreated.geracao, p.geracao); assert.ok(BigInt(recreated.revisao) > BigInt(p.revisao));
    assert.equal((await page(p)).valida, false); assert.deepEqual((await page(recreated)).capitulos, []);
  });
});
