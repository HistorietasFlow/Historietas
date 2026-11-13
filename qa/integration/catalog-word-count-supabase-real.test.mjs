import assert from "node:assert/strict";
import "./catalog-word-count-client-supabase-real.test.mjs";
import test from "node:test";
import { readFileSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { criarInvocacaoStatusSupabase } from "../scripts/supabase-cli-invocation.mjs";
import { loadApplicationModule } from "../helpers/load-application-module.mjs";

const check = result => { assert.equal(result.error, null, result.error?.message); return result.data; };
const quote = value => `'${String(value).replaceAll("'", "''")}'`;
const { contarPalavras: countJS } = loadApplicationModule("app/publicar/lib/publicar-text-utils.ts");
const signature = "text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text,numeric,text,text,text,numeric,numeric";

test("palavras: contratos reais, Data API, concorrencia e backfill somente local", async t => {
  const inv = criarInvocacaoStatusSupabase();
  const output = execFileSync(inv.comando, inv.argumentos, { encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  const env = Object.fromEntries(output.split(/\r?\n/).filter(s => /^[A-Z0-9_]+=/.test(s)).map(line => {
    const i = line.indexOf("="), value = line.slice(i + 1).trim();
    return [line.slice(0, i), value.startsWith('"') ? JSON.parse(value) : value];
  }));
  for (const value of [env.API_URL, env.DB_URL]) assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(new URL(value).hostname), "Somente Supabase local");
  const containers = execFileSync("docker", ["ps", "--filter", `publish=${new URL(env.DB_URL).port}`, "--format", "{{.Names}}"], { encoding: "utf8", windowsHide: true }).trim().split(/\r?\n/);
  assert.equal(containers.length, 1); assert.match(containers[0], /^supabase_db_/);
  const args = ["exec", "-i", containers[0], "psql", "-U", "postgres", "-d", "postgres", "-XqAt", "-v", "ON_ERROR_STOP=1"];
  const sql = text => execFileSync("docker", args, { input: text, encoding: "utf8", windowsHide: true, stdio: ["pipe", "pipe", "pipe"] }).trim();
  const writers = [];
  function writer(text) {
    const child = spawn("docker", args, { windowsHide: true });
    let stdout = "", stderr = "";
    const exit = new Promise((resolve, reject) => {
      child.on("error", reject);
      child.on("exit", code => code === 0 ? resolve() : reject(new Error(`SQL writer failed: ${stderr}`)));
    });
    const markers = new Map();
    child.stdout.on("data", data => { stdout += data; for (const [marker, resolve] of markers) if (stdout.includes(marker)) { markers.delete(marker); resolve(); } });
    child.stderr.on("data", data => { stderr += data; });
    const result = { child, exit, mark: marker => stdout.includes(marker) ? Promise.resolve() : Promise.race([
      new Promise(resolve => markers.set(marker, resolve)),
      exit.then(() => { if (!stdout.includes(marker)) throw new Error("SQL writer encerrou antes da barreira"); }),
    ]), end: text => child.stdin.end(text) };
    writers.push(result); child.stdin.write(text); return result;
  }
  const ids = { author: randomUUID(), third: randomUUID(), work: randomUUID(), chapter: randomUUID() };
  const works = Array.from({ length: 70 }, () => randomUUID());
  const tag = `qa-palavras-${randomBytes(6).toString("hex")}`;
  t.after(async () => {
    for (const w of writers) if (w.child.exitCode === null) { w.end("rollback;\n"); await w.exit; }
    sql(`begin; delete from public.obras where id in (${[ids.work, ...works].map(quote).join(",")}); delete from auth.users where id in (${quote(ids.author)},${quote(ids.third)}); commit;`);
  });

  await t.test("upgrade sem backfill, rewrite, perda de dados ou mudanca das seis RPCs", () => {
    const source = readFileSync(new URL("../../supabase/migrations/20261113053819_contar_palavras_catalogo.sql", import.meta.url), "utf8");
    const body = source.replace(/^begin;\s*/, "").replace(/commit;\s*$/, "");
    sql(`begin;
      drop function public.listar_obras_catalogo(${signature});
      drop function historietas_privado.preencher_palavras_capitulos(integer);
      drop trigger capitulos_palavras_contadas on public.capitulos;
      drop function historietas_privado.definir_palavras_capitulo();
      alter table public.capitulos drop column palavras_contadas;
      insert into auth.users(id) values (${quote(ids.author)});
      insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,slug)
        values (${quote(ids.work)},${quote(ids.author)},'Legado','QA','Fantasia','Conto', 'Livre',${quote(tag)});
      insert into public.capitulos(id,obra_id,user_id,titulo,texto,publicado) values
        (${quote(ids.chapter)},${quote(ids.work)},${quote(ids.author)},'Legado','corpo original',false);
      create temp table qa_before as select id,to_jsonb(c) dados,xmin::text tx from public.capitulos c;
      create temp table qa_rpc_before as select oid,pg_get_functiondef(oid) def,proacl from pg_proc where pronamespace='public'::regnamespace and proname='listar_obras_catalogo';
      create temp table qa_node_before as select pg_relation_filenode('public.capitulos') node;
      set constraints all immediate;
      ${body}
      do $$begin
        if exists(select 1 from public.capitulos where palavras_contadas is not null) then raise exception 'Backfill na migration'; end if;
        if exists(select 1 from public.capitulos c join qa_before b using(id) where to_jsonb(c)-'palavras_contadas' is distinct from b.dados or c.xmin::text<>b.tx) then raise exception 'Tuplas alteradas'; end if;
        if pg_relation_filenode('public.capitulos')<>(select node from qa_node_before) then raise exception 'Rewrite'; end if;
        if exists(select 1 from pg_proc p join qa_rpc_before b on p.oid=b.oid where pg_get_functiondef(p.oid)<>b.def or p.proacl is distinct from b.proacl) then raise exception 'RPC legada alterada'; end if;
        update public.capitulos set titulo='Metadado' where id=${quote(ids.chapter)};
        if (select palavras_contadas is not null from public.capitulos where id=${quote(ids.chapter)}) then raise exception 'Metadado inventou medicao'; end if;
      end $$;
      rollback;`);
  });

  const opts = { auth: { persistSession: false, autoRefreshToken: false } };
  const key = env.PUBLISHABLE_KEY || env.ANON_KEY;
  const admin = createClient(env.API_URL, env.SERVICE_ROLE_KEY, opts);
  const anon = createClient(env.API_URL, key, opts), author = createClient(env.API_URL, key, opts), third = createClient(env.API_URL, key, opts);
  for (const [id, client] of [[ids.author, author], [ids.third, third]]) {
    const password = randomBytes(24).toString("base64url"), email = `qa-palavras-${id}@historietas.test`;
    check(await admin.auth.admin.createUser({ id, email, password, email_confirm: true }));
    check(await client.auth.signInWithPassword({ email, password }));
  }
  sql(`insert into public.profiles(id,user_id,nome,tipo) values (${quote(ids.author)},${quote(ids.author)},'QA palavras','autor'),(${quote(ids.third)},${quote(ids.third)},'QA terceiro','autor');`);
  check(await author.rpc("aceitar_termos_publicacao", { p_termos_versao: "2026-08-05", p_diretrizes_versao: "2026-08-05", p_politica_versao: "2026-08-05" }));
  check(await author.from("obras").insert({ id: ids.work, user_id: ids.author, titulo: "QA palavras", autor: "QA", genero: "Fantasia", formato: "HQ", classificacao_indicativa: "Livre", publicado: false, slug: tag }));
  check(await author.from("capitulos").insert({ id: ids.chapter, obra_id: ids.work, user_id: ids.author, titulo: "Nao contar titulo", texto: "texto inicial", publicado: false, palavras_contadas: 987 }));

  await t.test("SQL/JS equivalentes, inclusive Unicode, literalidade e tentativas de falsificacao", async () => {
    const separators = [...Array.from({ length: 5 }, (_, i) => 9 + i), 32, 160, 5760, ...Array.from({ length: 11 }, (_, i) => 8192 + i), 8232, 8233, 8239, 8287, 12288, 65279];
    const cases = ["", " ", "café cafe\u0301 123", "guarda-chuva d’água d'agua", "! 😀", "<script>alert(1)</script> **literal**", "中文没有空格", "um\u200bdois", "um\u0085dois", ...separators.flatMap(n => [String.fromCodePoint(n), `um${String.fromCodePoint(n)}dois`])];
    for (const texto of cases) {
      const data = check(await author.from("capitulos").update({ texto, palavras_contadas: 999 }).eq("id", ids.chapter).select("texto,palavras_contadas").single());
      assert.equal(data.texto, texto); assert.equal(Number(data.palavras_contadas), countJS(data.texto));
    }
    check(await author.from("capitulos").update({ palavras_contadas: null }).eq("id", ids.chapter));
    assert.equal(Number(check(await author.from("capitulos").select("palavras_contadas").eq("id", ids.chapter).single()).palavras_contadas), 2);
    assert.deepEqual(check(await third.from("capitulos").update({ palavras_contadas: 77 }).eq("id", ids.chapter).select("id")), []);
    assert.deepEqual(check(await anon.from("capitulos").select("id,palavras_contadas").eq("id", ids.chapter)), []);
  });

  const params = (extra = {}) => ({ p_busca: "", p_genero: "", p_formato: "", p_classificacao: "", p_filtro_capitulos: "todos", p_ordenacao: "mais-recentes", p_limite: 7, p_cursor_valor: null, p_cursor_data: null, p_cursor_id: null, p_tag: tag, p_nota_minima: null, p_tag_excluida: "", p_genero_excluido: "", p_status_editorial: "", p_palavras_minimas: null, p_palavras_maximas: null, ...extra });
  sql(`begin; ${works.map((id, i) => `insert into public.obras(id,user_id,titulo,autor,genero,formato,classificacao_indicativa,publicado,slug,tags,status_editorial,criada_em)
    values (${quote(id)},${quote(ids.author)},'QA palavras ${i}','QA','Fantasia','HQ','Livre',true,${quote(`${tag}-${i}`)},array[${quote(tag)}],'concluida','2036-01-01'::timestamptz+${i}*interval '1 day');
    insert into public.capitulos(obra_id,user_id,titulo,texto,publicado) values (${quote(id)},${quote(ids.author)},'Titulo',${quote(i === 0 ? "um dois tres quatro cinco" : "duas palavras")},true);`).join("\n")} commit;`);

  await t.test("Data API rejeita entradas invalidas, preserva seis assinaturas e pagina alem da amostra", async () => {
    const p = params();
    const newest = check(await anon.rpc("listar_obras_catalogo", p));
    assert.equal(newest.length, 7); assert.equal(newest.some(r => r.obra_id === works[0]), false);
    const target = check(await anon.rpc("listar_obras_catalogo", params({ p_palavras_minimas: 5, p_palavras_maximas: 5, p_genero: "Fantasia", p_formato: "HQ", p_status_editorial: "concluida" })));
    assert.deepEqual(target.map(r => r.obra_id), [works[0]]);
    for (const bad of [-1, 1.5, "9007199254740992", "NaN", "Infinity"]) {
      const result = await anon.rpc("listar_obras_catalogo", params({ p_palavras_minimas: bad }));
      assert.equal(result.error?.code, "22023"); assert.equal(result.data, null);
    }
    assert.equal((await anon.rpc("listar_obras_catalogo", params({ p_palavras_minimas: 4, p_palavras_maximas: 3 }))).error?.code, "22023");
    // Todas as sobrecargas anteriores continuam chamadas reais pela Data API.
    for (const length of [10, 11, 12, 13, 14, 15]) {
      const entries = Object.entries(p).slice(0, length);
      const legacy = check(await anon.rpc("listar_obras_catalogo", Object.fromEntries(entries)));
      if (length >= 11) assert.deepEqual(legacy, newest);
      else assert.ok(legacy.length > 0);
    }
    const seen = [], query = params({ p_palavras_minimas: 2, p_palavras_maximas: 2 });
    for (;;) {
      const rows = check(await anon.rpc("listar_obras_catalogo", query));
      seen.push(...rows.map(r => r.obra_id));
      if (!rows.at(-1)?.tem_mais) break;
      const last = rows.at(-1); Object.assign(query, { p_cursor_valor: last.cursor_valor, p_cursor_data: last.cursor_data, p_cursor_id: last.cursor_id });
      assert.ok(seen.length <= works.length, "Cursor nao pode entrar em loop");
    }
    assert.equal(new Set(seen).size, 69); assert.equal(seen.length, 69);
    assert.deepEqual(new Set(seen), new Set(works.slice(1)));
  });

  const legacy = () => sql(`begin; set constraints all immediate; alter table public.capitulos disable trigger capitulos_palavras_contadas; update public.capitulos set palavras_contadas=null where id=${quote(ids.chapter)}; alter table public.capitulos enable trigger capitulos_palavras_contadas; commit;`);
  await t.test("backfill SKIP LOCKED nao compete com edicao; rollback e resposta perdida sao recuperaveis", async () => {
    legacy();
    const editing = writer(`begin; update public.capitulos set texto='agora cinco palavras neste corpo' where id=${quote(ids.chapter)}; select 'editing-ready';\n`);
    await editing.mark("editing-ready");
    assert.equal(sql("select count(*) from historietas_privado.preencher_palavras_capitulos(25);"), "0");
    editing.end("commit;\n"); await editing.exit;
    assert.equal(sql(`select palavras_contadas from public.capitulos where id=${quote(ids.chapter)};`), "5");
    legacy();
    const filling = writer("begin; select count(*) from historietas_privado.preencher_palavras_capitulos(25); select 'filling-ready';\n");
    await filling.mark("filling-ready");
    assert.equal(sql("select count(*) from historietas_privado.preencher_palavras_capitulos(25);"), "0", "segundo backfill nao reivindica linha bloqueada");
    // Timeout intencional de lock, nao aumento de espera do teste: a edicao
    // deve abortar sem persistir bytes enquanto o preenchimento detem a linha.
    const blocked = writer(`begin; set local lock_timeout='100ms'; update public.capitulos set texto='nao deve persistir' where id=${quote(ids.chapter)};\n`);
    blocked.child.stdin.end();
    await assert.rejects(blocked.exit, /lock timeout/);
    filling.end("rollback;\n"); await filling.exit;
    assert.equal(sql(`select palavras_contadas is null from public.capitulos where id=${quote(ids.chapter)};`), "t");
    sql("select count(*) from historietas_privado.preencher_palavras_capitulos(25);"); // resultado deliberadamente nao usado, como resposta perdida apos commit
    assert.equal(sql("select count(*) from historietas_privado.preencher_palavras_capitulos(25);"), "0");
    check(await author.from("capitulos").update({ texto: "edicao posterior" }).eq("id", ids.chapter));
    assert.equal(sql(`select palavras_contadas from public.capitulos where id=${quote(ids.chapter)};`), "2");
  });

  await t.test("backfill conserva revisao em rollback e nao repete revisao apos commit", () => {
    const id = works[1];
    sql(`begin; set constraints all immediate; alter table public.capitulos disable trigger capitulos_palavras_contadas;
      update public.capitulos set palavras_contadas=null where obra_id=${quote(id)};
      alter table public.capitulos enable trigger capitulos_palavras_contadas; commit;`);
    const revision = () => BigInt(sql(`select revisao from historietas_privado.obra_projecao_revisoes where obra_id=${quote(id)};`));
    const before = revision();
    sql("begin; select count(*) from historietas_privado.preencher_palavras_capitulos(25); rollback;");
    assert.equal(revision(), before);
    sql("select count(*) from historietas_privado.preencher_palavras_capitulos(25);");
    assert.equal(revision(), before + 1n);
    sql("select count(*) from historietas_privado.preencher_palavras_capitulos(25);");
    assert.equal(revision(), before + 1n);
  });

  await t.test("planos e custo local de lotes 1/10/25, sem extrapolar capacidade fisica", () => {
    const samples = [];
    for (const words of [20, 115000]) for (const size of [1, 10, 25]) {
      const sample = sql(`begin;
        set constraints all immediate;
        alter table public.capitulos disable trigger capitulos_palavras_contadas;
        update public.capitulos set texto=repeat('palavra ',${words}),palavras_contadas=null where obra_id in (${works.slice(0, size).map(quote).join(",")});
        alter table public.capitulos enable trigger capitulos_palavras_contadas;
        create temp table lsn_before as select pg_current_wal_insert_lsn() lsn;
        explain (analyze,buffers,wal,format json) select * from historietas_privado.preencher_palavras_capitulos(${size});
        select json_build_object('wal',pg_wal_lsn_diff(pg_current_wal_insert_lsn(),lsn),'linhas',${size},'bytes_texto',${size}*${words}*8) from lsn_before;
        rollback;`);
      const end = sample.lastIndexOf('\n{');
      const plan = JSON.parse(sample.slice(0, end)), stats = JSON.parse(sample.slice(end + 1));
      assert.equal(plan[0].Plan["Actual Rows"], size);
      samples.push({ ...stats, executionMs: plan[0]["Execution Time"] });
    }
    console.log(`Medicoes locais de backfill (WAL do intervalo, nao disco livre): ${JSON.stringify(samples)}`);
    const plan = sql(`begin; set local role anon; explain (analyze,buffers,wal,format json) select * from public.listar_obras_catalogo('','','','','todos','mais-recentes',7,null,null,null,${quote(tag)},null,'','','',2,2); rollback;`);
    assert.equal(JSON.parse(plan)[0].Plan["Actual Rows"], 7);
    assert.match(sql(`select prosrc from pg_proc where oid='public.listar_obras_catalogo(${signature})'::regprocedure`), /sum\(capitulo\.palavras_contadas\)/);
  });
});
