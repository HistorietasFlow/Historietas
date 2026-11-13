import assert from "node:assert/strict";
import test from "node:test";
import {execFileSync, spawn} from "node:child_process";
import {randomBytes, randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {createClient} from "@supabase/supabase-js";
import {criarInvocacaoStatusSupabase} from "../scripts/supabase-cli-invocation.mjs";

const check = result => { assert.equal(result.error, null, result.error?.message); return result.data; };
const quote = value => `'${String(value).replaceAll("'", "''")}'`;
const opts = {auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false}};

test("contrato de capas: duas sessoes, recibo, legado e rollback exclusivamente locais", async t => {
  const inv = criarInvocacaoStatusSupabase();
  const raw = execFileSync(inv.comando, inv.argumentos, {encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"]});
  const env = Object.fromEntries(raw.split(/\r?\n/).filter(line => /^[A-Z0-9_]+=/.test(line)).map(line => {
    const i = line.indexOf("="), value = line.slice(i + 1).trim();
    return [line.slice(0, i), value.startsWith('"') ? JSON.parse(value) : value];
  }));
  for (const [value, protocol] of [[env.API_URL, "http:"], [env.DB_URL, "postgresql:"]]) {
    const url = new URL(value);
    assert.equal(url.protocol, protocol);
    assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(url.hostname), "Somente Supabase local descartavel");
    assert.ok(Number(url.port) > 0);
  }
  const names = execFileSync("docker", ["ps", "--filter", `publish=${new URL(env.DB_URL).port}`, "--format", "{{.Names}}"], {encoding: "utf8", windowsHide: true}).trim().split(/\r?\n/).filter(Boolean);
  assert.equal(names.length, 1);
  assert.match(names[0], /^supabase_db_[a-zA-Z0-9-]+$/);
  const args = ["exec", "-i", names[0], "psql", "-U", "postgres", "-d", "postgres", "-XqAt", "-v", "ON_ERROR_STOP=1"];
  const sql = source => execFileSync("docker", args, {input: source, encoding: "utf8", windowsHide: true, stdio: ["pipe", "pipe", "pipe"]}).trim();
  const processes = [];
  function connection(source, marker) {
    const child = spawn("docker", args, {windowsHide: true, stdio: ["pipe", "pipe", "pipe"]});
    let output = "", error = "", notify;
    child.stdout.on("data", d => { output += d; notify?.(); });
    child.stderr.on("data", d => { error += d; });
    const exit = new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("exit", code => code === 0 ? resolve(output.trim()) : reject(Error(`psql ${code}: ${error}`)));
    });
    exit.catch(() => {});
    const ready = marker ? new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error("Barreira SQL local nao atingida")), 10_000);
      notify = () => { if (output.includes(marker)) { clearTimeout(timer); resolve(); } };
      exit.catch(e => { clearTimeout(timer); reject(e); });
    }) : exit;
    child.stdin.write(source);
    if (!marker) child.stdin.end();
    const item = {child, ready, exit}; processes.push(item); return item;
  }
  function releaseAfter(subtest, process) {
    subtest.after(async () => {
      if (!process.child.stdin.writableEnded) {
        process.child.stdin.end("rollback;\n"); await process.exit;
      }
    });
  }
  async function blocked(count) {
    await connection(`do $$ declare deadline timestamptz:=clock_timestamp()+interval '8 seconds'; begin loop
      exit when (select count(*) from pg_stat_activity where wait_event_type='Lock'
        and query ilike '%aplicar_operacao_capa%')>=${count};
      if clock_timestamp()>deadline then raise exception 'Data API nao aguardou lock da obra'; end if;
      perform pg_sleep(0.01); end loop; end $$;`).exit;
  }
  const admin = createClient(env.API_URL, env.SERVICE_ROLE_KEY, opts);
  const key = env.PUBLISHABLE_KEY || env.ANON_KEY;
  const a = createClient(env.API_URL, key, opts), b = createClient(env.API_URL, key, opts), other = createClient(env.API_URL, key, opts);
  const author = randomUUID(), third = randomUUID(), works = Array.from({length: 5}, () => randomUUID());
  const password = randomBytes(24).toString("base64url"), email = `qa-cover-${author}@historietas.test`;
  t.after(async () => {
    for (const p of processes) if (p.child.exitCode === null && !p.child.stdin.writableEnded) {
      p.child.stdin.end("rollback;\n"); await p.exit;
    }
    // Somente fixtures desta execucao. Recibos/referencias/tombstones conservados.
    sql(`delete from public.obras where id in (${works.map(quote)});`);
    check(await admin.auth.admin.deleteUser(author)); check(await admin.auth.admin.deleteUser(third));
  });
  check(await admin.auth.admin.createUser({id: author, email, password, email_confirm: true}));
  check(await admin.auth.admin.createUser({id: third, email: `qa-cover-${third}@historietas.test`, password, email_confirm: true}));
  const session = check(await a.auth.signInWithPassword({email, password})).session;
  const sessionB = check(await b.auth.signInWithPassword({email, password})).session;
  check(await other.auth.signInWithPassword({email: `qa-cover-${third}@historietas.test`, password}));
  sql(`insert into public.profiles(id,user_id,nome,tipo) values
    ('${author}','${author}','QA capa','autor'),('${third}','${third}','QA outro','autor');`);
  check(await a.rpc("aceitar_termos_publicacao", {p_termos_versao: "2026-08-05", p_diretrizes_versao: "2026-08-05", p_politica_versao: "2026-08-05"}));
  const insert = id => ({id, user_id: author, titulo: "QA capa", autor: "QA", genero: "Fantasia", formato: "HQ", classificacao_indicativa: "Livre", publicado: false, slug: `qa-cover-${id}`});
  check(await a.from("obras").insert(works.map(insert)));
  const snapshot = async (id = works[0], client = a) => check(await client.rpc("consultar_contrato_capa", {p_obra_id: id}));
  const params = (s, id = randomUUID(), classification = "12+", asset = null, notices = []) => ({
    p_operacao_id: id, p_obra_id: s.obraId, p_geracao: s.geracao, p_versao: Number(s.versao),
    p_capa_privada_id: asset, p_classificacao: classification, p_avisos: notices,
  });
  const receipt = async id => check(await a.rpc("consultar_operacao_capa", {p_operacao_id: id}));
  const callSql = p => `select public.aplicar_operacao_capa('${p.p_operacao_id}','${p.p_obra_id}','${p.p_geracao}',${p.p_versao},
    ${p.p_capa_privada_id ? quote(p.p_capa_privada_id) : "null"},${quote(p.p_classificacao)},array[${p.p_avisos.map(quote)}]::text[]);`;
  const claims = {sub: author, role: "authenticated", session_id: JSON.parse(Buffer.from(session.access_token.split(".")[1], "base64url")).session_id};
  const context = `select set_config('request.jwt.claims',${quote(JSON.stringify(claims))},true); set local role authenticated;`;

  await t.test("upgrade sem backfill preserva tuplas, projecao e grants", () => {
    const source = readFileSync(new URL("../../supabase/migrations/20261113190105_contrato_transacional_capas_privadas.sql", import.meta.url), "utf8");
    const body = source.replace(/^([\s\S]*?)begin;\s*/, "").replace(/commit;\s*$/, "");
    sql(`begin;
      drop function public.consultar_contrato_capa(uuid),public.aplicar_operacao_capa(uuid,uuid,uuid,bigint,uuid,text,text[]),public.consultar_operacao_capa(uuid);
      drop function historietas_privado.operar_contrato_capa(text,uuid,uuid,uuid,bigint,uuid,text,text[]);
      drop function historietas_privado.rastrear_contrato_capa() cascade;
      drop function historietas_privado.proteger_registro_capa() cascade;
      drop table historietas_privado.obra_capas_operacoes,historietas_privado.obra_capas_referencias,historietas_privado.obra_capas_estado;
      create temp table qa_cover_before as select id,to_jsonb(o) data,xmin::text previous_xmin from public.obras o;
      create temp table qa_cover_revision as select * from historietas_privado.obra_projecao_revisoes;
      create temp table qa_cover_acl as select relacl,pg_relation_filenode(oid) file from pg_class where oid='public.obras'::regclass;
      ${body}
      do $$ begin
        if exists(select 1 from public.obras o full join qa_cover_before b using(id)
          where to_jsonb(o) is distinct from b.data or o.xmin::text is distinct from b.previous_xmin)
          then raise exception 'Upgrade alterou obras'; end if;
        if exists(select 1 from historietas_privado.obra_capas_estado) then raise exception 'Backfill indevido'; end if;
        if exists(select 1 from historietas_privado.obra_projecao_revisoes r full join qa_cover_revision b using(obra_id)
          where to_jsonb(r) is distinct from to_jsonb(b)) then raise exception 'Upgrade alterou projecao'; end if;
        if exists(select 1 from pg_class c cross join qa_cover_acl b where c.oid='public.obras'::regclass
          and (c.relacl is distinct from b.relacl or pg_relation_filenode(c.oid)<>b.file)) then raise exception 'Grant/rewrite indevido'; end if;
      end $$; rollback;`);
  });
  await t.test("duas sessoes reais disputam uma versao: apenas uma confirma", async st => {
    const before = await snapshot();
    const hold = connection(`begin; select id from public.obras where id='${works[0]}' for update;\n\\echo COVER_LOCKED\n`, "COVER_LOCKED");
    releaseAfter(st, hold);
    await hold.ready;
    const first = params(before), second = params(before, randomUUID(), "14+");
    const pending = Promise.all([a.rpc("aplicar_operacao_capa", first), b.rpc("aplicar_operacao_capa", second)]);
    pending.catch(() => {}); await blocked(2);
    hold.child.stdin.end("commit;\n"); await hold.exit;
    const results = await pending;
    assert.equal(results.filter(r => !r.error).length, 1);
    assert.equal(results.find(r => r.error)?.error.code, "PT409");
    assert.equal(Number((await snapshot()).versao), Number(before.versao) + 1);
    assert.equal(sql(`select count(*) from historietas_privado.obra_capas_operacoes where obra_id='${works[0]}';`), "1");
  });
  await t.test("mesmo UUID em paralelo e resposta perdida devolvem um unico recibo", async () => {
    const before = await snapshot(), p = params(before), lost = createClient(env.API_URL, key, {
      ...opts, global: {fetch: async (input, init) => {
        const r = await fetch(input, init);
        if (String(input).includes("/rpc/aplicar_operacao_capa")) {
          assert.equal(r.status, 200); await r.arrayBuffer(); throw new TypeError("Resposta perdida controlada");
        }
        return r;
      }},
    });
    check(await lost.auth.setSession({access_token: session.access_token, refresh_token: session.refresh_token}));
    const result = await lost.rpc("aplicar_operacao_capa", p);
    assert.ok(result.error); // Falha de transporte nao e sucesso nem rollback.
    const causal = await receipt(p.p_operacao_id);
    const responses = await Promise.all([a.rpc("aplicar_operacao_capa", p), a.rpc("aplicar_operacao_capa", p)]);
    for (const r of responses) assert.deepEqual(check(r), causal);
    assert.equal((await snapshot()).versao, causal.versao);
    assert.equal(causal.versao, String(Number(before.versao) + 1));
    assert.equal((await a.rpc("aplicar_operacao_capa", {...p, p_classificacao: "16+"})).error?.code, "PT409");
    assert.equal((await b.rpc("aplicar_operacao_capa", p)).error?.code, "42501", "outra sessao nao assume UUID antigo");
    // O cliente clonado usa a sessao de A: signOut(local) a revogaria no Auth,
    // nao apenas sua memoria. A fixture nao deve invalidar os cenarios seguintes.
  });
  await t.test("rollback, CHECK e timeout nao deixam alteracao/recibo parciais", async () => {
    const before = await snapshot(), p = params(before, randomUUID(), "16+");
    sql(`begin; ${context} ${callSql(p)} rollback;`);
    assert.deepEqual(await snapshot(), before);
    assert.equal((await receipt(p.p_operacao_id)).estado, "ausente");
    const invalid = params(before, randomUUID(), "Livre", null, ["terror"]);
    assert.equal((await a.rpc("aplicar_operacao_capa", invalid)).error?.code, "23514");
    assert.deepEqual(await snapshot(), before);
    assert.equal((await receipt(invalid.p_operacao_id)).estado, "ausente");
    const interrupted = params(before, randomUUID(), "10+");
    assert.throws(() => sql(`begin; set local statement_timeout='150ms'; ${context}
      ${callSql(interrupted)} select pg_sleep(1); commit;`), /statement timeout/);
    assert.deepEqual(await snapshot(), before);
    assert.equal((await receipt(interrupted.p_operacao_id)).estado, "ausente");
    check(await a.rpc("aplicar_operacao_capa", interrupted)); // Retry exato apos rollback.
  });
  await t.test("Data API legada, ABA e exclusao/recriacao invalidam a intencao antiga", async () => {
    const before = await snapshot(works[1]);
    check(await b.from("obras").update({capa_url: "https://example.invalid/cover.png"}).eq("id", works[1]));
    check(await b.from("obras").update({capa_url: ""}).eq("id", works[1]));
    assert.equal((await a.rpc("aplicar_operacao_capa", params(before))).error?.code, "PT409");
    const next = await snapshot(works[1]); assert.equal(next.publicaOuIncerta, true);
    assert.equal((await a.from("obras").update({classificacao_indicativa: "18+", avisos_conteudo: ["terror"]}).eq("id", works[1])).error?.code, "23514");
    check(await a.from("obras").delete().eq("id", works[1])); check(await a.from("obras").insert(insert(works[1])));
    const recreated = await snapshot(works[1]); assert.notEqual(recreated.geracao, next.geracao);
    assert.equal((await a.rpc("aplicar_operacao_capa", params(next))).error?.code, "PT409");
    check(await a.from("obras").delete().eq("id", works[1]));
    assert.equal((await a.from("obras").insert({...insert(works[1]), classificacao_indicativa: "18+", avisos_conteudo: ["terror"]})).error?.code, "23514", "recriacao nao limpa exposicao publica anterior");
    check(await a.from("obras").insert(insert(works[1])));
  });
  await t.test("escritor legado concorrente invalida CAS; snapshot antigo nao confirma", async st => {
    const before = await snapshot(works[1]);
    const hold = connection(`begin; update public.obras set capa_url='https://example.invalid/concurrent.png'
      where id='${works[1]}';\n\\echo LEGACY_LOCKED\n`, "LEGACY_LOCKED");
    releaseAfter(st, hold);
    await hold.ready;
    const pending = a.rpc("aplicar_operacao_capa", params(before)).then(r => r);
    pending.catch(() => {}); await blocked(1);
    hold.child.stdin.end("commit;\n"); await hold.exit;
    assert.equal((await pending).error?.code, "PT409");
    const next = await snapshot(works[1]);
    assert.equal(next.classificacao, before.classificacao);
    const oldSnapshot = connection(`begin isolation level repeatable read; ${context}
      select id from public.obras where id='${works[1]}';\n\\echo OLD_SNAPSHOT\n`, "OLD_SNAPSHOT");
    releaseAfter(st, oldSnapshot);
    await oldSnapshot.ready;
    check(await b.from("obras").update({capa_nome: "Nova versao"}).eq("id", works[1]));
    oldSnapshot.child.stdin.end(`${callSql(params(next))} commit;\n`);
    await assert.rejects(oldSnapshot.exit, /could not serialize access due to concurrent update/);
    assert.equal((await snapshot(works[1])).classificacao, before.classificacao);
  });
  await t.test("referencia interna imutavel, isolamento e escritores antigos sem bypass", async st => {
    const before = await snapshot(works[2]), asset = randomUUID();
    // Somente fixture SQL confiavel: nao e atestado fisico nem produtor habilitado.
    sql(`insert into historietas_privado.obra_capas_referencias(id,obra_id,geracao,autor_id,bucket,caminho)
      values('${asset}','${works[2]}','${before.geracao}','${author}','capas-obras-privadas','${author}/${before.geracao}/${asset}.webp');`);
    const applied = check(await a.rpc("aplicar_operacao_capa", params(before, randomUUID(), "12+", asset)));
    assert.equal(applied.capaPrivadaId, asset);
    const managed = await snapshot(works[2]);
    const hold = connection(`begin; ${context} ${callSql(params(managed, randomUUID(), "14+", asset))}
      \\echo PRIVATE_LOCKED\n`, "PRIVATE_LOCKED");
    releaseAfter(st, hold);
    await hold.ready;
    const legacyWrite = b.from("obras").update({capa_url: "https://example.invalid/late.png"}).eq("id", works[2]).then(r => r);
    const observe = connection(`do $$ declare deadline timestamptz:=clock_timestamp()+interval '8 seconds'; begin loop
      exit when exists(select 1 from pg_stat_activity where wait_event_type='Lock' and query ilike '%UPDATE%obras%');
      if clock_timestamp()>deadline then raise exception 'Escritor legado nao aguardou lock'; end if;
      perform pg_sleep(0.01); end loop; end $$;`);
    await observe.exit;
    hold.child.stdin.end("commit;\n"); await hold.exit;
    assert.equal((await legacyWrite).error?.code, "42501", "escrita atrasada nao passa depois do commit privado");
    assert.equal((await a.from("obras").update({capa_url: "https://example.invalid/bypass.png"}).eq("id", works[2])).error?.code, "42501");
    assert.equal((await a.from("obras").update({classificacao_indicativa: "16+", sinopse: "Nao salvar"}).eq("id", works[2])).error?.code, "42501");
    check(await a.from("obras").update({sinopse: "Compatibilidade"}).eq("id", works[2]));
    assert.equal((await snapshot(works[2])).versao, String(Number(applied.versao) + 1));
    assert.equal((await other.rpc("consultar_contrato_capa", {p_obra_id: works[2]})).error?.code, "42501");
    assert.equal((await a.rpc("aplicar_operacao_capa", params(await snapshot(works[3]), randomUUID(), "12+", asset))).error?.code, "42501");
    assert.equal((await a.rpc("aplicar_operacao_capa", params(await snapshot(works[2]), randomUUID(), "18+", asset, ["terror"]))).error?.code, "23514");
    const previousRevision = sql(`select revisao from historietas_privado.obra_projecao_revisoes where obra_id='${works[2]}';`);
    const removalParams = params(await snapshot(works[2]), randomUUID(), "14+");
    const removed = check(await a.rpc("aplicar_operacao_capa", removalParams));
    assert.equal(removed.capaPrivadaId, null);
    assert.equal(sql(`select revisao from historietas_privado.obra_projecao_revisoes where obra_id='${works[2]}';`), String(BigInt(previousRevision) + 1n), "mudanca somente da referencia invalida projecao publica");
    assert.deepEqual(check(await a.rpc("aplicar_operacao_capa", removalParams)), removed);
    assert.equal(sql(`select revisao from historietas_privado.obra_projecao_revisoes where obra_id='${works[2]}';`), String(BigInt(previousRevision) + 1n), "retry nao invalida outra vez");
    assert.equal((await a.from("obras").update({capa_url: "https://example.invalid/again.png"}).eq("id", works[2])).error?.code, "42501", "retirada nao reabre escritor legado");
    check(await a.from("obras").delete().eq("id", works[2]));
    assert.deepEqual(await receipt(applied.operacaoId), applied);
    check(await a.from("obras").insert(insert(works[2])));
    assert.equal((await snapshot(works[2])).capaPrivadaId, null);
  });
  await t.test("sessao que expira durante o UPDATE nao confirma alteracao ou recibo", async st => {
    const client = createClient(env.API_URL, key, opts);
    const expiring = check(await client.auth.signInWithPassword({email, password})).session;
    const sid = JSON.parse(Buffer.from(expiring.access_token.split(".")[1], "base64url")).session_id;
    const before = await snapshot(works[4]), p = params(before);
    // Barreira depois do UPDATE: o trigger publico espera este lock antes do
    // recibo. Esperar a data real de expiracao, nao um sleep arbitrario no JS.
    const hold = connection(`begin; select obra_id from historietas_privado.obra_projecao_revisoes
      where obra_id='${works[4]}' for update;\n\\echo REVISION_LOCKED\n`, "REVISION_LOCKED");
    releaseAfter(st, hold); await hold.ready;
    sql(`update auth.sessions set not_after=clock_timestamp()+interval '2 seconds' where id='${sid}';`);
    const pending = client.rpc("aplicar_operacao_capa", p).then(r => r);
    pending.catch(() => {}); await blocked(1);
    await connection(`do $$ declare deadline timestamptz:=clock_timestamp()+interval '8 seconds'; begin loop
      exit when exists(select 1 from auth.sessions where id='${sid}' and not_after<=clock_timestamp());
      if clock_timestamp()>deadline then raise exception 'Sessao da fixture nao expirou'; end if;
      perform pg_sleep(0.01); end loop; end $$;`).exit;
    hold.child.stdin.end("commit;\n"); await hold.exit;
    assert.equal((await pending).error?.message, "SESSAO_CAPA_INDISPONIVEL");
    assert.deepEqual(await snapshot(works[4]), before);
    assert.equal((await receipt(p.p_operacao_id)).estado, "ausente");
  });
  await t.test("termos revogados e logout bloqueiam operacoes mesmo com JWT ainda valido", async () => {
    const before = await snapshot(works[4]), p = params(before);
    sql(`update public.profiles set termos_uso_aceitos_em=null where user_id='${author}';`);
    assert.equal((await a.rpc("aplicar_operacao_capa", p)).error?.message, "ACEITE_TERMOS_PUBLICACAO_OBRIGATORIO");
    assert.equal((await receipt(p.p_operacao_id)).estado, "ausente");
    const stale = createClient(env.API_URL, key, opts);
    check(await stale.auth.setSession({access_token: sessionB.access_token, refresh_token: sessionB.refresh_token}));
    check(await b.auth.signOut({scope: "local"}));
    assert.equal((await stale.rpc("consultar_contrato_capa", {p_obra_id: works[4]})).error?.code, "42501");
    assert.deepEqual(await snapshot(works[4]), before);
    const anon = createClient(env.API_URL, key, opts);
    assert.equal((await anon.rpc("consultar_contrato_capa", {p_obra_id: works[4]})).error?.code, "42501");
    assert.equal((await admin.rpc("consultar_contrato_capa", {p_obra_id: works[4]})).error?.code, "42501");
  });
});
