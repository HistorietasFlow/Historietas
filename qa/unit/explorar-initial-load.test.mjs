import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (arquivo) =>
  readFileSync(new URL(arquivo, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const pagina = ler("../../app/explorar/page.tsx");
const codigo = ler("../../app/explorar/hooks/use-explorar-initial-load.ts");
const codigoExecutavel = codigo.replace(/^import[\s\S]*?from "[^"]+";\n/gm, "");
const dependencias = [
  "lerStorageUsuarioExplorar", "salvarJsonStorageUsuarioExplorar",
  "carregarListaIdsUsuarioExplorar", "salvarListaIdsUsuarioExplorar",
  "obterArquivoObraComBackup", "salvarBackupsArquivosObras", "normalizarObra",
  "carregarColecoesUsuarioExplorar", "carregarObrasPublicadasSupabase",
];
const injecao = `
const useRef = (valor) => ({ current: valor });
const useEffect = (efeito, deps) => { globalThis.__explorarInitialTest.effect = efeito; globalThis.__explorarInitialTest.deps = deps; };
const supabase = { auth: { getUser: (...args) => globalThis.__explorarInitialTest.getUser(...args) } };
const STORAGE_KEY = "historietas-obras";
` + dependencias.map((nome) =>
  `const ${nome} = (...args) => globalThis.__explorarInitialTest.${nome}(...args);`
).join("\n");
const javascript = typescript.transpileModule(injecao + "\n" + codigoExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const modulo = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);
const tick = () => new Promise((resolve) => setImmediate(resolve));
const aguardar = async () => { await tick(); await tick(); };

function preparar(t, opcoes = {}) {
  const originalWindow = globalThis.window;
  globalThis.window = { location: { search: opcoes.query || "" } };
  t.after(() => {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
    delete globalThis.__explorarInitialTest;
  });
  const chamadas = [];
  const estado = {};
  const refs = { obrasCacheLocalRef: { current: [] }, usuarioIdExplorarRef: { current: "" } };
  const registrar = (nome, retorno) => (...args) => {
    chamadas.push([nome, ...args]);
    return typeof retorno === "function" ? retorno(...args) : retorno;
  };
  const deps = {
    getUser: registrar("getUser", () => {
      if (opcoes.erroAuth) throw new Error("auth");
      return Promise.resolve({ data: { user: opcoes.userId ? { id: opcoes.userId } : null } });
    }),
    lerStorageUsuarioExplorar: registrar("ler", opcoes.storage ?? null),
    normalizarObra: registrar("normalizar", (obra, index, userId) => ({ ...obra, index, userId })),
    obterArquivoObraComBackup: registrar("backup", null),
    salvarBackupsArquivosObras: registrar("salvarBackups"),
    salvarJsonStorageUsuarioExplorar: registrar("salvarObras"),
    carregarListaIdsUsuarioExplorar: registrar("carregarLista", (chave) =>
      chave === "favoritas" ? (opcoes.favoritas || []) : (opcoes.concluidas || [])),
    salvarListaIdsUsuarioExplorar: registrar("salvarLista"),
    carregarColecoesUsuarioExplorar: registrar("colecoes", () =>
      opcoes.colecoesPromise || Promise.resolve(opcoes.colecoes || { favoritas: [], concluidas: [] })),
    carregarObrasPublicadasSupabase: registrar("catalogo", () =>
      opcoes.catalogoPromise || Promise.resolve(opcoes.catalogo || { obras: [], pagina: null })),
  };
  globalThis.__explorarInitialTest = deps;
  const props = {
    ...refs,
    FAVORITES_STORAGE_KEY: "favoritas",
    COMPLETED_STORAGE_KEY: "concluidas",
  };
  for (const nome of [
    "ModoConteudo", "CategoriaSelecionada", "UsuarioLogado", "ObrasLocais",
    "ObrasFavoritas", "ObrasConcluidas", "ProximoCursorCatalogo",
    "CatalogoTemMais", "DadosExplorarCarregados",
  ]) {
    props[`set${nome}`] = (valor) => {
      chamadas.push([`set${nome}`, valor]);
      estado[nome] = valor;
    };
  }
  modulo.useExplorarInitialLoad(props);
  const cleanup = deps.effect();
  return { chamadas, estado, refs, deps, cleanup };
}

test("corpo do efeito é literalmente equivalente à base e permanece isolado", () => {
  const inicio = codigo.indexOf("  useEffect(() => {\n");
  const fim = codigo.indexOf("\n  }, []);", inicio) + "\n  }, []);".length;
  const efeito = codigo.slice(inicio, fim).replace(
    /    const \{[\s\S]*?\} = opcoesIniciaisRef\.current;\n\n/,
    "",
  );
  assert.equal(createHash("sha256").update(efeito).digest("hex"),
    "fce3ff57fa536c68e64667482caa1adbf8b298b986137a84a90c3902e67c220f");
  assert.match(pagina, /useExplorarInitialLoad\(\{/);
  assert.doesNotMatch(pagina, /async function carregarExplorar\(/);
  for (const nome of ["obrasCacheLocalRef", "usuarioIdExplorarRef", "setDadosExplorarCarregados",
    "setProximoCursorCatalogo", "setCatalogoTemMais"]) {
    assert.match(pagina, new RegExp(`\\b${nome}\\b`));
  }
  assert.match(pagina, /useExplorarAuthState\(\{/);
  assert.match(pagina, /useExplorarAuthorData\(\{/);
  assert.match(pagina, /useExplorarCatalogQuery\(\{/);
  assert.match(ler("../../app/explorar/hooks/use-explorar-catalog-query.ts"), /consultaCatalogoRef/);
  assert.doesNotMatch(codigo, /onAuthStateChange|carregarDadosAutores|consultaCatalogoRef/);
});

test("visitante usa parâmetros da URL e não consulta coleções remotas", async (t) => {
  const c = preparar(t, { query: "?tipo=autores&categoria=%20Fic%C3%A7%C3%A3o%20" });
  await aguardar();
  assert.deepEqual(c.deps.deps, []);
  assert.equal(c.estado.ModoConteudo, "autores");
  assert.equal(c.estado.CategoriaSelecionada, "Ficção");
  assert.equal(c.estado.UsuarioLogado, false);
  assert.deepEqual(c.estado.ObrasFavoritas, []);
  assert.deepEqual(c.estado.ObrasConcluidas, []);
  assert.equal(c.estado.ProximoCursorCatalogo, null);
  assert.equal(c.estado.CatalogoTemMais, false);
  assert.equal(c.estado.DadosExplorarCarregados, true);
  assert.equal(c.refs.usuarioIdExplorarRef.current, "");
  assert.ok(!c.chamadas.some(([nome]) => nome === "colecoes" || nome === "carregarLista"));
  assert.deepEqual(c.chamadas.find(([nome]) => nome === "catalogo").slice(1), [[], ""]);
});

test("usuário combina coleções, persiste dados e atualiza estado antes do catálogo", async (t) => {
  let resolverCatalogo;
  const catalogoPromise = new Promise((resolve) => { resolverCatalogo = resolve; });
  const c = preparar(t, {
    userId: "u1", storage: '[{"id":"local"}]', favoritas: ["a", "b"],
    concluidas: ["c"], colecoes: { favoritas: ["b", "d"], concluidas: ["c", "e"] },
    catalogoPromise,
  });
  await aguardar();
  const normalizada = [{ id: "local", index: 0, userId: "u1" }];
  assert.deepEqual(c.refs.obrasCacheLocalRef.current, normalizada);
  assert.equal(c.refs.usuarioIdExplorarRef.current, "u1");
  assert.deepEqual(c.estado.ObrasLocais, normalizada);
  assert.deepEqual(c.estado.ObrasFavoritas, ["a", "b", "d"]);
  assert.deepEqual(c.estado.ObrasConcluidas, ["c", "e"]);
  assert.equal(c.estado.DadosExplorarCarregados, undefined);
  assert.deepEqual(c.chamadas.filter(([nome]) => nome === "salvarLista"), [
    ["salvarLista", "favoritas", "u1", ["a", "b", "d"]],
    ["salvarLista", "concluidas", "u1", ["c", "e"]],
  ]);
  const ordem = c.chamadas.map(([nome]) => nome);
  assert.ok(ordem.indexOf("normalizar") < ordem.indexOf("salvarBackups"));
  assert.ok(ordem.indexOf("salvarBackups") < ordem.indexOf("colecoes"));
  assert.ok(ordem.indexOf("colecoes") < ordem.indexOf("catalogo"));
  assert.ok(ordem.indexOf("setObrasLocais") < ordem.indexOf("catalogo"));
  assert.deepEqual(c.chamadas.find(([nome]) => nome === "salvarObras"),
    ["salvarObras", "historietas-obras", "u1", normalizada]);
  const cursor = { id: "next" };
  resolverCatalogo({ obras: [{ id: "remota" }], pagina: { proximoCursor: cursor, temMais: true } });
  await aguardar();
  assert.deepEqual(c.estado.ObrasLocais, [{ id: "remota" }]);
  assert.deepEqual(c.estado.ProximoCursorCatalogo, cursor);
  assert.equal(c.estado.CatalogoTemMais, true);
  assert.equal(c.estado.DadosExplorarCarregados, true);
});

test("auth indisponível usa visitante; storage inválido cai no fallback e finaliza", async (t) => {
  const c = preparar(t, { erroAuth: true, storage: "{inválido" });
  await aguardar();
  assert.equal(c.estado.UsuarioLogado, false);
  assert.deepEqual(c.estado.ObrasLocais, []);
  assert.deepEqual(c.estado.ObrasFavoritas, []);
  assert.deepEqual(c.estado.ObrasConcluidas, []);
  assert.equal(c.estado.DadosExplorarCarregados, true);
  assert.ok(!c.chamadas.some(([nome]) => nome === "catalogo" || nome === "colecoes"));
});

test("falha de autenticação segue como visitante quando o storage está vazio", async (t) => {
  const c = preparar(t, { erroAuth: true });
  await aguardar();
  assert.equal(c.estado.UsuarioLogado, false);
  assert.equal(c.refs.usuarioIdExplorarRef.current, "");
  assert.deepEqual(c.chamadas.find(([nome]) => nome === "catalogo").slice(1), [[], ""]);
  assert.equal(c.estado.DadosExplorarCarregados, true);
});

test("falha remota preserva fallback geral e finalização", async (t) => {
  const c = preparar(t, { userId: "u", catalogoPromise: Promise.reject(new Error("remoto")) });
  await aguardar();
  assert.deepEqual(c.estado.ObrasLocais, []);
  assert.deepEqual(c.estado.ObrasFavoritas, []);
  assert.deepEqual(c.estado.ObrasConcluidas, []);
  assert.equal(c.estado.DadosExplorarCarregados, true);
});

test("cleanup impede atualizações posteriores sem cancelar a sequência existente", async (t) => {
  let resolverColecoes;
  const colecoesPromise = new Promise((resolve) => { resolverColecoes = resolve; });
  const c = preparar(t, { userId: "u", colecoesPromise });
  await aguardar();
  c.cleanup();
  const estadoAnterior = { ...c.estado };
  resolverColecoes({ favoritas: ["a"], concluidas: [] });
  await aguardar();
  assert.deepEqual(c.estado, estadoAnterior);
  assert.ok(c.chamadas.some(([nome]) => nome === "salvarLista"));
  assert.ok(c.chamadas.some(([nome]) => nome === "catalogo"));
  assert.equal(c.estado.DadosExplorarCarregados, undefined);
});
