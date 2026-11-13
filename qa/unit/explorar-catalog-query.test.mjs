import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";
// Mantém o novo contrato RPC na lista de sessão já executada pela CI.
import "./catalogo-tag.test.mjs";
import "./catalogo-palavras-ui.test.mjs";
import { loadApplicationModule } from "../helpers/load-application-module.mjs";

const ler = (caminho) =>
  readFileSync(new URL(caminho, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const pagina = ler("../../app/explorar/page.tsx");
const botaoCarregarMais = ler("../../app/explorar/components/explorar-load-more-button.tsx");
const codigo = ler("../../app/explorar/hooks/use-explorar-catalog-query.ts");
const migrationBuscaAutores = ler(
  "../../supabase/migrations/20261106175534_corrigir_busca_autores_catalogo.sql",
);
const codigoExecutavel = codigo.replace(/^import[\s\S]*?from "[^"]+";\n/gm, "");
const injecao = `
const STORAGE_KEY = "historietas-obras";
const lerStorageUsuarioExplorar = (...args) => globalThis.__catalogQueryTest.lerStorage(...args);
const normalizarObra = (obra) => obra;
const obterArquivoObraComBackup = () => null;
const validarIntervaloPalavras = (...args) => globalThis.__catalogQueryTest.validarIntervaloPalavras(...args);
const useRef = (...args) => globalThis.__catalogQueryTest.useRef(...args);
const useState = (...args) => globalThis.__catalogQueryTest.useState(...args);
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

test("busca de autores usa o perfil publico atual sem ampliar os privilegios da RPC", () => {
  assert.match(migrationBuscaAutores, /from public\.profiles_publicos as perfil_autor/);
  assert.match(migrationBuscaAutores, /perfil_autor\.tipo = 'autor'/);
  assert.match(migrationBuscaAutores, /strpos\(/);
  assert.match(migrationBuscaAutores, /array_agg\(distinct perfil_autor\.user_id\)/);
  assert.match(migrationBuscaAutores, /obra\.user_id = any\(v_autores_busca\)/);
  assert.doesNotMatch(migrationBuscaAutores, /\bilike\b/i);
  assert.match(migrationBuscaAutores, /prosecdef[\s\S]*?raise exception/);
  assert.match(migrationBuscaAutores, /permissao\.grantee = 0/);
  assert.match(migrationBuscaAutores, /permissao\.privilege_type = 'EXECUTE'/);
  assert.match(migrationBuscaAutores, /has_function_privilege\('anon'/);
  assert.match(migrationBuscaAutores, /has_function_privilege\('authenticated'/);
});

async function confirmarPrimeiraPagina(c, cursor, obras = [{ id: "atual" }]) {
  c.render();
  c.respostas.push(Promise.resolve({ obras, pagina: {
    obraIds: obras.map(obra => obra.id), proximoCursor: cursor, temMais: Boolean(cursor),
  }, falhaTemporaria: false }));
  await c.disparar();
  return c.render({ obrasLocais: obras, proximoCursorCatalogo: cursor, carregandoMaisCatalogo: false });
}

function preparar(t, overrides = {}) {
  const anterior = globalThis.window;
  const chamadas = [];
  const estado = { ErroCatalogoExplorar: null };
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
    lerStorage: () => null,
    validarIntervaloPalavras: loadApplicationModule("lib/catalogo-palavras.ts").validarIntervaloPalavras,
    useState(valor) {
      const i = indice++;
      if (!slots[i]) slots[i] = { value: valor };
      return [slots[i].value, (novo) => { slots[i].value = novo; }];
    },
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
    modoConteudo: "obras", busca: "", termoBusca: "", categoriaSelecionada: "", filtroFormato: "todos",
    filtroClassificacao: "todos", filtroCapitulos: "todos", ordenacao: "relevancia",
    filtroColecao: "todos", obrasFavoritas: [], obrasConcluidas: [],
    obrasComLeitura: [], colecoesCarregadas: true,
    dadosExplorarCarregados: true, obrasLocais: [{ id: "atual" }],
    proximoCursorCatalogo: null, carregandoMaisCatalogo: false,
    versaoRetryCatalogo: 0,
    usuarioIdExplorar: "usuario",
    obrasCacheLocalRef: { current: [{ id: "cache" }] }, usuarioIdExplorarRef: { current: "usuario" },
    ...overrides,
  };
  for (const nome of ["ObrasLocais", "ProximoCursorCatalogo", "CatalogoTemMais", "CarregandoMaisCatalogo", "ObraIdsBuscaRemota", "ErroCatalogoExplorar"]) {
    props[`set${nome}`] = (valor) => {
      const valorResolvido = typeof valor === "function" ? valor(estado[nome]) : valor;
      chamadas.push([`set${nome}`, valorResolvido]);
      estado[nome] = valorResolvido;
    };
  }
  const render = (alteracoes = {}) => {
    Object.assign(props, alteracoes);
    // A página atualiza esta ref antes do efeito da consulta.
    props.usuarioIdExplorarRef.current = props.usuarioIdExplorar;
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
  return { chamadas, estado, timers, respostas, props, deps, render, disparar, cancelar: () => cleanup?.() };
}

test("memo, condição, efeito e paginação preservam o contrato atualizado", () => {
  assert.match(pagina, /useExplorarCatalogQuery\(\{/);
  assert.doesNotMatch(pagina, /async function carregarMaisObrasCatalogo\(/);
  assert.match(pagina, /consultaCatalogoPersonalizada && catalogoTemMais/);
  assert.match(pagina, /modoConteudo === "autores" && catalogoTemMais/);
  assert.match(pagina, /<ExplorarLoadMoreButton/);
  assert.match(pagina, /onCarregarMais=\{\(\) =>\n                    void carregarMaisObrasCatalogo\(\)\n                  \}/);
  assert.match(botaoCarregarMais, /onClick=\{onCarregarMais\}/);
  assert.match(pagina, /useExplorarInitialLoad\(\{/);
  assert.match(pagina, /useExplorarAuthState\(\{/);
  assert.match(pagina, /useExplorarAuthorData\(\{/);
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
  assert.deepEqual(c.chamadas, [
    ["setErroCatalogoExplorar", null],
    ["setObraIdsBuscaRemota", null],
    ["setProximoCursorCatalogo", null],
    ["setCatalogoTemMais", false],
    ["setCarregandoMaisCatalogo", true],
  ]);
  const cursor = { valor: 3, data: "2024-01-01", id: "cursor" };
  c.respostas.push(Promise.resolve({ obras: [{ id: "remota" }], pagina: { obraIds: ["remota"], proximoCursor: cursor, temMais: true } }));
  await c.disparar();
  assert.deepEqual(c.chamadas, [
    ["setErroCatalogoExplorar", null],
    ["setObraIdsBuscaRemota", null],
    ["setProximoCursorCatalogo", null],
    ["setCatalogoTemMais", false],
    ["setCarregandoMaisCatalogo", true],
    ["carregar", [{ id: "cache" }], "usuario", [{
      busca: "Ação", genero: "Fantasia", formato: "Livro", classificacao: "18+",
      filtroCapitulos: "com-capitulos", ordenacao: "recentes", limite: 24,
    }], null, false, c.chamadas.find(([nome]) => nome === "carregar")[6]],
    ["setObrasLocais", [{ id: "remota" }]], ["setObraIdsBuscaRemota", ["remota"]],
    ["setProximoCursorCatalogo", cursor],
    ["setCatalogoTemMais", true], ["setErroCatalogoExplorar", null],
    ["setCarregandoMaisCatalogo", false],
  ]);
});

test("retry repete somente a consulta atual e limpa o erro após recuperação", async (t) => {
  const c = preparar(t);
  c.render();
  assert.equal(c.timers.size, 0);

  c.respostas.push(Promise.resolve({
    obras: [{ id: "fallback" }],
    pagina: null,
    falhaTemporaria: true,
  }));
  c.render({ versaoRetryCatalogo: 1 });
  await c.disparar();
  assert.deepEqual(c.estado.ObrasLocais, [{ id: "fallback" }]);
  assert.equal(c.estado.ErroCatalogoExplorar, "consulta");
  assert.equal(c.chamadas.filter(([nome]) => nome === "carregar").length, 1);

  c.respostas.push(Promise.resolve({
    obras: [],
    pagina: null,
    falhaTemporaria: false,
  }));
  c.render({ versaoRetryCatalogo: 2 });
  await c.disparar();
  assert.deepEqual(c.estado.ObrasLocais, []);
  assert.equal(c.estado.ErroCatalogoExplorar, null);
  assert.equal(c.chamadas.filter(([nome]) => nome === "carregar").length, 2);
});

test("busca diferencia resposta remota vazia de fallback local", async (t) => {
  const remotoVazio = preparar(t, { busca: "histórias", termoBusca: "historias" });
  remotoVazio.render();
  remotoVazio.respostas.push(Promise.resolve({
    obras: [{ id: "cache-local" }],
    pagina: { obraIds: [], proximoCursor: null, temMais: false },
  }));
  await remotoVazio.disparar();
  assert.deepEqual(remotoVazio.estado.ObraIdsBuscaRemota, []);

  const fallbackLocal = preparar(t, { busca: "histórias", termoBusca: "historias" });
  fallbackLocal.render();
  fallbackLocal.respostas.push(Promise.resolve({
    obras: [{ id: "cache-local" }],
    pagina: null,
  }));
  await fallbackLocal.disparar();
  assert.equal(fallbackLocal.estado.ObraIdsBuscaRemota, null);
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

test("modo autores ativa paginação incremental mesmo sem outros filtros", async (t) => {
  const cursor = { valor: 4, data: "2026-04-01", id: "autor-pagina-1" };
  const c = preparar(t, { modoConteudo: "autores" });

  let resultado = c.render();
  assert.equal(resultado.consultaCatalogoPersonalizada, true);
  assert.equal(c.timers.size, 1);
  c.respostas.push(Promise.resolve({
    obras: [{ id: "obra-autor-1", autorId: "autor-1" }],
    pagina: { obraIds: ["obra-autor-1"], proximoCursor: cursor, temMais: true },
    falhaTemporaria: false,
  }));
  await c.disparar();
  assert.equal(c.estado.CatalogoTemMais, true);

  c.chamadas.length = 0;
  resultado = c.render({
    obrasLocais: [{ id: "obra-autor-1", autorId: "autor-1" }],
    proximoCursorCatalogo: cursor,
    carregandoMaisCatalogo: false,
  });
  c.respostas.push(Promise.resolve({
    obras: [
      { id: "obra-autor-1", autorId: "autor-1" },
      { id: "obra-autor-2", autorId: "autor-2" },
    ],
    pagina: { obraIds: ["obra-autor-2"], proximoCursor: null, temMais: false },
    falhaTemporaria: false,
  }));
  await resultado.carregarMaisObrasCatalogo();

  const chamada = c.chamadas.find(([nome]) => nome === "carregar");
  assert.deepEqual(chamada[3], [{
    busca: "", genero: "", formato: "", classificacao: "",
    filtroCapitulos: "todos", ordenacao: "relevancia", limite: 24, cursor,
  }]);
  assert.deepEqual(
    c.estado.ObrasLocais.map((obra) => obra.autorId),
    ["autor-1", "autor-2"],
  );
  assert.equal(c.estado.CatalogoTemMais, false);
});

test("tag ativa consulta paginada, mantém cursor e descarta resultado antigo após troca", async (t) => {
  const c = preparar(t, { filtroTag: "acao" });
  const antiga = adiar();
  c.respostas.push(antiga.promise);
  assert.equal(c.render().consultaCatalogoPersonalizada, true);
  const pendente = c.disparar();
  const cursor = { valor: 3, data: "2026-01-01", id: "obra-a" };
  c.respostas.push(Promise.resolve({ obras: [{ id: "nova" }], pagina: { obraIds: ["nova"], proximoCursor: cursor, temMais: true } }));
  c.render({ filtroTag: "romance", filtroFormato: "HQ" });
  await c.disparar();
  antiga.resolve({ obras: [{ id: "antiga" }], pagina: null });
  await pendente;
  assert.deepEqual(c.estado.ObrasLocais, [{ id: "nova" }]);
  c.respostas.push(Promise.resolve({ obras: [{ id: "p2" }], pagina: { obraIds: ["p2"], proximoCursor: null, temMais: false } }));
  await c.render({ proximoCursorCatalogo: cursor }).carregarMaisObrasCatalogo();
  const consulta = c.chamadas.filter(([nome]) => nome === "carregar").at(-1)[3][0];
  assert.equal(consulta.tag, "romance");
  assert.equal(consulta.formato, "HQ");
  assert.deepEqual(consulta.cursor, cursor);
});

test("nota mínima confirma a consulta exata, acumula IDs e invalida ao trocar filtros", async (t) => {
  const c = preparar(t, { notaMinima: 4, filtroTag: "acao", filtroFormato: "HQ" });
  const cursor = { valor: 5, data: "2026-01-01", id: "aprovada" };
  assert.equal(c.render().notaMinimaVerificada, false);
  c.respostas.push(Promise.resolve({ obras: [{ id: "aprovada" }], pagina: { obraIds: ["aprovada"], proximoCursor: cursor, temMais: true } }));
  await c.disparar();
  assert.equal(c.render().notaMinimaVerificada, true);
  assert.deepEqual(c.estado.ObraIdsBuscaRemota, ["aprovada"]);
  c.respostas.push(Promise.resolve({ obras: [{ id: "segunda" }], pagina: { obraIds: ["segunda"], proximoCursor: null, temMais: false } }));
  await c.render({ proximoCursorCatalogo: cursor }).carregarMaisObrasCatalogo();
  assert.deepEqual(c.estado.ObraIdsBuscaRemota, ["aprovada", "segunda"]);
  const consulta = c.chamadas.filter(([nome]) => nome === "carregar").at(-1)[3][0];
  assert.equal(consulta.notaMinima, 4);
  assert.equal(consulta.tag, "acao");
  assert.deepEqual(consulta.cursor, cursor);
  assert.equal(c.render({ notaMinima: 4.5 }).notaMinimaVerificada, false);
});

test("exclusão reinicia cursor, preserva combinações e invalida respostas obsoletas/retry", async (t) => {
  const c = preparar(t, { tagExcluida: "acao", filtroTag: "base", notaMinima: 4 });
  const antiga = adiar();
  c.respostas.push(antiga.promise);
  assert.equal(c.render().consultaCatalogoPersonalizada, true);
  const pendente = c.disparar();
  c.render({ tagExcluida: "romance", filtroFormato: "HQ" });
  const cursor = { valor: 0, data: "2026-01-01", id: "nova" };
  c.respostas.push(Promise.resolve({ obras: [{ id: "nova" }], pagina: { obraIds: ["nova"], proximoCursor: cursor, temMais: true } }));
  await c.disparar();
  antiga.resolve({ obras: [{ id: "antiga" }], pagina: null });
  await pendente;
  assert.deepEqual(c.estado.ObrasLocais, [{ id: "nova" }]);
  let consulta = c.chamadas.filter(([nome]) => nome === "carregar").at(-1)[3][0];
  assert.equal(consulta.tagExcluida, "romance");
  assert.equal(consulta.tag, "base");
  assert.equal(consulta.notaMinima, 4);
  assert.equal(consulta.cursor, undefined);
  c.respostas.push(Promise.resolve({ obras: [{ id: "segunda" }], pagina: { obraIds: ["segunda"], proximoCursor: null, temMais: false } }));
  await c.render({ proximoCursorCatalogo: cursor }).carregarMaisObrasCatalogo();
  consulta = c.chamadas.filter(([nome]) => nome === "carregar").at(-1)[3][0];
  assert.deepEqual(consulta.cursor, cursor);
  assert.equal(consulta.tagExcluida, "romance");
  c.render({ tagExcluida: "outra" });
  c.respostas.push(Promise.resolve({ obras: [], pagina: null, falhaTemporaria: true }));
  await c.disparar();
  assert.equal(c.estado.ErroCatalogoExplorar, "consulta");
  c.render({ versaoRetryCatalogo: 1 });
  c.respostas.push(Promise.resolve({ obras: [], pagina: { obraIds: [], proximoCursor: null, temMais: false } }));
  await c.disparar();
  assert.equal(c.estado.ErroCatalogoExplorar, null);
  assert.equal(c.chamadas.filter(([nome]) => nome === "carregar").at(-1)[3][0].tagExcluida, "outra");
  c.render({ modoConteudo: "autores" });
  await c.disparar();
  assert.equal(c.chamadas.filter(([nome]) => nome === "carregar").at(-1)[3][0].tagExcluida, undefined);
});

test("exclusão sozinha exige IDs atuais, não certifica cache em falha e invalida troca de conta", async (t) => {
  const c = preparar(t, { tagExcluida: "acao", usuarioIdExplorar: "A" });
  assert.equal(c.render().tagExcluidaVerificada, false);
  c.respostas.push(Promise.resolve({ obras: [{ id: "cache-tags-antigas" }], pagina: null, falhaTemporaria: true }));
  await c.disparar();
  assert.equal(c.render().tagExcluidaVerificada, false);
  assert.equal(c.estado.ObraIdsBuscaRemota, null);
  const respostaA = adiar();
  c.render({ versaoRetryCatalogo: 1 });
  c.respostas.push(respostaA.promise);
  const pendenteA = c.disparar();
  c.render({ usuarioIdExplorar: "B" });
  c.respostas.push(Promise.resolve({ obras: [{ id: "B" }], pagina: { obraIds: ["B"], proximoCursor: null, temMais: false } }));
  await c.disparar();
  respostaA.resolve({ obras: [{ id: "A" }], pagina: { obraIds: ["A"] } });
  await pendenteA;
  assert.equal(c.render().tagExcluidaVerificada, true);
  assert.deepEqual(c.estado.ObraIdsBuscaRemota, ["B"]);
  assert.deepEqual(c.estado.ObrasLocais, [{ id: "B" }]);
  assert.equal(c.render({ usuarioIdExplorar: "" }).tagExcluidaVerificada, false);
});

test("falha com cache não certifica nota; retry e resposta obsoleta mantêm guards", async (t) => {
  const c = preparar(t, { notaMinima: 4 });
  c.render();
  c.respostas.push(Promise.resolve({ obras: [{ id: "cache" }], pagina: null, falhaTemporaria: true }));
  await c.disparar();
  assert.equal(c.render().notaMinimaVerificada, false);
  assert.equal(c.estado.ObraIdsBuscaRemota, null);
  assert.equal(c.estado.ErroCatalogoExplorar, "consulta");
  const antiga = adiar();
  c.render({ versaoRetryCatalogo: 1 });
  c.respostas.push(antiga.promise);
  const pendente = c.disparar();
  c.render({ versaoRetryCatalogo: 2 });
  c.respostas.push(Promise.resolve({ obras: [{ id: "atual" }], pagina: { obraIds: ["atual"], proximoCursor: null, temMais: false } }));
  await c.disparar();
  antiga.resolve({ obras: [{ id: "obsoleta" }], pagina: { obraIds: ["obsoleta"] } });
  await pendente;
  assert.equal(c.render().notaMinimaVerificada, true);
  assert.deepEqual(c.estado.ObraIdsBuscaRemota, ["atual"]);
  assert.equal(c.estado.ErroCatalogoExplorar, null);
});

test("troca de conta e logout invalidam certificação e ignoram a resposta da conta antiga", async (t) => {
  const c = preparar(t, { notaMinima: 4, usuarioIdExplorar: "A", usuarioIdExplorarRef: { current: "A" } });
  const antiga = adiar();
  c.render();
  c.respostas.push(antiga.promise);
  const pendente = c.disparar();
  c.props.usuarioIdExplorarRef.current = "B";
  assert.equal(c.render({ usuarioIdExplorar: "B" }).notaMinimaVerificada, false);
  c.respostas.push(Promise.resolve({ obras: [{ id: "B" }], pagina: { obraIds: ["B"], proximoCursor: null, temMais: false } }));
  await c.disparar();
  antiga.resolve({ obras: [{ id: "A" }], pagina: { obraIds: ["A"] } });
  await pendente;
  assert.deepEqual(c.estado.ObraIdsBuscaRemota, ["B"]);
  assert.equal(c.render().notaMinimaVerificada, true);
  c.props.usuarioIdExplorarRef.current = "";
  assert.equal(c.render({ usuarioIdExplorar: "" }).notaMinimaVerificada, false);
  c.respostas.push(Promise.resolve({ obras: [], pagina: { obraIds: [], proximoCursor: null, temMais: false } }));
  await c.disparar();
  assert.deepEqual(c.estado.ObraIdsBuscaRemota, []);
  assert.equal(c.render().notaMinimaVerificada, true);
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
  primeira.resolve({
    obras: [{ id: "antiga" }],
    pagina: { obraIds: ["antiga"], proximoCursor: null, temMais: false },
  });
  await aguardandoPrimeira;
  assert.equal(c.chamadas.filter(([nome]) => nome === "setObrasLocais").length, 0);
  assert.equal(c.chamadas.some(([nome, valor]) =>
    nome === "setObraIdsBuscaRemota" && valor?.includes?.("antiga")), false);
  assert.equal(c.chamadas.filter(([nome, valor]) => nome === "setCarregandoMaisCatalogo" && !valor).length, 0);
  segunda.resolve({
    obras: [{ id: "nova" }],
    pagina: { obraIds: ["nova"], proximoCursor: null, temMais: false },
  });
  await aguardandoSegunda;
  assert.deepEqual(c.estado.ObrasLocais, [{ id: "nova" }]);
  assert.deepEqual(c.estado.ObraIdsBuscaRemota, ["nova"]);
  assert.equal(c.estado.CarregandoMaisCatalogo, false);
  c.render({ termoBusca: "c", busca: "c" });
  c.cancelar();
  assert.equal(c.timers.size, 0);
});

test("resposta antiga de retry não sobrescreve a recuperação mais recente", async (t) => {
  const c = preparar(t);
  const antiga = adiar();
  const nova = adiar();
  c.respostas.push(antiga.promise, nova.promise);
  c.render();
  c.render({ versaoRetryCatalogo: 1 });
  const aguardandoAntiga = c.disparar();
  c.render({ versaoRetryCatalogo: 2 });
  const aguardandoNova = c.disparar();

  nova.resolve({
    obras: [{ id: "atual" }],
    pagina: null,
    falhaTemporaria: false,
  });
  await aguardandoNova;
  antiga.resolve({
    obras: [{ id: "obsoleta" }],
    pagina: null,
    falhaTemporaria: true,
  });
  await aguardandoAntiga;

  assert.deepEqual(c.estado.ObrasLocais, [{ id: "atual" }]);
  assert.equal(c.estado.ErroCatalogoExplorar, null);
});

test("carregar mais respeita guardas, cursor e atualizações na ordem original", async (t) => {
  const cursor = { valor: 1, data: "2024-01-01", id: "a" };
  const c = preparar(t, { termoBusca: "x", busca: "x" });
  let resultado = c.render();
  assert.deepEqual(c.chamadas, [
    ["setErroCatalogoExplorar", null],
    ["setObraIdsBuscaRemota", null],
    ["setProximoCursorCatalogo", null],
    ["setCatalogoTemMais", false],
    ["setCarregandoMaisCatalogo", true],
  ]);
  c.chamadas.length = 0;
  await resultado.carregarMaisObrasCatalogo();
  assert.equal(c.chamadas.length, 0);
  resultado = c.render({ proximoCursorCatalogo: cursor, carregandoMaisCatalogo: true });
  await resultado.carregarMaisObrasCatalogo();
  assert.equal(c.chamadas.length, 0);
  await confirmarPrimeiraPagina(c, cursor);
  c.chamadas.length = 0;
  resultado = c.render({ carregandoMaisCatalogo: false, proximoCursorCatalogo: cursor });
  c.estado.ObraIdsBuscaRemota = ["p1"];
  c.respostas.push(Promise.resolve({ obras: [{ id: "p2" }], pagina: { obraIds: ["p2"], proximoCursor: null, temMais: false } }));
  await resultado.carregarMaisObrasCatalogo();
  assert.deepEqual(c.chamadas, [
    ["setCarregandoMaisCatalogo", true],
    ["carregar", [{ id: "atual" }], "usuario", [{
      busca: "x", genero: "", formato: "", classificacao: "", filtroCapitulos: "todos",
      ordenacao: "relevancia", limite: 24, cursor,
    }], null, false, c.chamadas.find(([nome]) => nome === "carregar")[6]],
    ["setObrasLocais", [{ id: "p2" }]], ["setObraIdsBuscaRemota", ["p1", "p2"]],
    ["setProximoCursorCatalogo", null],
    ["setCatalogoTemMais", false], ["setErroCatalogoExplorar", null],
    ["setCarregandoMaisCatalogo", false],
  ]);
  const d = preparar(t, { proximoCursorCatalogo: cursor });
  await d.render().carregarMaisObrasCatalogo();
  assert.deepEqual(d.chamadas, []);
});

test("filtro pessoal consulta a coleção completa e pagina sem expor IDs na URL", async (t) => {
  const cursor = { valor: 2, data: "2024-01-02", id: "b" };
  const c = preparar(t, {
    filtroColecao: "favoritas",
    obrasFavoritas: ["fora-da-primeira-pagina"],
  });

  assert.equal(c.render().consultaCatalogoPersonalizada, true);
  c.respostas.push(Promise.resolve({
    obras: [{ id: "fora-da-primeira-pagina" }],
    pagina: {
      obraIds: ["fora-da-primeira-pagina"],
      proximoCursor: cursor,
      temMais: true,
    },
    falhaTemporaria: false,
  }));
  await c.disparar();

  const chamadaInicial = c.chamadas.find(([nome]) => nome === "carregar");
  assert.deepEqual(chamadaInicial[4], {
    tipo: "favoritas",
    obraIds: ["fora-da-primeira-pagina"],
  });
  assert.equal(chamadaInicial[5], false);
  assert.deepEqual(c.estado.ObrasLocais, [{ id: "fora-da-primeira-pagina" }]);

  c.chamadas.length = 0;
  const resultado = c.render({
    obrasLocais: [{ id: "fora-da-primeira-pagina" }],
    proximoCursorCatalogo: cursor,
    carregandoMaisCatalogo: false,
  });
  c.respostas.push(Promise.resolve({
    obras: [
      { id: "fora-da-primeira-pagina" },
      { id: "pagina-seguinte" },
    ],
    pagina: { obraIds: ["pagina-seguinte"], proximoCursor: null, temMais: false },
    falhaTemporaria: false,
  }));
  await resultado.carregarMaisObrasCatalogo();
  const chamadaPaginacao = c.chamadas.find(([nome]) => nome === "carregar");
  assert.deepEqual(chamadaPaginacao[4], chamadaInicial[4]);
  assert.equal(chamadaPaginacao[5], true);
});

test("filtro pessoal aguarda coleções da identidade atual", (t) => {
  const c = preparar(t, {
    filtroColecao: "lendo",
    obrasComLeitura: ["obra-a"],
    colecoesCarregadas: false,
  });
  assert.equal(c.render().consultaCatalogoPersonalizada, true);
  assert.equal(c.timers.size, 0);
  c.render({ colecoesCarregadas: true });
  assert.equal(c.timers.size, 1);
});

test("falha e retry da paginação preservam a página atual", async (t) => {
  const cursor = { valor: 1, data: "2024-01-01", id: "a" };
  const c = preparar(t, {
    busca: "x",
    termoBusca: "x",
    proximoCursorCatalogo: cursor,
    obrasLocais: [{ id: "p1" }],
  });
  let resultado = await confirmarPrimeiraPagina(c, cursor, [{ id: "p1" }]);
  c.chamadas.length = 0;
  c.respostas.push(Promise.resolve({
    obras: [{ id: "fallback" }],
    pagina: null,
    falhaTemporaria: true,
  }));
  await resultado.carregarMaisObrasCatalogo();
  assert.deepEqual(c.estado.ObrasLocais, [{ id: "p1" }]);
  assert.equal(c.estado.ErroCatalogoExplorar, "paginacao");
  assert.equal(c.props.proximoCursorCatalogo, cursor);

  resultado = c.render({ carregandoMaisCatalogo: false });
  c.respostas.push(Promise.resolve({
    obras: [{ id: "p1" }, { id: "p2" }],
    pagina: { obraIds: ["p2"], proximoCursor: null, temMais: false },
    falhaTemporaria: false,
  }));
  await resultado.carregarMaisObrasCatalogo();
  assert.deepEqual(c.estado.ObrasLocais, [{ id: "p1" }, { id: "p2" }]);
  assert.equal(c.estado.ErroCatalogoExplorar, null);
  assert.equal(c.chamadas.filter(([nome]) => nome === "carregar").length, 2);
});

test("falha inesperada da paginação mantém dados e oferece retry", async (t) => {
  const cursor = { valor: 1, data: "2024-01-01", id: "a" };
  const c = preparar(t, { termoBusca: "x", proximoCursorCatalogo: cursor });
  const resultado = await confirmarPrimeiraPagina(c, cursor, [{ id: "p1" }]);
  c.respostas.push(Promise.reject(new Error("catálogo")));
  await resultado.carregarMaisObrasCatalogo();
  assert.equal(c.estado.CarregandoMaisCatalogo, false);
  assert.deepEqual(c.estado.ObrasLocais, [{ id: "p1" }]);
  assert.equal(c.estado.ErroCatalogoExplorar, "paginacao");
});

test("paginação ultrapassada não sobrescreve uma consulta mais recente", async (t) => {
  const cursor = { valor: 1, data: "2024-01-01", id: "a" };
  const c = preparar(t, { termoBusca: "x", busca: "x", proximoCursorCatalogo: cursor });
  const paginaAntiga = adiar();
  const resultado = await confirmarPrimeiraPagina(c, cursor, [{ id: "p1" }]);
  c.respostas.push(paginaAntiga.promise);
  const pendente = resultado.carregarMaisObrasCatalogo();
  c.render({ busca: "nova", termoBusca: "nova" });
  paginaAntiga.resolve({ obras: [{ id: "antiga" }], pagina: null });
  await pendente;
  assert.deepEqual(c.estado.ObrasLocais, [{ id: "p1" }]);
  assert.equal(c.estado.CarregandoMaisCatalogo, true);
  await c.disparar();
  assert.deepEqual(c.estado.ObrasLocais, []);
  assert.equal(c.estado.CarregandoMaisCatalogo, false);
});

test("exclusão de gênero reinicia cursor, preserva combinações e invalida respostas obsoletas/retry", async (t) => {
  const c = preparar(t, { generoExcluido: "acao", filtroTag: "base", notaMinima: 4 });
  const antiga = adiar();
  c.respostas.push(antiga.promise);
  assert.equal(c.render().consultaCatalogoPersonalizada, true);
  const pendente = c.disparar();
  c.render({ generoExcluido: "romance", filtroFormato: "HQ" });
  const cursor = { valor: 0, data: "2026-01-01", id: "nova" };
  c.respostas.push(Promise.resolve({ obras: [{ id: "nova" }], pagina: { obraIds: ["nova"], proximoCursor: cursor, temMais: true } }));
  await c.disparar();
  antiga.resolve({ obras: [{ id: "antiga" }], pagina: null });
  await pendente;
  assert.deepEqual(c.estado.ObrasLocais, [{ id: "nova" }]);
  let consulta = c.chamadas.filter(([nome]) => nome === "carregar").at(-1)[3][0];
  assert.equal(consulta.generoExcluido, "romance");
  assert.equal(consulta.tag, "base");
  assert.equal(consulta.notaMinima, 4);
  assert.equal(consulta.cursor, undefined);
  c.respostas.push(Promise.resolve({ obras: [{ id: "segunda" }], pagina: { obraIds: ["segunda"], proximoCursor: null, temMais: false } }));
  await c.render({ proximoCursorCatalogo: cursor }).carregarMaisObrasCatalogo();
  consulta = c.chamadas.filter(([nome]) => nome === "carregar").at(-1)[3][0];
  assert.deepEqual(consulta.cursor, cursor);
  assert.equal(consulta.generoExcluido, "romance");
  c.render({ generoExcluido: "fantasia" });
  c.respostas.push(Promise.resolve({ obras: [], pagina: null, falhaTemporaria: true }));
  await c.disparar();
  assert.equal(c.estado.ErroCatalogoExplorar, "consulta");
  c.render({ versaoRetryCatalogo: 1 });
  c.respostas.push(Promise.resolve({ obras: [], pagina: { obraIds: [], proximoCursor: null, temMais: false } }));
  await c.disparar();
  assert.equal(c.estado.ErroCatalogoExplorar, null);
  assert.equal(c.chamadas.filter(([nome]) => nome === "carregar").at(-1)[3][0].generoExcluido, "fantasia");
  c.render({ modoConteudo: "autores" });
  await c.disparar();
  assert.equal(c.chamadas.filter(([nome]) => nome === "carregar").at(-1)[3][0].generoExcluido, undefined);
});

test("exclusão de gênero sozinha exige IDs atuais, não certifica cache em falha e invalida troca de conta", async (t) => {
  const c = preparar(t, { generoExcluido: "acao", usuarioIdExplorar: "A" });
  assert.equal(c.render().generoExcluidoVerificado, false);
  c.respostas.push(Promise.resolve({ obras: [{ id: "cache-tags-antigas" }], pagina: null, falhaTemporaria: true }));
  await c.disparar();
  assert.equal(c.render().generoExcluidoVerificado, false);
  assert.equal(c.estado.ObraIdsBuscaRemota, null);
  const respostaA = adiar();
  c.render({ versaoRetryCatalogo: 1 });
  c.respostas.push(respostaA.promise);
  const pendenteA = c.disparar();
  c.render({ usuarioIdExplorar: "B" });
  c.respostas.push(Promise.resolve({ obras: [{ id: "B" }], pagina: { obraIds: ["B"], proximoCursor: null, temMais: false } }));
  await c.disparar();
  respostaA.resolve({ obras: [{ id: "A" }], pagina: { obraIds: ["A"] } });
  await pendenteA;
  assert.equal(c.render().generoExcluidoVerificado, true);
  assert.deepEqual(c.estado.ObraIdsBuscaRemota, ["B"]);
  assert.deepEqual(c.estado.ObrasLocais, [{ id: "B" }]);
  assert.equal(c.render({ usuarioIdExplorar: "" }).generoExcluidoVerificado, false);
});


test("status editorial exige confirmação atual, combina filtros e descarta resposta antiga e de outra conta", async t => {
  const c = preparar(t, {statusEditorial:"pausada", usuarioIdExplorar:"A", filtroTag:"base", generoExcluido:"romance"});
  assert.equal(c.render().statusEditorialVerificado,false);
  const antiga=adiar();c.respostas.push(antiga.promise);const pendente=c.disparar();
  c.render({statusEditorial:"concluida", usuarioIdExplorar:"B"});
  c.respostas.push(Promise.resolve({obras:[{id:"B"}],pagina:{obraIds:["B"],proximoCursor:null,temMais:false}}));
  await c.disparar();antiga.resolve({obras:[{id:"A"}],pagina:{obraIds:["A"]}});await pendente;
  assert.equal(c.render().statusEditorialVerificado,true);
  assert.deepEqual(c.estado.ObraIdsBuscaRemota,["B"]);
  const consulta=c.chamadas.filter(([nome])=>nome==="carregar").at(-1)[3][0];
  assert.equal(consulta.statusEditorial,"concluida");assert.equal(consulta.tag,"base");assert.equal(consulta.generoExcluido,"romance");
  assert.equal(c.render({usuarioIdExplorar:""}).statusEditorialVerificado,false);
  c.respostas.push(Promise.resolve({obras:[{id:"cache"}],pagina:null,falhaTemporaria:true}));await c.disparar();
  assert.equal(c.render().statusEditorialVerificado,false);assert.equal(c.estado.ObraIdsBuscaRemota,null);
  c.render({modoConteudo:"autores"});await c.disparar();
  assert.equal(c.chamadas.filter(([nome])=>nome==="carregar").at(-1)[3][0].statusEditorial,undefined);
});

test("palavras: par atômico, cursor invalidado, confirmação por consulta e identidade, sem requests extras", async t => {
  const c = preparar(t,{palavrasMinimas:"0",palavrasMaximas:"100",usuarioIdExplorar:"A",statusEditorial:"concluida"});
  assert.equal(c.render().palavrasVerificadas,false); assert.equal(c.estado.ProximoCursorCatalogo,null);
  const cursor={valor:1,data:"2026-01-01",id:"next"};
  const antiga=adiar(); c.respostas.push(antiga.promise); const pendente=c.disparar();
  c.render({palavrasMinimas:"10",palavrasMaximas:"200"});
  c.respostas.push(Promise.resolve({obras:[{id:"certa"}],pagina:{obraIds:["certa"],proximoCursor:cursor,temMais:true}}));
  await c.disparar(); antiga.resolve({obras:[{id:"antiga"}],pagina:{obraIds:["antiga"]}}); await pendente;
  assert.equal(c.render().palavrasVerificadas,true); assert.deepEqual(c.estado.ObraIdsBuscaRemota,["certa"]);
  const calls=c.chamadas.filter(([nome])=>nome==="carregar"); assert.equal(calls.length,2);
  assert.deepEqual([calls[1][3][0].palavrasMinimas,calls[1][3][0].palavrasMaximas],[10,200]);
  assert.equal(calls[1][3][0].statusEditorial,"concluida");
  c.render(); assert.equal(c.timers.size,0);
  assert.equal(c.render({usuarioIdExplorar:"B"}).palavrasVerificadas,false);
  c.respostas.push(Promise.resolve({obras:[{id:"cache"}],pagina:null,falhaTemporaria:true})); await c.disparar();
  assert.equal(c.render().palavrasVerificadas,false); assert.equal(c.estado.ObraIdsBuscaRemota,null);
  assert.equal(c.estado.ErroCatalogoExplorar,"consulta");
  c.render({versaoRetryCatalogo:1});
  c.respostas.push(Promise.resolve({obras:[],pagina:{obraIds:[],proximoCursor:null,temMais:false}})); await c.disparar();
  assert.equal(c.render().palavrasVerificadas,true); assert.deepEqual(c.estado.ObraIdsBuscaRemota,[]);
  assert.equal(c.render({usuarioIdExplorar:""}).palavrasVerificadas,false);
});

test("palavras inválidas bloqueiam RPC/paginação e Autores não envia limites", async t => {
  const c=preparar(t,{palavrasMinimas:"1e3",proximoCursorCatalogo:{valor:1,data:"2026-01-01",id:"antigo"}});
  let r=c.render(); assert.equal(r.palavrasVerificadas,false); assert.equal(c.timers.size,0);
  await r.carregarMaisObrasCatalogo(); assert.equal(c.chamadas.filter(([n])=>n==="carregar").length,0);
  c.render({modoConteudo:"autores"}); c.respostas.push(Promise.resolve({obras:[],pagina:{obraIds:[]}})); await c.disparar();
  const q=c.chamadas.filter(([n])=>n==="carregar").at(-1)[3][0];
  assert.equal(q.palavrasMinimas,undefined); assert.equal(q.palavrasMaximas,undefined);
});

const cursorCorrida = { valor: 1, data: "2026-01-01", id: "pagina-1" };
const respostaCorrida = (id, cursor = null) => ({
  obras: [{ id }], pagina: { obraIds: [id], proximoCursor: cursor, temMais: Boolean(cursor) },
  falhaTemporaria: false,
});
const filtrosCorrida = [
  { busca: "nova busca", termoBusca: "nova busca" },
  { categoriaSelecionada: "Fantasia" },
  { palavrasMinimas: "0", palavrasMaximas: "100" },
  { filtroClassificacao: "Livre" },
  { filtroFormato: "HQ", filtroTag: "magia", tagExcluida: "terror",
    generoExcluido: "Drama", statusEditorial: "concluida", notaMinima: 4 },
];

for (const [indice, filtro] of filtrosCorrida.entries()) {
  test(`corrida ${indice}: troca de filtro descarta consulta e página, inclusive durante debounce`, async t => {
    const c = preparar(t, { busca: "original", termoBusca: "original" });
    let resultado = await confirmarPrimeiraPagina(c, cursorCorrida, [{ id: "p1" }]);
    const pagina = adiar();
    c.respostas.push(pagina.promise);
    const paginacao = resultado.carregarMaisObrasCatalogo();
    const guardPagina = c.chamadas.filter(([nome]) => nome === "carregar").at(-1)[6];
    resultado = c.render(filtro);
    assert.equal(c.estado.ProximoCursorCatalogo, null);
    assert.equal(c.estado.CatalogoTemMais, false);
    assert.equal(c.estado.CarregandoMaisCatalogo, true);
    assert.equal(guardPagina(), false);
    const contagem = c.chamadas.filter(([nome]) => nome === "carregar").length;
    await resultado.carregarMaisObrasCatalogo();
    assert.equal(c.chamadas.filter(([nome]) => nome === "carregar").length, contagem);
    const consulta = adiar();
    c.respostas.push(consulta.promise);
    const consultando = c.disparar();
    pagina.resolve(respostaCorrida("pagina-obsoleta", cursorCorrida));
    await paginacao;
    assert.deepEqual(c.estado.ObrasLocais, [{ id: "p1" }]);
    assert.equal(c.estado.CarregandoMaisCatalogo, true);
    c.render({ ordenacao: "recentes" });
    c.respostas.push(Promise.resolve(respostaCorrida("atual")));
    await c.disparar();
    consulta.resolve(respostaCorrida("consulta-obsoleta", cursorCorrida));
    await consultando;
    assert.deepEqual(c.estado.ObrasLocais, [{ id: "atual" }]);
    assert.equal(c.estado.ProximoCursorCatalogo, null);
    assert.equal(c.estado.CarregandoMaisCatalogo, false);
  });
}

test("cliques no mesmo render e callback antigo não repetem nem reabrem cursor consumido", async t => {
  const c = preparar(t, { termoBusca: "x", busca: "x" });
  const resultado = await confirmarPrimeiraPagina(c, cursorCorrida, [{ id: "p1" }]);
  const pagina = adiar();
  c.respostas.push(pagina.promise);
  const primeira = resultado.carregarMaisObrasCatalogo();
  await resultado.carregarMaisObrasCatalogo();
  assert.equal(c.chamadas.filter(([nome]) => nome === "carregar").length, 2);
  pagina.resolve({ ...respostaCorrida("p2"), obras: [{ id: "p1" }, { id: "p2" }],
    pagina: { obraIds: ["p1", "p2", "p2"], proximoCursor: null, temMais: false } });
  await primeira;
  await resultado.carregarMaisObrasCatalogo();
  assert.equal(c.chamadas.filter(([nome]) => nome === "carregar").length, 2);
  assert.deepEqual(c.estado.ObraIdsBuscaRemota, ["p1", "p2"]);
  assert.deepEqual(c.estado.ObrasLocais, [{ id: "p1" }, { id: "p2" }]);
});

test("callback de filtro anterior não cancela a primeira página atual", async t => {
  const c = preparar(t, { termoBusca: "x", busca: "x" });
  const anterior = await confirmarPrimeiraPagina(c, cursorCorrida);
  c.render({ categoriaSelecionada: "Drama" });
  const consulta = adiar(); c.respostas.push(consulta.promise);
  const pendente = c.disparar();
  await anterior.carregarMaisObrasCatalogo();
  assert.equal(c.chamadas.filter(([nome]) => nome === "carregar").length, 2);
  consulta.resolve(respostaCorrida("nova")); await pendente;
  assert.deepEqual(c.estado.ObrasLocais, [{ id: "nova" }]);
});

for (const alteracao of [{ colecoesCarregadas: false }, { dadosExplorarCarregados: false }, { palavrasMinimas: "1e3" }]) {
  test(`espera/intervalo inválido encerra loading e invalida paginação: ${JSON.stringify(alteracao)}`, async t => {
    const c = preparar(t, { filtroColecao: "favoritas", obrasFavoritas: ["p1"] });
    const resultado = await confirmarPrimeiraPagina(c, cursorCorrida, [{ id: "p1" }]);
    const pagina = adiar(); c.respostas.push(pagina.promise);
    const pendente = resultado.carregarMaisObrasCatalogo();
    c.render(alteracao);
    assert.equal(c.timers.size, 0);
    assert.equal(c.estado.ProximoCursorCatalogo, null);
    assert.equal(c.estado.CatalogoTemMais, false);
    assert.equal(c.estado.CarregandoMaisCatalogo, false);
    const chamadas = c.chamadas.length;
    pagina.reject(new Error("resposta antiga")); await pendente;
    assert.equal(c.chamadas.length, chamadas);
    c.render({ colecoesCarregadas: true, dadosExplorarCarregados: true, palavrasMinimas: "" });
    c.respostas.push(Promise.resolve(respostaCorrida("p1"))); await c.disparar();
    assert.equal(c.estado.CarregandoMaisCatalogo, false);
    assert.equal(c.estado.ErroCatalogoExplorar, null);
  });
}

test("cleanup invalida página pendente sem setters ou persistência posterior", async t => {
  const c = preparar(t, { termoBusca: "x" });
  const resultado = await confirmarPrimeiraPagina(c, cursorCorrida);
  const pagina = adiar(); c.respostas.push(pagina.promise);
  const pendente = resultado.carregarMaisObrasCatalogo();
  const guard = c.chamadas.filter(([nome]) => nome === "carregar").at(-1)[6];
  assert.equal(guard(), true);
  c.cancelar(); const chamadas = c.chamadas.length;
  assert.equal(guard(), false);
  pagina.resolve(respostaCorrida("tardia")); await pendente;
  assert.equal(c.chamadas.length, chamadas);
});

test("conta A → B → logout invalida páginas e troca cache mesmo sem filtro avançado", async t => {
  const c = preparar(t, { termoBusca: "x", busca: "x", usuarioIdExplorar: "A" });
  c.deps.lerStorage = (_chave, usuarioId) => usuarioId === "B" ? '[{"id":"cache-B"}]' : null;
  const resultado = await confirmarPrimeiraPagina(c, cursorCorrida, [{ id: "A" }]);
  const paginaA = adiar(); c.respostas.push(paginaA.promise);
  const pendenteA = resultado.carregarMaisObrasCatalogo();
  c.render({ usuarioIdExplorar: "B" });
  assert.deepEqual(c.estado.ObrasLocais, [{ id: "cache-B" }]);
  c.respostas.push(Promise.resolve(respostaCorrida("B", cursorCorrida))); await c.disparar();
  const chamadaB = c.chamadas.filter(([nome]) => nome === "carregar").at(-1);
  assert.deepEqual(chamadaB[1], [{ id: "cache-B" }]); assert.equal(chamadaB[2], "B");
  paginaA.resolve(respostaCorrida("A-atrasada")); await pendenteA;
  assert.deepEqual(c.estado.ObrasLocais, [{ id: "B" }]);
  const paginaB = adiar(); c.respostas.push(paginaB.promise);
  const pendenteB = c.render({ obrasLocais: c.estado.ObrasLocais,
    proximoCursorCatalogo: cursorCorrida }).carregarMaisObrasCatalogo();
  c.render({ usuarioIdExplorar: "" });
  assert.deepEqual(c.estado.ObrasLocais, []);
  c.respostas.push(Promise.resolve(respostaCorrida("publica"))); await c.disparar();
  const anonima = c.chamadas.filter(([nome]) => nome === "carregar").at(-1);
  assert.deepEqual(anonima[1], []); assert.equal(anonima[2], "");
  paginaB.reject(new Error("falha da conta B")); await pendenteB;
  assert.deepEqual(c.estado.ObrasLocais, [{ id: "publica" }]);
  assert.equal(c.estado.ErroCatalogoExplorar, null);
});

test("retry e coleção nova retiram confirmação de palavras da mesma consulta", async t => {
  const c = preparar(t, { palavrasMinimas: "0", palavrasMaximas: "0" });
  await confirmarPrimeiraPagina(c, cursorCorrida);
  assert.equal(c.render().palavrasVerificadas, true);
  assert.equal(c.render({ versaoRetryCatalogo: 1 }).palavrasVerificadas, false);
  c.respostas.push(Promise.resolve(respostaCorrida("medida", cursorCorrida))); await c.disparar();
  assert.equal(c.render().palavrasVerificadas, true);
  assert.equal(c.render({ filtroColecao: "favoritas", obrasFavoritas: ["medida"] }).palavrasVerificadas, false);
  assert.equal(c.render().palavrasVerificadas, false);
  c.respostas.push(Promise.resolve({ ...respostaCorrida("fallback"), falhaTemporaria: true }));
  await c.disparar();
  assert.equal(c.render().palavrasVerificadas, false);
  assert.equal(c.estado.ProximoCursorCatalogo, null);
  assert.equal(c.estado.CatalogoTemMais, false);
  assert.equal(c.estado.ErroCatalogoExplorar, "consulta");
});

test("consulta neutra recarrega ao mudar identidade e descarta retry da conta anterior", async t => {
  const c = preparar(t, { usuarioIdExplorar: "A" }); c.render();
  const antiga = adiar(); c.respostas.push(antiga.promise);
  c.render({ versaoRetryCatalogo: 1 }); const pendente = c.disparar();
  c.render({ usuarioIdExplorar: "B" });
  c.respostas.push(Promise.resolve(respostaCorrida("B"))); await c.disparar();
  antiga.reject(new Error("A indisponível")); await pendente;
  assert.deepEqual(c.estado.ObrasLocais, [{ id: "B" }]);
  assert.equal(c.estado.ErroCatalogoExplorar, null);
  assert.equal(c.estado.CarregandoMaisCatalogo, false);
});

test("hidratação inicial da identidade preserva seleção neutra sem nova RPC", t => {
  const c = preparar(t, { dadosExplorarCarregados: false, usuarioIdExplorar: "" });
  c.render(); c.render({ usuarioIdExplorar: "A" });
  c.render({ dadosExplorarCarregados: true });
  assert.equal(c.timers.size, 0);
  assert.equal(c.chamadas.filter(([nome]) => nome === "carregar").length, 0);
});

test("trocas rápidas de todos os filtros coalescem no debounce e enviam apenas o par final", async t => {
  const c = preparar(t, { busca: "a", termoBusca: "a" }); c.render();
  for (const filtro of filtrosCorrida) c.render(filtro);
  c.render({ palavrasMinimas: "10", palavrasMaximas: "200", busca: "final", termoBusca: "final" });
  assert.equal(c.timers.size, 1);
  assert.equal(c.chamadas.filter(([nome]) => nome === "carregar").length, 0);
  c.respostas.push(Promise.resolve(respostaCorrida("final"))); await c.disparar();
  const chamadas = c.chamadas.filter(([nome]) => nome === "carregar");
  assert.equal(chamadas.length, 1);
  assert.deepEqual(chamadas[0][3], [{
    busca: "final", genero: "Fantasia", formato: "HQ", tag: "magia", tagExcluida: "terror",
    generoExcluido: "Drama", statusEditorial: "concluida", notaMinima: 4,
    palavrasMinimas: 10, palavrasMaximas: 200, classificacao: "Livre",
    filtroCapitulos: "todos", ordenacao: "relevancia", limite: 24,
  }]);
  assert.equal(c.render().palavrasVerificadas, true);
});

test("troca de identidade limpa cache anterior mesmo enquanto coleções estão pendentes", async t => {
  const c = preparar(t, { usuarioIdExplorar: "A", filtroColecao: "favoritas" });
  await confirmarPrimeiraPagina(c, cursorCorrida, [{ id: "privada-A" }]);
  c.deps.lerStorage = () => '{inválido';
  c.render({ usuarioIdExplorar: "B", colecoesCarregadas: false });
  assert.deepEqual(c.estado.ObrasLocais, []);
  assert.deepEqual(c.props.obrasCacheLocalRef.current, []);
  assert.equal(c.estado.CarregandoMaisCatalogo, false);
  assert.equal(c.timers.size, 0);
});
