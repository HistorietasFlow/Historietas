import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import typescript from "typescript";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const modulePath = path.join(root, "app/explorar/lib/explorar-page-route-utils.ts");
const hookPath = path.join(root, "app/explorar/hooks/use-explorar-route-filter-sync.ts");
const pagePath = path.join(root, "app/explorar/page.tsx");
const categorias = [
  "Ação",
  "Aventura",
  "Comédia",
  "Drama",
  "Fantasia",
  "Ficção",
  "Mistério",
  "Romance",
  "Suspense",
  "Terror",
  "Sobrenatural",
  "Histórico",
  "Biografia",
];
const tagJavascript = typescript.transpileModule(await readFile(path.join(root, "lib/catalogo-tag.ts"), "utf8"), {
  compilerOptions: { module: typescript.ModuleKind.CommonJS },
}).outputText;
const tagModulo = { exports: {} };
new Function("module", "exports", tagJavascript)(tagModulo, tagModulo.exports);
const notaJavascript = typescript.transpileModule(await readFile(path.join(root, "lib/catalogo-nota-minima.ts"), "utf8"), {
  compilerOptions: { module: typescript.ModuleKind.CommonJS },
}).outputText;
const notaModulo = { exports: {} };
new Function("module", "exports", notaJavascript)(notaModulo, notaModulo.exports);

async function carregarModuloRota() {
  const source = await readFile(modulePath, "utf8");
  const javascript = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.CommonJS,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
  const modulo = { exports: {} };

  new Function("module", "exports", "require", javascript)(
    modulo,
    modulo.exports,
    (specifier) => {
      if (specifier === "../../../lib/catalogo-tag") return tagModulo.exports;
      if (specifier === "../../../lib/catalogo-nota-minima") return notaModulo.exports;
      if (specifier === "./explorar-categories") {
        return { categorias };
      }
      if (specifier === "../../publicar/lib/publicar-static-options") {
        return { OPCOES_FORMATO_OBRA: ["Webnovel", "Light novel", "Romance", "Conto", "Poesia", "HQ", "Mangá", "Fanfic"] };
      }

      throw new Error(`Import inesperado no helper de rota: ${specifier}`);
    },
  );

  return modulo.exports;
}

function comWindow(t, urlInicial = "/explorar") {
  const windowAnterior = globalThis.window;
  const listeners = new Map();
  const chamadas = [];
  const url = new URL(urlInicial, "https://historietas.local");
  const location = { pathname: url.pathname, search: url.search };
  const navegar = (metodo, estado, titulo, destino) => {
    const proximaUrl = new URL(destino, "https://historietas.local");
    location.pathname = proximaUrl.pathname;
    location.search = proximaUrl.search;
    chamadas.push([metodo, estado, titulo, destino]);
  };

  globalThis.window = {
    location,
    history: {
      pushState: (...args) => navegar("pushState", ...args),
      replaceState: (...args) => navegar("replaceState", ...args),
    },
    addEventListener(tipo, listener) {
      listeners.set(tipo, listener);
    },
    removeEventListener(tipo, listener) {
      if (listeners.get(tipo) === listener) {
        listeners.delete(tipo);
      }
    },
  };

  t.after(() => {
    if (windowAnterior === undefined) delete globalThis.window;
    else globalThis.window = windowAnterior;
  });

  return { chamadas, listeners };
}

test("lê filtros compartilháveis e normaliza links antigos e inválidos", async () => {
  const { lerFiltrosCompartilhaveisExplorar } = await carregarModuloRota();

  assert.deepEqual(
    lerFiltrosCompartilhaveisExplorar(
      "?tipo=autores&categoria=ficcao&busca=%20drag%C3%A3o%20&ordenacao=mais-recentes&formato=manga",
    ),
    {
      modoConteudo: "autores",
      categoriaSelecionada: "Ficção",
      busca: "dragão",
      ordenacao: "mais-recentes",
      filtroFormato: "Mangá",
    },
  );
  assert.deepEqual(
    lerFiltrosCompartilhaveisExplorar(
      "?tipo=desconhecido&categoria=privada&ordenacao=mais-salvas&colecao=favoritas&formato=privado",
    ),
    {
      modoConteudo: "obras",
      categoriaSelecionada: "",
      busca: "",
      ordenacao: "relevancia",
      filtroFormato: "todos",
    },
  );
});

test("serializa somente filtros públicos e limita a busca compartilhada", async () => {
  const { criarUrlExplorar } = await carregarModuloRota();
  const url = criarUrlExplorar({
    modoConteudo: "autores",
    categoriaSelecionada: " Fantasia ",
    busca: `  ${"a".repeat(100)}  `,
    ordenacao: "mais-curtidas",
    filtroColecao: "favoritas",
    filtroFormato: "HQ",
  });
  const parametros = new URL(url, "https://historietas.local").searchParams;

  assert.equal(parametros.get("tipo"), "autores");
  assert.equal(parametros.get("categoria"), "Fantasia");
  assert.equal(parametros.get("busca"), "a".repeat(90));
  assert.equal(parametros.get("ordenacao"), "mais-curtidas");
  assert.equal(parametros.has("colecao"), false);
  assert.equal(parametros.get("formato"), "HQ");
});

test("mais capítulos é compartilhável em obras e usa fallback seguro em autores", async () => {
  const { lerFiltrosCompartilhaveisExplorar, criarUrlExplorar } = await carregarModuloRota();
  const filtros = lerFiltrosCompartilhaveisExplorar("?ordenacao=mais-capitulos&formato=HQ&categoria=Fantasia");
  assert.equal(filtros.ordenacao, "mais-capitulos");
  assert.equal(criarUrlExplorar(filtros), "/explorar?categoria=Fantasia&ordenacao=mais-capitulos&formato=HQ");
  assert.equal(lerFiltrosCompartilhaveisExplorar("?tipo=autores&ordenacao=mais-capitulos").ordenacao, "relevancia");
  assert.equal(criarUrlExplorar({ ...filtros, modoConteudo: "autores" }), "/explorar?tipo=autores&categoria=Fantasia&formato=HQ");
});

test("tag literal normalizada combina com busca, formato e ordenação na URL", async () => {
  const { lerFiltrosCompartilhaveisExplorar, criarUrlExplorar } = await carregarModuloRota();
  const filtros = lerFiltrosCompartilhaveisExplorar("?tag=%20A%C3%87%C3%83O%20%20ÉPICA%20&busca=dragao&formato=HQ&ordenacao=mais-capitulos");
  assert.equal(filtros.filtroTag, "acao epica");
  assert.equal(criarUrlExplorar(filtros), "/explorar?busca=dragao&ordenacao=mais-capitulos&formato=HQ&tag=acao+epica");
  assert.equal(lerFiltrosCompartilhaveisExplorar("?tag=%20").filtroTag, undefined);
  assert.equal(lerFiltrosCompartilhaveisExplorar(`?tag=${"a".repeat(100)}`).filtroTag.length, 90);
  assert.equal(lerFiltrosCompartilhaveisExplorar("?tag=%25_%5C%2C.%28%29").filtroTag, "%_\\,.()");
});

test("nota mínima combina com tag e formato; inválidos e modo autores não a ativam", async () => {
  const { lerFiltrosCompartilhaveisExplorar, criarUrlExplorar } = await carregarModuloRota();
  const filtros = lerFiltrosCompartilhaveisExplorar("?tag=acao&formato=HQ&ordenacao=mais-capitulos&notaMinima=4.5");
  assert.equal(filtros.notaMinima, 4.5);
  assert.equal(criarUrlExplorar(filtros), "/explorar?ordenacao=mais-capitulos&formato=HQ&tag=acao&notaMinima=4.5");
  for (const valor of ["", "0", "6", "4.1", "NaN", "1e0", "4,5"]) {
    assert.equal(lerFiltrosCompartilhaveisExplorar(`?notaMinima=${encodeURIComponent(valor)}`).notaMinima, undefined);
  }
  assert.equal(lerFiltrosCompartilhaveisExplorar("?tipo=autores&notaMinima=4").notaMinima, undefined);
  assert.doesNotMatch(criarUrlExplorar({ ...filtros, modoConteudo: "autores" }), /notaMinima=/);
});

test("usa push para filtros discretos, replace para busca e evita histórico redundante", async (t) => {
  const { atualizarUrlExplorar } = await carregarModuloRota();
  const ambiente = comWindow(t);
  const filtros = {
    modoConteudo: "obras",
    categoriaSelecionada: "Fantasia",
    busca: "",
    ordenacao: "relevancia",
  };

  atualizarUrlExplorar(filtros);
  atualizarUrlExplorar({ ...filtros, busca: "dragão" }, "replace");
  atualizarUrlExplorar({ ...filtros, busca: "dragão" }, "replace");

  assert.deepEqual(ambiente.chamadas, [
    ["pushState", null, "", "/explorar?categoria=Fantasia"],
    [
      "replaceState",
      null,
      "",
      "/explorar?categoria=Fantasia&busca=drag%C3%A3o",
    ],
  ]);
});

test("popstate reaplica a URL atual e cleanup remove exatamente o listener", async (t) => {
  const { observarFiltrosCompartilhaveisExplorar } = await carregarModuloRota();
  const ambiente = comWindow(
    t,
    "/explorar?tipo=autores&categoria=Romance&busca=ana&ordenacao=mais-recentes&formato=HQ",
  );
  const aplicados = [];
  const cleanup = observarFiltrosCompartilhaveisExplorar((filtros) => {
    aplicados.push(filtros);
  });

  assert.equal(typeof ambiente.listeners.get("popstate"), "function");
  ambiente.listeners.get("popstate")();
  assert.deepEqual(aplicados, [
    {
      modoConteudo: "autores",
      categoriaSelecionada: "Romance",
      busca: "ana",
      ordenacao: "mais-recentes",
      filtroFormato: "HQ",
    },
  ]);

  cleanup();
  assert.equal(ambiente.listeners.has("popstate"), false);
});

test("página e hook preservam debounce, paginação e filtro pessoal fora da URL", async () => {
  const [source, hook, page] = await Promise.all([
    readFile(modulePath, "utf8"),
    readFile(hookPath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);

  assert.match(source, /window\.addEventListener\("popstate"/);
  assert.match(source, /window\.removeEventListener\("popstate"/);
  assert.doesNotMatch(source, /filtroColecao|favoritas|concluidas/);
  assert.match(hook, /observarFiltrosCompartilhaveisExplorar/);
  assert.match(page, /useExplorarRouteFilterSync\(\{/);
  assert.match(page, /atualizarBuscaExplorar/);
  assert.match(page, /"replace"/);
  assert.match(page, /selecionarOrdenacaoExplorar/);
  assert.doesNotMatch(page, /window\.history\.pushState/);
});
