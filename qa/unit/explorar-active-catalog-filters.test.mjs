import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import typescript from "typescript";

const sourceUrl = new URL("../../app/explorar/components/explorar-active-catalog-filters.tsx", import.meta.url);
const source = readFileSync(sourceUrl, "utf8");
const cache = new Map();
let grupo = null;
function carregar(url) {
  if (cache.has(url.href)) return cache.get(url.href);
  const exports = {};
  cache.set(url.href, exports);
  const js = typescript.transpileModule(readFileSync(url, "utf8"), {
    compilerOptions: { module: typescript.ModuleKind.CommonJS, target: typescript.ScriptTarget.ES2022, jsx: typescript.JsxEmit.React },
  }).outputText;
  new Function("require", "exports", "React", js)(nome => {
    if (nome === "react") return { useRef: () => ({ current: grupo }) };
    assert.ok(nome.startsWith("."), nome);
    const destino = [".ts", ".tsx"].map(ext => new URL(nome + ext, url)).find(existsSync);
    assert.ok(destino, nome);
    return carregar(destino);
  }, exports, React);
  return exports;
}
const { ExplorarActiveCatalogFilters } = carregar(sourceUrl);
const padrao = {
  language: "pt-BR", modoConteudo: "obras", filtroFormato: "todos", filtroTag: "",
  tagExcluida: "", generoExcluido: "", notaMinima: null,
};
function montar(opcoes = {}) {
  const chamadas = [];
  const handlers = Object.fromEntries(["Formato", "Tag", "TagExcluida", "GeneroExcluido", "NotaMinima"].map(nome =>
    [`onSelecionar${nome}`, valor => chamadas.push([nome, valor])]));
  const tree = ExplorarActiveCatalogFilters({ ...padrao, ...opcoes, ...handlers, onFocarFiltros: () => chamadas.push(["foco"]) });
  const botoes = tree ? React.Children.toArray(tree.props.children).filter(child => child.type === "button") : [];
  return { tree, botoes, chamadas, html: tree ? renderToStaticMarkup(tree) : "" };
}
const todos = { filtroFormato: "HQ", filtroTag: "  AVENTÚRA  ", tagExcluida: "terror", generoExcluido: "sci-fi", notaMinima: 4.5 };

test("não renderiza neutros, valores inválidos ou novas opções fora do escopo", () => {
  assert.equal(montar().tree, null);
  assert.equal(montar({ filtroFormato: "inexistente", filtroTag: " \n ", tagExcluida: " ", generoExcluido: "Melodrama", notaMinima: 9 }).tree, null);
});

test("cada indicador isolado identifica o filtro e remove só ele com seu valor neutro", () => {
  for (const [props, texto, handler, neutro] of [
    [{ filtroFormato: " hq " }, "Formato: HQ", "Formato", "todos"],
    [{ filtroTag: " AVENTÚRA " }, "Tag: aventura", "Tag", ""],
    [{ tagExcluida: " AVENTÚRA " }, "Excluir tag: aventura", "TagExcluida", ""],
    [{ generoExcluido: "sci-fi" }, "Excluir gênero: Ficção", "GeneroExcluido", ""],
    [{ notaMinima: 0.5 }, "Avaliação mínima: 0.5", "NotaMinima", ""],
  ]) {
    const { botoes, chamadas } = montar(props);
    assert.equal(botoes.length, 1);
    assert.equal(botoes[0].props["aria-label"], `Remover filtro: ${texto}`);
    botoes[0].props.onClick({ currentTarget: {} });
    assert.deepEqual(chamadas, [["foco"], [handler, neutro]]);
  }
});

test("combina cinco filtros; Autores mantém apenas formato e tag incluída", () => {
  assert.equal(montar(todos).botoes.length, 5);
  const { botoes } = montar({ ...todos, modoConteudo: "autores" });
  assert.deepEqual(botoes.map(b => b.props["aria-label"]), ["Remover filtro: Formato: HQ", "Remover filtro: Tag: aventura"]);
});

test("traduções de controles e vocabulário não traduzem tags; conteúdo longo é escapado", () => {
  for (const [language, prefixo, genero, tag] of [
    ["pt-BR", "Remover filtro", "Ficção", "Tag"], ["en", "Remove filter", "Fiction", "Tag"], ["es", "Quitar filtro", "Ficción", "Etiqueta"],
  ]) {
    const { botoes } = montar({ ...todos, language });
    assert.ok(botoes.every(b => b.props["aria-label"].startsWith(prefixo)));
    assert.ok(botoes.some(b => b.props["aria-label"].endsWith(genero)));
    assert.ok(botoes.some(b => b.props["aria-label"].endsWith(`${tag}: aventura`)));
  }
  const literal = '<ScRiPt>alert(1)</ScRiPt> **texto** ' + 'x'.repeat(90);
  const { html } = montar({ filtroTag: literal });
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt; **texto**'));
  assert.doesNotMatch(html, /<script|<strong>/i);
  assert.match(html, /overflow-wrap:anywhere/);
});

test("foco avança, volta ao anterior ou retorna ao controle externo antes da remoção", () => {
  const focos = [];
  const elementos = Array.from({ length: 5 }, (_, i) => ({ focus: opts => focos.push([i, opts]) }));
  grupo = { querySelectorAll: () => elementos };
  try {
    const { botoes, chamadas } = montar(todos);
    botoes[0].props.onClick({ currentTarget: elementos[0] });
    botoes[4].props.onClick({ currentTarget: elementos[4] });
    assert.deepEqual(focos, [[1, { preventScroll: true }], [3, { preventScroll: true }]]);
    assert.deepEqual(chamadas, [["Formato", "todos"], ["NotaMinima", ""]]);
  } finally { grupo = null; }
});

test("integra handlers existentes sem painel avançado, rede, estado persistido ou sincronização paralela", () => {
  const page = readFileSync(new URL("../../app/explorar/page.tsx", import.meta.url), "utf8");
  for (const nome of ["Formato", "Tag", "TagExcluida", "GeneroExcluido", "NotaMinima"]) {
    assert.ok(page.includes(`onSelecionar${nome}={selecionar${nome}Explorar}`));
  }
  assert.doesNotMatch(source, /supabase|fetch\(|localStorage|sessionStorage|useEffect|useState|limparFiltros|AdvancedFilters|history|URLSearchParams/);
  assert.match(source, /:focus-visible/);
});
