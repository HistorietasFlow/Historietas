import assert from "node:assert/strict";
import { execFile, execFileSync, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { setTimeout as pause } from "node:timers/promises";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { criarInvocacaoStatusSupabase } from "../scripts/supabase-cli-invocation.mjs";

const AUTHOR = "ac100000-0000-4000-8000-000000000001";
const FOLLOWER = "ac100000-0000-4000-8000-000000000002";
const OTHER = "ac100000-0000-4000-8000-000000000003";
const WORK = "ac200000-0000-4000-8000-000000000001";
const chapter = (n) => `ac300000-0000-4000-8000-${String(n).padStart(12, "0")}`;
function environment() {
  const inv = criarInvocacaoStatusSupabase();
  const output = execFileSync(inv.comando, inv.argumentos, { encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  const values = Object.fromEntries(output.split(/\r?\n/).filter((line) => /^[A-Z0-9_]+=/.test(line)).map((line) => {
    const i = line.indexOf("="), value = line.slice(i + 1).trim();
    return [line.slice(0, i), value.startsWith('"') ? JSON.parse(value) : value];
  }));
  const api = new URL(values.API_URL), db = new URL(values.DB_URL);
  for (const url of [api, db]) assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(url.hostname), "Recusa ambiente remoto.");
  assert.equal(api.protocol, "http:"); assert.equal(db.protocol, "postgresql:");
  const containers = execFileSync("docker", ["ps", "--filter", `publish=${db.port}`, "--format", "{{.Names}}"],
    { encoding: "utf8", windowsHide: true }).trim().split(/\r?\n/).filter(Boolean);
  assert.equal(containers.length, 1); assert.ok(containers[0].startsWith("supabase_db_"));
  assert.ok(values.ANON_KEY && values.SERVICE_ROLE_KEY);
  return { url: api.origin, key: values.ANON_KEY, secret: values.SERVICE_ROLE_KEY, container: containers[0] };
}
const args = (container) => ["exec", "-i", container, "psql", "-U", "postgres", "-d", "postgres", "-XqAt", "-v", "ON_ERROR_STOP=1"];
function sql(container, source) {
  return execFileSync("docker", args(container), { input: source, encoding: "utf8", windowsHide: true, stdio: ["pipe", "pipe", "pipe"] }).trim();
}
function asyncSql(container, source) {
  return new Promise((resolve, reject) => {
    const child = execFile("docker", args(container), { encoding: "utf8", windowsHide: true },
      (error, out) => error ? reject(error) : resolve(out.trim()));
    child.stdin.end(source);
  });
}
function check(response) { assert.equal(response.error, null, response.error?.message); return response.data; }

// Retem o perfil ANTES da validacao de termos/propriedade. O executor real ja
// adquiriu seu try-lock, mas cancelamento/edicao/reagendamento podem vencer.
async function blockedExecutor(container, number, during) {
  const locker = spawn("docker", args(container), { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
  let timer, output = "";
  const ready = new Promise((resolve, reject) => {
    locker.stdout.on("data", (data) => { output += data; if (output.includes("LOCK_READY")) resolve(); });
    locker.on("error", reject);
    locker.on("exit", (code) => { if (!output.includes("LOCK_READY")) reject(new Error(`Lock encerrou: ${code}`)); });
    timer = setTimeout(() => reject(new Error("Barreira local nao ficou pronta.")), 10_000);
  });
  locker.stdin.write(`begin; select user_id from public.profiles where user_id='${AUTHOR}' for update;\n\\echo LOCK_READY\n`);
  let pending, detail, failure;
  try {
    await ready;
    pending = asyncSql(container, `select historietas_privado.executar_agendamento_capitulo('${chapter(number)}',1);`);
    const deadline = Date.now() + 10_000;
    let waiting = 0;
    while (Date.now() < deadline) {
      waiting = Number(await asyncSql(container,
        "select count(*) from pg_stat_activity where wait_event_type='Lock' and query like '%executar_agendamento_capitulo%';"));
      if (waiting > 0) break;
      await pause(25);
    }
    assert.ok(waiting > 0, "Executor deve ter iniciado e estar aguardando o perfil real.");
    detail = await during();
  } catch (error) { failure = error; }
  finally {
    clearTimeout(timer); locker.stdin.end("commit;\n");
    if (locker.exitCode === null) await new Promise((resolve) => locker.once("exit", resolve));
  }
  const result = pending ? JSON.parse(await pending) : null;
  if (failure) throw failure;
  return { result, detail };
}

test("executor SQL privado e Data API local: concorrencia, cancelamento, edicao e identidade", async (t) => {
  const env = environment();
  const client = (secret = false) => createClient(env.url, secret ? env.secret : env.key,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const admin = client(true), author = client(), follower = client(), anon = client();
  const cleanup = () => sql(env.container, `begin;
    delete from public.obras where id='${WORK}';
    delete from public.profiles where user_id in ('${AUTHOR}','${FOLLOWER}','${OTHER}');
    delete from auth.users where id in ('${AUTHOR}','${FOLLOWER}','${OTHER}'); commit;`);
  cleanup(); t.after(cleanup);
  for (const [id, who, suffix] of [[AUTHOR, author, "autor"], [FOLLOWER, follower, "seguidor"]]) {
    const password = randomBytes(24).toString("base64url"), email = `qa-executor-${suffix}@historietas.test`;
    check(await admin.auth.admin.createUser({ id, email, password, email_confirm: true }));
    check(await who.auth.signInWithPassword({ email, password }));
  }
  const fixture = readFileSync(new URL("../../supabase/tests/database/capitulo_executor.test.sql", import.meta.url), "utf8");
  const start = fixture.indexOf("-- BEGIN EXECUTOR FIXTURE"), end = fixture.indexOf("-- END EXECUTOR FIXTURE");
  assert.ok(start >= 0 && end > start);
  sql(env.container, `begin;\n${fixture.slice(fixture.indexOf("\n", start), end)}\ncommit;`);
  const schedule = (n, revision = 0) => author.rpc("agendar_capitulo", {
    p_capitulo_id: chapter(n), p_revisao_esperada: revision, p_publicar_em: "2099-01-01T12:00:00Z", p_fuso_horario: "UTC",
  });
  const prepare = async (n) => {
    check(await schedule(n));
    sql(env.container, `update historietas_privado.capitulo_agendamentos set publicar_em=now()-interval '1 minute' where capitulo_id='${chapter(n)}';`);
  };
  const execute = async (n) => JSON.parse(await asyncSql(env.container, `select historietas_privado.executar_agendamento_capitulo('${chapter(n)}',1);`));

  await t.test("API nao expoe executor nem recibo, inclusive ao service role", async () => {
    for (const who of [anon, author, admin]) {
      assert.ok((await who.rpc("executar_agendamento_capitulo", { p_capitulo_id: chapter(1), p_revisao_esperada: 1 })).error);
      assert.ok((await who.rpc("executar_lote_agendamentos_capitulos", { p_limite: 5 })).error);
      assert.ok((await who.schema("historietas_privado").from("capitulo_publicacao_eventos").select("*")).error);
    }
    check(await schedule(1));
    assert.equal((await execute(1)).estado, "futuro");
    assert.deepEqual(check(await anon.from("capitulos").select("id").eq("id", chapter(1))), []);
  });
  await t.test("dois executores e resposta perdida nao duplicam publicacao/notificacoes", async () => {
    await prepare(2);
    const { result, detail } = await blockedExecutor(env.container, 2, () => execute(2));
    assert.equal(detail.estado, "ocupado"); assert.equal(result.estado, "publicado"); assert.equal(result.notificacoes, 2);
    const repeated = await execute(2);
    assert.equal(repeated.repetido, true); assert.equal(repeated.publicadoEm, result.publicadoEm);
    assert.equal(check(await follower.from("notificacoes").select("id").eq("capitulo_id", chapter(2))).length, 1);
    assert.equal(check(await anon.from("capitulos").select("id").eq("id", chapter(2))).length, 1);
    assert.equal(sql(env.container, `select count(*) from historietas_privado.capitulo_publicacao_eventos where capitulo_id='${chapter(2)}';`), "1");
  });
  await t.test("cancelamento autenticado durante execucao impede publicacao", async () => {
    await prepare(3);
    const { result } = await blockedExecutor(env.container, 3, async () => {
      const value = check(await author.rpc("cancelar_agendamento_capitulo", { p_capitulo_id: chapter(3), p_revisao_esperada: 1 }));
      assert.equal(value.estado, "cancelado");
    });
    assert.equal(result.estado, "desatualizado");
    assert.deepEqual(check(await anon.from("capitulos").select("id").eq("id", chapter(3))), []);
  });
  await t.test("edicao autenticada durante execucao invalida a intencao", async () => {
    await prepare(4);
    const { result } = await blockedExecutor(env.container, 4, async () =>
      check(await author.from("capitulos").update({ texto: "Texto editado enquanto o executor aguardava autorizacao." }).eq("id", chapter(4))));
    assert.equal(result.estado, "desatualizado");
    assert.equal(check(await author.rpc("consultar_agendamento_capitulo", { p_capitulo_id: chapter(4) })).estado, "invalidado");
  });
  await t.test("reagendamento durante execucao preserva novo horario futuro", async () => {
    await prepare(5);
    const { result } = await blockedExecutor(env.container, 5, async () => check(await schedule(5, 1)));
    assert.equal(result.estado, "desatualizado");
    const value = check(await author.rpc("consultar_agendamento_capitulo", { p_capitulo_id: chapter(5) }));
    assert.equal(value.revisao, 2); assert.equal(value.estado, "agendado");
    assert.deepEqual(check(await anon.from("capitulos").select("id").eq("id", chapter(5))), []);
  });
  await t.test("logout nao impersona nem cancela intencao autorizada; execucao continua somente SQL", async () => {
    await prepare(6); check(await author.auth.signOut());
    assert.ok((await author.rpc("executar_lote_agendamentos_capitulos", { p_limite: 5 })).error);
    assert.equal((await execute(6)).estado, "publicado");
  });
});
