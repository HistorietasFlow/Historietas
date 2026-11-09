import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { setTimeout as pause } from "node:timers/promises";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { criarInvocacaoStatusSupabase } from "../scripts/supabase-cli-invocation.mjs";

const AUTHOR = "e9100000-0000-4000-8000-000000000001";
const OTHER = "e9100000-0000-4000-8000-000000000002";
const CHAPTER = "e9300000-0000-4000-8000-000000000001";
const WORK = "e9200000-0000-4000-8000-000000000001";
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");

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
  return execFileSync("docker", ["exec", "-i", container, "psql", "-U", "postgres", "-d", "postgres", "-XAt", "-v", "ON_ERROR_STOP=1"],
    { input: source, encoding: "utf8", windowsHide: true, stdio: ["pipe", "pipe", "pipe"] }).trim();
}
function client(env, secret = false) {
  return createClient(env.url, secret ? env.secret : env.key,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
function reserve(who, key = randomUUID(), overrides = {}) {
  return who.rpc("reservar_pagina_capitulo", { p_capitulo_id: CHAPTER, p_versao_esperada: 0,
    p_chave_requisicao: key, p_mime_type: "image/png", ...overrides });
}
function check(result) {
  assert.equal(result.error, null, result.error?.message);
  return result.data;
}

// Bloqueia as duas transacoes ANTES da leitura de quota. Aguarda a evidencia
// pg_locks/pg_stat_activity, nao usa probabilidade de Promise.all como prova.
async function concurrentAtQuotaLock(container, operations) {
  const locker = spawn("docker", ["exec", "-i", container, "psql", "-U", "postgres", "-d", "postgres", "-XAt", "-v", "ON_ERROR_STOP=1"],
    { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
  let readyTimer;
  const ready = new Promise((resolve, reject) => {
    let output = "";
    locker.stdout.on("data", (data) => { output += data; if (output.includes("LOCK_READY")) resolve(); });
    locker.on("error", reject);
    locker.on("exit", (code) => { if (!output.includes("LOCK_READY")) reject(new Error(`Lock encerrou: ${code}`)); });
    readyTimer = setTimeout(() => reject(new Error("Trava local nao ficou pronta.")), 10_000);
  });
  locker.stdin.write("begin; select pg_advisory_xact_lock(hashtextextended('historietas:storage:cota:v1',0));\n\\echo LOCK_READY\n");
  const pending = [];
  let failure;
  try {
    await ready;
    pending.push(...operations.map((operation) => Promise.resolve(operation())));
    const deadline = Date.now() + 10_000;
    let waiting = 0;
    while (Date.now() < deadline) {
      waiting = Number(sql(container, "select count(*) from pg_stat_activity where wait_event_type='Lock' and wait_event='advisory';"));
      if (waiting >= operations.length) break;
      await pause(25);
    }
    assert.ok(waiting >= operations.length, "As duas operacoes devem disputar a mesma trava global.");
  } catch (error) {
    failure = error;
  } finally {
    clearTimeout(readyTimer);
    locker.stdin.end("commit;\n");
    if (locker.exitCode === null) await new Promise((resolve) => locker.once("exit", resolve));
  }
  if (failure) { await Promise.allSettled(pending); throw failure; }
  return Promise.all(pending);
}

test("reservas reais: identidade, Storage legado e concorrencia na ultima vaga", async (t) => {
  const env = environment();
  const admin = client(env, true);
  const anon = client(env);
  const author = client(env);
  const other = client(env);
  const paths = Array.from({ length: 30 }, (_, index) => `${AUTHOR}/qa-reserva-legado-${index}.png`);
  const removed = () => admin.storage.from("arquivos-obras").remove(paths).then(check);
  await removed();
  const clean = () => sql(env.container, `begin;
    delete from historietas_privado.capitulo_upload_tentativas where user_id='${AUTHOR}';
    delete from public.obras where id='${WORK}';
    delete from public.profiles where user_id in ('${AUTHOR}','${OTHER}');
    delete from auth.users where id in ('${AUTHOR}','${OTHER}');
    delete from historietas_privado.capitulo_arquivos_limpeza where storage_path like '${AUTHOR}/capitulos/%';
    commit;`);
  clean();
  t.after(async () => { await removed(); clean(); });
  for (const [id, who, suffix] of [[AUTHOR, author, "author"], [OTHER, other, "other"]]) {
    const password = randomBytes(24).toString("base64url");
    const email = `qa-reservas-${suffix}@historietas.test`;
    check(await admin.auth.admin.createUser({ id, email, password, email_confirm: true }));
    check(await who.auth.signInWithPassword({ email, password }));
  }
  const fixture = readFileSync(new URL("../../supabase/tests/database/capitulo_reservas.test.sql", import.meta.url), "utf8");
  const start = fixture.indexOf("-- BEGIN RESERVATION FIXTURE");
  const end = fixture.indexOf("-- END RESERVATION FIXTURE");
  assert.ok(start >= 0 && end > start);
  sql(env.container, `begin;\n${fixture.slice(fixture.indexOf("\n", start), end)}\ncommit;`);
  const releases = new Set();
  const release = async (id, who = author) => check(await who.rpc("liberar_reserva_pagina_capitulo", { p_reserva_id: id }));
  const track = (result) => { const value = check(result); releases.add(value.reservaId); return value; };
  const releaseAll = async () => { for (const id of releases) await release(id); releases.clear(); };

  await t.test("anon, service role e terceiros nao reservam nem acessam o ledger", async () => {
    assert.equal((await reserve(anon)).error?.code, "42501");
    assert.equal((await reserve(admin)).error?.code, "42501");
    assert.equal((await reserve(other)).error?.code, "42501");
    for (const who of [anon, author, other, admin]) {
      assert.ok((await who.schema("historietas_privado").from("capitulo_uploads_pendentes").select("*")).error);
      assert.ok((await who.rpc("objetos_storage_com_reservas")).error);
    }
  });
  await t.test("retry simultaneo retorna a mesma reserva sem repetir capacidade", async () => {
    const key = randomUUID();
    const [a, b] = await concurrentAtQuotaLock(env.container, [() => reserve(author, key), () => reserve(author, key)]);
    const first = track(a);
    assert.deepEqual(check(b), first);
    assert.deepEqual(Object.keys(first).sort(), ["expiraEm", "reservaId", "tamanhoReservado", "versaoEsperada"]);
    assert.equal(first.tamanhoReservado, 2097152);
    assert.ok(Date.parse(first.expiraEm) > Date.now());
    assert.ok(Date.parse(first.expiraEm) < Date.now() + 16 * 60_000);
    assert.equal((await reserve(author, key, { p_mime_type: "image/webp" })).error?.code, "22023");
    const path = sql(env.container, `select storage_path from historietas_privado.capitulo_uploads_pendentes where id='${first.reservaId}';`);
    assert.equal(path, `${AUTHOR}/capitulos/${CHAPTER}/${first.reservaId}.png`);
    const uploaded = await author.storage.from("arquivos-obras").upload(path, PNG, { contentType: "image/png" });
    assert.equal(String(uploaded.error?.statusCode), "403", "Reserva nao autoriza upload.");
    await release(first.reservaId, other);
    assert.deepEqual(check(await reserve(author, key)), first, "Terceiro nao libera capacidade alheia.");
    await releaseAll();
    await release(first.reservaId);
    assert.equal((await reserve(author, key)).error?.code, "55000");
  });
  await t.test("versao, campos forjados, capitulo alheio e inexistente sao recusados", async () => {
    const stale = await reserve(author, randomUUID(), { p_versao_esperada: 1 });
    assert.equal(stale.status, 409);
    assert.equal(stale.error?.code, "PT409");
    assert.equal((await reserve(author, randomUUID(), { p_capitulo_id: randomUUID() })).error?.code, "42501");
    assert.equal((await reserve(author, randomUUID(), { p_mime_type: "image/gif" })).error?.code, "22023");
    assert.ok((await reserve(author, randomUUID(), { p_storage_path: `${OTHER}/forjado.png` })).error);
    assert.ok((await reserve(author, randomUUID(), { p_user_id: OTHER })).error);
    assert.ok((await reserve(author, randomUUID(), { p_tamanho_reservado: 1 })).error);
  });
  await t.test("dez pendencias por capitulo; liberar nao muda manifesto", async () => {
    for (let index = 0; index < 10; index++) track(await reserve(author));
    assert.equal((await reserve(author)).error?.code, "54000");
    await releaseAll();
    const chapter = check(await author.from("capitulos").select("tipo_conteudo,versao_paginas").eq("id", CHAPTER).single());
    assert.deepEqual(chapter, { tipo_conteudo: "texto", versao_paginas: 0 });
  });
  await t.test("29 anexos reais + duas reservas concorrentes: somente uma aprovada", async () => {
    for (const path of paths.slice(0, 29)) check(await author.storage.from("arquivos-obras").upload(path, PNG, { contentType: "image/png" }));
    const results = await concurrentAtQuotaLock(env.container, [() => reserve(author), () => reserve(author)]);
    assert.equal(results.filter((result) => !result.error).length, 1);
    assert.equal(results.find((result) => result.error).error.code, "54000");
    track(results.find((result) => !result.error));
    // Upsert legado substitui, nao duplica objeto, mesmo com cota cheia.
    check(await author.storage.from("arquivos-obras").upload(paths[0], PNG, { contentType: "image/png", upsert: true }));
    assert.ok((await author.storage.from("arquivos-obras").upload(paths[29], PNG, { contentType: "image/png" })).error);
    await releaseAll();
  });
  await t.test("reserva e upload legado disputam a ultima vaga no MESMO lock", async (t) => {
    // A disputa pode revelar um defeito real. Mesmo nesse caso, nao deixar
    // capacidade/objetos desta fixture contaminarem expiracao e quotas depois.
    t.after(async () => {
      try { await releaseAll(); }
      finally { await removed(); }
    });
    const [reservation, upload] = await concurrentAtQuotaLock(env.container, [
      () => reserve(author),
      () => author.storage.from("arquivos-obras").upload(paths[29], PNG, { contentType: "image/png" }),
    ]);
    if (!reservation.error) track(reservation);
    assert.equal([reservation, upload].filter((result) => !result.error).length, 1);
  });
  await t.test("expiracao libera so reserva, e retry antigo nunca renova", async () => {
    // Fixture antiga inserida pelo administrador SQL, sem esperar 15 minutos ou
    // tornar o prazo editavel na RPC. Nao existe escrita fora do banco local.
    const id = randomUUID();
    const key = randomUUID();
    sql(env.container, `insert into historietas_privado.capitulo_uploads_pendentes
      (id,capitulo_id,user_id,storage_path,versao_esperada,chave_requisicao,criado_em,expira_em)
      values ('${id}','${CHAPTER}','${AUTHOR}','${AUTHOR}/capitulos/${CHAPTER}/${id}.png',0,'${key}',
      now()-interval '2 hours',now()-interval '1 hour');`);
    assert.equal((await reserve(author, key)).error?.code, "55000");
    assert.equal((await author.rpc("conferir_reserva_pagina_capitulo", {
      p_reserva_id: id, p_capitulo_id: CHAPTER, p_versao_esperada: 0,
    })).error?.code, "PT410");
    assert.equal(sql(env.container, `select count(*) from historietas_privado.objetos_storage_com_reservas() where name like '${AUTHOR}/%';`), "0");
    await release(id);
    await release(id);
  });
  await t.test("logout e sessao de B nao reutilizam reserva de A", async () => {
    const key = randomUUID();
    const value = track(await reserve(author, key));
    await release(value.reservaId, other);
    assert.deepEqual(check(await reserve(author, key)), value);
    check(await other.auth.signOut());
    assert.equal((await reserve(other, key)).error?.code, "42501");
    assert.equal((await other.rpc("liberar_reserva_pagina_capitulo", { p_reserva_id: value.reservaId })).error?.code, "42501");
    await releaseAll();
  });

  await t.test("ledger duravel privado: concorrencia, timeout e quotas reais compartilhadas", async () => {
    const value = track(await reserve(author));
    const session = check(await author.auth.getSession()).session;
    // Usa somente sub/session_id do JWT REAL em memoria, nunca imprime o token.
    // SQL privilegiado e exclusivo da fixture local: nao existe RPC publica para
    // preparar/iniciar tentativas nem permissao para service_role faze-lo.
    const jwt = JSON.parse(Buffer.from(session.access_token.split(".")[1], "base64url"));
    assert.equal(jwt.sub, AUTHOR);
    assert.match(jwt.session_id, /^[a-f0-9-]{36}$/i);
    const claims = `select set_config('request.jwt.claims','${JSON.stringify({ sub: AUTHOR, session_id: jwt.session_id })}',true);`;
    const key = randomUUID();
    const prepare = `select historietas_privado.preparar_tentativa_upload_pagina('${value.reservaId}','${CHAPTER}',0,'${key}');`;
    const run = (source) => new Promise((resolve, reject) => {
      const child = spawn("docker", ["exec", "-i", env.container, "psql", "-U", "postgres", "-d", "postgres", "-XqAt",
        "-v", "ON_ERROR_STOP=1", "-v", "VERBOSITY=sqlstate"], { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
      let out = "", err = "";
      child.stdout.on("data", (data) => { out += data; });
      child.stderr.on("data", (data) => { err += data; });
      child.on("error", reject);
      child.on("close", (code) => resolve({ code, out: out.trim().split(/\r?\n/).at(-1), err }));
      child.stdin.end(`begin; ${claims} ${source} commit;`);
    });
    const cleanupAttempt = () => sql(env.container, `delete from historietas_privado.capitulo_upload_tentativas where reserva_id='${value.reservaId}';`);
    const path = `${AUTHOR}/capitulos/${CHAPTER}/${value.reservaId}.png`;
    try {
      const prepared = await concurrentAtQuotaLock(env.container, [() => run(prepare), () => run(prepare)]);
      assert.deepEqual(prepared.map((r) => r.code), [0, 0]);
      assert.ok(prepared[0].out === prepared[1].out, "Retry nao renova lease (nao imprimir recibos internos).");
      const attempt = JSON.parse(prepared[0].out);
      assert.equal(attempt.escritaHabilitada, false);
      const start = `select historietas_privado.iniciar_transferencia_pagina('${attempt.tentativaId}',
        '${attempt.leaseToken}','${"a".repeat(64)}',${PNG.length},1,1,'image/png');`;
      const starts = await concurrentAtQuotaLock(env.container, [() => run(start), () => run(start)]);
      assert.equal(starts.filter((r) => r.code === 0).length, 1, "Somente um inicio autorizado pelo protocolo privado.");
      assert.match(starts.find((r) => r.code !== 0).err, /PT409/);
      for (const who of [anon, author, other, admin]) {
        assert.ok((await who.schema("historietas_privado").from("capitulo_upload_tentativas").select("*")).error);
        assert.ok((await who.rpc("preparar_tentativa_upload_pagina", { p_reserva_id: value.reservaId,
          p_capitulo_id: CHAPTER, p_versao_esperada: 0, p_chave_requisicao: key })).error);
      }
      assert.equal(String((await author.storage.from("arquivos-obras").upload(path, PNG, { contentType: "image/png" })).error?.statusCode), "403");
      assert.equal((await run(`select historietas_privado.encerrar_tentativa_upload_pagina('${attempt.tentativaId}','${attempt.leaseToken}','timeout');`)).code, 0);
      await releaseAll();
      for (const legacyPath of paths.slice(0, 29)) check(await author.storage.from("arquivos-obras").upload(legacyPath, PNG, { contentType: "image/png" }));
      assert.ok((await author.storage.from("arquivos-obras").upload(paths[29], PNG, { contentType: "image/png" })).error,
        "Timeout + reserva liberada ainda ocupam a ultima vaga.");
      check(await author.storage.from("arquivos-obras").upload(paths[0], PNG, { contentType: "image/png", upsert: true }));
      // Escrita ADMINISTRATIVA de fixture somente local, simulando resposta tardia.
      // Nao e um escritor de producao nem habilita upload pelo endpoint.
      check(await admin.storage.from("arquivos-obras").upload(path, PNG, { contentType: "image/png" }));
      assert.equal(sql(env.container, `select count(*) from historietas_privado.objetos_storage_com_reservas() where name='${path}';`), "1");
      assert.equal(sql(env.container, `select metadata->>'size' from historietas_privado.objetos_storage_com_reservas() where name='${path}';`), "2097152");
      check(await admin.storage.from("arquivos-obras").remove([path]));
      assert.equal(sql(env.container, `select count(*) from historietas_privado.objetos_storage_com_reservas() where name='${path}';`), "1",
        "Ausencia atual do objeto nao libera tentativa ambigua automaticamente.");
    } finally {
      check(await admin.storage.from("arquivos-obras").remove([path]));
      await removed();
      // Exclusao apenas da fixture sem IO em andamento; nenhuma API libera o ledger.
      cleanupAttempt();
      await releaseAll();
    }
  });

  await t.test("pre-validacao confere JWT real, nao grava e recusa token apos logout", async () => {
    const value = track(await reserve(author));
    const params = { p_reserva_id: value.reservaId, p_capitulo_id: CHAPTER, p_versao_esperada: 0 };
    const before = sql(env.container, `select row_to_json(r)::text from historietas_privado.capitulo_uploads_pendentes r where id='${value.reservaId}';`);
    for (let index = 0; index < 2; index++) {
      const info = check(await author.rpc("conferir_reserva_pagina_capitulo", params));
      assert.deepEqual(info, { usuarioId: AUTHOR, mimeType: "image/png", expiraEm: value.expiraEm, versaoEsperada: 0 });
    }
    assert.equal(sql(env.container, `select row_to_json(r)::text from historietas_privado.capitulo_uploads_pendentes r where id='${value.reservaId}';`), before);
    assert.equal((await anon.rpc("conferir_reserva_pagina_capitulo", params)).error?.code, "42501");
    assert.equal((await admin.rpc("conferir_reserva_pagina_capitulo", params)).error?.code, "42501");
    const token = check(await author.auth.getSession()).session.access_token;
    check(await author.auth.signOut());
    const old = createClient(env.url, env.key, { global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false } });
    assert.equal((await old.rpc("conferir_reserva_pagina_capitulo", params)).error?.code, "42501");
    // A FK/cascata do cleanup remove a reserva; JWT/credenciais nunca vao ao log.
  });
});
