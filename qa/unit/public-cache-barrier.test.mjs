import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import test from "node:test";
import ts from "typescript";

const nativeRequire = createRequire(import.meta.url);
function load(path, mocks = {}) {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", code)((id) => {
    if (id === "server-only") return {};
    if (id in mocks) return mocks[id];
    if (id.startsWith("node:")) return nativeRequire(id);
    throw new Error(`Import inesperado ${id}`);
  }, mod, mod.exports);
  return mod.exports;
}
const barrier = load("../../lib/cache/barreira-projecao-publica.ts");
const id = "c0200000-0000-4000-8000-000000000001";
const initial = () => ({ estado: "obra_publica", obraId: id, geracao: id, revisao: "1", slug: "obra",
  obra: { titulo: "Obra", autorId: id, classificacaoIndicativa: "Livre" }, capitulo: null });
const chapter = (ordem = 1) => ({ id: id.replace(/1$/, String(ordem)), titulo: `Capítulo ${ordem}`, texto: "Texto atual", ordem, publicado: true });
const deferred = () => { let resolve; const promise = new Promise((r) => { resolve = r; }); return { promise, resolve }; };

function harness() {
  const cache = new Map(), calls = [];
  const state = { projection: initial(), chapters: [chapter()], onRead: null, onPage: null };
  const cacheMock = { unstable_cache(fn, keys) { return async () => {
    const key = JSON.stringify(keys);
    if (!cache.has(key)) cache.set(key, await fn());
    return structuredClone(cache.get(key));
  }; } };
  const mocks = {
    "next/cache": cacheMock,
    "../server/agendamento/ler-projecao-publica": { lerProjecaoPublicaObra: async () => {
      calls.push("barreira"); await state.onRead?.(); return structuredClone(state.projection);
    } },
    "./barreira-projecao-publica": barrier,
    "./obra-publica-cache-tag": { tagObraPublica: (s) => `tag-${s}` },
    "../historietasAdultContent": { normalizarAvisosConteudo18: () => [] },
    "../utils": { idObraSupabaseValido: (s) => typeof s === "string" && s.length === 36 },
    "../supabase/paginacao.mjs": { carregarTodasPaginasSupabase: async ({ buscarPagina }) => {
      const rows = [];
      for (let i = 0; i < 4; i++) {
        const r = await buscarPagina(i * 500, i * 500 + 499); rows.push(...r.data);
        if (r.data.length < 500) return rows;
      }
      throw new Error("paginação sem fim");
    } },
    "../supabase/public": { supabasePublicoConfigurado: true, criarSupabasePublicClient: () => ({ rpc: async (name, args) => {
      calls.push(name);
      const result = { data: { valida: args.p_geracao === state.projection.geracao && args.p_revisao === state.projection.revisao,
        link: "/obra/obra", capitulos: structuredClone(state.chapters.slice(args.p_inicio, args.p_inicio + args.p_limite)) }, error: null };
      await state.onPage?.(); return result;
    } }) },
  };
  return { state, cache, calls, instance: () => load("../../lib/cache/obrasPublicas.ts", mocks), cacheMock };
}

test("cache positivo/negativo e geracoes: leitura nova nao depende do flush", async () => {
  const h = harness(), a = h.instance(), b = h.instance();
  assert.equal(await a.obterLeituraCapituloPublico("obra", 2), null);
  h.state.chapters.push(chapter(2)); h.state.projection.revisao = "2";
  assert.equal((await b.obterLeituraCapituloPublico("obra", 2)).capituloId, chapter(2).id);
  const pages = h.calls.filter((c) => c !== "barreira").length;
  await a.obterLeituraCapituloPublico("obra", 2);
  assert.equal(h.calls.filter((c) => c !== "barreira").length, pages);
  assert.equal(h.calls.slice(-2).join(","), "barreira,barreira");
  h.state.projection = { estado: "obra_indisponivel" };
  assert.equal(await a.obterLeituraCapituloPublico("obra", 2), null);
  h.state.projection = { ...initial(), geracao: chapter(2).id, revisao: "3", obra: { titulo: "Recriada" } };
  assert.equal((await a.obterObraMetadataPublica("obra")).titulo, "Recriada");
  h.state.projection = { estado: "obra_indisponivel" };
  assert.equal(await a.obterObraMetadataPublica("desconhecida"), null);
  h.state.projection = initial();
  assert.equal((await a.obterObraMetadataPublica("obra")).titulo, "Obra");
});

test("escritor de cache atrasado e duas instancias nao restituem revisao antiga", async () => {
  const h = harness(), entered = deferred(), release = deferred();
  h.state.onPage = async () => { h.state.onPage = null; entered.resolve(); await release.promise; };
  const oldRead = h.instance().obterLeituraCapituloPublico("obra", 1);
  await entered.promise;
  h.state.projection.revisao = "2"; h.state.chapters[0].texto = "Texto revisao 2";
  assert.equal((await h.instance().obterLeituraCapituloPublico("obra", 1)).obra.capitulos[0].texto, "Texto revisao 2");
  release.resolve();
  assert.equal((await oldRead).obra.capitulos[0].texto, "Texto revisao 2");
  assert.equal(h.cache.size, 2); // O antigo pode existir, mas nunca e reutilizado.
});

test("falha da barreira final nao serve cache, nao vira null/404; retry posterior funciona", async () => {
  const h = harness(), loader = h.instance();
  await loader.obterLeituraCapituloPublico("obra", 1);
  let reads = 0;
  h.state.onRead = () => { if (++reads === 2) throw new Error("primario indisponivel"); };
  await assert.rejects(loader.obterLeituraCapituloPublico("obra", 1), /primario indisponivel/);
  h.state.onRead = null;
  assert.equal((await loader.obterLeituraCapituloPublico("obra", 1)).numeroCapitulo, 1);
});

test("lista do leitor ultrapassa uma pagina sem misturar revisoes", async () => {
  const h = harness();
  h.state.chapters = Array.from({ length: 501 }, (_, i) => ({ ...chapter(),
    id: `c0300000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`, ordem: i + 1 }));
  const data = await h.instance().obterLeituraCapituloPublico("obra", 501);
  assert.equal(data.obra.capitulos.length, 501); assert.equal(data.numeroCapitulo, 501);
  assert.equal(h.calls.filter((c) => c === "listar_capitulos_projecao_publica").length, 2);
});

test("pagina obsoleta e rejeitada; mutacao continua tem limite, sem loop/fallback antigo", async () => {
  const h = harness(); let page = true;
  h.state.onRead = () => { if (page) { h.state.projection.revisao = String(Number(h.state.projection.revisao) + 1); page = false; } };
  h.state.onPage = () => { h.state.projection.revisao = String(Number(h.state.projection.revisao) + 1); };
  await assert.rejects(h.instance().obterLeituraCapituloPublico("obra", 1), barrier.ProjecaoPublicaAlterada);
  assert.equal(h.calls.filter((c) => c === "listar_capitulos_projecao_publica").length, 3);
});

test("sitemap confirma manifesto paginado antes/depois e nao serve lista antiga em falha", async () => {
  const h = harness(); let version = "1", fail = false, count = 0, changeDuringRead = false;
  const work = () => ({ id, slug: "obra", geracao: id, revisao: version, atualizado_em: null, publicado: true, classificacao_indicativa: "Livre" });
  const mocks = { "next/cache": h.cacheMock, "./barreira-projecao-publica": barrier,
    "../supabase/public": { criarSupabasePublicClient: () => ({ rpc: async (name) => {
      if (fail) return { error: new Error("rede"), data: null };
      if (name === "obter_revisao_sitemap_publico") return { data: createHash("sha256").update(`${id}:${id}:${version}`).digest("hex"), error: null };
      if (name === "listar_revisoes_sitemap_publico") return { data: [work()], error: null };
      count++;
      const data = [{ id, obra_id: id, ordem: Number(version), publicado: true, geracao: id, revisao: version }];
      if (changeDuringRead) { changeDuringRead = false; version = String(Number(version) + 1); }
      return { data, error: null };
    } }) } };
  const a = load("../../lib/cache/sitemap-projecao-publica.ts", mocks), b = load("../../lib/cache/sitemap-projecao-publica.ts", mocks);
  assert.equal((await a.obterConteudoSitemapPublico()).capitulos[0].ordem, 1);
  await b.obterConteudoSitemapPublico(); assert.equal(count, 1);
  version = "2";
  assert.equal((await b.obterConteudoSitemapPublico()).capitulos[0].ordem, 2);
  fail = true; await assert.rejects(a.obterConteudoSitemapPublico(), /rede/);
  fail = false; version = "3"; changeDuringRead = true;
  assert.equal((await a.obterConteudoSitemapPublico()).capitulos[0].ordem, 4);
  assert.equal(count, 4); // Leitura mista 3 descartada, seguida da revisao 4.
});

test("sitemap pagina manifesto e capitulos sem N+1 e valida o cursor", async () => {
  const rows = Array.from({ length: 501 }, (_, i) => ({ id: `c0200000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    slug: `obra-${i}`, geracao: id, revisao: "1", publicado: true, classificacao_indicativa: "Livre" }));
  const fingerprint = createHash("sha256").update(rows.map((r) => `${r.id}:${r.geracao}:${r.revisao}`).join("\n")).digest("hex");
  const calls = [], h = harness(); let invalidCursor = false;
  const mocks = { "next/cache": h.cacheMock, "./barreira-projecao-publica": barrier,
    "../supabase/public": { criarSupabasePublicClient: () => ({ rpc: async (name, args) => {
      calls.push(name);
      if (name === "obter_revisao_sitemap_publico") return { data: fingerprint, error: null };
      if (name === "listar_revisoes_sitemap_publico") return { data: args.p_depois_id ? rows.slice(500) : rows.slice(0, 500), error: null };
      const data = args.p_depois_id ? [] : rows.slice(0, 500).map((r) => ({ id: r.id, obra_id: r.id, ordem: 1, geracao: id, revisao: "1" }));
      return { data: invalidCursor ? [{ ...data[0], id: null }] : data, error: null };
    } }) } };
  const loader = load("../../lib/cache/sitemap-projecao-publica.ts", mocks);
  assert.equal((await loader.obterConteudoSitemapPublico()).obras.length, 501);
  assert.equal(calls.filter((c) => c === "listar_revisoes_sitemap_publico").length, 2);
  assert.equal(calls.filter((c) => c === "listar_capitulos_sitemap_publico").length, 2);
  h.cache.clear(); invalidCursor = true;
  await assert.rejects(loader.obterConteudoSitemapPublico(), /Cursor público inválido/);
});

test("sitemap explicito preserva XML e nao permite cache de resposta pular barreira", async () => {
  const xml = load("../../app/lib/sitemap-public-xml.ts");
  const serialized = xml.serializarSitemapPublico([{ url: 'https://site.test/obra/a?x=1&y=<x>"\'',
    lastModified: new Date("2026-11-08Z"), changeFrequency: "weekly", priority: 0.7 }]);
  assert.ok(serialized.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(serialized.includes("&amp;y=&lt;x&gt;&quot;&apos;"));
  assert.ok(serialized.includes("<lastmod>2026-11-08T00:00:00.000Z</lastmod>"));
  let calls = 0, fail = false;
  const route = load("../../app/sitemap.xml/route.ts", {
    "../lib/sitemap-public-content-utils": { criarRotasConteudoPublicoSitemap: () => ({ rotasObras: [], rotasCapitulos: [] }) },
    "../lib/sitemap-public-xml": xml,
    "../../lib/cache/sitemap-projecao-publica": { obterConteudoSitemapPublico: async () => {
      calls++; if (fail) throw new Error("banco"); return { obras: [], capitulos: [] };
    } },
    "../../lib/historietasAdultContent": { ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO: true, ehClassificacao18: () => false },
    "../../lib/seo": { SITE_URL: "https://site.test" },
  });
  for (let i = 0; i < 2; i++) {
    const response = await route.GET();
    assert.equal(response.status, 200);
    for (const header of ["cache-control", "cdn-cache-control", "vercel-cdn-cache-control"]) assert.ok(response.headers.get(header).includes("no-store"));
    assert.match(await response.text(), /<loc>https:\/\/site\.test\/explorar<\/loc>/);
  }
  assert.equal(calls, 2);
  fail = true; await assert.rejects(route.GET(), /banco/);
});
