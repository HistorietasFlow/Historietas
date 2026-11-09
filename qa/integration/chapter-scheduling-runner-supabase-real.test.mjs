import assert from "node:assert/strict";
import { execFile, execFileSync, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { criarInvocacaoStatusSupabase } from "../scripts/supabase-cli-invocation.mjs";

const AUTHOR = "b6100000-0000-4000-8000-000000000001";
const WORK = "b6200000-0000-4000-8000-000000000001";
const chapter = (n) => `b6300000-0000-4000-8000-${String(n).padStart(12, "0")}`;
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
function check(response) { assert.equal(response.error, null, response.error?.message); return response.data; }

test("runner privado local: gate, concorrencia, orcamento, recuperacao e Data API", async (t) => {
  const env = environment(), container = env.container;
  const client = (key = env.key) => createClient(env.url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const admin = client(env.secret), author = client(), anon = client();
  const control = sql(container, "select row_to_json(c) from historietas_privado.capitulo_runner_controle c;");
  assert.equal(JSON.parse(control).habilitado, false, "Testes exigem runner previamente desativado.");
  const cleanup = () => sql(container, `begin;
    drop trigger if exists zz_qa_runner_delay on historietas_privado.capitulo_publicacao_eventos;
    drop function if exists historietas_privado.zz_qa_runner_delay();
    delete from historietas_privado.capitulo_cache_outbox where obra_id='${WORK}';
    delete from public.obras where id='${WORK}';
    delete from public.profiles where user_id='${AUTHOR}';
    delete from auth.users where id='${AUTHOR}';
    update historietas_privado.capitulo_runner_controle c set
      habilitado=false,lotes=x.lotes,tentativas=x.tentativas,sucessos=x.sucessos,erros=x.erros,
      ultima_execucao=x.ultima_execucao,ultimo_resultado=x.ultimo_resultado
      from json_populate_record(null::historietas_privado.capitulo_runner_controle,'${control}'::json) x;
    commit;`);
  cleanup(); t.after(cleanup);
  const email = "qa-runner@historietas.test", password = randomBytes(24).toString("base64url");
  check(await admin.auth.admin.createUser({ id: AUTHOR, email, password, email_confirm: true }));
  check(await author.auth.signInWithPassword({ email, password }));
  const fixture = readFileSync(new URL("../../supabase/tests/database/capitulo_runner.test.sql", import.meta.url), "utf8");
  const start = fixture.indexOf("-- BEGIN RUNNER FIXTURE"), end = fixture.indexOf("-- END RUNNER FIXTURE");
  assert.ok(start >= 0 && end > start);
  sql(container, `begin;\n${fixture.slice(fixture.indexOf("\n", start), end)}\ncommit;`);
  const prepare = async (n) => {
    check(await author.rpc("agendar_capitulo", { p_capitulo_id: chapter(n), p_revisao_esperada: 0,
      p_publicar_em: "2099-01-01T00:00:00Z", p_fuso_horario: "UTC" }));
    sql(container, `update historietas_privado.capitulo_agendamentos set publicar_em=now()-interval '1 hour' where capitulo_id='${chapter(n)}';`);
  };
  const command = (limit = 3, budget = 2000, timeout = "10s") =>
    `begin; set local statement_timeout='${timeout}'; set local lock_timeout='100ms';
     select historietas_privado.executar_runner_capitulos(${limit},${budget}); commit;`;
  const run = async (...params) => JSON.parse(await asyncSql(container, command(...params)));
  const delay = (number, seconds) => sql(container, `
    create or replace function historietas_privado.zz_qa_runner_delay() returns trigger language plpgsql as $$
    begin if new.capitulo_id='${chapter(number)}' then perform pg_sleep(${seconds}); end if; return new; end; $$;
    create trigger zz_qa_runner_delay after insert on historietas_privado.capitulo_publicacao_eventos
      for each row execute function historietas_privado.zz_qa_runner_delay();`);
  const removeDelay = () => sql(container, `drop trigger zz_qa_runner_delay on historietas_privado.capitulo_publicacao_eventos;
    drop function historietas_privado.zz_qa_runner_delay();`);
  const ageRetry = (n) => sql(container, `begin;
    update historietas_privado.capitulo_runner_tentativas set proxima_em=now()-interval '1 minute' where capitulo_id='${chapter(n)}';
    update historietas_privado.capitulo_agendamentos set executado_em=case when estado='erro' then now()-interval '2 minutes' else executado_em end
      where capitulo_id='${chapter(n)}'; commit;`);

  await t.test("gate fechado e nenhuma exposicao para anon/authenticated/service role", async () => {
    await prepare(1);
    assert.equal((await run()).estado, "desativado");
    for (const who of [anon, author, admin]) {
      assert.ok((await who.rpc("executar_runner_capitulos", { p_limite: 3, p_orcamento_ms: 2000 })).error);
      assert.ok((await who.rpc("metricas_runner_capitulos")).error);
      for (const table of ["capitulo_runner_controle", "capitulo_runner_tentativas"]) {
        assert.ok((await who.schema("historietas_privado").from(table).select("*")).error);
      }
    }
    assert.deepEqual(check(await anon.from("capitulos").select("id").eq("id", chapter(1))), []);
    sql(container, "update historietas_privado.capitulo_runner_controle set habilitado=true;");
  });
  await t.test("dois runners reais nao processam simultaneamente", async () => {
    const locker = spawn("docker", args(container), { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let output = "", timer;
    const exited = new Promise((resolve) => locker.once("exit", resolve));
    const ready = new Promise((resolve, reject) => {
      locker.stdout.on("data", (chunk) => { output += chunk; if (output.includes("RUNNER_READY")) resolve(); });
      locker.on("error", reject);
      locker.on("exit", () => { if (!output.includes("RUNNER_READY")) reject(new Error("Runner nao alcancou a barreira.")); });
      timer = setTimeout(() => reject(new Error("Barreira local indisponivel.")), 10_000);
    });
    // A barreira e o COMMIT sao controlados pelo teste, nao por um sleep/lease.
    locker.stdin.write(command(1, 5000).replace("commit;", "") + "\n\\echo RUNNER_READY\n");
    try {
      await ready;
      const result = JSON.parse(output.split(/\r?\n/).find((line) => line.startsWith("{")));
      assert.equal(result.sucessos, 1);
      assert.deepEqual(check(await anon.from("capitulos").select("id").eq("id", chapter(1))), [], "Sem exposicao antes do commit.");
      assert.equal((await run()).estado, "ocupado");
    } finally {
      clearTimeout(timer); locker.stdin.end("commit;\n");
      assert.equal(await exited, 0);
    }
    assert.equal((await run()).erros, 0);
    assert.equal(check(await anon.from("capitulos").select("id").eq("id", chapter(1))).length, 1);
  });
  await t.test("backlog limitado, resposta perdida e efeitos unicos", async () => {
    await prepare(2); await prepare(3); await prepare(4);
    assert.equal((await run(2, 5000)).sucessos, 2);
    assert.equal((await run(2, 5000)).sucessos, 1);
    assert.equal((await run()).tentativas, 0);
    for (const table of ["capitulo_publicacao_eventos", "capitulo_cache_outbox"]) {
      assert.equal(Number(sql(container, `select count(*) from historietas_privado.${table} where obra_id='${WORK}';`)), 4);
    }
    assert.equal(check(await anon.from("diario_atividades").select("id").eq("obra_id", WORK)).length, 4);
  });
  await t.test("orcamento cooperativo nao inicia o proximo item", async () => {
    await prepare(5); await prepare(6); delay(5, 1);
    try {
      const result = await run(2, 500);
      assert.equal(result.estado, "orcamento_esgotado"); assert.equal(result.tentativas, 1);
      assert.deepEqual(check(await anon.from("capitulos").select("id").eq("id", chapter(6))), []);
    } finally { removeDelay(); }
    assert.equal((await run()).sucessos, 1);
  });
  await t.test("timeout global reverte o lote, sem recibo ou telemetria parcial", async () => {
    await prepare(7); await prepare(8); delay(8, 2);
    const before = sql(container, "select tentativas from historietas_privado.capitulo_runner_controle;");
    try {
      await assert.rejects(asyncSql(container, command(2, 5000, "250ms")), /statement timeout/);
    } finally { removeDelay(); }
    assert.equal(sql(container, "select tentativas from historietas_privado.capitulo_runner_controle;"), before);
    for (const n of [7, 8]) {
      assert.deepEqual(check(await anon.from("capitulos").select("id").eq("id", chapter(n))), []);
      assert.equal(sql(container, `select count(*) from historietas_privado.capitulo_cache_outbox where capitulo_id='${chapter(n)}';`), "0");
    }
    assert.equal((await run()).sucessos, 2);
  });
  await t.test("falha, limite de retries e revisao nova sem recuperar intencao antiga", async () => {
    await prepare(9);
    sql(container, `create function historietas_privado.zz_qa_runner_delay() returns trigger language plpgsql as $$
      begin raise exception 'falha controlada'; end; $$;
      create trigger zz_qa_runner_delay after insert on historietas_privado.capitulo_publicacao_eventos
        for each row execute function historietas_privado.zz_qa_runner_delay();`);
    try {
      for (let i = 1; i <= 5; i++) {
        assert.equal((await run()).erros, 1);
        assert.equal((await run()).tentativas, 0);
        ageRetry(9);
      }
      assert.equal((await run()).tentativas, 0);
      const metrics = JSON.parse(sql(container, "select historietas_privado.metricas_runner_capitulos();"));
      assert.equal(metrics.retriesEsgotados, 1);
    } finally { removeDelay(); }
    check(await author.rpc("agendar_capitulo", { p_capitulo_id: chapter(9), p_revisao_esperada: 1,
      p_publicar_em: "2099-02-01T00:00:00Z", p_fuso_horario: "UTC" }));
    assert.equal((await run()).tentativas, 0, "Reagendamento futuro nao pode publicar.");
    sql(container, `update historietas_privado.capitulo_agendamentos set publicar_em=now()-interval '1 minute' where capitulo_id='${chapter(9)}';`);
    assert.equal((await run()).sucessos, 1);
    assert.equal(sql(container, `select tentativas from historietas_privado.capitulo_runner_tentativas where capitulo_id='${chapter(9)}';`), "1");
  });
  await t.test("lock_timeout de um item preserva a intencao e permite recuperacao", async () => {
    await prepare(10);
    const locker = spawn("docker", args(container), { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let output = "", timer;
    const exited = new Promise((resolve) => locker.once("exit", resolve));
    const ready = new Promise((resolve, reject) => {
      locker.stdout.on("data", (chunk) => { output += chunk; if (output.includes("PROFILE_READY")) resolve(); });
      locker.on("error", reject);
      locker.on("exit", () => { if (!output.includes("PROFILE_READY")) reject(new Error("Lock local encerrou antes da barreira.")); });
      timer = setTimeout(() => reject(new Error("Barreira de perfil indisponivel.")), 10_000);
    });
    locker.stdin.write(`begin; select user_id from public.profiles where user_id='${AUTHOR}' for update;\n\\echo PROFILE_READY\n`);
    try {
      await ready;
      const result = await run();
      assert.equal(result.erros, 1); assert.equal(result.sucessos, 0);
      assert.deepEqual(check(await anon.from("capitulos").select("id").eq("id", chapter(10))), []);
      assert.equal(sql(container, `select estado from historietas_privado.capitulo_agendamentos where capitulo_id='${chapter(10)}';`), "agendado");
    } finally {
      clearTimeout(timer); locker.stdin.end("rollback;\n"); assert.equal(await exited, 0);
    }
    ageRetry(10);
    assert.equal((await run()).sucessos, 1);
  });
});
