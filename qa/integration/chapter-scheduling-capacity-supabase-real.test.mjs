import assert from "node:assert/strict";
import { execFile, execFileSync, spawn } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { criarInvocacaoStatusSupabase } from "../scripts/supabase-cli-invocation.mjs";

const AUTHOR = randomUUID();
const WORK = randomUUID();
const chapterPrefix = randomUUID().slice(0, 23);
const chapter = n => `${chapterPrefix}-${String(n).padStart(12, "0")}`;
const literal = value => `'${value.replaceAll("'", "''")}'`;
function environment() {
  const inv = criarInvocacaoStatusSupabase();
  const output = execFileSync(inv.comando, inv.argumentos, { encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  const values = Object.fromEntries(output.split(/\r?\n/).filter(line => /^[A-Z0-9_]+=/.test(line)).map(line => {
    const i = line.indexOf("="), value = line.slice(i + 1).trim();
    return [line.slice(0, i), value.startsWith('"') ? JSON.parse(value) : value];
  }));
  const api = new URL(values.API_URL), db = new URL(values.DB_URL);
  for (const url of [api, db]) assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(url.hostname), "Recusa ambiente remoto.");
  assert.equal(api.protocol, "http:"); assert.equal(db.protocol, "postgresql:");
  const containers = execFileSync("docker", ["ps", "--filter", `publish=${db.port}`, "--format", "{{.Names}}"],
    { encoding: "utf8", windowsHide: true }).trim().split(/\r?\n/).filter(Boolean);
  assert.equal(containers.length, 1); assert.ok(containers[0].startsWith("supabase_db_"));
  return { container: containers[0], url: api.origin, key: values.ANON_KEY, secret: values.SERVICE_ROLE_KEY };
}
const check = result => { assert.equal(result.error, null, result.error?.code); return result.data; };

test("capacidade local: admissao efetiva, pausa, snapshots, retomada e Data API", async t => {
  const env = environment();
  const args = ["exec", "-i", env.container, "psql", "-U", "postgres", "-d", "postgres", "-XqAt", "-v", "ON_ERROR_STOP=1"];
  const sql = source => execFileSync("docker", args, { input: source, encoding: "utf8", windowsHide: true, stdio: ["pipe", "pipe", "pipe"] }).trim();
  const asyncSql = source => new Promise((resolve, reject) => {
    const child = execFile("docker", args, { encoding: "utf8", windowsHide: true }, (error, out) => error ? reject(error) : resolve(out.trim()));
    child.stdin.end(source);
  });
  const control = sql("select row_to_json(c) from historietas_privado.capitulo_runner_controle c;");
  const capacity = sql("select row_to_json(c) from historietas_privado.capitulo_runner_capacidade c;");
  assert.equal(JSON.parse(control).habilitado, false);
  assert.equal(JSON.parse(capacity).pausado, false);
  const fingerprint = () => sql(`select coalesce(md5(string_agg(row_to_json(b)::text,',' order by id)),'vazio')
    from historietas_privado.capitulo_cache_outbox b where obra_id<>'${WORK}';`);
  const original = fingerprint();
  const count = () => Number(sql("select count(*) from historietas_privado.capitulo_cache_outbox;"));
  const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
  const admin = createClient(env.url, env.secret, options), author = createClient(env.url, env.key, options), anon = createClient(env.url, env.key, options);
  const followers = [randomUUID(), randomUUID()];
  const originalMeasure = sql("select pg_get_functiondef('historietas_privado.medir_capacidade_capitulos()'::regprocedure);");
  t.after(async () => {
    sql(`begin; ${originalMeasure};
      update historietas_privado.capitulo_runner_controle set habilitado=false;
      update historietas_privado.capitulo_runner_capacidade c set
        limite_eventos=x.limite_eventos,limite_outbox_bytes=x.limite_outbox_bytes,
        limite_notificacoes_bytes=x.limite_notificacoes_bytes,limite_banco_bytes=x.limite_banco_bytes,
        alerta_percentual=x.alerta_percentual
        from json_populate_record(null::historietas_privado.capitulo_runner_capacidade,${literal(capacity)}::json) x;
      commit;`);
    // Preservar inclusive pendencias/incidentes sinteticos. O ambiente inteiro
    // e descartavel, mas este teste nao apaga eventos nem reseta sua evidencia.
    assert.equal(fingerprint(), original);
    assert.equal(sql("select habilitado from historietas_privado.capitulo_runner_controle;"), "f");
  });
  const password = randomBytes(24).toString("base64url");
  const email = `qa-capacidade-${AUTHOR}@historietas.test`;
  check(await admin.auth.admin.createUser({ id: AUTHOR, email, password, email_confirm: true }));
  check(await author.auth.signInWithPassword({ email, password }));
  const fixture = readFileSync(new URL("../../supabase/tests/database/capitulo_runner.test.sql", import.meta.url), "utf8");
  const start = fixture.indexOf("-- BEGIN RUNNER FIXTURE"), end = fixture.indexOf("-- END RUNNER FIXTURE");
  assert.ok(start >= 0 && end > start);
  const seed = fixture.slice(fixture.indexOf("\n", start), end)
    .replaceAll("b6100000-0000-4000-8000-000000000001", AUTHOR)
    .replaceAll("b6200000-0000-4000-8000-000000000001", WORK)
    .replaceAll("b6500000-0000-4000-8000-000000000001", randomUUID())
    .replaceAll("b6300000-0000-4000-8000-", `${chapterPrefix}-`)
    .replaceAll("'qa-runner'", `'qa-capacidade-${WORK}'`);
  sql(`begin; ${seed} commit;`);
  for (const id of followers) {
    check(await admin.auth.admin.createUser({ id, email: `qa-capacidade-${id}@historietas.test`, password: randomBytes(24).toString("base64url"), email_confirm: true }));
    sql(`insert into public.profiles(id,user_id,nome,tipo) values('${id}','${id}','Leitor capacidade','leitor');
      insert into public.seguindo_obras(user_id,obra_id) values('${id}','${WORK}');`);
  }
  const insert = (id = randomUUID()) => `insert into historietas_privado.capitulo_cache_outbox
    (capitulo_id,revisao_agendada,obra_id,publicado_em) values('${id}',1,'${WORK}',now());`;
  const run = () => JSON.parse(sql("begin; set local statement_timeout='10s'; set local lock_timeout='100ms'; select historietas_privado.executar_runner_capitulos(3,5000); commit;"));
  const verify = () => JSON.parse(sql("select historietas_privado.verificar_capacidade_runner_capitulos();"));
  const resume = revision => JSON.parse(sql(`select historietas_privado.retomar_capacidade_runner_capitulos(${revision},'capacidade_revisada');`));
  const limit = n => sql(`update historietas_privado.capitulo_runner_capacidade set limite_eventos=${n};`);

  await t.test("API e papel operacional nao medem, configuram ou retomam", async () => {
    assert.equal(run().estado, "desativado");
    for (const client of [anon, author, admin]) {
      for (const name of ["medir_capacidade_capitulos", "verificar_capacidade_runner_capitulos", "retomar_capacidade_runner_capitulos"]) {
        const params = name.startsWith("retomar") ? { p_revisao: 1, p_justificativa: "capacidade_revisada" } : {};
        assert.ok((await client.rpc(name, params)).error);
        assert.ok((await client.schema("historietas_privado").rpc(name, params)).error);
      }
      for (const table of ["capitulo_runner_capacidade", "capitulo_capacidade_incidentes"]) {
        assert.ok((await client.schema("historietas_privado").from(table).select("*")).error);
      }
    }
    assert.equal(sql("select has_function_privilege('historietas_capitulo_runner','historietas_privado.medir_capacidade_capitulos()','EXECUTE');"), "f");
  });
  await t.test("duas transacoes reais disputam a ultima vaga; retry nao ultrapassa", async () => {
    const before = count(); limit(before + 2); sql(insert());
    const ids = [randomUUID(), randomUUID()];
    const results = await Promise.allSettled(ids.map(id => asyncSql(insert(id))));
    assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
    assert.equal(results.filter(r => r.status === "rejected").length, 1);
    assert.equal(count(), before + 2);
    const loser = ids[results.findIndex(r => r.status === "rejected")];
    assert.throws(() => sql(insert(loser)), /Capacidade de eventos esgotada/);
    assert.equal(count(), before + 2);
    const result = verify(); assert.equal(result.motivo, "eventos");
    assert.equal(verify().revisao, result.revisao, "Pausa idempotente.");
    assert.throws(() => sql("update historietas_privado.capitulo_runner_controle set habilitado=true;"), /Retomada administrativa/);
  });
  await t.test("retomada CAS nao habilita; resposta antiga nao limpa pausa nova", async () => {
    const r = verify().revisao;
    assert.throws(() => resume(r), /Capacidade ainda indisponivel/);
    limit(count() + 1); assert.equal(resume(r).estado, "retomada_registrada");
    assert.equal(sql("select habilitado from historietas_privado.capitulo_runner_controle;"), "f");
    sql(insert()); const next = verify(); assert.ok(next.revisao > r);
    assert.equal(resume(r).estado, "ja_registrado");
    assert.equal(sql("select pausado from historietas_privado.capitulo_runner_capacidade;"), "t");
    limit(10000); assert.equal(resume(next.revisao).estado, "retomada_registrada");
  });
  await t.test("snapshot REPEATABLE READ antigo nao contorna o limite", async () => {
    const child = spawn("docker", args, { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let out = "", err = "", timer;
    const exit = new Promise(resolve => child.once("exit", resolve));
    const ready = new Promise((resolve, reject) => {
      child.stdout.on("data", data => { out += data; if (out.includes("SNAPSHOT_READY")) resolve(); });
      child.stderr.on("data", data => { err += data; }); child.once("error", reject);
      timer = setTimeout(() => reject(new Error("Barreira de snapshot indisponivel.")), 10000);
    });
    child.stdin.write("begin isolation level repeatable read; select admissoes from historietas_privado.capitulo_runner_capacidade;\n\\echo SNAPSHOT_READY\n");
    try {
      await ready; sql(insert()); const before = count();
      child.stdin.end(insert());
      assert.notEqual(await exit, 0); assert.match(err, /could not serialize access/);
      assert.equal(count(), before);
    } finally { clearTimeout(timer); if (child.exitCode === null) { child.stdin.end("rollback;\n"); await exit; } }
  });
  await t.test("rollback e timeout nao consomem vaga nem deixam lock; retry valido", async () => {
    const id = randomUUID(), before = count();
    const admissions = sql("select admissoes from historietas_privado.capitulo_runner_capacidade;");
    sql(`begin; ${insert(id)} rollback;`);
    assert.equal(count(), before);
    assert.equal(sql("select admissoes from historietas_privado.capitulo_runner_capacidade;"), admissions);
    await assert.rejects(asyncSql(`begin; set local statement_timeout='100ms'; ${insert(id)} select pg_sleep(1); commit;`), /statement timeout/);
    assert.equal(count(), before); sql(insert(id)); assert.equal(count(), before + 1);
    assert.equal(verify().estado, "disponivel");
  });
  await t.test("backlog para exatamente na capacidade sem consumir retry do proximo capitulo", async () => {
    for (const n of [1, 2]) {
      check(await author.rpc("agendar_capitulo", { p_capitulo_id: chapter(n), p_revisao_esperada: 0, p_publicar_em: "2099-01-01Z", p_fuso_horario: "UTC" }));
      sql(`update historietas_privado.capitulo_agendamentos set publicar_em=now()-interval '1 hour' where capitulo_id='${chapter(n)}';`);
    }
    limit(count() + 1);
    sql("update historietas_privado.capitulo_runner_controle set habilitado=true;");
    const result = run(); assert.equal(result.estado, "capacidade"); assert.equal(result.sucessos, 1); assert.equal(result.tentativas, 1);
    assert.equal(sql("select habilitado from historietas_privado.capitulo_runner_controle;"), "f");
    assert.equal(sql(`select count(*) from historietas_privado.capitulo_runner_tentativas where capitulo_id='${chapter(2)}';`), "0");
    assert.equal(check(await anon.from("capitulos").select("id").eq("id", chapter(2))).length, 0);
    assert.equal(sql(`select count(*) from public.notificacoes where capitulo_id='${chapter(1)}';`), "2");
    assert.equal(sql(`select count(*) from public.diario_atividades where capitulo_id='${chapter(1)}';`), "1");
    assert.equal(run().estado, "desativado", "Resposta perdida nao repete publicacao.");
    const revision = Number(sql("select revisao from historietas_privado.capitulo_runner_capacidade;"));
    limit(count() + 2); resume(revision); sql("update historietas_privado.capitulo_runner_controle set habilitado=true;");
    assert.equal(run().sucessos, 1);
    assert.equal(sql(`select count(*) from public.notificacoes where capitulo_id='${chapter(2)}';`), "2");
    sql("update historietas_privado.capitulo_runner_controle set habilitado=false;"); limit(10000);
  });
  await t.test("medicao indisponivel pausa antes de publicar; recuperacao exige decisao", async () => {
    sql(`create or replace function historietas_privado.medir_capacidade_capitulos() returns jsonb
      language plpgsql volatile security invoker set search_path='' as $$begin raise exception 'Falha local controlada.' using errcode='42501'; end;$$;
      update historietas_privado.capitulo_runner_controle set habilitado=true;`);
    let result;
    try { result = run(); assert.equal(result.motivo, "medicao_indisponivel"); assert.equal(result.tentativas, 0); }
    finally { sql(originalMeasure); }
    assert.equal(sql("select habilitado from historietas_privado.capitulo_runner_controle;"), "f");
    assert.equal(resume(result.revisao).estado, "retomada_registrada");
    assert.equal(sql("select habilitado from historietas_privado.capitulo_runner_controle;"), "f");
  });
  await t.test("bytes observados freiam; solicitada_em nao libera evento ou capacidade", () => {
    const before = count();
    sql(`update historietas_privado.capitulo_cache_outbox set solicitada_em=clock_timestamp() where obra_id='${WORK}';
      update historietas_privado.capitulo_runner_capacidade set limite_outbox_bytes=pg_total_relation_size('historietas_privado.capitulo_cache_outbox');`);
    const result = verify(); assert.equal(result.motivo, "outbox_bytes"); assert.equal(count(), before);
    assert.throws(() => resume(result.revisao), /Capacidade ainda indisponivel/);
    sql("update historietas_privado.capitulo_runner_capacidade set limite_outbox_bytes=16777216;");
    resume(result.revisao); assert.equal(count(), before);
  });
});
