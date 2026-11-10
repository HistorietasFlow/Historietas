import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { criarInvocacaoStatusSupabase } from "../scripts/supabase-cli-invocation.mjs";

const USER = randomUUID(), WORK = randomUUID(), chapterPrefix = randomUUID().slice(0, 23);
const chapter = (n) => `${chapterPrefix}-${String(n).padStart(12, "0")}`;
function check(result) { assert.equal(result.error, null, result.error?.message); return result.data; }

test("outbox local Data API: autenticacao, pos-commit, concorrencia, resposta perdida e retry", async (t) => {
  const inv = criarInvocacaoStatusSupabase();
  const output = execFileSync(inv.comando, inv.argumentos, { encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  const values = Object.fromEntries(output.split(/\r?\n/).filter((s) => /^[A-Z0-9_]+=/.test(s)).map((s) => {
    const i = s.indexOf("="), v = s.slice(i + 1).trim(); return [s.slice(0, i), v.startsWith('"') ? JSON.parse(v) : v];
  }));
  for (const value of [values.API_URL, values.DB_URL]) assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(value).hostname));
  const containers = execFileSync("docker", ["ps", "--filter", `publish=${new URL(values.DB_URL).port}`, "--format", "{{.Names}}"], { encoding: "utf8", windowsHide: true }).trim().split(/\r?\n/);
  assert.equal(containers.length, 1); assert.match(containers[0], /^supabase_db_/);
  const args = ["exec", "-i", containers[0], "psql", "-U", "postgres", "-d", "postgres", "-XqAt", "-v", "ON_ERROR_STOP=1"];
  const sql = (s) => execFileSync("docker", args, { input: s, encoding: "utf8", windowsHide: true, stdio: ["pipe", "pipe", "pipe"] }).trim();
  const snapshots = () => JSON.parse(sql(`select coalesce(json_agg(json_build_object(
    'id',id,'capitulo',capitulo_id,'revisao',revisao_agendada,'obra',obra_id,
    'slug',slug_publicacao,'numero',numero_capitulo,'publicadoEm',publicado_em) order by id),'[]')
    from historietas_privado.capitulo_cache_outbox;`));
  const anteriores = snapshots();
  t.diagnostic(`Outbox local: ${anteriores.length} eventos anteriores devem permanecer preservados.`);
  t.after(() => {
    const antesCleanup = snapshots();
    sql(`begin; delete from public.obras where id='${WORK}'; delete from auth.users where id='${USER}'; commit;`);
    assert.deepEqual(snapshots(), antesCleanup, "Cleanup nao apaga eventos nem altera IDs/snapshots, inclusive da fixture.");
    assert.deepEqual(antesCleanup.filter(evento => evento.obra !== WORK), anteriores, "Todas as pendencias anteriores permanecem intactas.");
  });
  const idsDaFixture = () => snapshots().filter(evento => evento.obra === WORK).map(evento => evento.id).sort();
  // Percorrer lotes novos nao e retry de falha: cada chamada reivindica outros
  // eventos elegiveis. Erro/lote vazio/repeticao falha imediatamente, sem espera.
  const localizarNosLotes = async (alvos, recebidos = []) => {
    const encontrados = recebidos.filter(evento => alvos.includes(evento.id));
    const vistos = new Set(recebidos.map(evento => evento.id));
    const elegiveis = Number(sql(`select count(*) from historietas_privado.capitulo_cache_outbox
      where lease_ate is null or lease_ate<=clock_timestamp();`));
    let percorridos = 0;
    for (let lote = 0; encontrados.length < alvos.length && lote < Math.ceil(elegiveis / 5); lote++) {
      const rows = check(await admin.rpc("reivindicar_cache_capitulos", { p_limite: 5 }));
      percorridos++;
      assert.ok(rows.length > 0 && rows.length <= 5, "Lote deve progredir com ate cinco eventos.");
      for (const row of rows) {
        assert.ok(!vistos.has(row.id), "Lease ativo impede repetir evento entre lotes.");
        vistos.add(row.id);
        if (alvos.includes(row.id)) encontrados.push(row);
      }
    }
    assert.deepEqual(encontrados.map(evento => evento.id).sort(), alvos, "Todos os IDs da fixture devem ser encontrados, sem duplicatas.");
    assert.ok(encontrados.every(evento => evento.obraId === WORK));
    t.diagnostic(`Fixture localizada: ${percorridos} lotes adicionais; ${elegiveis} eventos elegiveis no inicio.`);
    return encontrados;
  };
  const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
  const admin = createClient(values.API_URL, values.SERVICE_ROLE_KEY, options);
  const author = createClient(values.API_URL, values.ANON_KEY, options), anon = createClient(values.API_URL, values.ANON_KEY, options);
  const email = `qa-cache-outbox-${USER}@historietas.test`, password = randomBytes(24).toString("base64url");
  check(await admin.auth.admin.createUser({ id: USER, email, password, email_confirm: true, user_metadata: { role: "admin" } }));
  const session = check(await author.auth.signInWithPassword({ email, password })).session;
  const source = readFileSync(new URL("../../supabase/tests/database/capitulo_cache_outbox.test.sql", import.meta.url), "utf8");
  const inicio = source.indexOf("-- BEGIN CACHE FIXTURE"), fim = source.indexOf("-- END CACHE FIXTURE");
  assert.ok(inicio >= 0 && fim > inicio);
  const fixture = source.slice(source.indexOf("\n", inicio), fim)
    .replaceAll("bc100000-0000-4000-8000-000000000001", USER)
    .replaceAll("bc200000-0000-4000-8000-000000000001", WORK)
    .replaceAll("bc300000-0000-4000-8000-", `${chapterPrefix}-`)
    .replaceAll("bc500000-0000-4000-8000-000000000001", randomUUID())
    .replaceAll("'qa-cache'", `'qa-cache-${WORK}'`);
  sql(`begin; ${fixture} commit;`);
  const prepare = async (n) => {
    check(await author.rpc("agendar_capitulo", { p_capitulo_id: chapter(n), p_revisao_esperada: 0, p_publicar_em: "2099-01-01Z", p_fuso_horario: "UTC" }));
    sql(`update historietas_privado.capitulo_agendamentos set publicar_em=now()-interval '1 minute' where capitulo_id='${chapter(n)}';`);
  };
  await t.test("anon/autor nao leem fila nem reivindicam; metadata editavel nao autoriza", async () => {
    for (const who of [anon, author, admin]) assert.ok((await who.schema("historietas_privado").from("capitulo_cache_outbox").select("*")).error);
    for (const who of [anon, author]) assert.equal((await who.rpc("reivindicar_cache_capitulos", { p_limite: 1 })).error?.code, "42501");
    assert.equal(check(await author.rpc("autorizar_consumidor_cache_capitulos")), false);
    check(await admin.auth.admin.updateUserById(USER, { app_metadata: { role: "admin" } }));
    assert.equal(check(await author.rpc("autorizar_consumidor_cache_capitulos")), true);
  });
  await t.test("outbox somente visivel ao consumidor apos commit da publicacao", async () => {
    await prepare(1);
    const transaction = spawn("docker", args, { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let output = "", timer;
    const ready = new Promise((resolve, reject) => {
      transaction.stdout.on("data", (data) => { output += data; if (output.includes("CACHE_READY")) resolve(); });
      transaction.on("error", reject); transaction.on("exit", (code) => { if (!output.includes("CACHE_READY")) reject(new Error(`Transacao encerrou: ${code}`)); });
      timer = setTimeout(() => reject(new Error("Barreira local indisponivel.")), 10_000);
    });
    transaction.stdin.write(`begin; select historietas_privado.executar_agendamento_capitulo('${chapter(1)}',1);\n\\echo CACHE_READY\n`);
    try {
      await ready;
      const rows = check(await admin.rpc("reivindicar_cache_capitulos", { p_limite: 5 }));
      assert.ok(!rows.some((r) => r.obraId === WORK));
    } finally {
      clearTimeout(timer); transaction.stdin.end("commit;\n");
      if (transaction.exitCode === null) await new Promise((resolve) => transaction.once("exit", resolve));
    }
  });
  let claims;
  await t.test("dois consumidores simultaneos recebem eventos distintos; localiza capitulos da fixture entre lotes", async () => {
    await prepare(2); sql(`select historietas_privado.executar_agendamento_capitulo('${chapter(2)}',1);`);
    claims = (await Promise.all([1, 2].map(() => admin.rpc("reivindicar_cache_capitulos", { p_limite: 1 })))).flatMap(check);
    assert.equal(claims.length, 2); assert.equal(new Set(claims.map((c) => c.id)).size, 2);
    assert.equal(new Set(claims.map(c => c.leaseId)).size, 2);
    const alvos = idsDaFixture(); assert.equal(alvos.length, 2);
    claims = await localizarNosLotes(alvos, claims);
    assert.deepEqual(claims.map(c => c.capituloId).sort(), [chapter(1), chapter(2)].sort());
  });
  await t.test("solicitacao repetida, falha e lease vencido nao confirmam nem duplicam efeitos", async () => {
    const c = claims[0], params = { p_id: c.id, p_lease_id: c.leaseId };
    assert.equal(check(await admin.rpc("registrar_solicitacao_cache_capitulo", params)), true);
    assert.equal(check(await admin.rpc("registrar_solicitacao_cache_capitulo", params)), true);
    sql(`update historietas_privado.capitulo_cache_outbox set lease_ate=clock_timestamp()-interval '1 second' where obra_id='${WORK}';`);
    assert.equal((await admin.rpc("registrar_solicitacao_cache_capitulo", params)).error?.code, "55000");
    const retry = await localizarNosLotes(idsDaFixture());
    assert.equal(retry.length, 2);
    for (const anterior of claims) assert.notEqual(retry.find(r => r.id === anterior.id).leaseId, anterior.leaseId);
    assert.equal(sql(`select count(*) from historietas_privado.capitulo_cache_outbox
      where id='${c.id}' and solicitada_em is not null;`), "1", "Solicitacao preservada nao e ACK nem remocao.");
    assert.equal(sql(`select count(*) from historietas_privado.capitulo_cache_outbox where obra_id='${WORK}';`), "2");
    assert.equal(sql(`select count(*) from public.diario_atividades where obra_id='${WORK}';`), "2");
    assert.equal(sql(`select count(*) from historietas_privado.capitulo_publicacao_eventos where obra_id='${WORK}';`), "2");
  });
  await t.test("rebaixamento e logout negam acionamento mesmo com JWT anteriormente valido", async () => {
    const stale = createClient(values.API_URL, values.ANON_KEY, { ...options, global: { headers: { Authorization: `Bearer ${session.access_token}` } } });
    check(await admin.auth.admin.updateUserById(USER, { app_metadata: { role: "leitor" } }));
    assert.equal(check(await stale.rpc("autorizar_consumidor_cache_capitulos")), false);
    check(await admin.auth.admin.updateUserById(USER, { app_metadata: { role: "admin" } }));
    check(await author.auth.signOut());
    assert.equal(check(await stale.rpc("autorizar_consumidor_cache_capitulos")), false);
  });
});
