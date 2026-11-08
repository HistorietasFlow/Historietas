import assert from "node:assert/strict";
import { execFile, execFileSync, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { setTimeout as pause } from "node:timers/promises";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { criarInvocacaoStatusSupabase } from "../scripts/supabase-cli-invocation.mjs";

const AUTHOR = "ab100000-0000-4000-8000-000000000001";
const OTHER = "ab100000-0000-4000-8000-000000000002";
const CHAPTER = "ab300000-0000-4000-8000-000000000001";
const WORKS = [1, 2, 3].map((n) => `ab200000-0000-4000-8000-00000000000${n}`);

function environment() {
  const invocation = criarInvocacaoStatusSupabase();
  const output = execFileSync(invocation.comando, invocation.argumentos, {
    encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
  });
  const env = Object.fromEntries(output.split(/\r?\n/).filter((line) => /^[A-Z0-9_]+=/.test(line)).map((line) => {
    const index = line.indexOf("=");
    const value = line.slice(index + 1).trim();
    return [line.slice(0, index), value.startsWith('"') ? JSON.parse(value) : value];
  }));
  const url = new URL(env.API_URL);
  const db = new URL(env.DB_URL);
  for (const value of [url, db]) assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(value.hostname), "Recusa Supabase remoto.");
  assert.equal(url.protocol, "http:");
  assert.equal(db.protocol, "postgresql:");
  const containers = execFileSync("docker", ["ps", "--filter", `publish=${db.port}`, "--format", "{{.Names}}"],
    { encoding: "utf8", windowsHide: true }).trim().split(/\r?\n/).filter(Boolean);
  assert.equal(containers.length, 1);
  assert.ok(containers[0].startsWith("supabase_db_"));
  assert.ok(env.ANON_KEY && env.SERVICE_ROLE_KEY);
  return { url: url.origin, key: env.ANON_KEY, secret: env.SERVICE_ROLE_KEY, container: containers[0] };
}
function sql(container, source) {
  return execFileSync("docker", ["exec", "-i", container, "psql", "-U", "postgres", "-d", "postgres", "-XqAt", "-v", "ON_ERROR_STOP=1"],
    { input: source, encoding: "utf8", windowsHide: true, stdio: ["pipe", "pipe", "pipe"] }).trim();
}
function check(result) {
  assert.equal(result.error, null, result.error?.message);
  return result.data;
}
function waitingTransactions(container) {
  // Nao bloquear o event loop com execFileSync enquanto os thenables RPC ainda
  // precisam iniciar/enviar HTTP. O observador nao pode impedir a propria corrida.
  return new Promise((resolve, reject) => execFile("docker", ["exec", container, "psql", "-U", "postgres", "-d", "postgres", "-XqAt", "-c",
    "select count(*) from pg_stat_activity where wait_event_type='Lock' and query ~ '(agendar_capitulo|cancelar_agendamento_capitulo)';"],
  { encoding: "utf8", windowsHide: true }, (error, output) => error ? reject(error) : resolve(Number(output.trim()))));
}

// Barreira real: as duas chamadas aguardam o MESMO lock do capitulo antes de
// testar a revisao. Promise.all sozinho nao demonstra sobreposicao transacional.
async function concurrent(container, operations, beforeCommit = "") {
  const locker = spawn("docker", ["exec", "-i", container, "psql", "-U", "postgres", "-d", "postgres", "-XqAt", "-v", "ON_ERROR_STOP=1"],
    { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
  let timer;
  let output = "";
  const ready = new Promise((resolve, reject) => {
    locker.stdout.on("data", (data) => { output += data; if (output.includes("LOCK_READY")) resolve(); });
    locker.on("error", reject);
    locker.on("exit", (code) => { if (!output.includes("LOCK_READY")) reject(new Error(`Lock encerrou: ${code}`)); });
    timer = setTimeout(() => reject(new Error("Trava local nao ficou pronta.")), 10_000);
  });
  locker.stdin.write(`begin; select id from public.capitulos where id='${CHAPTER}' for update;\n\\echo LOCK_READY\n`);
  const pending = [];
  let failure;
  try {
    await ready;
    pending.push(...operations.map((operation) => Promise.resolve(operation())));
    const deadline = Date.now() + 10_000;
    let waiting = 0;
    while (Date.now() < deadline) {
      waiting = await waitingTransactions(container);
      if (waiting >= operations.length) break;
      await pause(25);
    }
    assert.ok(waiting >= operations.length, "As chamadas devem disputar a revisao sob lock real.");
  } catch (error) {
    failure = error;
  } finally {
    clearTimeout(timer);
    locker.stdin.end(`${beforeCommit}\ncommit;\n`);
    if (locker.exitCode === null) await new Promise((resolve) => locker.once("exit", resolve));
  }
  if (failure) { await Promise.allSettled(pending); throw failure; }
  return Promise.all(pending);
}

test("agendamento pela Data API local: identidade, revisoes, concorrencia e drafts", async (t) => {
  const env = environment();
  const client = (secret = false) => createClient(env.url, secret ? env.secret : env.key,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const admin = client(true), anon = client(), author = client(), other = client();
  const cleanup = () => sql(env.container, `begin;
    delete from public.obras where id in (${WORKS.map((id) => `'${id}'`).join(",")});
    delete from public.profiles where user_id in ('${AUTHOR}','${OTHER}');
    delete from auth.users where id in ('${AUTHOR}','${OTHER}');
    commit;`);
  cleanup();
  t.after(cleanup);
  for (const [id, who, suffix] of [[AUTHOR, author, "autor"], [OTHER, other, "terceiro"]]) {
    const password = randomBytes(24).toString("base64url");
    const email = `qa-agendamento-${suffix}@historietas.test`;
    check(await admin.auth.admin.createUser({ id, email, password, email_confirm: true }));
    check(await who.auth.signInWithPassword({ email, password }));
  }
  const fixture = readFileSync(new URL("../../supabase/tests/database/capitulo_agendamentos.test.sql", import.meta.url), "utf8");
  const start = fixture.indexOf("-- BEGIN SCHEDULING FIXTURE");
  const end = fixture.indexOf("-- END SCHEDULING FIXTURE");
  assert.ok(start >= 0 && end > start);
  sql(env.container, `begin;\n${fixture.slice(fixture.indexOf("\n", start), end)}\ncommit;`);
  const schedule = (revision, date = "2099-01-01T12:00:00Z", who = author) => who.rpc("agendar_capitulo", {
    p_capitulo_id: CHAPTER, p_revisao_esperada: revision, p_publicar_em: date, p_fuso_horario: "America/Sao_Paulo",
  });
  const consult = async () => check(await author.rpc("consultar_agendamento_capitulo", { p_capitulo_id: CHAPTER }));
  const cancel = (revision, who = author) => who.rpc("cancelar_agendamento_capitulo", { p_capitulo_id: CHAPTER, p_revisao_esperada: revision });

  await t.test("uma agenda privada, retry idempotente e nenhuma visibilidade antecipada", async () => {
    const initial = await concurrent(env.container, [() => schedule(0), () => schedule(0)]);
    const value = check(initial[0]);
    assert.deepEqual(check(initial[1]), value, "Duas solicitacoes equivalentes compartilham a revisao, nao duas tarefas.");
    assert.equal(value.revisao, 1);
    assert.equal(value.publicacaoAutomaticaHabilitada, false);
    assert.deepEqual(check(await schedule(0)), value);
    assert.deepEqual(check(await anon.from("capitulos").select("id,texto").eq("id", CHAPTER)), []);
    assert.deepEqual(check(await other.from("capitulos").select("id,texto").eq("id", CHAPTER)), []);
    assert.equal(check(await author.from("capitulos").select("publicado").eq("id", CHAPTER).single()).publicado, false);
    for (const who of [anon, other, admin]) {
      assert.equal((await schedule(1, undefined, who)).error?.code, "42501");
      assert.ok((await who.rpc("consultar_agendamento_capitulo", { p_capitulo_id: CHAPTER })).error);
      assert.ok((await who.schema("historietas_privado").from("capitulo_agendamentos").select("*")).error);
    }
    assert.equal((await author.from("capitulos").update({ publicado: true }).eq("id", CHAPTER)).error?.code, "PT409");
  });
  await t.test("reagendamentos concorrentes diferentes: so uma revisao vence", async () => {
    const results = await concurrent(env.container, [() => schedule(1, "2099-02-01T00:00:00Z"), () => schedule(1, "2099-03-01T00:00:00Z")]);
    assert.equal(results.filter((r) => r.error === null).length, 1);
    assert.equal(results.find((r) => r.error)?.error.code, "PT409");
    assert.equal((await consult()).revisao, 2);
  });
  await t.test("cancelamento contra reagendamento: nao desfaz a operacao vencedora", async () => {
    const results = await concurrent(env.container, [() => cancel(2), () => schedule(2, "2099-04-01T00:00:00Z")]);
    assert.equal(results.filter((r) => r.error === null).length, 1);
    assert.equal(results.find((r) => r.error)?.error.code, "PT409");
    assert.equal((await consult()).revisao, 3);
    check(await schedule(3, "2099-05-01T00:00:00Z"));
  });
  await t.test("edicao direta invalida; resposta antiga nao reativa; cancelar e seguro", async () => {
    check(await author.from("capitulos").update({ texto: "Texto alterado pela Data API, sem publicar." }).eq("id", CHAPTER));
    assert.equal((await consult()).estado, "invalidado");
    assert.equal((await consult()).revisao, 5);
    assert.equal((await schedule(3, "2099-05-01T00:00:00Z")).error?.code, "PT409");
    assert.equal((await schedule(5, "2000-01-01T00:00:00Z")).error?.code, "22023");
    check(await schedule(5, "2099-06-01T00:00:00Z"));
    assert.equal((await cancel(6, other)).error?.code, "42501");
    const value = check(await cancel(6));
    assert.equal(value.revisao, 7);
    assert.deepEqual(check(await cancel(6)), value);
  });
  await t.test("horario vencido nao publica sozinho; logout nao autoriza chamada posterior", async () => {
    check(await schedule(7, "2099-07-01T00:00:00Z"));
    const [stale] = await concurrent(env.container, [() => schedule(8, "2099-08-01T00:00:00Z")],
      `update public.capitulos set titulo='Edicao concorrente confirmada' where id='${CHAPTER}';`);
    assert.equal(stale.error?.code, "PT409", "Edicao confirmada durante espera invalida a revisao antiga.");
    assert.equal((await consult()).estado, "invalidado");
    check(await schedule(9, "2099-09-01T00:00:00Z"));
    // Simulacao EXCLUSIVAMENTE local do relogio/registro vencido, sem esperar.
    sql(env.container, `update historietas_privado.capitulo_agendamentos set publicar_em=now()-interval '1 minute' where capitulo_id='${CHAPTER}';`);
    assert.equal((await consult()).estado, "agendado");
    assert.equal(check(await author.from("capitulos").select("publicado").eq("id", CHAPTER).single()).publicado, false);
    const token = check(await author.auth.getSession()).session.access_token;
    check(await author.auth.signOut());
    const old = createClient(env.url, env.key, { global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false } });
    assert.equal((await cancel(10, old)).error?.code, "42501");
    assert.equal(sql(env.container, `select estado from historietas_privado.capitulo_agendamentos where capitulo_id='${CHAPTER}';`), "agendado");
  });
});
