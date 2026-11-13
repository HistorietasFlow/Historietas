import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { criarInvocacaoStatusSupabase } from "../scripts/supabase-cli-invocation.mjs";

const uid = n => `ea100000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const wid = n => `ea200000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const check = result => { assert.equal(result.error, null, result.error?.message); return result.data; };
const fields = "id,user_id,status_editorial,status_editorial_versao,publicado,sinopse";

test("versao editorial local: migracao incremental, CAS real, ABA, recriacao e resposta perdida", async t => {
  const inv = criarInvocacaoStatusSupabase();
  const raw = execFileSync(inv.comando, inv.argumentos, { encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  const env = Object.fromEntries(raw.split(/\r?\n/).filter(s => /^[A-Z0-9_]+=/.test(s)).map(s => {
    const i = s.indexOf("="), v = s.slice(i + 1).trim(); return [s.slice(0, i), v.startsWith('"') ? JSON.parse(v) : v];
  }));
  for (const value of [env.API_URL, env.DB_URL]) assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(value).hostname), "Somente Supabase local descartavel");
  const names = execFileSync("docker", ["ps", "--filter", `publish=${new URL(env.DB_URL).port}`, "--format", "{{.Names}}"], { encoding: "utf8", windowsHide: true }).trim().split(/\r?\n/);
  assert.equal(names.length, 1); assert.match(names[0], /^supabase_db_/);
  const args = ["exec", "-i", names[0], "psql", "-U", "postgres", "-d", "postgres", "-XqAt", "-v", "ON_ERROR_STOP=1"];
  const sql = s => execFileSync("docker", args, { input: s, encoding: "utf8", windowsHide: true, stdio: ["pipe", "pipe", "pipe"] }).trim();
  const writers = [];
  // Fecha writers antes de remover apenas fixtures proprias; nunca apagar ledger/outbox.
  t.after(async () => {
    for (const writer of writers) if (writer.child.exitCode === null) { writer.end("rollback;\n"); await writer.exit; }
    sql(`begin; delete from public.obras where id::text like 'ea200000-%';
      delete from auth.users where id in ('${uid(1)}','${uid(2)}'); commit;`);
  });
  sql(`begin; delete from public.obras where id::text like 'ea200000-%'; delete from auth.users where id in ('${uid(1)}','${uid(2)}'); commit;`);

  await t.test("upgrade da #2282 com registros existentes nao reescreve tuplas nem contratos", () => {
    const source = readFileSync(new URL("../../supabase/migrations/20261113013249_proteger_versao_status_editorial.sql", import.meta.url), "utf8");
    assert.match(source, /^begin;\s/); assert.match(source, /commit;\s*$/);
    const body = source.replace(/^begin;\s*/, "").replace(/commit;\s*$/, "");
    // Reconstitui SOMENTE o delta novo, em transacao revertida no descartavel.
    // Nao edita migrations antigas nem deixa janela de schema sem protecao.
    sql(`begin;
      drop trigger obras_status_editorial_versao on public.obras;
      drop function historietas_privado.definir_versao_status_editorial();
      alter table public.obras drop column status_editorial_versao;
      insert into auth.users(id) values ('${uid(1)}');
      insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,publicado,slug,status_editorial)
      select ('ea200000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'${uid(1)}','Preexistente','QA','Fantasia','HQ','Livre',n%2=0,'qa-versao-pre-'||n,
        case n when 1 then null when 2 then 'em_andamento' when 3 then 'concluida' else 'pausada' end from generate_series(1,4) n;
      create temp table qa_antes as select id,to_jsonb(o) dados,xmin::text xmin_antes from public.obras o;
      create temp table qa_revisoes as select * from historietas_privado.obra_projecao_revisoes;
      create temp table qa_contratos as select oid,pg_get_functiondef(oid) def,proacl from pg_proc
        where pronamespace='public'::regnamespace and proname in ('listar_obras_catalogo','obter_projecao_publica_obra');
      create temp table qa_relacao as select pg_relation_filenode('public.obras') arquivo;
      ${body}
      do $$ begin
        if exists(select 1 from public.obras where status_editorial_versao is not null) then raise exception 'Backfill indevido'; end if;
        if exists(select 1 from public.obras o join qa_antes a using(id)
          where to_jsonb(o)-'status_editorial_versao' is distinct from a.dados or o.xmin::text<>a.xmin_antes)
          or (select count(*) from public.obras)<>(select count(*) from qa_antes) then raise exception 'Dados/tuplas alterados'; end if;
        if pg_relation_filenode('public.obras')<>(select arquivo from qa_relacao) then raise exception 'Rewrite da tabela'; end if;
        if exists(select 1 from historietas_privado.obra_projecao_revisoes r full join qa_revisoes a using(obra_id)
          where to_jsonb(r) is distinct from to_jsonb(a)) then raise exception 'Revisao alterada na instalacao'; end if;
        if exists(select 1 from pg_proc p join qa_contratos a on p.oid=a.oid
          where pg_get_functiondef(p.oid)<>a.def or p.proacl is distinct from a.proacl) then raise exception 'RPC/ACL alterada'; end if;
        update public.obras set sinopse='Metadado' where id='${wid(1)}';
        if (select status_editorial_versao is not null from public.obras where id='${wid(1)}') then raise exception 'Metadado inicializou token legado'; end if;
        update public.obras set status_editorial='concluida' where id='${wid(1)}' and status_editorial_versao is null;
        if (select status_editorial_versao is null from public.obras where id='${wid(1)}') then raise exception 'Primeira transicao sem token'; end if;
        update public.obras set status_editorial='pausada' where id='${wid(1)}' and status_editorial_versao is null;
        if found then raise exception 'CAS NULL obsoleto aceito'; end if;
      end $$;
      rollback;`);
  });

  const opts = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
  const admin = createClient(env.API_URL, env.SERVICE_ROLE_KEY, opts);
  const anon = createClient(env.API_URL, env.ANON_KEY, opts), author = createClient(env.API_URL, env.ANON_KEY, opts);
  const second = createClient(env.API_URL, env.ANON_KEY, opts), third = createClient(env.API_URL, env.ANON_KEY, opts);
  let authorSession;
  for (const n of [1, 2]) {
    const email = `qa-editorial-version-${n}@historietas.test`, password = randomBytes(24).toString("base64url");
    check(await admin.auth.admin.createUser({ id: uid(n), email, password, email_confirm: true }));
    const client = n === 1 ? author : third;
    const auth = check(await client.auth.signInWithPassword({ email, password }));
    if (n === 1) { authorSession = auth.session; check(await second.auth.signInWithPassword({ email, password })); }
  }
  sql(`begin; insert into public.profiles(id,user_id,nome,tipo) values ('${uid(1)}','${uid(1)}','QA versao','autor'),('${uid(2)}','${uid(2)}','QA terceiro','autor'); commit;`);
  check(await author.rpc("aceitar_termos_publicacao", { p_termos_versao: "2026-08-05", p_diretrizes_versao: "2026-08-05", p_politica_versao: "2026-08-05" }));
  const insert = (n, status = null) => ({ id: wid(n), user_id: uid(1), titulo: `QA versao ${n}`, autor: "QA", genero: "Fantasia", formato: "HQ", classificacao_indicativa: "Livre", avisos_conteudo: [], publicado: false, slug: `qa-versao-${n}`, status_editorial: status });
  check(await author.from("obras").insert([insert(1), { ...insert(2, "em_andamento"), publicado: true }, { ...insert(4, "concluida"), publicado: true, classificacao_indicativa: "18+", avisos_conteudo: ["terror"] }]));
  // Fixture de NULL legado para a Data API. DDL, INSERT e restauracao do unico
  // trigger ficam no MESMO lock/transacao; nenhuma janela externa desprotegida.
  // O upgrade real acima comprova por que esse estado legado e valido.
  sql(`begin; alter table public.obras disable trigger obras_status_editorial_versao;
    insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,publicado,slug,status_editorial)
    values ('${wid(5)}','${uid(1)}','Legado','QA','Fantasia','HQ','Livre',false,'qa-versao-5','pausada');
    alter table public.obras enable trigger obras_status_editorial_versao; commit;`);
  const read = async (n, client = author) => check(await client.from("obras").select(fields).eq("id", wid(n)).eq("user_id", uid(1)).single());
  // Exemplo executavel do contrato futuro: ZERO consultas de rebase/retry.
  async function cas(client, confirmed, patch) {
    assert.ok(Object.hasOwn(confirmed, "status_editorial") && Object.hasOwn(confirmed, "status_editorial_versao"), "Resposta remota incompleta nao confirma NULL");
    assert.ok(confirmed.status_editorial_versao === null || /^[0-9a-f-]{36}$/.test(confirmed.status_editorial_versao));
    let query = client.from("obras").update(patch).eq("id", confirmed.id).eq("user_id", confirmed.user_id);
    query = confirmed.status_editorial_versao === null
      ? query.is("status_editorial_versao", null) : query.eq("status_editorial_versao", confirmed.status_editorial_versao);
    return check(await query.select(fields)); // Chamador exige exatamente uma linha.
  }
  const token = row => row.status_editorial_versao;
  const context = `select set_config('request.jwt.claim.sub','${uid(1)}',true); set local role authenticated;`;
  function transaction() {
    const child = spawn("docker", args, { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "", stderr = "", changed;
    child.stdout.on("data", d => { stdout += d; changed?.(); }); child.stderr.on("data", d => { stderr += d; });
    const exit = new Promise((resolve, reject) => { child.on("error", reject); child.on("exit", code => code === 0 ? resolve() : reject(new Error(`psql ${code}: ${stderr}`))); }); exit.catch(() => {});
    const until = mark => new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Barreira nao atingida: ${mark}`)), 10_000);
      changed = () => { if (stdout.includes(mark)) { clearTimeout(timer); resolve(); } }; changed();
    });
    const writer = { child, write: s => child.stdin.write(s), end: s => child.stdin.end(s), until, exit, output: () => stdout };
    writers.push(writer); return writer;
  }
  async function waitForApiLocks(count) {
    const observer = transaction(); // Nao bloquear o event loop que envia as duas requisicoes HTTP.
    observer.end(`do $$ declare deadline timestamptz:=clock_timestamp()+interval '8 seconds'; begin loop
      exit when (select count(*) from pg_stat_activity where wait_event_type='Lock' and query ilike '%UPDATE%obras%' and query ilike '%status_editorial_versao%')>=${count};
      if clock_timestamp()>deadline then raise exception 'Data API nao aguardou lock'; end if;
      perform pg_sleep(0.01); end loop; end $$;`);
    await observer.exit;
  }

  await t.test("leitura conjunta, legado NULL, resposta antiga ausente e escrita deliberada", async () => {
    const legacy = await read(5); assert.equal(token(legacy), null);
    const unchanged = await cas(author, legacy, { status_editorial: "pausada" });
    assert.equal(unchanged.length, 1); assert.equal(token(unchanged[0]), null, "no-op legado nao preenche versao");
    check(await author.from("obras").update({ sinopse: "Outro metadado" }).eq("id", wid(5)));
    assert.equal(token(await read(5)), null);
    const oldResponse = check(await author.from("obras").select("id,user_id,status_editorial").eq("id", wid(5)).single());
    await assert.rejects(cas(author, oldResponse, { status_editorial: "concluida" }), /Resposta remota incompleta/);
    const saved = await cas(author, legacy, { status_editorial: "concluida" });
    assert.equal(saved.length, 1); assert.equal(saved[0].status_editorial, "concluida"); assert.ok(token(saved[0]));
    assert.equal(saved[0].sinopse, "Outro metadado", "CAS nao envia metadados antigos");
    assert.deepEqual(await cas(second, legacy, { status_editorial: "em_andamento", sinopse: "Nao salvar" }), []);
    assert.deepEqual(await read(5), saved[0]);
  });
  await t.test("INSERT nao aceita token imposto; UPDATE/upsert nao ampliam privilegios", async () => {
    const oldInsert = insert(9); delete oldInsert.status_editorial;
    const oldRow = check(await author.from("obras").insert(oldInsert).select(fields).single());
    assert.equal(oldRow.status_editorial, null); assert.ok(token(oldRow), "cliente antigo omite ambos os campos");
    for (const status of [undefined, null, "em_andamento", "concluida", "pausada"]) {
      const n = 10 + [undefined, null, "em_andamento", "concluida", "pausada"].indexOf(status);
      const payload = insert(n, status); if (status === undefined) delete payload.status_editorial;
      payload.status_editorial_versao = n % 2 ? null : token(await read(1));
      const row = check(await author.from("obras").insert(payload).select(fields).single());
      assert.ok(token(row)); assert.notEqual(token(row), payload.status_editorial_versao);
      assert.equal(row.status_editorial, status ?? null);
    }
    const before = await read(1);
    for (const forced of [null, randomUUID(), token(before)]) {
      assert.equal((await author.from("obras").update({ status_editorial_versao: forced }).eq("id", wid(1))).error?.code, "42501");
    }
    assert.equal((await author.from("obras").upsert({ ...insert(1, "pausada"), status_editorial_versao: token(before) })).error?.code, "42501");
    assert.deepEqual(await read(1), before);
    sql(`begin; ${context} insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,publicado,slug,status_editorial)
      values ('${wid(1)}','${uid(1)}','QA','QA','Fantasia','HQ','Livre',false,'qa-versao-1',null)
      on conflict(id) do update set status_editorial=excluded.status_editorial; commit;`);
    assert.equal(token(await read(1)), token(before), "upsert no-op nao importa token do BEFORE INSERT");
    sql(`begin; ${context} insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,publicado,slug,status_editorial)
      values ('${wid(1)}','${uid(1)}','QA','QA','Fantasia','HQ','Livre',false,'qa-versao-1','em_andamento')
      on conflict(id) do update set status_editorial=excluded.status_editorial; commit;`);
    assert.equal((await read(1)).status_editorial, "em_andamento"); assert.notEqual(token(await read(1)), token(before));
  });
  await t.test("duas requisicoes Data API com a mesma versao: exatamente uma confirma", async () => {
    const before = await read(1), locker = transaction();
    locker.write(`begin; select id from public.obras where id='${wid(1)}' for update;\n\\echo LOCKED\n`); await locker.until("LOCKED");
    const operations = Promise.all([cas(author, before, { status_editorial: "pausada" }), cas(second, before, { status_editorial: "concluida" })]);
    operations.catch(() => {}); await waitForApiLocks(2);
    locker.end("commit;\n"); await locker.exit;
    const results = await operations; assert.deepEqual(results.map(r => r.length).sort(), [0, 1]);
    const winner = results.find(r => r.length === 1)[0]; assert.notEqual(token(winner), token(before));
    assert.deepEqual(await read(1), winner);
  });
  await t.test("ABA, NULL e mudancas na mesma transacao invalidam snapshots antigos", async () => {
    const a = await read(1), b = a.status_editorial === "pausada" ? "concluida" : "pausada";
    const tokens = sql(`begin; ${context} update public.obras set status_editorial='${b}' where id='${wid(1)}';
      select 'TOKEN:'||status_editorial_versao from public.obras where id='${wid(1)}';
      update public.obras set status_editorial='${a.status_editorial}' where id='${wid(1)}';
      select 'TOKEN:'||status_editorial_versao from public.obras where id='${wid(1)}'; commit;`)
      .split(/\r?\n/).filter(s => s.startsWith("TOKEN:")).map(s => s.slice(6));
    assert.equal(tokens.length, 2); assert.equal(new Set([token(a), ...tokens]).size, 3);
    const after = await read(1); assert.equal(after.status_editorial, a.status_editorial); assert.notEqual(token(after), token(a));
    assert.deepEqual(await cas(author, a, { status_editorial: b, sinopse: "Nao salvar" }), []);
    assert.deepEqual(await read(1), after);
    const cleared = await cas(author, after, { status_editorial: null }); assert.equal(cleared.length, 1); assert.notEqual(token(cleared[0]), token(after));
    const same = await cas(author, cleared[0], { status_editorial: null }); assert.equal(same.length, 1); assert.equal(token(same[0]), token(cleared[0]));
  });
  await t.test("rollback do primeiro escritor permite CAS valido sem vazar estado intermediario", async () => {
    const before = await read(1), first = transaction();
    first.write(`begin; ${context} update public.obras set status_editorial='pausada' where id='${wid(1)}';\n\\echo DIRTY\n`); await first.until("DIRTY");
    assert.deepEqual(await read(1), before);
    const pending = cas(second, before, { status_editorial: "concluida" }); pending.catch(() => {}); await waitForApiLocks(1);
    first.end("rollback;\n"); await first.exit;
    const saved = await pending; assert.equal(saved.length, 1); assert.equal(saved[0].status_editorial, "concluida"); assert.notEqual(token(saved[0]), token(before));
    const stable = await read(1);
    sql(`begin; ${context} update public.obras set status_editorial='pausada' where id='${wid(1)}'; rollback;`);
    assert.deepEqual(await read(1), stable);
  });
  await t.test("exclusao/recriacao do mesmo ID nao aceita token anterior ou NULL legado", async () => {
    const previous = await read(5);
    check(await author.from("obras").delete().eq("id", wid(5)).eq("user_id", uid(1)));
    assert.deepEqual(await cas(author, previous, { status_editorial: "pausada" }), []);
    const recreated = check(await author.from("obras").insert({ ...insert(5, previous.status_editorial), status_editorial_versao: token(previous) }).select(fields).single());
    assert.ok(token(recreated)); assert.notEqual(token(recreated), token(previous));
    assert.deepEqual(await cas(author, previous, { status_editorial: "pausada" }), []);
    assert.deepEqual(await cas(author, { ...previous, status_editorial_versao: null }, { status_editorial: "pausada" }), []);
    assert.deepEqual(await read(5), recreated);
  });
  await t.test("escrita sem CAS invalida CAS antigo; nao e CAS obrigatorio no banco", async () => {
    const before = await read(1), next = before.status_editorial === "pausada" ? "concluida" : "pausada";
    check(await author.from("obras").update({ status_editorial: next }).eq("id", wid(1)));
    const after = await read(1); assert.notEqual(token(after), token(before));
    assert.deepEqual(await cas(second, before, { status_editorial: "em_andamento", sinopse: "Nao salvar" }), []);
    assert.deepEqual(await read(1), after);
  });
  await t.test("identidade, privacidade, 18+, CHECK e termos permanecem autoridade", async () => {
    const before = await read(2);
    assert.deepEqual(await cas(third, before, { status_editorial: "concluida" }), []);
    assert.equal((await anon.from("obras").update({ status_editorial: "concluida" }).eq("id", wid(2))).error?.code, "42501");
    assert.equal(check(await anon.from("obras").select("status_editorial_versao").eq("id", wid(2)).single()).status_editorial_versao, token(before));
    for (const n of [1, 4]) assert.deepEqual(check(await third.from("obras").select(fields).eq("id", wid(n))), []);
    assert.deepEqual(check(await anon.from("obras").select(fields).eq("id", wid(4))), []);
    assert.equal(check(await anon.rpc("obter_projecao_publica_obra", { p_slug: "qa-versao-4", p_numero: null })).estado, "obra_indisponivel");
    const adult = await read(4); assert.equal((await cas(author, adult, { status_editorial: "pausada" })).length, 1);
    const publicSnapshot = check(await anon.rpc("obter_projecao_publica_obra", { p_slug: "qa-versao-2", p_numero: null }));
    assert.ok(!JSON.stringify(publicSnapshot).includes(token(before)), "versao nao entra na projecao publica");
    assert.equal((await author.from("obras").update({ status_editorial: "invalido", sinopse: "Nao salvar" }).eq("id", wid(2))).error?.code, "23514");
    assert.deepEqual(await read(2), before);
    sql(`insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,publicado,slug,status_editorial)
      values ('${wid(3)}','${uid(2)}','Sem termos','QA','Fantasia','HQ','Livre',true,'qa-versao-3','pausada');`);
    const noTerms = check(await third.from("obras").select(fields).eq("id", wid(3)).single());
    assert.equal((await third.from("obras").update({ status_editorial: "concluida" }).eq("id", wid(3)).eq("status_editorial_versao", token(noTerms))).error?.message, "ACEITE_TERMOS_PUBLICACAO_OBRIGATORIO");
    assert.deepEqual(check(await third.from("obras").select(fields).eq("id", wid(3)).single()), noTerms);
  });
  await t.test("resposta perdida nao vira rollback/sucesso e retry antigo nao reaplica", async () => {
    const before = await read(1); let writes = 0, drop = true;
    const lost = createClient(env.API_URL, env.ANON_KEY, { ...opts, global: { fetch: async (input, init) => {
      const response = await fetch(input, init);
      if (init?.method === "PATCH") { writes++; if (drop) { drop = false; await response.arrayBuffer(); throw new TypeError("Resposta perdida local"); } }
      return response;
    } } });
    check(await lost.auth.setSession({ access_token: authorSession.access_token, refresh_token: authorSession.refresh_token }));
    const next = before.status_editorial === "pausada" ? "concluida" : "pausada";
    await assert.rejects(cas(lost, before, { status_editorial: next })); assert.equal(writes, 1);
    const actual = await read(1); assert.equal(actual.status_editorial, next); assert.notEqual(token(actual), token(before));
    assert.deepEqual(await cas(lost, before, { status_editorial: next }), []); assert.equal(writes, 2);
    assert.deepEqual(await read(1), actual);
    await lost.auth.signOut({ scope: "local" });
  });
});
