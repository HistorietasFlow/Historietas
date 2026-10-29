import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (caminho) =>
  readFileSync(new URL(caminho, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const pagina = ler("../../app/explorar/page.tsx");
const botaoCarregarMais = ler("../../app/explorar/components/explorar-load-more-button.tsx");
const codigo = ler("../../app/explorar/hooks/use-explorar-catalog-query.ts");
const codigoExecutavel = codigo.replace(/^import[\s\S]*?from "[^"]+";\n/gm, "");
const injecao = `
const useRef = (...args) => globalThis.__catalogQueryTest.useRef(...args);
const useMemo = (...args) => globalThis.__catalogQueryTest.useMemo(...args);
const useEffect = (...args) => globalThis.__catalogQueryTest.useEffect(...args);
const carregarObrasPublicadasSupabase = (...args) => globalThis.__catalogQueryTest.carregar(...args);
const CONSULTAS_INICIAIS_CATALOGO_EXPLORAR = [{ ordenacao: "recentes", limite: 50 }];
`;
const javascript = typescript.transpileModule(injecao + codigoExecutavel, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const modulo = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);
const adiar = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};
const mesmas = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));

function preparar(t, overrides = {}) {
  const anterior = globalThis.window;
  const chamadas = [];
  const estado = {};
  const timers = new Map();
  const slots = [];
  let indice = 0;
  let proximoTimer = 0;
  let proximoEfeito;
  let cleanup;
  let efeitosDeps;
  const respostas = [];
  globalThis.window = {
    setTimeout(fn, ms) {
      const id = ++proximoTimer;
      timers.set(id, { fn, ms });
      return id;
    },
    clearTimeout(id) { chamadas.push(["clearTimeout", id]); timers.delete(id); },
  };
  t.after(() => {
    if (anterior === undefined) delete globalThis.window;
    else globalThis.window = anterior;
    delete globalThis.__catalogQueryTest;
  });
  const deps = {
    useRef(valor) {
      const i = indice++;
      if (!slots[i]) slots[i] = { current: valor };
      return slots[i];
    },
    useMemo(fn, valores) {
      const i = indice++;
      if (!slots[i] || !mesmas(slots[i].deps, valores)) slots[i] = { deps: valores, value: fn() };
      return slots[i].value;
    },
    useEffect(fn, valores) {
      indice++;
      if (!mesmas(efeitosDeps, valores)) {
        if (cleanup) cleanup();
        efeitosDeps = valores;
        proximoEfeito = fn;
      }
    },
    carregar(...args) {
      chamadas.push(["carregar", ...args]);
      return respostas.shift() || Promise.resolve({ obras: [], pagina: null });
    },
  };
  globalThis.__catalogQueryTest = deps;
  const props = {
    busca: "", termoBusca: "", categoriaSelecionada: "", filtroFormato: "todos",
    filtroClassificacao: "todos", filtroCapitulos: "todos", ordenacao: "relevancia",
    dadosExplorarCarregados: true, obrasLocais: [{ id: "atual" }],
    proximoCursorCatalogo: null, carregandoMaisCatalogo: false,
    obrasCacheLocalRef: { current: [{ id: "cache" }] }, usuarioIdExplorarRef: { current: "usuario" },
    ...overrides,
  };
  for (const nome of ["ObrasLocais", "ProximoCursorCatalogo", "CatalogoTemMais", "CarregandoMaisCatalogo"]) {
    props[`set${nome}`] = (valor) => { chamadas.push([`set${nome}`, valor]); estado[nome] = valor; };
  }
  const render = (alteracoes = {}) => {
    Object.assign(props, alteracoes);
    indice = 0;
    proximoEfeito = undefined;
    const resultado = modulo.useExplorarCatalogQuery(props);
    if (proximoEfeito) cleanup = proximoEfeito();
    return resultado;
  };
  const disparar = () => {
    const [id, timer] = timers.entries().next().value || [];
    assert.ok(timer, "timer não foi agendado");
    timers.delete(id);
    return timer.fn();
  };
  return { chamadas, estado, timers, respostas, props, render, disparar, cancelar: () => cleanup?.() };
}

test("memo, condição, efeito e paginação preservam literalmente a base", () => {
  const inicio = codigo.indexOf("  const buscaCatalogo = busca.trim();");
  const fim = codigo.indexOf("\n\n  return { consultaCatalogoPersonalizada", inicio);
  const original = codigo.slice(inicio, fim).replace(
    /    const \{[\s\S]*?\} = dependenciasEstaveisRef\.current;\n\n/g,
    "",
  );
  assert.equal(createHash("sha256").update(original).digest("hex"),
    "65be89aa3220eae4c3f83b417bd6b57de2bea5d5a8044dd1400ce3bad724f423");
  assert.match(pagina, /useExplorarCatalogQuery\(\{/);
  assert.doesNotMatch(pagina, /async function carregarMaisObrasCatalogo\(/);
  assert.match(pagina, /consultaCatalogoPersonalizada && catalogoTemMais/);
  assert.match(pagina, /<ExplorarLoadMoreButton/);
  assert.match(pagina, /onCarregarMais=\{\(\) =>\n                    void carregarMaisObrasCatalogo\(\)\n                  \}/);
  assert.match(botaoCarregarMais, /onClick=\{onCarregarMais\}/);
  assert.match(pagina, /useExplorarInitialLoad\(\{/);
  assert.match(pagina, /supabase\.auth\.onAuthStateChange/);
  assert.match(pagina, /async function carregarDadosAutores\(/);
  assert.doesNotMatch(codigo, /onAuthStateChange|carregarDadosAutores|useExplorarInitialLoad/);
});

test("sem dados iniciais ou sem consulta personalizada não agenda nova consulta", (t) => {
  const c = preparar(t, { dadosExplorarCarregados: false, busca: "x", termoBusca: "x" });
  assert.equal(c.render().consultaCatalogoPersonalizada, true);
  assert.equal(c.timers.size, 0);
  const d = preparar(t);
  assert.equal(d.render().consultaCatalogoPersonalizada, false);
  assert.equal(d.timers.size, 0);
  assert.deepEqual(d.chamadas, []);
});

test("consulta personalizada respeita debounce, filtros e ordem das atualizações", async (t) => {
  const c = preparar(t, {
    busca: "  Ação  ", termoBusca: "acao", categoriaSelecionada: "Fantasia",
    filtroFormato: "Livro", filtroClassificacao: "18+", filtroCapitulos: "com-capitulos",
    ordenacao: "recentes",
  });
  assert.equal(c.render().consultaCatalogoPersonalizada, true);
  assert.equal([...c.timers.values()][0].ms, 350);
  assert.equal(c.chamadas.length, 0);
  const cursor = { valor: 3, data: "2024-01-01", id: "cursor" };
  c.respostas.push(Promise.resolve({ obras: [{ id: "remota" }], pagina: { proximoCursor: cursor, temMais: true } }));
  await c.disparar();
  assert.deepEqual(c.chamadas, [
    ["setCarregandoMaisCatalogo", true],
    ["carregar", [{ id: "cache" }], "usuario", [{
      busca: "Ação", genero: "Fantasia", formato: "Livro", classificacao: "18+",
      filtroCapitulos: "com-capitulos", ordenacao: "recentes", limite: 24,
    }]],
    ["setObrasLocais", [{ id: "remota" }]], ["setProximoCursorCatalogo", cursor],
    ["setCatalogoTemMais", true], ["setCarregandoMaisCatalogo", false],
  ]);
});

test("cada filtro individual ativa consulta; capítulo desconhecido mantém fallback todos", async (t) => {
  const casos = [
    { termoBusca: "x" }, { categoriaSelecionada: "Drama" }, { filtroFormato: "Livro" },
    { filtroClassificacao: "Livre" }, { filtroCapitulos: "sem-capitulos" }, { ordenacao: "recentes" },
  ];
  for (const caso of casos) {
    const c = preparar(t, caso);
    assert.equal(c.render().consultaCatalogoPersonalizada, true);
    assert.equal(c.timers.size, 1);
  }
  const c = preparar(t, { filtroCapitulos: "desconhecido" });
  c.render();
  await c.disparar();
  assert.equal(c.chamadas.find(([nome]) => nome === "carregar")[3][0].filtroCapitulos, "todos");
});

test("volta à consulta inicial após limpar filtros e cancela debounce anterior", async (t) => {
  const c = preparar(t, { termoBusca: "x", busca: "x" });
  c.render();
  const antigo = [...c.timers.keys()][0];
  c.render({ termoBusca: "", busca: "" });
  assert.ok(c.chamadas.some((item) => item[0] === "clearTimeout" && item[1] === antigo));
  assert.equal(c.timers.size, 1);
  await c.disparar();
  assert.deepEqual(c.chamadas.find(([nome]) => nome === "carregar")[3], [{ ordenacao: "recentes", limite: 50 }]);
  assert.equal(c.estado.ProximoCursorCatalogo, null);
  assert.equal(c.estado.CatalogoTemMais, false);
});

test("resposta antiga e cleanup não aplicam dados nem encerram o loading da nova consulta", async (t) => {
  const c = preparar(t, { termoBusca: "a", busca: "a" });
  const primeira = adiar();
  const segunda = adiar();
  c.respostas.push(primeira.promise, segunda.promise);
  c.render();
  const aguardandoPrimeira = c.disparar();
  c.render({ termoBusca: "b", busca: "b" });
  const aguardandoSegunda = c.disparar();
  primeira.resolve({ obras: [{ id: "antiga" }], pagina: null });
  await aguardandoPrimeira;
  assert.equal(c.chamadas.filter(([nome]) => nome === "setObrasLocais").length, 0);
  assert.equal(c.chamadas.filter(([nome, valor]) => nome === "setCarregandoMaisCatalogo" && !valor).length, 0);
  segunda.resolve({ obras: [{ id: "nova" }], pagina: null });
  await aguardandoSegunda;
  assert.deepEqual(c.estado.ObrasLocais, [{ id: "nova" }]);
  assert.equal(c.estado.CarregandoMaisCatalogo, false);
  c.render({ termoBusca: "c", busca: "c" });
  c.cancelar();
  assert.equal(c.timers.size, 0);
});

test("carregar mais respeita guardas, cursor e atualizações na ordem original", async (t) => {
  const cursor = { valor: 1, data: "2024-01-01", id: "a" };
  const c = preparar(t, { termoBusca: "x", busca: "x" });
  let resultado = c.render();
  await resultado.carregarMaisObrasCatalogo();
  assert.equal(c.chamadas.length, 0);
  resultado = c.render({ proximoCursorCatalogo: cursor, carregandoMaisCatalogo: true });
  await resultado.carregarMaisObrasCatalogo();
  assert.equal(c.chamadas.length, 0);
  resultado = c.render({ carregandoMaisCatalogo: false });
  c.respostas.push(Promise.resolve({ obras: [{ id: "p2" }], pagina: { proximoCursor: null, temMais: false } }));
  await resultado.carregarMaisObrasCatalogo();
  assert.deepEqual(c.chamadas, [
    ["setCarregandoMaisCatalogo", true],
    ["carregar", [{ id: "atual" }], "usuario", [{
      busca: "x", genero: "", formato: "", classificacao: "", filtroCapitulos: "todos",
      ordenacao: "relevancia", limite: 24, cursor,
    }]],
    ["setObrasLocais", [{ id: "p2" }]], ["setProximoCursorCatalogo", null],
    ["setCatalogoTemMais", false], ["setCarregandoMaisCatalogo", false],
  ]);
  const d = preparar(t, { proximoCursorCatalogo: cursor });
  await d.render().carregarMaisObrasCatalogo();
  assert.deepEqual(d.chamadas, []);
});

test("falha da paginação propaga erro e encerra loading da consulta ativa", async (t) => {
  const cursor = { valor: 1, data: "2024-01-01", id: "a" };
  const c = preparar(t, { termoBusca: "x", proximoCursorCatalogo: cursor });
  const resultado = c.render();
  c.respostas.push(Promise.reject(new Error("catálogo")));
  await assert.rejects(resultado.carregarMaisObrasCatalogo(), /catálogo/);
  assert.equal(c.estado.CarregandoMaisCatalogo, false);
  assert.equal(c.estado.ObrasLocais, undefined);
});

test("paginação ultrapassada não sobrescreve uma consulta mais recente", async (t) => {
  const cursor = { valor: 1, data: "2024-01-01", id: "a" };
  const c = preparar(t, { termoBusca: "x", busca: "x", proximoCursorCatalogo: cursor });
  const paginaAntiga = adiar();
  c.respostas.push(paginaAntiga.promise);
  const resultado = c.render();
  const pendente = resultado.carregarMaisObrasCatalogo();
  c.render({ busca: "nova", termoBusca: "nova" });
  paginaAntiga.resolve({ obras: [{ id: "antiga" }], pagina: null });
  await pendente;
  assert.equal(c.estado.ObrasLocais, undefined);
  assert.equal(c.estado.CarregandoMaisCatalogo, true);
  await c.disparar();
  assert.deepEqual(c.estado.ObrasLocais, []);
  assert.equal(c.estado.CarregandoMaisCatalogo, false);
});
