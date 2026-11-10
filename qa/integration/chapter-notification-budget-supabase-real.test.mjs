import assert from "node:assert/strict";
import { execFile, execFileSync, spawn } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { criarInvocacaoStatusSupabase } from "../scripts/supabase-cli-invocation.mjs";

test("orcamento de notificacoes local: concorrencia, snapshot, rollback e Data API", async t => {
  const inv = criarInvocacaoStatusSupabase();
  const status = execFileSync(inv.comando, inv.argumentos, { encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  const env = Object.fromEntries(status.split(/\r?\n/).filter(x => /^[A-Z0-9_]+=/.test(x)).map(x => {
    const i = x.indexOf("="), v = x.slice(i + 1).trim();
    return [x.slice(0, i), v.startsWith('"') ? JSON.parse(v) : v];
  }));
  for (const address of [env.API_URL, env.DB_URL]) {
    assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(new URL(address).hostname), "Recusa destino remoto.");
  }
  assert.equal(new URL(env.API_URL).protocol, "http:");
  assert.equal(new URL(env.DB_URL).protocol, "postgresql:");
  const containers = execFileSync("docker", ["ps", "--filter", `publish=${new URL(env.DB_URL).port}`, "--format", "{{.Names}}"],
    { encoding: "utf8", windowsHide: true }).trim().split(/\r?\n/);
  assert.equal(containers.length, 1); assert.match(containers[0], /^supabase_db_/);
  const args = ["exec", "-i", containers[0], "psql", "-U", "postgres", "-d", "postgres", "-XqAt", "-v", "ON_ERROR_STOP=1", "-v", "VERBOSITY=verbose"];
  const sql = source => execFileSync("docker", args, { input: source, encoding: "utf8", windowsHide: true, stdio: ["pipe", "pipe", "pipe"] }).trim();
  const asyncSql = source => new Promise((resolve, reject) => {
    const child = execFile("docker", args, { encoding: "utf8", windowsHide: true }, (err, out, stderr) => {
      if (err) { err.message += `\n${stderr}`; reject(err); } else resolve(out.trim());
    });
    child.stdin.end(source);
  });
  // Mantem uma conexao real aberta ate o teste liberar COMMIT/ROLLBACK.
  async function barrier(source, marker = "QA_READY") {
    const child = spawn("docker", args, { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let out = "", err = "", timer;
    const exit = new Promise(resolve => child.once("exit", resolve));
    const ready = new Promise((resolve, reject) => {
      child.stdout.on("data", data => { out += data; if (out.includes(marker)) resolve(); });
      child.stderr.on("data", data => { err += data; });
      child.once("error", reject);
      child.once("exit", () => { if (!out.includes(marker)) reject(new Error(err || "Barreira encerrou.")); });
      timer = setTimeout(() => reject(new Error("Barreira local nao iniciou.")), 10000);
    });
    child.stdin.write(`${source}\n\\echo ${marker}\n`);
    try { await ready; } catch (error) { child.stdin.end("rollback;\n"); await exit; throw error; }
    finally { clearTimeout(timer); }
    return { async finish(source = "rollback;") { child.stdin.end(`${source}\n`); return { code: await exit, out, err }; } };
  }
  const AUTHOR = randomUUID(), WORK = randomUUID(), session = randomUUID(), prefix = randomUUID().slice(0, 23);
  const chapter = n => `${prefix}-${String(n).padStart(12, "0")}`;
  const client = key => createClient(env.API_URL, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const admin = client(env.SERVICE_ROLE_KEY), author = client(env.ANON_KEY), anon = client(env.ANON_KEY);
  const check = r => { assert.equal(r.error, null, r.error?.code); return r.data; };
  const before = JSON.parse(sql("select row_to_json(b) from historietas_privado.capitulo_notificacao_orcamento b;"));
  assert.equal(sql("select habilitado from historietas_privado.capitulo_runner_controle;"), "f");
  const password = randomBytes(24).toString("base64url"), email = `qa-notificacao-${AUTHOR}@historietas.test`;
  check(await admin.auth.admin.createUser({ id: AUTHOR, email, password, email_confirm: true }));
  check(await author.auth.signInWithPassword({ email, password }));
  const text = readFileSync(new URL("../../supabase/tests/database/capitulo_notificacao_orcamento.test.sql", import.meta.url), "utf8");
  const start = text.indexOf("-- BEGIN NOTIFICATION BUDGET FIXTURE"), end = text.indexOf("-- END NOTIFICATION BUDGET FIXTURE");
  assert.ok(start >= 0 && end > start);
  sql("begin;\n" + text.slice(text.indexOf("\n", start), end)
    .replaceAll("d4100000-0000-4000-8000-000000000001", AUTHOR)
    .replaceAll("d4200000-0000-4000-8000-000000000001", WORK)
    .replaceAll("d4500000-0000-4000-8000-000000000001", session)
    .replaceAll("d4300000-0000-4000-8000-", `${prefix}-`)
    .replaceAll("'qa-orcamento'", `'qa-orcamento-${WORK}'`) + "\ncommit;");
  const readers = [randomUUID(), randomUUID(), randomUUID(), randomUUID()];
  for (const id of readers) {
    sql(`insert into auth.users(id) values('${id}'); insert into public.profiles(id,user_id,nome,tipo) values('${id}','${id}','Leitor QA','leitor');`);
  }
  sql(`insert into public.seguindo_obras(user_id,obra_id) values('${readers[0]}','${WORK}'),('${readers[1]}','${WORK}');
    insert into public.favoritos(user_id,obra_id) values('${readers[0]}','${WORK}');
    insert into public.seguindo_usuarios(seguidor_id,seguido_id) values('${readers[2]}','${AUTHOR}');`);
  const budget = () => JSON.parse(sql("select row_to_json(b) from historietas_privado.capitulo_notificacao_orcamento b;"));
  const execute = n => `select historietas_privado.executar_agendamento_capitulo('${chapter(n)}',1);`;
  const run = async n => JSON.parse(await asyncSql(execute(n)));
  const prepare = async n => {
    check(await author.rpc("agendar_capitulo", { p_capitulo_id: chapter(n), p_revisao_esperada: 0, p_publicar_em: "2099-01-01Z", p_fuso_horario: "UTC" }));
    sql(`update historietas_privado.capitulo_agendamentos set publicar_em=now()-interval '1 hour' where capitulo_id='${chapter(n)}';`);
  };
  t.after(() => {
    sql(`update historietas_privado.capitulo_runner_controle set habilitado=false;
      update historietas_privado.capitulo_notificacao_orcamento set limite_total=${before.limite_total};
      delete from public.obras where id='${WORK}';
      delete from public.profiles where user_id in ('${AUTHOR}',${readers.map(id => `'${id}'`).join(",")});
      delete from auth.users where id in ('${AUTHOR}',${readers.map(id => `'${id}'`).join(",")});`);
    // Nenhuma outbox e removida; debitos confirmados tampouco sao resetados.
    assert.equal(sql("select habilitado from historietas_privado.capitulo_runner_controle;"), "f");
  });
  await t.test("API nao expoe saldo, plano nem admissao, inclusive service role", async () => {
    for (const who of [anon, author, admin]) {
      for (const name of ["admitir_notificacoes_capitulo", "aplicar_notificacoes_capitulo"]) {
        assert.ok((await who.rpc(name, { p_plano: {} })).error);
        assert.ok((await who.schema("historietas_privado").rpc(name, { p_plano: {} })).error);
      }
      const params = { p_obra_id: WORK, p_capitulo_id: chapter(1), p_autor_validado: AUTHOR, p_publicado_em: new Date().toISOString() };
      assert.ok((await who.rpc("planejar_notificacoes_capitulo_agendado", params)).error);
      assert.ok((await who.schema("historietas_privado").rpc("planejar_notificacoes_capitulo_agendado", params)).error);
      assert.ok((await who.schema("historietas_privado").from("capitulo_notificacao_orcamento").select("*")).error);
    }
  });
  await t.test("ultima capacidade: concorrentes nao gastam o mesmo saldo; resposta perdida", async () => {
    await prepare(1); await prepare(2);
    sql(`update historietas_privado.capitulo_notificacao_orcamento set limite_total=${Number(before.notificacoes_admitidas) + 3};`);
    const a = await barrier(`begin; ${execute(1)}`);
    try { assert.equal((await run(2)).estado, "erro", "Contencao e transitoria, nao sucesso parcial."); }
    finally { assert.equal((await a.finish("commit;")).code, 0); }
    const confirmed = budget();
    sql(`update historietas_privado.capitulo_agendamentos set executado_em=now()-interval '2 minutes' where capitulo_id='${chapter(2)}';`);
    assert.equal((await run(2)).estado, "capacidade_notificacoes");
    assert.equal(budget().notificacoes_admitidas, Number(before.notificacoes_admitidas) + 3);
    assert.equal((await run(1)).repetido, true); assert.deepEqual(budget(), confirmed);
    assert.equal(sql(`select count(*) from public.notificacoes where capitulo_id='${chapter(2)}';`), "0");
    sql(`update historietas_privado.capitulo_notificacao_orcamento set limite_total=${before.limite_total};`);
  });
  await t.test("snapshot antigo nao reutiliza saldo; rollback externo nao cobra", async () => {
    await prepare(3);
    const old = await barrier("begin isolation level repeatable read; select notificacoes_admitidas from historietas_privado.capitulo_notificacao_orcamento;");
    assert.equal((await run(3)).estado, "publicado");
    const result = await old.finish(`select historietas_privado.admitir_notificacoes_capitulo(
      historietas_privado.planejar_notificacoes_capitulo_agendado('${WORK}','${chapter(2)}','${AUTHOR}',now())); commit;`);
    assert.notEqual(result.code, 0); assert.match(result.err, /40001/);
    const b = budget();
    const rolled = await barrier(`begin; ${execute(2)}`);
    await rolled.finish("rollback;"); assert.deepEqual(budget(), b);
    assert.equal(sql(`select publicado from public.capitulos where id='${chapter(2)}';`), "f");
  });
  await t.test("audiencia congelada nao cresce entre admissao e escrita", async () => {
    await prepare(4);
    const lockKey = randomUUID();
    const fn = `zz_qa_d4_${randomUUID().replaceAll("-", "")}`;
    const locker = await barrier(`begin; select pg_advisory_xact_lock(hashtextextended('${lockKey}',0));`);
    let pending;
    try {
      sql(`create function historietas_privado.${fn}() returns trigger language plpgsql set search_path='' as $$
        begin perform pg_advisory_xact_lock(hashtextextended('${lockKey}',0)); return new; end $$;
        revoke all on function historietas_privado.${fn}() from public,anon,authenticated,service_role;
        create trigger ${fn} after update on historietas_privado.capitulo_notificacao_orcamento for each row execute function historietas_privado.${fn}();`);
      pending = run(4);
      const deadline = Date.now() + 10000;
      let waiting = false;
      while (Date.now() < deadline) {
        waiting = (await asyncSql(`select exists(select 1 from pg_stat_activity where wait_event='advisory'
          and query like '%${chapter(4)}%' and query like '%executar_agendamento_capitulo%');`)) === "t";
        if (waiting) break;
        await new Promise(resolve => setTimeout(resolve, 25));
      }
      assert.ok(waiting, "Executor real parado depois de congelar e admitir o plano.");
      sql(`insert into public.seguindo_obras(user_id,obra_id) values('${readers[3]}','${WORK}');`);
    } finally {
      await locker.finish("commit;");
      try { if (pending) assert.equal((await pending).notificacoes, 3); }
      finally { sql(`drop trigger if exists ${fn} on historietas_privado.capitulo_notificacao_orcamento; drop function if exists historietas_privado.${fn}();`); }
    }
    assert.equal(sql(`select count(*) from public.notificacoes where user_id='${readers[3]}' and capitulo_id='${chapter(4)}';`), "0");
    await prepare(5); assert.equal((await run(5)).notificacoes, 4);
  });
  await t.test("statement_timeout desfaz debito, publicacao e efeitos; retry recupera", async () => {
    await prepare(6);
    const b = budget();
    await assert.rejects(asyncSql(`begin; ${execute(6)} set local statement_timeout='100ms'; select pg_sleep(1); commit;`), /57014/);
    assert.deepEqual(budget(), b);
    for (const table of ["public.notificacoes", "public.diario_atividades", "historietas_privado.capitulo_publicacao_eventos", "historietas_privado.capitulo_cache_outbox"]) {
      assert.equal(sql(`select count(*) from ${table} where capitulo_id='${chapter(6)}';`), "0");
    }
    assert.equal((await run(6)).estado, "publicado");
    assert.equal((await run(6)).repetido, true);
  });
});
