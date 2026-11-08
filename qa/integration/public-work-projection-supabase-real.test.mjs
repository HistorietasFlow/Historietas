import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { criarInvocacaoStatusSupabase } from "../scripts/supabase-cli-invocation.mjs";

const USER = "bf100000-0000-4000-8000-000000000001", WORK = "bf200000-0000-4000-8000-000000000001";
const OTHER = "bf200000-0000-4000-8000-000000000002", CHAPTER = "bf300000-0000-4000-8000-000000000001";
const readSource = () => readFileSync(new URL("../../supabase/tests/database/obra_projecao_revisoes.test.sql", import.meta.url), "utf8");
const check = (r) => { assert.equal(r.error, null, r.error?.message); return r.data; };

test("projecao publica local: RLS, snapshots, duas escritas concorrentes e rollback", async (t) => {
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
  const cleanup = () => sql(`begin; delete from public.obras where id in ('${WORK}','${OTHER}'); delete from auth.users where id='${USER}';
    delete from historietas_privado.capitulo_cache_outbox where obra_id in ('${WORK}','${OTHER}'); commit;`);
  cleanup(); t.after(cleanup); // Ledger/tombstones NAO sao apagados nem pela fixture.
  const opts = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
  const admin = createClient(values.API_URL, values.SERVICE_ROLE_KEY, opts);
  const anon = createClient(values.API_URL, values.ANON_KEY, opts), author = createClient(values.API_URL, values.ANON_KEY, opts);
  const email = "qa-public-projection@historietas.test", password = randomBytes(24).toString("base64url");
  check(await admin.auth.admin.createUser({ id: USER, email, password, email_confirm: true }));
  check(await author.auth.signInWithPassword({ email, password }));
  const fixture = readSource();
  sql(`begin; ${fixture.slice(fixture.indexOf("\n", fixture.indexOf("-- BEGIN PROJECTION FIXTURE")), fixture.indexOf("-- END PROJECTION FIXTURE"))} commit;`);
  const snapshot = async (client = anon, slug = "qa-projecao", num = 1) => check(await client.rpc("obter_projecao_publica_obra", { p_slug: slug, p_numero: num }));
  const initial = await snapshot();
  const revision = (r) => BigInt(r.revisao);

  // PSQL interativo cria barreiras reais, sem sleeps. Segunda sessao informa
  // seu PID antes de bloquear; pg_stat_activity prova espera no lock do ledger.
  function transaction() {
    const child = spawn("docker", args, { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "", stderr = "", changed;
    child.stdout.on("data", (d) => { stdout += d; changed?.(); });
    child.stderr.on("data", (d) => { stderr += d; });
    const exit = new Promise((resolve, reject) => {
      child.on("error", reject);
      child.on("exit", (code) => code === 0 ? resolve(stdout) : reject(new Error(`psql ${code}: ${stderr}`)));
    });
    // Evita rejeicao sem handler quando uma assertion abortar antes do commit.
    exit.catch(() => {});
    const until = (mark) => new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Barreira nao atingida: ${mark}. ${stderr}`)), 10_000);
      changed = () => { if (stdout.includes(mark)) { clearTimeout(timer); resolve(); } };
      changed();
    });
    t.after(async () => { if (child.exitCode === null) { child.stdin.end("rollback;\n"); await exit; } });
    return { write: (s) => child.stdin.write(s), end: (s) => child.stdin.end(s), until, exit, output: () => stdout };
  }

  await t.test("anon e autor recebem a mesma projecao publica, sem drafts, arquivos ou ledger privado", async () => {
    assert.equal(initial.estado, "capitulo_publico");
    assert.deepEqual(await snapshot(author), initial);
    assert.equal((await snapshot(author, "qa-projecao", 2)).capitulo, null);
    assert.deepEqual(await snapshot(author, "qa-projecao-draft"), { estado: "obra_indisponivel" });
    assert.equal(JSON.stringify(initial).includes("arquivo"), false);
    assert.ok((await anon.schema("historietas_privado").from("obra_projecao_revisoes").select("*")).error);
    assert.ok((await author.rpc("revisar_projecao_obra")).error);
    assert.equal((await anon.rpc("obter_projecao_publica_obra", { p_slug: "qa-projecao", p_numero: "nao-inteiro" })).error?.code, "22P02");
    const ownUpdate = check(await author.from("capitulos").update({ texto: "Texto pelo autor" }).eq("id", CHAPTER).select("id"));
    assert.equal(ownUpdate.length, 1);
    assert.equal((await snapshot()).capitulo.texto, "Texto pelo autor");
    assert.ok(revision(await snapshot()) > revision(initial));
    assert.ok((await anon.from("capitulos").update({ texto: "forjado" }).eq("id", CHAPTER)).error);
  });
  await t.test("edicao nao commitada fica invisivel; dados e revisao aparecem juntos apos commit", async () => {
    const before = await snapshot(), writer = transaction();
    writer.write(`begin; select set_config('request.jwt.claim.sub','${USER}',true); update public.capitulos set texto='Snapshot novo' where id='${CHAPTER}';\n\\echo FIRST_READY\n`);
    await writer.until("FIRST_READY");
    assert.deepEqual(await snapshot(), before);
    writer.end("commit;\n"); await writer.exit;
    const after = await snapshot();
    assert.equal(after.capitulo.texto, "Snapshot novo"); assert.equal(revision(after), revision(before) + 1n);
  });
  await t.test("duas edicoes independentes da mesma obra serializam sem perder incremento", async () => {
    const before = await snapshot(), first = transaction(), second = transaction();
    first.write(`begin; select set_config('request.jwt.claim.sub','${USER}',true); update public.capitulos set texto='Concorrente' where id='${CHAPTER}';\n\\echo LEDGER_HELD\n`);
    await first.until("LEDGER_HELD");
    second.write(`select 'BACKEND:' || pg_backend_pid();\n\\echo PID_READY\nbegin; select set_config('request.jwt.claim.sub','${USER}',true); update public.obras set sinopse='Concorrente' where id='${WORK}';\n\\echo SECOND_READY\n`);
    await second.until("PID_READY");
    const pid = /BACKEND:(\d+)/.exec(second.output())?.[1]; assert.ok(pid);
    // A consulta termina somente quando o segundo writer realmente aguarda.
    sql(`do $$ declare deadline timestamptz := clock_timestamp()+interval '8 seconds'; begin loop
      exit when exists(select 1 from pg_stat_activity where pid=${pid} and wait_event_type='Lock');
      if clock_timestamp()>deadline then raise exception 'Writer nao aguardou ledger'; end if;
      perform pg_sleep(0.01); end loop; end $$;`);
    assert.deepEqual(await snapshot(), before);
    first.end("commit;\n"); await first.exit; await second.until("SECOND_READY");
    const intermediate = await snapshot();
    assert.equal(intermediate.capitulo.texto, "Concorrente"); assert.equal(revision(intermediate), revision(before)+1n);
    assert.notEqual(intermediate.obra.sinopse, "Concorrente");
    second.end("commit;\n"); await second.exit;
    const after = await snapshot(); assert.equal(after.obra.sinopse, "Concorrente"); assert.equal(revision(after), revision(before)+2n);
  });
  await t.test("rollback nao publica revisao e recriar mesmo UUID/slug nao reutiliza chave antiga", async () => {
    const before = await snapshot();
    sql(`begin; select set_config('request.jwt.claim.sub','${USER}',true); update public.obras set titulo='Revertido' where id='${WORK}'; rollback;`);
    assert.deepEqual(await snapshot(), before);
    sql(`delete from public.obras where id='${WORK}';`);
    assert.deepEqual(await snapshot(), { estado: "obra_indisponivel" });
    sql(`begin; select set_config('request.jwt.claim.sub','${USER}',true);
      insert into public.obras(id,user_id,titulo,autor,genero,formato,publicado,slug,classificacao_indicativa) values
      ('${WORK}','${USER}','Recriada','QA','Fantasia','Romance',true,'qa-projecao','Livre'); commit;`);
    const after = await snapshot(anon, "qa-projecao", null);
    assert.ok(revision(after)>revision(before)); assert.notEqual(after.geracao, before.geracao);
    check(await author.auth.signOut());
    assert.deepEqual(await snapshot(), { ...after, estado: "capitulo_indisponivel" });
  });
});
