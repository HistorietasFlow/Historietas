import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(new URL("../../app/adicionar-capitulo/lib/adicionar-capitulo-language-bridge.ts", import.meta.url), "utf8");
const page = readFileSync(new URL("../../app/adicionar-capitulo/page.tsx", import.meta.url), "utf8");

async function carregar() {
  const javascript = typescript.transpileModule(source, { compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}#${Math.random()}`);
}

function elemento(tagName = "DIV", atributos = {}) {
  return { tagName, atributos, getAttribute(nome) { return this.atributos[nome] ?? null; }, setAttribute(nome, valor) { this.atributos[nome] = valor; } };
}

async function traduzir(textos, idioma, atributos = []) {
  const modulo = await carregar();
  const nos = textos.map(([valor, tag = "DIV"]) => ({ nodeValue: valor, parentElement: elemento(tag) }));
  const raiz = elemento();
  raiz.querySelectorAll = () => atributos;
  const anteriorDocumento = globalThis.document;
  const anteriorFiltro = globalThis.NodeFilter;
  globalThis.NodeFilter = { SHOW_TEXT: 4 };
  globalThis.document = { createTreeWalker() { let indice = 0; return { nextNode: () => nos[indice++] || null }; } };
  try { modulo.traduzirElementoAdicionarCapitulo(raiz, idioma); } finally { globalThis.document = anteriorDocumento; globalThis.NodeFilter = anteriorFiltro; }
  return nos;
}

test("bridge preserva traduções, padrões dinâmicos e whitespace", async () => {
  const nos = await traduzir([["  Capítulo 3  "], ["Ex: Capítulo 3"], ["Notificações: 7 não lidas"], ["arquivo • 12 palavras • 3 min"], ["Não consegui confirmar a autoria da obra: detalhe"], ["Não consegui calcular a ordem do novo capítulo: detalhe"], ["Não consegui salvar capítulo no Supabase: detalhe"], ["desconhecido"]], "en");
  assert.deepEqual(nos.map((no) => no.nodeValue), ["  Chapter 3  ", "E.g.: Chapter 3", "Notifications: 7 unread", "arquivo • 12 words • 3 min", "I couldn't confirm the authorship of the work: detalhe", "I couldn't calculate the new chapter order: detalhe", "I couldn't save the chapter in Supabase: detalhe", "desconhecido"]);
  const pt = await traduzir([["Criar capítulo"]], "pt-BR");
  assert.equal(pt[0].nodeValue, "Criar capítulo");
  const es = await traduzir([["Capítulo 3"], ["Ex: Capítulo 3"]], "es");
  assert.deepEqual(es.map((no) => no.nodeValue), ["Capítulo 3", "Ej.: Capítulo 3"]);
});

test("bridge ignora elementos proibidos e traduz somente quatro atributos", async () => {
  const atributo = elemento("DIV", { "aria-label": "Criar capítulo", title: "Cancelar", placeholder: "Título do capítulo", alt: "Obra sem título", role: "Criar capítulo" });
  const nos = await traduzir([["Criar capítulo", "SCRIPT"], ["Criar capítulo", "STYLE"], ["Criar capítulo", "TEXTAREA"]], "en", [atributo]);
  assert.deepEqual(nos.map((no) => no.nodeValue), ["Criar capítulo", "Criar capítulo", "Criar capítulo"]);
  assert.deepEqual(atributo.atributos, { "aria-label": "Create chapter", title: "Cancel", placeholder: "Chapter title", alt: "Untitled work", role: "Criar capítulo" });
});

test("Adicionar Capítulo delega helpers ao módulo sem mover lifecycle", () => {
  assert.match(source, /en: \{/); assert.match(source, /es: \{/);
  assert.match(source, /document\.createTreeWalker\(raiz, NodeFilter\.SHOW_TEXT\)/);
  assert.match(source, /\["aria-label", "title", "placeholder", "alt"\]/);
  assert.doesNotMatch(source, /useEffect|useState|supabase|localStorage|router/);
  assert.doesNotMatch(page, /function traduzirConteudoAdicionarCapitulo\(/);
  assert.doesNotMatch(page, /function traduzirTextoAdicionarCapitulo\(/);
  assert.doesNotMatch(page, /function traduzirElementoAdicionarCapitulo\(/);
  assert.match(page, /useEffect\(\(\) => \{/);
  assert.match(page, /new MutationObserver/);
  assert.match(page, /traduzirElementoAdicionarCapitulo\(/);
});
