import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import * as pagination from "../../lib/supabase/paginacao.mjs";

function load(path, mocks = {}) {
  const js = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", js)((name) => {
    if (name === "server-only") return {};
    if (name in mocks) return mocks[name];
    throw new Error(`Import não mockado: ${name}`);
  }, mod, mod.exports);
  return mod.exports;
}
const barrier = load("../../lib/cache/barreira-projecao-publica.ts");
const uuid = (n) => `d0300000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const chapter = (ordem) => ({ id: uuid(ordem), ordem, titulo: `Capítulo ${ordem}`,
  tipo_conteudo: "texto", criado_em: null, atualizado_em: null });
const initial = () => ({ estado: "obra_publica", obraId: uuid(9000), geracao: uuid(9001),
  revisao: "9007199254740993", slug: "obra", obra: { titulo: "Obra", sinopse: "", tags: [], capa: "https://example.test/capa.png" } });

function harness() {
  const cache = new Map(), calls = [], transport = [];
  const state = { projection: initial(), chapters: [chapter(2), chapter(7)], anexo: null, onRead: null, onPage: null, fail: false };
  const mocks = {
    "next/cache": { unstable_cache(fn, keys) { return async () => {
      const key = JSON.stringify(keys);
      if (!cache.has(key)) cache.set(key, await fn());
      return structuredClone(cache.get(key));
    }; } },
    "../server/agendamento/ler-projecao-publica": { lerProjecaoPublicaObra: async () => {
      calls.push("barreira"); await state.onRead?.(); return structuredClone(state.projection);
    } },
    "./barreira-projecao-publica": barrier,
    "./obra-publica-cache-tag": { tagObraPublica: (s) => `obra-${s}` },
    "../historietasAdultContent": { normalizarAvisosConteudo18: () => [] },
    "../utils": { idObraSupabaseValido: (v) => /^[0-9a-f-]{36}$/.test(v) },
    "../supabase/paginacao.mjs": pagination,
    "../supabase/public": { supabasePublicoConfigurado: true, criarSupabasePublicClient: (options) => ({ rpc: async (name, args) => {
      assert.equal(name, "listar_capitulos_leves_projecao_publica"); calls.push(args);
      const fetchOriginal = globalThis.fetch;
      try {
        globalThis.fetch = async (_url, init) => { transport.push(init); return new Response("{}"); };
        await options.fetch("http://localhost/rpc", { method: "POST" });
      } finally { globalThis.fetch = fetchOriginal; }
      if (state.fail) return { error: new Error("rede"), data: null };
      const p = state.projection;
      const data = { valida: args.p_geracao === p.geracao && args.p_revisao === p.revisao,
        obraId: p.obraId, geracao: p.geracao, revisao: p.revisao, slug: p.slug, anexo: structuredClone(state.anexo),
        capitulos: structuredClone(state.chapters.filter(c => args.p_depois_ordem === null || c.ordem > args.p_depois_ordem).slice(0, args.p_limite)) };
      await state.onPage?.(data, args);
      return { data, error: null };
    } }) },
  };
  return { state, calls, transport, cache, instance: () => load("../../lib/cache/obrasPublicas.ts", mocks).obterSnapshotObraPublica };
}

test("snapshot leve usa ordem canônica, whitelist e preserva remoções sem recorrer ao cache pessoal", async () => {
  const h = harness();
  Object.assign(h.state.projection.obra, { user_metadata: "privado", arquivo_url: "privado", comentarios: ["segredo"] });
  h.state.chapters[0].texto = "Texto completo que nunca deve chegar ao DTO";
  h.state.anexo = { nome: "Legado.pdf", tipo: "application/pdf", tamanho: 123, categoria: "documento", caminho: "privado", url: "https://storage/object/sign/token" };
  const result = await h.instance()("obra");
  assert.deepEqual(result.capitulos.map(c => c.href), ["/obra/obra/capitulo/2", "/obra/obra/capitulo/7"]);
  assert.deepEqual(result.capitulos.map(c => c.ordem), [2, 7]);
  assert.equal(result.obra.sinopse, ""); assert.deepEqual(result.obra.tags, []);
  assert.deepEqual(result.anexo, { nome: "Legado.pdf", tipo: "application/pdf", tamanho: 123, categoria: "documento" });
  const json = JSON.stringify(result);
  for (const forbidden of ["privado", "segredo", "Texto completo", "object/sign", "user_metadata", "arquivo_url"]) assert.ok(!json.includes(forbidden), forbidden);
  assert.equal(h.calls.filter(c => c === "barreira").length, 2);
  assert.ok(h.transport.every(t => t.method === "POST" && t.cache === "no-store"));
});

test("paginação keyset ultrapassa 500 capítulos, sem perda ou duplicação e sem renumerar lacunas", async () => {
  const h = harness(); h.state.chapters = Array.from({ length: 1201 }, (_, i) => chapter(i * 3 + 2));
  const result = await h.instance()("obra");
  assert.equal(result.capitulos.length, 1201); assert.equal(new Set(result.capitulos.map(c => c.id)).size, 1201);
  assert.equal(result.capitulos.at(-1).href, "/obra/obra/capitulo/3602");
  assert.deepEqual(h.calls.filter(c => c !== "barreira").map(c => c.p_depois_ordem), [null, 1499, 2999]);
});

test("cache hit confirma duas barreiras e não consulta a lista novamente; erro final não entrega cache antigo", async () => {
  const h = harness(), a = h.instance(), b = h.instance();
  await a("obra"); await b("obra");
  assert.equal(h.calls.filter(c => c !== "barreira").length, 1);
  let reads = 0; h.state.onRead = () => { if (++reads === 2) throw new Error("primário indisponível"); };
  await assert.rejects(a("obra"), /primário indisponível/);
  h.state.onRead = null; assert.ok(await b("obra"));
});

test("vazia legítima, ausência, publicação após vazio e reutilização do slug têm identidades distintas", async () => {
  const h = harness(), read = h.instance();
  h.state.chapters = []; assert.deepEqual((await read("obra")).capitulos, []);
  h.state.projection.revisao = "9007199254740994"; h.state.chapters = [chapter(7)];
  assert.equal((await read("obra")).capitulos[0].ordem, 7);
  const keys = h.cache.size; h.state.projection = { estado: "obra_indisponivel" };
  assert.equal(await read("obra"), null); assert.equal(h.cache.size, keys);
  h.state.projection = { ...initial(), obraId: uuid(9002), geracao: uuid(9003) };
  const recreated = await read("obra"); assert.equal(recreated.obraId, uuid(9002)); assert.equal(recreated.geracao, uuid(9003));
});

test("edição entre páginas rejeita a coleta antiga; retry usa nova revisão inteira", async () => {
  const h = harness(), read = h.instance(); h.state.chapters = Array.from({ length: 501 }, (_, i) => chapter(i + 1));
  let edited = false;
  h.state.onPage = (_data, args) => {
    if (args.p_depois_ordem === null && !edited) { edited = true; h.state.projection.revisao = "9007199254740994"; h.state.chapters[0].titulo = "Novo título"; }
  };
  const result = await read("obra"); assert.equal(result.revisao, "9007199254740994"); assert.equal(result.capitulos[0].titulo, "Novo título");
});

test("duas instâncias e escritor atrasado não entregam snapshot de revisão anterior", async () => {
  const h = harness(), a = h.instance(), b = h.instance();
  let release, entered, first = true;
  const gate = new Promise(r => { release = r; }), ready = new Promise(r => { entered = r; });
  h.state.onPage = async () => { if (first) { first = false; entered(); await gate; } };
  const delayed = a("obra"); await ready;
  try {
    h.state.projection.revisao = "9007199254740994"; h.state.chapters[0].titulo = "Revisão nova";
    assert.equal((await b("obra")).capitulos[0].titulo, "Revisão nova");
  } finally { release(); }
  const result = await delayed;
  assert.equal(result.revisao, "9007199254740994"); assert.equal(result.capitulos[0].titulo, "Revisão nova");
});

test("falha de página, resposta inválida e cursor repetido nunca viram lista vazia ou 404", async () => {
  const h = harness(), read = h.instance(); h.state.fail = true;
  await assert.rejects(read("obra"), /rede/);
  h.state.fail = false; h.state.onPage = data => { data.capitulos[0].ordem = 0; };
  await assert.rejects(read("obra"), /Capítulo leve inválido/);
  h.state.chapters = Array.from({ length: 500 }, (_, i) => chapter(i + 1));
  h.state.onPage = (data, args) => { if (args.p_depois_ordem) data.capitulos = [chapter(1)]; };
  await assert.rejects(read("obra"), /Cursor.*não avançou/);
  h.state.onPage = null; assert.equal((await read("obra")).capitulos.length, 500);
});

test("revisões obsoletas têm retry limitado; renomeação e despublicação não servem snapshot velho", async () => {
  const h = harness(), read = h.instance(); h.state.onPage = data => { data.valida = false; };
  await assert.rejects(read("obra"), barrier.ProjecaoPublicaAlterada);
  assert.equal(h.calls.filter(c => c !== "barreira").length, 3);
  h.state.onPage = null; await read("obra");
  h.state.projection = { estado: "obra_indisponivel" }; assert.equal(await read("obra"), null);
  h.state.projection = { ...initial(), slug: "renomeada", revisao: "9007199254740999" };
  assert.equal((await read("renomeada")).capitulos[0].href, "/obra/renomeada/capitulo/2");
});

test("capa assinada não entra no DTO; contratos SSR/cliente e assinador legados permanecem sem ativação parcial", async () => {
  const h = harness(); h.state.projection.obra.capa = "https://storage.test/storage/v1/object/sign/capas/capa.png?token=secreto";
  assert.equal((await h.instance()("obra")).obra.capa, "");
  const page = readFileSync(new URL("../../app/obra/[slug]/page.tsx", import.meta.url), "utf8");
  assert.match(page, /<ObraDinamicaClient\s*\/>/); assert.doesNotMatch(page, /obterSnapshotObraPublica/);
  const client = readFileSync(new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url), "utf8");
  assert.match(client, /useObraPublicWorkLoad\(/); assert.doesNotMatch(client, /obterSnapshotObraPublica/);
});
