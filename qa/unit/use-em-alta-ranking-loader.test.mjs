import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/em-alta/hooks/use-em-alta-ranking-loader.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);
const executavel = modulo.replace(/^import .*;\r?\n/gm, "");
const javascript = typescript.transpileModule(executavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const dependencias = "const { useEffect, supabase, carregarColecoesRankingEmAlta, carregarInteracoesLocaisRankingEmAlta, carregarObrasSupabasePublicadas } = globalThis.__emAltaRankingLoaderTest;\n";
let sequenciaCenarios = 0;

async function executarCenario({ usuarioId = "", authFalha = false, colecoesFalham = false, cancelar = false } = {}) {
  const windowAnterior = globalThis.window;
  const dependenciasAnteriores = globalThis.__emAltaRankingLoaderTest;
  const chamadas = [];
  const timers = [];
  let cleanup;
  let deps;
  const setters = Object.fromEntries([
    "setCarregandoRanking",
    "setUsuarioLogado",
    "setUsuarioLogadoId",
    "setObrasLocais",
    "setObrasFavoritas",
    "setObrasConcluidas",
    "setVisualizacoesRegistradas",
    "setAvaliacoesLocaisRegistradas",
  ].map((nome) => [nome, (valor) => chamadas.push([nome, valor])]));

  globalThis.window = {
    setTimeout(callback, tempo) {
      assert.equal(tempo, 0);
      timers.push(callback);
    },
  };
  globalThis.__emAltaRankingLoaderTest = {
    useEffect(callback, dependenciasDoEfeito) {
      deps = dependenciasDoEfeito;
      cleanup = callback();
    },
    supabase: {
      auth: {
        async getUser() {
          chamadas.push(["getUser"]);
          if (authFalha) throw new Error("auth");
          return { data: { user: { id: "usuario-remoto" } } };
        },
      },
    },
    async carregarColecoesRankingEmAlta(id) {
      chamadas.push(["colecoes", id]);
      if (colecoesFalham) throw new Error("colecoes");
      return { obrasFavoritasNormalizadas: ["favorita"], obrasConcluidasNormalizadas: ["concluida"] };
    },
    carregarInteracoesLocaisRankingEmAlta(id) {
      chamadas.push(["interacoes", id]);
      return { visualizacoesNormalizadas: { obra: 2 }, avaliacoesLocaisNormalizadas: { obra: 4 } };
    },
    async carregarObrasSupabasePublicadas(obras, id) {
      chamadas.push(["obras", obras, id]);
      return ["obra-remota"];
    },
  };

  try {
    const { useEmAltaRankingLoader: executarHook } = await import(
      `data:text/javascript;base64,${Buffer.from(dependencias + javascript + `\n// cenário ${sequenciaCenarios++}`).toString("base64")}`
    );
    executarHook({ usuarioLogadoId: usuarioId, ...setters });
    await new Promise((resolve) => setImmediate(resolve));
    if (cancelar) cleanup();
    const totalTimers = timers.length;
    timers.forEach((callback) => callback());
    return { chamadas, deps, totalTimers };
  } finally {
    if (windowAnterior === undefined) delete globalThis.window;
    else globalThis.window = windowAnterior;
    if (dependenciasAnteriores === undefined) delete globalThis.__emAltaRankingLoaderTest;
    else globalThis.__emAltaRankingLoaderTest = dependenciasAnteriores;
  }
}

test("ranking preserva ordem do carregamento e atualizações com usuário conhecido", async () => {
  const { chamadas, deps, totalTimers } = await executarCenario({ usuarioId: "usuario-local" });
  assert.deepEqual(deps, ["usuario-local"]);
  assert.equal(totalTimers, 4);
  assert.deepEqual(chamadas, [
    ["colecoes", "usuario-local"],
    ["interacoes", "usuario-local"],
    ["obras", [], "usuario-local"],
    ["setCarregandoRanking", true],
    ["setUsuarioLogado", true],
    ["setUsuarioLogadoId", "usuario-local"],
    ["setObrasLocais", []],
    ["setObrasFavoritas", ["favorita"]],
    ["setObrasConcluidas", ["concluida"]],
    ["setVisualizacoesRegistradas", { obra: 2 }],
    ["setAvaliacoesLocaisRegistradas", { obra: 4 }],
    ["setObrasLocais", ["obra-remota"]],
    ["setCarregandoRanking", false],
  ]);
});

test("busca usuário ausente e preserva fallback quando autenticação falha", async () => {
  const autenticado = await executarCenario();
  assert.deepEqual(autenticado.chamadas.slice(0, 4), [
    ["getUser"], ["colecoes", "usuario-remoto"], ["interacoes", "usuario-remoto"],
    ["obras", [], "usuario-remoto"],
  ]);
  const visitante = await executarCenario({ authFalha: true });
  assert.deepEqual(visitante.chamadas.slice(0, 4), [
    ["getUser"], ["colecoes", ""], ["interacoes", ""], ["obras", [], ""],
  ]);
  assert.ok(visitante.chamadas.some(([nome, valor]) => nome === "setUsuarioLogado" && valor === false));
});

test("falha geral limpa os estados e encerra o carregamento", async () => {
  const { chamadas, totalTimers } = await executarCenario({ usuarioId: "usuario", colecoesFalham: true });
  assert.equal(totalTimers, 3);
  assert.deepEqual(chamadas, [
    ["colecoes", "usuario"],
    ["setCarregandoRanking", true],
    ["setObrasLocais", []],
    ["setObrasFavoritas", []],
    ["setObrasConcluidas", []],
    ["setVisualizacoesRegistradas", {}],
    ["setAvaliacoesLocaisRegistradas", {}],
    ["setCarregandoRanking", false],
  ]);
});

test("cleanup impede que os timers apliquem estados após cancelamento", async () => {
  const { chamadas, totalTimers } = await executarCenario({ usuarioId: "usuario", cancelar: true });
  assert.equal(totalTimers, 4);
  assert.deepEqual(chamadas.map(([nome]) => nome), ["colecoes", "interacoes", "obras"]);
});

test("página delega o lifecycle com estados externos e mesmas dependências", () => {
  assert.match(pagina, /import \{ useEmAltaRankingLoader \} from "\.\/hooks\/use-em-alta-ranking-loader";/);
  assert.match(pagina, /useEmAltaRankingLoader\(\{/);
  assert.doesNotMatch(pagina, /async function carregarRanking\(/);
  assert.match(modulo, /\}, \[usuarioLogadoId\]\);/);
  assert.equal((modulo.match(/window\.setTimeout\(/g) || []).length, 5);
  assert.match(modulo, /cancelado = true/);
  assert.doesNotMatch(modulo, /\.insert\(|\.update\(|\.delete\(|\.upsert\(/);
});
