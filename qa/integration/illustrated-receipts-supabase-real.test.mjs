import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { setTimeout as pause } from "node:timers/promises";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { criarInvocacaoStatusSupabase } from "../scripts/supabase-cli-invocation.mjs";

const USER = "fc100000-0000-4000-8000-000000000001";
const OTHER = "fc100000-0000-4000-8000-000000000002";
const SESSION = "fc500000-0000-4000-8000-000000000001";
const CLAIMS = `select set_config('request.jwt.claim.sub','${USER}',true);
 select set_config('request.jwt.claims','{"sub":"${USER}","session_id":"${SESSION}","role":"authenticated"}',true);`;

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
  for (const value of [url, db]) assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(value.hostname), "Recusa ambiente remoto.");
  assert.equal(url.protocol, "http:");
  assert.equal(db.protocol, "postgresql:");
  const containers = execFileSync("docker", ["ps", "--filter", `publish=${db.port}`, "--format", "{{.Names}}"],
    { encoding: "utf8", windowsHide: true }).trim().split(/\r?\n/).filter(Boolean);
  assert.equal(containers.length, 1);
  assert.ok(containers[0].startsWith("supabase_db_"));
  assert.ok(env.ANON_KEY && env.SERVICE_ROLE_KEY);
  return { url: url.origin, key: env.ANON_KEY, secret: env.SERVICE_ROLE_KEY, container: containers[0] };
}
const args = (container) => ["exec", "-i", container, "psql", "-U", "postgres", "-d", "postgres", "-XAt", "-v", "ON_ERROR_STOP=1", "-v", "VERBOSITY=verbose"];
function sql(container, source) {
  return execFileSync("docker", args(container), { input: source, encoding: "utf8", windowsHide: true, stdio: ["pipe", "pipe", "pipe"] }).trim();
}
function startSql(container) {
  const process = spawn("docker", args(container), { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
  let output = "";
  process.stdout.on("data", (value) => { output += value; });
  process.stderr.on("data", (value) => { output += value; });
  const done = new Promise((resolve, reject) => {
    process.on("error", reject);
    process.on("exit", (code) => resolve({ code, output }));
  });
  return { process, done, output: () => output };
}
async function until(predicate, description) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await pause(25);
  }
  throw new Error(description);
}
// Evidencia de bloqueio em pg_stat_activity, nao uma corrida probabilistica.
async function raceAtLock(container, lockSql, operations) {
  const locker = startSql(container);
  const pending = [];
  try {
    locker.process.stdin.write(`begin; ${lockSql};\n\\echo RECEIPT_LOCK_READY\n`);
    await until(() => locker.output().includes("RECEIPT_LOCK_READY"), "Lock local nao iniciou.");
    for (const source of operations) {
      const child = startSql(container);
      child.process.stdin.end(`begin; ${CLAIMS} /* qa_recibos_corrida */ ${source}; commit;`);
      pending.push(child.done);
    }
    await until(() => Number(sql(container, "select count(*) from pg_stat_activity where wait_event_type='Lock' and query like '%qa_recibos_corrida%' and pid<>pg_backend_pid();")) >= operations.length,
      "Operacoes nao chegaram a barreira SQL.");
  } finally {
    locker.process.stdin.end("commit;\n");
    await locker.done;
  }
  return Promise.all(pending);
}
function check(result) { assert.equal(result.error, null, result.error?.message); return result.data; }

test("recibos privados, Data API e disputas transacionais sem upload", async (t) => {
  const env = environment();
  const client = (key = env.key) => createClient(env.url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const admin = client(env.secret);
  const anon = client();
  const author = client();
  const other = client();
  const clean = () => sql(env.container, `begin;
    delete from historietas_privado.capitulo_upload_recibos where user_id='${USER}';
    delete from historietas_privado.capitulo_upload_tentativas where user_id='${USER}';
    delete from public.obras where id='fc200000-0000-4000-8000-000000000001';
    delete from public.profiles where user_id in ('${USER}','${OTHER}');
    delete from auth.users where id in ('${USER}','${OTHER}');
    delete from historietas_privado.capitulo_arquivos_limpeza where storage_path like '${USER}/capitulos/%';
    commit;`);
  clean();
  t.after(clean);
  for (const [id, who, suffix] of [[USER, author, "autor"], [OTHER, other, "outro"]]) {
    const password = randomBytes(24).toString("base64url");
    const email = `qa-recibos-${suffix}@historietas.test`;
    check(await admin.auth.admin.createUser({ id, email, password, email_confirm: true }));
    check(await who.auth.signInWithPassword({ email, password }));
  }
  const fixture = readFileSync(new URL("../../supabase/tests/database/capitulo_recibos.test.sql", import.meta.url), "utf8");
  const start = fixture.indexOf("-- BEGIN RECEIPT FIXTURE");
  const end = fixture.indexOf("-- END RECEIPT FIXTURE");
  assert.ok(start >= 0 && end > start);
  sql(env.container, `begin; ${fixture.slice(fixture.indexOf("\n", start), end)} commit;`);
  const attempt = JSON.parse(sql(env.container, `select row_to_json(t) from historietas_privado.capitulo_upload_tentativas t where user_id='${USER}';`));
  const observation = `select historietas_privado.registrar_observacao_upload_pagina('${attempt.id}','${attempt.lease_token}','fc600000-0000-4000-8000-000000000001','qa-version',repeat('a',64))`;

  await t.test("Data API nao permite forjar recibos/finalizar; somente admin recebe booleano", async () => {
    for (const who of [anon, author, other, admin]) {
      assert.ok((await who.schema("historietas_privado").from("capitulo_upload_recibos").select("*")).error);
      assert.ok((await who.rpc("registrar_observacao_upload_pagina", { p_tentativa_id: attempt.id })).error);
      assert.ok((await who.rpc("conferir_finalizacao_pagina", { p_tentativa_id: attempt.id })).error);
    }
    for (const who of [anon, author, other]) {
      assert.equal((await who.rpc("ha_uploads_ilustrados_pendentes_exclusao", { p_user_id: USER })).error?.code, "42501");
    }
    assert.equal(check(await admin.rpc("ha_uploads_ilustrados_pendentes_exclusao", { p_user_id: USER })), true);
    assert.equal(check(await admin.rpc("ha_uploads_ilustrados_pendentes_exclusao", { p_user_id: OTHER })), false);
    assert.equal(check(await admin.rpc("ha_uploads_ilustrados_pendentes_exclusao", { p_user_id: USER })), true, "Retry nao libera capacidade.");
  });

  // Observacao sintetica do TESTE para repetir o recibo em conexoes distintas.
  // Nenhum arquivo/metadado Storage criado; nao simula prova de upload seguro.
  sql(env.container, `insert into historietas_privado.capitulo_upload_recibos
    (tentativa_id,reserva_id,user_id,sessao_id,capitulo_id,versao_esperada,storage_path,objeto_id,objeto_versao,sha256,tamanho_bytes,largura,altura,mime_type)
    select id,reserva_id,user_id,sessao_id,capitulo_id,versao_esperada,storage_path,
      'fc600000-0000-4000-8000-000000000001','qa-version',sha256,tamanho_bytes,largura,altura,mime_type
    from historietas_privado.capitulo_upload_tentativas where id='${attempt.id}';`);
  const receipt = sql(env.container, `select id from historietas_privado.capitulo_upload_recibos where tentativa_id='${attempt.id}';`);
  const gate = `select historietas_privado.conferir_finalizacao_pagina('${attempt.id}','${attempt.lease_token}','${receipt}')`;

  await t.test("recibos duplicados simultaneos serializam e nao publicam", async () => {
    const results = await raceAtLock(env.container, "select pg_advisory_xact_lock(hashtextextended('historietas:storage:cota:v1',0))", [observation, observation]);
    assert.deepEqual(results.map((result) => result.code), [0, 0]);
    for (const result of results) assert.ok(result.output.includes('"publicacaoHabilitada": false'));
    assert.equal(sql(env.container, `select count(*) from historietas_privado.capitulo_upload_recibos where tentativa_id='${attempt.id}';`), "1");
    assert.ok(sql(env.container, `begin; ${CLAIMS} ${gate}; rollback;`).includes("terminalidade_nao_comprovada"));
  });
  await t.test("logout confirmado enquanto gate aguarda impede finalizacao", async () => {
    const [result] = await raceAtLock(env.container, `delete from auth.sessions where id='${SESSION}'`, [gate]);
    assert.notEqual(result.code, 0);
    assert.ok(result.output.includes("42501"), result.output);
    sql(env.container, `insert into auth.sessions(id,user_id) values('${SESSION}','${USER}');`);
  });
  await t.test("limpeza enfileirada vence gate concorrente sem remover arquivo", async () => {
    const [result] = await raceAtLock(env.container,
      `select pg_advisory_xact_lock(hashtextextended('historietas:storage:cota:v1',0));
       insert into historietas_privado.capitulo_arquivos_limpeza(storage_path,motivo) values('${attempt.storage_path}','upload_descartado')`, [gate]);
    assert.notEqual(result.code, 0);
    assert.ok(result.output.includes("PT409"), result.output);
    sql(env.container, `delete from historietas_privado.capitulo_arquivos_limpeza where storage_path='${attempt.storage_path}';`);
  });
  await t.test("cancelamento vence gate concorrente; recibo tardio nao reativa", async () => {
    const [result] = await raceAtLock(env.container,
      `select historietas_privado.encerrar_tentativa_upload_pagina('${attempt.id}','${attempt.lease_token}','cancelamento')`, [gate]);
    assert.notEqual(result.code, 0);
    assert.ok(result.output.includes("PT409"), result.output);
    assert.ok(sql(env.container, `${observation};`).includes('"publicacaoHabilitada": false'));
    assert.equal(sql(env.container, `select estado from historietas_privado.capitulo_upload_tentativas where id='${attempt.id}';`), "incerta");
    assert.equal(check(await admin.rpc("ha_uploads_ilustrados_pendentes_exclusao", { p_user_id: USER })), true);
    assert.equal(sql(env.container, `select count(*) from public.capitulo_paginas where capitulo_id='${attempt.capitulo_id}';`), "0");
    assert.equal(sql(env.container, `select count(*) from storage.objects where bucket_id='arquivos-obras' and name='${attempt.storage_path}';`), "0");
  });
  await t.test("exclusao em cascata preserva recibo e pendencia administrativa", async () => {
    sql(env.container, `delete from public.obras where id='fc200000-0000-4000-8000-000000000001';`);
    assert.equal(sql(env.container, `select count(*) from historietas_privado.capitulo_upload_recibos where tentativa_id='${attempt.id}';`), "1");
    assert.equal(check(await admin.rpc("ha_uploads_ilustrados_pendentes_exclusao", { p_user_id: USER })), true);
    assert.ok(sql(env.container, `${observation};`).includes('"publicacaoHabilitada": false'));
  });
});
