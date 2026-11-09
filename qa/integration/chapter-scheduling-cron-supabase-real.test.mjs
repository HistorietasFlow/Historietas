import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { criarInvocacaoStatusSupabase } from "../scripts/supabase-cli-invocation.mjs";

const ROLE = "historietas_capitulo_runner";
const AUTHOR = "b7100000-0000-4000-8000-000000000001";
const WORK = "b7200000-0000-4000-8000-000000000001";
const chapter = (n) => `b7300000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const ENTRY = "select historietas_privado.acionar_runner_capitulos()";
const literal = (s) => `'${s.replaceAll("'", "''")}'`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function environment() {
  const inv = criarInvocacaoStatusSupabase();
  const out = execFileSync(inv.comando, inv.argumentos, { encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  const values = Object.fromEntries(out.split(/\r?\n/).filter((s) => /^[A-Z0-9_]+=/.test(s)).map((s) => {
    const i = s.indexOf("="), value = s.slice(i + 1).trim();
    return [s.slice(0, i), value.startsWith('"') ? JSON.parse(value) : value];
  }));
  const api = new URL(values.API_URL), db = new URL(values.DB_URL);
  for (const url of [api, db]) assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(url.hostname), "Recusa banco remoto.");
  assert.equal(api.protocol, "http:"); assert.equal(db.protocol, "postgresql:");
  const containers = execFileSync("docker", ["ps", "--filter", `publish=${db.port}`, "--format", "{{.Names}}"],
    { encoding: "utf8", windowsHide: true }).trim().split(/\r?\n/).filter(Boolean);
  assert.equal(containers.length, 1); assert.ok(containers[0].startsWith("supabase_db_"));
  return { container: containers[0], url: api.origin, key: values.ANON_KEY, secret: values.SERVICE_ROLE_KEY };
}
function check(response) { assert.equal(response.error, null, response.error?.message); return response.data; }

test("Cron real local: identidade, timers previos, atomicidade e gate", async (t) => {
  const env = environment();
  const args = (role = "postgres") => ["exec", "-i", env.container, "psql", "-h", "127.0.0.1", "-U", role,
    "-d", "postgres", "-XqAt", "-v", "ON_ERROR_STOP=1"];
  const sql = (source, role = "postgres") => execFileSync("docker", args(role),
    { input: source, encoding: "utf8", windowsHide: true, stdio: ["pipe", "pipe", "pipe"] }).trim();
  const operational = (source) => sql(source, ROLE);
  const client = (key = env.key) => createClient(env.url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const admin = client(env.secret), author = client(), anon = client();
  const control = sql("select row_to_json(c) from historietas_privado.capitulo_runner_controle c;");
  assert.equal(JSON.parse(control).habilitado, false);
  assert.equal(sql("select count(*) from pg_extension where extname='pg_cron';"), "0",
    "Exige ambiente descartavel sem Cron instalado; nao alterar jobs preexistentes.");
  assert.equal(sql("select current_setting('cron.use_background_workers');"), "off");
  assert.equal(sql(`select rolcanlogin from pg_roles where rolname='${ROLE}';`), "f");
  assert.equal(sql(`select (select count(*) from historietas_privado.capitulo_runner_monitor)
    +(select count(*) from historietas_privado.capitulo_runner_observacoes)
    +(select count(*) from historietas_privado.capitulo_runner_incidentes);`), "0",
    "Nao alterar monitor ou evidencias preexistentes.");
  const jobs = new Set();
  let installed = false;
  const waitUntil = async (predicate, label, timeout = 35_000) => {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) { if (await predicate()) return; await sleep(200); }
    assert.fail(`Barreira local nao alcancada: ${label}`);
  };
  const removeDelay = () => sql(`drop trigger if exists zz_qa_cron_delay on historietas_privado.capitulo_publicacao_eventos;
    drop function if exists historietas_privado.zz_qa_cron_delay();`);
  t.after(async () => {
    if (installed) {
      for (const id of jobs) operational(`select cron.unschedule(${id});`);
      await waitUntil(() => sql(`select count(*) from pg_stat_activity where usename='${ROLE}';`) === "0", "encerramento dos jobs");
      sql(`revoke usage on schema cron from ${ROLE}; drop extension pg_cron;`);
    }
    removeDelay();
    sql(`begin; alter role ${ROLE} nologin;
      delete from historietas_privado.capitulo_runner_observacoes;
      delete from historietas_privado.capitulo_runner_incidentes;
      delete from historietas_privado.capitulo_runner_monitor;
      delete from historietas_privado.capitulo_cache_outbox where obra_id='${WORK}';
      delete from public.obras where id='${WORK}';
      delete from public.profiles where user_id='${AUTHOR}'; delete from auth.users where id='${AUTHOR}';
      update historietas_privado.capitulo_runner_controle c set habilitado=false,lotes=x.lotes,tentativas=x.tentativas,
        sucessos=x.sucessos,erros=x.erros,ultima_execucao=x.ultima_execucao,ultimo_resultado=x.ultimo_resultado
        from json_populate_record(null::historietas_privado.capitulo_runner_controle,${literal(control)}::json) x;
      commit;`);
  });
  sql("create extension pg_cron version '1.6.4';"); installed = true;
  sql(`grant usage on schema cron to ${ROLE}; alter role ${ROLE} login;`);
  assert.equal(sql("select extversion from pg_extension where extname='pg_cron';"), "1.6.4");
  // Somente o harness local agenda. A migration nao instala extensao ou job.
  const cron = async (command = ENTRY, during) => {
    const name = `qa-6b1-${randomBytes(6).toString("hex")}`;
    const id = Number(operational(`select cron.schedule(${literal(name)},'15 seconds',${literal(command)});`));
    jobs.add(id);
    try {
      if (during) await during();
      let result;
      await waitUntil(() => {
        const raw = operational(`select row_to_json(d) from (select status,return_message,
          extract(epoch from end_time-start_time) as seconds from cron.job_run_details
          where jobid=${id} and end_time is not null order by runid limit 1) d;`);
        if (raw) result = JSON.parse(raw);
        return Boolean(result);
      }, "resultado do Cron");
      assert.equal(operational(`select count(*) from cron.job_run_details where jobid=${id};`), "1",
        "Uma execucao real, sem retry do harness.");
      return result;
    } finally { operational(`select cron.unschedule(${id});`); jobs.delete(id); }
  };
  const password = randomBytes(24).toString("base64url"), email = "qa-cron@historietas.test";
  check(await admin.auth.admin.createUser({ id: AUTHOR, email, password, email_confirm: true }));
  check(await author.auth.signInWithPassword({ email, password }));
  const fixture = readFileSync(new URL("../../supabase/tests/database/capitulo_runner.test.sql", import.meta.url), "utf8");
  const start = fixture.indexOf("-- BEGIN RUNNER FIXTURE"), end = fixture.indexOf("-- END RUNNER FIXTURE");
  assert.ok(start >= 0 && end > start);
  sql(`begin; ${fixture.slice(fixture.indexOf("\n", start), end).replaceAll("b6", "b7").replaceAll("'qa-runner'", "'qa-cron'")} commit;`);
  const prepare = async (n) => {
    check(await author.rpc("agendar_capitulo", { p_capitulo_id: chapter(n), p_revisao_esperada: 0,
      p_publicar_em: "2099-01-01T00:00:00Z", p_fuso_horario: "UTC" }));
    sql(`update historietas_privado.capitulo_agendamentos set publicar_em=now()-interval '1 hour' where capitulo_id='${chapter(n)}';`);
  };
  const delay = (n, seconds) => sql(`create function historietas_privado.zz_qa_cron_delay() returns trigger language plpgsql as $$
    begin if new.capitulo_id='${chapter(n)}' then perform pg_sleep(${seconds}); end if; return new; end; $$;
    create trigger zz_qa_cron_delay after insert on historietas_privado.capitulo_publicacao_eventos
      for each row execute function historietas_privado.zz_qa_cron_delay();`);
  const count = (table) => Number(sql(`select count(*) from historietas_privado.${table} where obra_id='${WORK}';`));
  const published = (n) => sql(`select publicado from public.capitulos where id='${chapter(n)}';`);

  await t.test("sessao real recebe limites e gate fechado nao publica via Cron", async () => {
    assert.equal(operational("select session_user,current_setting('statement_timeout'),current_setting('lock_timeout'),current_setting('idle_in_transaction_session_timeout');"),
      `${ROLE}|10s|500ms|5s`);
    await prepare(1);
    assert.equal((await cron()).status, "succeeded");
    assert.equal(published(1), "f"); assert.equal(count("capitulo_cache_outbox"), 0);
    assert.equal(sql("select row_to_json(c) from historietas_privado.capitulo_runner_controle c;"), control);
  });
  await t.test("Data API e sessao SQL nao ganham acesso direto a dados ou ativacao", async () => {
    for (const who of [anon, author, admin]) {
      assert.ok((await who.rpc("acionar_runner_capitulos")).error);
      assert.ok((await who.schema("historietas_privado").rpc("acionar_runner_capitulos")).error);
    }
    for (const command of ["select * from auth.users", "select * from historietas_privado.capitulo_agendamentos",
      "update historietas_privado.capitulo_runner_controle set habilitado=true",
      "select historietas_privado.executar_runner_capitulos()", "set role postgres"]) {
      assert.throws(() => operational(command), /permission denied/);
    }
    assert.throws(() => operational(`set statement_timeout=0; ${ENTRY}`), /Timeouts operacionais previos/);
    assert.throws(() => operational(`set lock_timeout=0; ${ENTRY}`), /Timeouts operacionais previos/);
    assert.throws(() => operational(`set idle_in_transaction_session_timeout=0; ${ENTRY}`), /Timeouts operacionais previos/);
  });
  await t.test("rollback explicito, commit pelo Cron e resposta perdida nao duplicam efeitos", async () => {
    sql("update historietas_privado.capitulo_runner_controle set habilitado=true;");
    operational(`begin; ${ENTRY}; rollback;`);
    assert.equal(published(1), "f"); assert.equal(count("capitulo_cache_outbox"), 0);
    assert.equal((await cron()).status, "succeeded"); // Sem depender do JSON funcional devolvido pelo SELECT.
    assert.equal(published(1), "t");
    const events = count("capitulo_publicacao_eventos"), outbox = count("capitulo_cache_outbox");
    assert.equal(events, 1); assert.equal(outbox, 1);
    assert.equal(JSON.parse(operational(ENTRY)).tentativas, 0);
    assert.equal(count("capitulo_publicacao_eventos"), events); assert.equal(count("capitulo_cache_outbox"), outbox);
    assert.equal(check(await anon.from("diario_atividades").select("id").eq("obra_id", WORK)).length, 1);
  });
  await t.test("Cron concorrente com acionamento SQL conserva lock ate commit", async () => {
    await prepare(2); delay(2, 2);
    try {
      const result = await cron(ENTRY, async () => {
        await waitUntil(() => sql(`select count(*) from pg_stat_activity where usename='${ROLE}' and wait_event='PgSleep';`) === "1", "executor em voo");
        assert.equal(published(2), "f", "Publicacao invisivel antes do commit.");
        assert.equal(JSON.parse(operational(ENTRY)).estado, "ocupado");
      });
      assert.equal(result.status, "succeeded"); assert.equal(published(2), "t");
    } finally { removeDelay(); }
  });
  await t.test("statement_timeout real aborta lote inteiro e fica no historico do Cron", async () => {
    await prepare(3); await prepare(4); delay(4, 12);
    const before = sql("select row_to_json(c) from historietas_privado.capitulo_runner_controle c;");
    const events = count("capitulo_publicacao_eventos"), outbox = count("capitulo_cache_outbox");
    try {
      const result = await cron();
      assert.equal(result.status, "failed"); assert.match(result.return_message, /statement timeout/);
      assert.ok(result.seconds >= 9 && result.seconds < 14, "Timer de 10s efetivo no caminho do Cron.");
    } finally { removeDelay(); }
    assert.equal(published(3), "f"); assert.equal(published(4), "f");
    assert.equal(count("capitulo_publicacao_eventos"), events); assert.equal(count("capitulo_cache_outbox"), outbox);
    assert.equal(sql("select row_to_json(c) from historietas_privado.capitulo_runner_controle c;"), before);
    assert.equal(sql(`select count(*) from historietas_privado.capitulo_runner_tentativas where capitulo_id in ('${chapter(3)}','${chapter(4)}');`), "0");
    assert.equal((await cron()).status, "succeeded", "Nova operacao legitima apos remover a causa.");
    assert.equal(published(3), "t"); assert.equal(published(4), "t");
  });
  await t.test("lock_timeout real nao publica e preserva backoff", async () => {
    await prepare(5);
    const locker = spawn("docker", args(), { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    const exited = new Promise((resolve) => locker.once("exit", resolve));
    let ready = false;
    locker.stdout.on("data", (data) => { if (data.toString().includes("LOCK_READY")) ready = true; });
    locker.stdin.write(`begin; select user_id from public.profiles where user_id='${AUTHOR}' for update;\n\\echo LOCK_READY\n`);
    try {
      await waitUntil(() => ready, "lock de perfil");
      const result = await cron();
      assert.equal(result.status, "succeeded", "Falha do item capturada, nao sucesso de publicacao.");
      assert.ok(result.seconds >= 0.4 && result.seconds < 4, "lock_timeout de 500ms ativo.");
      assert.equal(published(5), "f");
      assert.equal(sql(`select resultado from historietas_privado.capitulo_runner_tentativas where capitulo_id='${chapter(5)}';`), "erro");
      assert.equal(JSON.parse(operational(ENTRY)).tentativas, 0);
    } finally { locker.stdin.end("rollback;\n"); assert.equal(await exited, 0); }
  });
  await t.test("sessao abandonada encerra e libera lock por idle timeout previo", async () => {
    const conn = spawn("docker", args(ROLE), { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    const exited = new Promise((resolve) => conn.once("exit", resolve));
    let ready = false, error = "";
    conn.stdout.on("data", (data) => { if (data.toString().includes("IDLE_READY")) ready = true; });
    conn.stderr.on("data", (data) => { error += data; });
    const lock = "hashtextextended('qa:cron:idle',0)";
    conn.stdin.write(`begin; select pg_advisory_xact_lock(${lock});\n\\echo IDLE_READY\n`);
    try {
      await waitUntil(() => ready, "sessao ociosa");
      assert.equal(sql(`select pg_try_advisory_xact_lock(${lock});`), "f");
      // psql aguarda stdin e so le o FATAL ao receber o proximo comando.
      // Comprovar primeiro o encerramento do backend, nao a entrega do stderr.
      await waitUntil(() => sql(`select count(*) from pg_stat_activity where usename='${ROLE}';`) === "0",
        "cancelamento por ociosidade", 9_000);
      assert.equal(sql(`select pg_try_advisory_xact_lock(${lock});`), "t");
    } finally { conn.stdin.end("rollback;\n"); await exited; }
    assert.match(error, /idle-in-transaction timeout/);
  });

  await t.test("observador independente: tres abortos reais, pausa duravel e retomada explicita", async () => {
    sql("update historietas_privado.capitulo_runner_controle set habilitado=false;");
    // O item 5 pertence ao cenario anterior de lock_timeout, nao a esta disputa.
    sql(`update historietas_privado.capitulo_agendamentos set publicar_em='2099-01-01Z' where capitulo_id='${chapter(5)}';`);
    const id = Number(operational(`select cron.schedule('qa-monitor-6b2','15 seconds',${literal(ENTRY)});`));
    jobs.add(id);
    // Dono da extensao somente para controlar o job descartavel. Observacao e
    // retomada continuam como postgres; nao ampliar grants do runner/Cron.
    const manageJob = (source) => sql(source, "supabase_admin");
    manageJob(`select cron.alter_job(${id},active:=false);`);
    sql(`select historietas_privado.configurar_monitor_capitulos(${id},15);`);
    const observe = () => JSON.parse(sql("select historietas_privado.observar_runner_capitulos();"));
    const resume = (revision) => JSON.parse(sql(`select historietas_privado.retomar_monitor_capitulos(${revision},'causa_corrigida');`));
    const state = () => JSON.parse(sql("select row_to_json(m) from historietas_privado.capitulo_runner_monitor m;"));
    const records = () => Number(sql("select count(*) from historietas_privado.capitulo_runner_observacoes;"));
    const oneRun = async (during) => {
      const previous = Number(sql(`select coalesce(max(runid),0) from cron.job_run_details where jobid=${id};`));
      manageJob(`select cron.alter_job(${id},active:=true);`);
      try {
        if (during) await during();
        let row;
        await waitUntil(() => {
          const raw = sql(`select row_to_json(d) from (select runid,status,return_message from cron.job_run_details
            where jobid=${id} and runid>${previous} and end_time is not null order by runid limit 1) d;`);
          if (raw) row = JSON.parse(raw);
          return Boolean(row);
        }, "resultado independente do monitor");
        assert.equal(sql(`select count(*) from cron.job_run_details where jobid=${id} and runid>${previous};`), "1");
        return row;
      } finally { manageJob(`select cron.alter_job(${id},active:=false);`); }
    };
    assert.equal(resume(1).estado, "retomada_registrada");
    assert.equal(sql("select habilitado from historietas_privado.capitulo_runner_controle;"), "f");
    assert.equal(resume(1).estado, "ja_registrado");
    for (const who of [anon, author, admin]) {
      for (const name of ["observar_runner_capitulos", "retomar_monitor_capitulos", "saude_runner_capitulos"]) {
        assert.ok((await who.rpc(name)).error);
        assert.ok((await who.schema("historietas_privado").rpc(name)).error);
      }
    }
    assert.throws(() => operational("select historietas_privado.observar_runner_capitulos()"), /permission denied/);
    await prepare(6); delay(6, 12);
    sql("update historietas_privado.capitulo_runner_controle set habilitado=true;");
    const before = sql("select row_to_json(c) from historietas_privado.capitulo_runner_controle c;");
    const outbox = count("capitulo_cache_outbox"), events = count("capitulo_publicacao_eventos");
    try {
      for (let i = 1; i <= 3; i += 1) {
        const row = await oneRun(async () => {
          await waitUntil(() => sql(`select count(*) from pg_stat_activity where usename='${ROLE}' and wait_event='PgSleep';`) === "1", "runner aguardando timeout");
          assert.equal(observe().estado, "ocupado", "Observador nao disputa dados durante transacao do runner.");
        });
        assert.equal(row.status, "failed"); assert.match(row.return_message, /statement timeout/);
        assert.equal(published(6), "f");
        if (i === 1) {
          sql("begin; select historietas_privado.observar_runner_capitulos(); rollback;");
          assert.equal(records(), 0, "Rollback do observador nao avanca cursor.");
        }
        assert.equal(observe().observados, 1);
        assert.equal(observe().observados, 0, "Retry apos resposta perdida nao duplica observacao.");
        assert.equal(state().falhas_consecutivas, i);
        assert.equal(state().pausado, i === 3);
        if (i < 3) assert.equal(sql("select row_to_json(c) from historietas_privado.capitulo_runner_controle c;"), before,
          "Abortos desfazem metricas internas; observacoes externas persistem.");
      }
    } finally { removeDelay(); }
    assert.equal(count("capitulo_cache_outbox"), outbox); assert.equal(count("capitulo_publicacao_eventos"), events);
    assert.equal(sql("select habilitado from historietas_privado.capitulo_runner_controle;"), "f");
    assert.throws(() => sql("update historietas_privado.capitulo_runner_controle set habilitado=true;"), /Retomada administrativa/);
    assert.equal((await oneRun()).status, "succeeded", "Gate fechado retorna sucesso SQL sem publicar.");
    observe(); assert.equal(state().pausado, true); assert.equal(published(6), "f");
    assert.equal(resume(1).estado, "ja_registrado"); assert.equal(state().pausado, true, "Retry antigo nao retoma incidente novo.");
    assert.equal(resume(2).estado, "retomada_registrada");
    assert.equal(sql("select habilitado from historietas_privado.capitulo_runner_controle;"), "f", "Retomar NAO habilita.");
    sql("update historietas_privado.capitulo_runner_controle set habilitado=true;");
    assert.equal((await oneRun()).status, "succeeded"); observe();
    assert.equal(published(6), "t");
    assert.equal(count("capitulo_cache_outbox"), outbox + 1); assert.equal(count("capitulo_publicacao_eventos"), events + 1);

    // Falha da fonte e sucesso posterior nao limpam automaticamente a pausa.
    manageJob(`select cron.alter_job(${id},command:='select 1');`);
    assert.equal(observe().estado, "fonte_indisponivel");
    manageJob(`select cron.alter_job(${id},command:=${literal(ENTRY)});`);
    observe(); assert.equal(state().pausado, true); resume(3);
    // Concorrencia entre observadores usa o mesmo lock, sem perder cursor.
    const lock = spawn("docker", args(), { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    const ended = new Promise((resolve) => lock.once("exit", resolve));
    let locked = false;
    lock.stdout.on("data", (data) => { if (data.toString().includes("MONITOR_LOCK")) locked = true; });
    lock.stdin.write("begin; select historietas_privado.observar_runner_capitulos();\n\\echo MONITOR_LOCK\n");
    try { await waitUntil(() => locked, "observador em transacao"); assert.equal(observe().estado, "ocupado"); }
    finally { lock.stdin.end("rollback;\n"); assert.equal(await ended, 0); }
    const anchor = state().ultimo_run;
    sql(`update historietas_privado.capitulo_runner_observacoes set observado_em=now()-interval '8 days';`);
    observe();
    assert.equal(records(), 4, "Retencao conserva tres falhas e ancora, elimina somente sucesso antigo.");
    assert.equal(Number(sql("select count(*) from historietas_privado.capitulo_runner_incidentes;")), 3);
    // Cenario sintetico explicitamente limitado ao teste de saturacao/retencao.
    sql(`insert into historietas_privado.capitulo_runner_observacoes(run_id,estado,fim)
      select -n,'failed',now() from generate_series(1,996) n;`);
    await oneRun();
    assert.equal(observe().estado, "capacidade"); assert.equal(records(), 1000);
    assert.throws(() => resume(4), /capacidade/);
    sql("delete from historietas_privado.capitulo_runner_observacoes where run_id<0;");
    observe(); resume(4);
    // Remover ancora apenas na fixture comprova falha fechada, nunca falso ACK.
    const currentAnchor = state().ultimo_run;
    assert.ok(currentAnchor > anchor);
    sql(`delete from cron.job_run_details where jobid=${id} and runid=${currentAnchor};`);
    assert.equal(observe().estado, "historico_incompleto");
    assert.throws(() => resume(5), /inconclusiva/);
    assert.equal(state().pausado, true);
    const health = JSON.parse(sql("select historietas_privado.saude_runner_capitulos();"));
    assert.ok(health.incidentesAbertos > 0); assert.equal(health.habilitado, false);
    assert.ok(!JSON.stringify(health).includes(AUTHOR));
    assert.equal(count("capitulo_cache_outbox"), outbox + 1, "Monitor jamais confirma/apaga a outbox.");
  });
});
