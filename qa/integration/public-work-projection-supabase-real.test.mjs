import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { criarInvocacaoStatusSupabase } from "../scripts/supabase-cli-invocation.mjs";
import "./editorial-status-version-supabase-real.test.mjs";
import "./private-cover-contract-supabase-real.test.mjs";

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
  const pages = async (r, client = anon) => check(await client.rpc("listar_capitulos_projecao_publica", {
    p_slug: r.slug, p_geracao: r.geracao, p_revisao: r.revisao, p_inicio: 0, p_limite: 500,
  }));
  const manifest = async () => check(await anon.rpc("listar_revisoes_sitemap_publico", { p_depois_id: null, p_limite: 500 }));

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
    const current = await snapshot();
    assert.deepEqual(await pages(current, author), await pages(current));
    assert.equal((await pages(current)).capitulos.length, 1);
    assert.equal((await pages(current)).capitulos[0].texto, current.capitulo.texto);
    assert.equal(check(await anon.rpc("existe_capitulo_projecao_publica", { p_slug: current.slug, p_numero: 1 })), true);
    assert.equal(check(await anon.rpc("existe_capitulo_projecao_publica", { p_slug: current.slug, p_numero: 2 })), false);
    const rows = check(await anon.rpc("listar_revisoes_sitemap_publico", { p_depois_id: WORK.replace(/1$/, "0"), p_limite: 500 }));
    assert.ok(rows.some((r) => r.id === WORK && r.revisao === current.revisao));
    assert.ok(!rows.some((r) => r.id === OTHER));
  });
  await t.test("edicao nao commitada fica invisivel; dados e revisao aparecem juntos apos commit", async () => {
    const before = await snapshot(), writer = transaction();
    writer.write(`begin; select set_config('request.jwt.claim.sub','${USER}',true); update public.capitulos set texto='Snapshot novo' where id='${CHAPTER}';\n\\echo FIRST_READY\n`);
    await writer.until("FIRST_READY");
    assert.deepEqual(await snapshot(), before);
    assert.equal((await pages(before)).capitulos[0].texto, before.capitulo.texto);
    writer.end("commit;\n"); await writer.exit;
    const after = await snapshot();
    assert.equal(after.capitulo.texto, "Snapshot novo"); assert.equal(revision(after), revision(before) + 1n);
    assert.equal((await pages(before)).valida, false);
    assert.deepEqual((await pages(before)).capitulos, []);
    assert.equal((await pages(after)).capitulos[0].texto, after.capitulo.texto);
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
    assert.equal((await pages(before)).valida, false);
    assert.ok(Array.isArray(await manifest()));
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
    assert.equal((await pages(before)).valida, false);
    assert.equal((await pages(after)).valida, true);
    assert.deepEqual((await pages(after)).capitulos, []);
    check(await author.auth.signOut());
    assert.deepEqual(await snapshot(), { ...after, estado: "capitulo_indisponivel" });
  });
});

test("status editorial: Data API local, assinaturas legadas, isolamento e limites de CAS", async t => {
  const inv = criarInvocacaoStatusSupabase();
  const output = execFileSync(inv.comando, inv.argumentos, { encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  const env = Object.fromEntries(output.split(/\r?\n/).filter(s => /^[A-Z0-9_]+=/.test(s)).map(s => {
    const i = s.indexOf("="), v = s.slice(i + 1).trim(); return [s.slice(0, i), v.startsWith('"') ? JSON.parse(v) : v];
  }));
  for (const value of [env.API_URL, env.DB_URL]) assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(value).hostname), "Somente Supabase local");
  const containers = execFileSync("docker", ["ps", "--filter", `publish=${new URL(env.DB_URL).port}`, "--format", "{{.Names}}"], { encoding: "utf8", windowsHide: true }).trim().split(/\r?\n/);
  assert.equal(containers.length, 1); assert.match(containers[0], /^supabase_db_/);
  const args = ["exec", "-i", containers[0], "psql", "-U", "postgres", "-d", "postgres", "-XqAt", "-v", "ON_ERROR_STOP=1"];
  const sql = s => execFileSync("docker", args, { input: s, encoding: "utf8", windowsHide: true, stdio: ["pipe", "pipe", "pipe"] }).trim();
  const uid = n => `e8100000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  const wid = n => `e8200000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  const cleanup = () => sql(`begin; delete from public.obras where id::text like 'e8200000-%';
    delete from auth.users where id in ('${uid(1)}','${uid(2)}','${uid(3)}'); commit;`);
  cleanup(); t.after(cleanup); // Ledger/tombstones e outbox nao sao apagados.
  const opts = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
  const admin = createClient(env.API_URL, env.SERVICE_ROLE_KEY, opts);
  const anon = createClient(env.API_URL, env.ANON_KEY, opts);
  const clients = [];
  for (let n = 1; n <= 3; n++) {
    const email = `qa-editorial-${n}@historietas.test`, password = randomBytes(24).toString("base64url");
    check(await admin.auth.admin.createUser({ id: uid(n), email, password, email_confirm: true }));
    const client = createClient(env.API_URL, env.ANON_KEY, opts);
    check(await client.auth.signInWithPassword({ email, password })); clients.push(client);
  }
  const [author, third, noTerms] = clients;
  const source = readFileSync(new URL("../../supabase/tests/database/obra_status_editorial.test.sql", import.meta.url), "utf8");
  sql(`begin; ${source.slice(source.indexOf("insert into public.profiles"), source.indexOf("-- END EDITORIAL FIXTURE"))} commit;`);
  check(await author.rpc("aceitar_termos_publicacao", { p_termos_versao: "2026-08-05", p_diretrizes_versao: "2026-08-05", p_politica_versao: "2026-08-05" }));
  const base = { p_busca: "", p_genero: "", p_formato: "", p_classificacao: "", p_filtro_capitulos: "todos", p_ordenacao: "mais-recentes", p_limite: 24, p_cursor_valor: null, p_cursor_data: null, p_cursor_id: null };
  const extended = { ...base, p_tag: "qa-editorial", p_nota_minima: null, p_tag_excluida: "", p_genero_excluido: "", p_status_editorial: "concluida" };
  const catalog = async (parameters = extended, client = anon) => check(await client.rpc("listar_obras_catalogo", parameters));
  const work = async (n, client = author) => check(await client.from("obras").select("id,status_editorial,publicado,sinopse,atualizado_em").eq("id", wid(n)).single());
  const projection = async (n = 3) => check(await anon.rpc("obter_projecao_publica_obra", { p_slug: `qa-editorial-${n}`, p_numero: null }));

  await t.test("cinco assinaturas antigas e neutros resolvem na Data API sem ambiguidade", async () => {
    let parameters = { ...base };
    for (const field of [null, ["p_tag", ""], ["p_nota_minima", null], ["p_tag_excluida", ""], ["p_genero_excluido", ""]]) {
      if (field) parameters = { ...parameters, [field[0]]: field[1] };
      const legacy = await catalog(parameters);
      assert.deepEqual(await catalog({ ...base, p_tag: "", p_nota_minima: null, p_tag_excluida: "", p_genero_excluido: "", p_status_editorial: null }), legacy);
    }
    assert.deepEqual(await catalog({ ...extended, p_status_editorial: "" }), await catalog({ ...extended, p_status_editorial: null }));
    for (const invalid of ["nao_informado", "Concluida", " concluida", "%", "publicado"]) {
      assert.equal((await anon.rpc("listar_obras_catalogo", { ...extended, p_status_editorial: invalid })).error?.code, "22023");
    }
  });
  await t.test("filtro anterior ao limite, cursores, ordenadores e combinacoes", async () => {
    assert.deepEqual((await catalog()).map(r => r.obra_id), [wid(63), wid(4), wid(3)]);
    const rawFirst = await catalog({ ...extended, p_status_editorial: null });
    assert.ok(!rawFirst.some(r => r.obra_id === wid(3)), "obra elegivel fora da primeira pagina ampla");
    const ids = []; let cursor = {};
    do {
      const page = await catalog({ ...extended, p_limite: 1, ...cursor });
      assert.equal(page.length, 1); ids.push(page[0].obra_id);
      if (!page[0].tem_mais) break;
      cursor = { p_cursor_valor: page[0].cursor_valor, p_cursor_data: page[0].cursor_data, p_cursor_id: page[0].cursor_id };
      assert.ok(ids.length <= 3, "cursor deve avancar");
    } while (true);
    assert.deepEqual(ids, [wid(63), wid(4), wid(3)]);
    for (const order of ["relevancia", "geral", "lidas", "mais-curtidas", "curtidas", "mais-comentadas", "comentadas", "mais-salvas", "salvas", "mais-recentes", "recentes", "mais-capitulos", "capitulos"]) {
      assert.deepEqual(new Set((await catalog({ ...extended, p_ordenacao: order })).map(r => r.obra_id)), new Set(ids));
    }
    const combined = { ...extended, p_busca: "QA editorial", p_genero: "Fantasia", p_formato: "HQ", p_classificacao: "Livre", p_filtro_capitulos: "com-capitulos", p_nota_minima: 4.5, p_tag_excluida: "bloqueada", p_genero_excluido: "romance", p_ordenacao: "mais-capitulos" };
    assert.deepEqual((await catalog(combined)).map(r => r.obra_id), [wid(3)]);
    assert.deepEqual(await catalog({ ...combined, p_status_editorial: "pausada" }), []);
    assert.deepEqual((await catalog({ ...extended, p_status_editorial: "em_andamento" })).map(r => r.obra_id), [wid(2)]);
  });
  await t.test("autoria, termos, null, clientes antigos e bloqueio 18+", async () => {
    const before = await work(3);
    assert.equal((await anon.from("obras").update({ status_editorial: "pausada" }).eq("id", wid(3))).error?.code, "42501");
    assert.deepEqual(check(await third.from("obras").update({ status_editorial: "pausada" }).eq("id", wid(3)).select("id")), []);
    assert.equal((await noTerms.from("obras").update({ status_editorial: "pausada", sinopse: "Nao salvar" }).eq("id", wid(63))).error?.message, "ACEITE_TERMOS_PUBLICACAO_OBRIGATORIO");
    assert.equal((await work(63, noTerms)).status_editorial, "concluida");
    assert.equal((await work(63, noTerms)).sinopse, "");
    for (const status of ["em_andamento", "concluida", "pausada"]) {
      assert.equal(check(await author.from("obras").update({ status_editorial: status }).eq("id", wid(3)).select("status_editorial").single()).status_editorial, status);
      assert.equal((await projection()).obra.statusEditorial, status);
    }
    for (const invalid of ["", "Concluida", "publicado"]) {
      assert.equal((await author.from("obras").update({ status_editorial: invalid, sinopse: "Nao salvar" }).eq("id", wid(3))).error?.code, "23514");
    }
    check(await author.from("obras").update({ sinopse: "Cliente antigo" }).eq("id", wid(3)));
    assert.equal((await work(3)).status_editorial, "pausada");
    check(await author.from("obras").update({ status_editorial: null }).eq("id", wid(3)));
    assert.equal((await projection()).obra.statusEditorial, null);
    assert.equal((await work(3)).publicado, before.publicado);
    for (const n of [61, 62, 64]) {
      check(await author.from("obras").update({ status_editorial: "pausada" }).eq("id", wid(n)));
      assert.deepEqual(check(await third.from("obras").select("id,status_editorial").eq("id", wid(n))), []);
      assert.equal((await projection(n)).estado, "obra_indisponivel");
    }
    const legacyId = "e8200000-0000-4000-8000-000000000065";
    assert.equal(check(await author.from("obras").insert({ id: legacyId, user_id: uid(1), titulo: "Legado", autor: "QA", genero: "Fantasia", formato: "HQ", classificacao_indicativa: "Livre", publicado: false, slug: "qa-editorial-65" }).select("status_editorial").single()).status_editorial, null);
    const insert = { id: wid(66), user_id: uid(1), titulo: "Novo", autor: "QA", genero: "Fantasia", formato: "HQ", classificacao_indicativa: "Livre", publicado: false, slug: "qa-editorial-66", status_editorial: "concluida" };
    assert.equal(check(await author.from("obras").insert(insert).select("status_editorial").single()).status_editorial, "concluida");
    assert.equal((await author.from("obras").insert({ ...insert, id: wid(67), slug: "qa-editorial-67", user_id: uid(2) })).error?.code, "42501");
    assert.equal((await author.from("obras").update({ user_id: uid(2) }).eq("id", wid(3))).error?.code, "42501");
  });

  function transaction() {
    const child = spawn("docker", args, { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "", stderr = "", changed;
    child.stdout.on("data", d => { stdout += d; changed?.(); });
    child.stderr.on("data", d => { stderr += d; });
    const exit = new Promise((resolve, reject) => {
      child.on("error", reject); child.on("exit", code => code === 0 ? resolve() : reject(new Error(`psql ${code}: ${stderr}`)));
    }); exit.catch(() => {});
    const until = mark => new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Barreira nao atingida: ${mark}`)), 10_000);
      changed = () => { if (stdout.includes(mark)) { clearTimeout(timer); resolve(); } }; changed();
    });
    t.after(async () => { if (child.exitCode === null) { child.stdin.end("rollback;\n"); await exit; } });
    return { write: s => child.stdin.write(s), end: s => child.stdin.end(s), until, exit, output: () => stdout };
  }
  const identity = `select set_config('request.jwt.claim.sub','${uid(1)}',true); set local role authenticated;`;
  await t.test("duas sessoes: comparacao atomica detecta conflito simples, mas nao resolve ABA", async () => {
    check(await author.from("obras").update({ status_editorial: "em_andamento" }).eq("id", wid(64)));
    const first = transaction(), second = transaction();
    first.write(`begin; ${identity} update public.obras set status_editorial='pausada' where id='${wid(64)}';\n\\echo FIRST_HELD\n`);
    await first.until("FIRST_HELD");
    second.write(`select 'BACKEND:'||pg_backend_pid();\n\\echo PID_READY\nbegin; ${identity}
      with u as (update public.obras set status_editorial='concluida' where id='${wid(64)}' and status_editorial='em_andamento' returning id)
      select 'CHANGED:'||count(*) from u;\n\\echo SECOND_READY\n`);
    await second.until("PID_READY");
    const pid = /BACKEND:(\d+)/.exec(second.output())?.[1]; assert.ok(pid);
    sql(`do $$ declare deadline timestamptz:=clock_timestamp()+interval '8 seconds'; begin loop
      exit when exists(select 1 from pg_stat_activity where pid=${pid} and wait_event_type='Lock');
      if clock_timestamp()>deadline then raise exception 'Writer nao aguardou'; end if;
      perform pg_sleep(0.01); end loop; end $$;`);
    assert.equal((await work(64)).status_editorial, "em_andamento", "escrita nao commitada invisivel");
    first.end("commit;\n"); await first.exit; await second.until("SECOND_READY");
    second.end("commit;\n"); await second.exit;
    assert.match(second.output(), /CHANGED:0/); assert.equal((await work(64)).status_editorial, "pausada");
    // A->B->A e real, mas status antigo sozinho deixa uma edicao obsoleta vencer.
    sql(`begin; ${identity} update public.obras set status_editorial='em_andamento' where id='${wid(64)}';
      update public.obras set status_editorial='pausada' where id='${wid(64)}'; commit;`);
    const stale = check(await author.from("obras").update({ status_editorial: "concluida" }).eq("id", wid(64)).eq("status_editorial", "pausada").select("id"));
    assert.equal(stale.length, 1, "evidencia do bloqueador ABA; nao e certificacao de CAS");
    const rollback = await work(64);
    sql(`begin; ${identity} update public.obras set status_editorial='em_andamento' where id='${wid(64)}'; rollback;`);
    assert.deepEqual(await work(64), rollback);
    const equalTimestamps = sql(`begin; ${identity} update public.obras set status_editorial='em_andamento' where id='${wid(64)}';
      select 'STAMP:'||atualizado_em::text from public.obras where id='${wid(64)}';
      update public.obras set status_editorial='pausada' where id='${wid(64)}';
      select 'STAMP:'||atualizado_em::text from public.obras where id='${wid(64)}'; rollback;`);
    const stamps = equalTimestamps.split(/\r?\n/).filter(s => s.startsWith("STAMP:"));
    assert.equal(stamps.length, 2); assert.equal(stamps[0], stamps[1], "timestamp nao e revisao monotônica por edicao");
    assert.equal((await author.schema("historietas_privado").from("obra_projecao_revisoes").select("revisao").eq("obra_id", wid(64))).error?.code, "PGRST106", "schema privado nao e endpoint de CAS");
  });
  await t.test("planos comparaveis: filtro na selecao anterior a agregacao/cursor, sem indice novo", () => {
    const plan = status => JSON.parse(sql(`explain (analyze,buffers,format json) select id from public.obras
      where publicado and tags @> array['qa-editorial'] ${status ? "and status_editorial='pausada'" : ""}
      order by criada_em desc,id desc limit 24;`))[0];
    const before = plan(false), after = plan(true);
    assert.ok(JSON.stringify(after.Plan).includes("status_editorial"));
    const body = sql("select prosrc from pg_proc where oid='public.listar_obras_catalogo(text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text,text,text)'::regprocedure;");
    const predicate = body.indexOf("obra.status_editorial = p_status_editorial");
    assert.ok(predicate >= 0 && predicate < body.indexOf("candidatos_ordenados as"));
    const rpcPlan = suffix => JSON.parse(sql(`explain (analyze,buffers,format json)
      select * from public.listar_obras_catalogo('','','','','todos','mais-recentes',24,null,null,null,'qa-editorial',null,'',''${suffix});`))[0];
    const summarize = p => ({ rows: p.Plan["Actual Rows"], ms: p["Execution Time"], buffers: p.Plan["Shared Hit Blocks"] });
    const oldRpc = rpcPlan(""), neutralRpc = rpcPlan(",null"), activeRpc = rpcPlan(",'pausada'");
    assert.equal(oldRpc.Plan["Actual Rows"], neutralRpc.Plan["Actual Rows"]);
    console.log(JSON.stringify({ planosEditoriaisLocais: { selecaoSemStatus: summarize(before), selecaoComStatus: summarize(after), rpc14: summarize(oldRpc), rpc15Neutra: summarize(neutralRpc), rpc15Filtrada: summarize(activeRpc) } }));
    assert.equal(sql("select count(*) from historietas_privado.capitulo_cache_outbox where obra_id::text like 'e8200000-%';"), "0");
  });
});
