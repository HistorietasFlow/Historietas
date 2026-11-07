import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const fonte = readFileSync(
  new URL(
    "../../app/obra/[slug]/hooks/use-obra-work-metrics-lifecycle.ts",
    import.meta.url,
  ),
  "utf8",
).replace(/\r\n/g, "\n");
const fonteMockada = fonte
  .replace(
    'import { useEffect } from "react";',
    "const useEffect = (...args) => globalThis.__obraMetrics.useEffect(...args);",
  )
  .replace(
    'import { idObraSupabaseValido } from "../../../../lib/utils";',
    "const idObraSupabaseValido = (...args) => globalThis.__obraMetrics.idValido(...args);",
  )
  .replace(
    /import \{[\s\S]*?\} from "\.\.\/lib\/obra-interaction-utils";/,
    "const obraEstaEmListaLocalObraPublica = (...args) => globalThis.__obraMetrics.estaNaLista(...args); const salvarListaLocalObraPublica = (...args) => globalThis.__obraMetrics.salvarLista(...args);",
  )
  .replace(
    /import \{\s*criarMetricasBaseObra,\s*metricasComunidadeObraVazias,\s*metricasObraVazias,[\s\S]*?\} from "\.\.\/lib\/obra-metric-utils";/,
    "const criarMetricasBaseObra = (...args) => globalThis.__obraMetrics.criarMetricasBase(...args); const metricasComunidadeObraVazias = { teorias: 0, reviews: 0, posts: 0, carregado: false }; const metricasObraVazias = { vazio: true };",
  )
  .replace(
    /import \{\s*carregarListaLocalObraPublica,\s*lerStorageUsuarioObraPublica,\s*salvarStorageUsuarioObraPublica,\s*\} from "\.\.\/lib\/obra-user-storage";/,
    "const carregarListaLocalObraPublica = (...args) => globalThis.__obraMetrics.carregarLista(...args); const lerStorageUsuarioObraPublica = (...args) => globalThis.__obraMetrics.lerStorage(...args); const salvarStorageUsuarioObraPublica = (...args) => globalThis.__obraMetrics.salvarStorage(...args);",
  );
const javascript = typescript.transpileModule(fonteMockada, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { useObraWorkMetricsLifecycle } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);

const CHAVES = {
  seguidas: "seguidas",
  curtidas: "curtidas",
  favoritas: "favoritas",
  concluidas: "concluidas",
};
const OBRA = {
  id: "11111111-1111-4111-8111-111111111111",
  titulo: "Minha Obra",
  slug: "minha-obra",
  link: "/obra/minha-obra",
  origem: "supabase",
};

function criarDeferred() {
  let resolver;
  const promise = new Promise((resolve) => {
    resolver = resolve;
  });
  return { promise, resolver };
}

function montarHook({ storage = {}, colecoes = {}, estadoInicial = {} } = {}) {
  const windowAnterior = globalThis.window;
  const efeitos = [];
  const timers = new Map();
  const leituras = [];
  const persistencias = [];
  const carregamentosRemotos = [];
  const versoesInteracoesRef = {
    current: {
      seguimento: 0,
      curtida: 0,
      favorito: 0,
      conclusao: 0,
    },
  };
  let indiceEfeito = 0;
  let proximoTimerId = 1;
  const estado = {
    seguida: estadoInicial.seguida ?? false,
    favoritada: estadoInicial.favoritada ?? false,
    concluida: estadoInicial.concluida ?? false,
    metricas: estadoInicial.metricas ?? null,
    comunidade: estadoInicial.comunidade ?? null,
    totalComentarios: estadoInicial.totalComentarios ?? -1,
  };
  const aplicar = (chave) => (valor) => {
    estado[chave] = typeof valor === "function" ? valor(estado[chave]) : valor;
  };
  const setters = {
    setObraSeguida: aplicar("seguida"),
    setObraFavoritada: aplicar("favoritada"),
    setObraConcluida: aplicar("concluida"),
    setMetricasObra: aplicar("metricas"),
    setMetricasComunidadeObra: aplicar("comunidade"),
    setTotalComentariosObra: aplicar("totalComentarios"),
  };

  globalThis.window = {
    setTimeout(callback, atraso) {
      assert.equal(atraso, 0);
      const id = proximoTimerId++;
      timers.set(id, callback);
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
  };
  globalThis.__obraMetrics = {
    metricasVazias: { vazio: true },
    metricasComunidadeVazias: { teorias: 0, reviews: 0, posts: 0, carregado: false },
    useEffect(efeito, dependencias) {
      const indice = indiceEfeito++;
      const anterior = efeitos[indice];
      const mudou =
        !anterior ||
        dependencias.some(
          (dependencia, posicao) =>
            !Object.is(dependencia, anterior.dependencias[posicao]),
        );
      if (!mudou) return;
      anterior?.cleanup?.();
      efeitos[indice] = { dependencias, cleanup: efeito() };
    },
    lerStorage(chave, usuarioId) {
      leituras.push(["storage", chave, usuarioId]);
      const valor = storage[`${usuarioId}:${chave}`];
      if (valor instanceof Error) throw valor;
      return valor ?? null;
    },
    estaNaLista(_obra, chave, usuarioId) {
      leituras.push(["colecao", chave, usuarioId]);
      return colecoes[`${usuarioId}:${chave}`] ?? false;
    },
    criarMetricasBase() {
      return { visualizacoes: 1, curtidas: 0, comentarios: 2, seguidores: 0 };
    },
    idValido() {
      return true;
    },
    carregarMetricas() {
      const deferred = criarDeferred();
      carregamentosRemotos.push(deferred);
      return deferred.promise;
    },
    carregarLista(chave, usuarioId) {
      leituras.push(["lista", chave, usuarioId]);
      return [];
    },
    salvarStorage(chave, usuarioId, valor) {
      persistencias.push(["storage", chave, usuarioId, valor]);
    },
    salvarLista(_obra, chave, ativo, usuarioId) {
      persistencias.push(["colecao", chave, ativo, usuarioId]);
    },
  };

  function useRenderHook({ obra = OBRA, usuarioId = "usuario-a" } = {}) {
    indiceEfeito = 0;
    useObraWorkMetricsLifecycle({
      obra,
      obraNormalizada: obra ? "minha obra" : "",
      usuarioIdLogado: usuarioId,
      followedWorksStorageKey: CHAVES.seguidas,
      likedWorksStorageKey: CHAVES.curtidas,
      favoritesStorageKey: CHAVES.favoritas,
      completedStorageKey: CHAVES.concluidas,
      versoesInteracoesRef,
      carregarMetricasObra: (...args) =>
        globalThis.__obraMetrics.carregarMetricas(...args),
      ...setters,
    });
  }

  return {
    estado,
    leituras,
    persistencias,
    carregamentosRemotos,
    versoesInteracoesRef,
    useRenderHook,
    executarTimers() {
      for (const [id, callback] of [...timers]) {
        timers.delete(id);
        callback();
      }
    },
    desmontar() {
      for (const efeito of efeitos) efeito?.cleanup?.();
      delete globalThis.__obraMetrics;
      if (windowAnterior === undefined) delete globalThis.window;
      else globalThis.window = windowAnterior;
    },
  };
}

test("aplica seguir favorito e concluido do estado local por usuario", () => {
  const cenario = montarHook({
    storage: {
      "usuario-a:seguidas": JSON.stringify(["minha obra"]),
      "usuario-a:curtidas": JSON.stringify(["minha obra"]),
    },
    colecoes: {
      "usuario-a:favoritas": true,
      "usuario-a:concluidas": true,
    },
  });
  try {
    cenario.useRenderHook();
    cenario.executarTimers();
    assert.equal(cenario.estado.seguida, true);
    assert.equal(cenario.estado.favoritada, true);
    assert.equal(cenario.estado.concluida, true);
    assert.equal(cenario.estado.metricas.curtidaAtiva, true);
    assert.deepEqual(cenario.leituras.slice(0, 4), [
      ["storage", "seguidas", "usuario-a"],
      ["colecao", "favoritas", "usuario-a"],
      ["colecao", "concluidas", "usuario-a"],
      ["storage", "curtidas", "usuario-a"],
    ]);
  } finally {
    cenario.desmontar();
  }
});

test("troca de usuario cancela timer anterior e aplica somente a nova conta", () => {
  const cenario = montarHook({
    storage: {
      "usuario-a:seguidas": JSON.stringify(["minha obra"]),
      "usuario-b:seguidas": JSON.stringify([]),
      "usuario-a:curtidas": JSON.stringify(["minha obra"]),
      "usuario-b:curtidas": JSON.stringify([]),
    },
    colecoes: {
      "usuario-a:favoritas": true,
      "usuario-a:concluidas": true,
      "usuario-b:favoritas": false,
      "usuario-b:concluidas": false,
    },
  });
  try {
    cenario.useRenderHook({ usuarioId: "usuario-a" });
    cenario.useRenderHook({ usuarioId: "usuario-b" });
    cenario.executarTimers();
    assert.equal(cenario.estado.seguida, false);
    assert.equal(cenario.estado.favoritada, false);
    assert.equal(cenario.estado.concluida, false);
    assert.equal(cenario.estado.metricas.curtidaAtiva, false);
  } finally {
    cenario.desmontar();
  }
});

test("ausencia de obra reseta colecoes no timer com cleanup", () => {
  const cenario = montarHook({
    estadoInicial: { favoritada: true, concluida: true, totalComentarios: 9 },
  });
  try {
    cenario.useRenderHook({ obra: null, usuarioId: "" });
    cenario.executarTimers();
    assert.equal(cenario.estado.favoritada, false);
    assert.equal(cenario.estado.concluida, false);
    assert.deepEqual(cenario.estado.metricas, { vazio: true });
    assert.equal(cenario.estado.totalComentarios, 0);
  } finally {
    cenario.desmontar();
  }
});

test("snapshot remoto prevalece e sincroniza estados e storage da conta", async () => {
  const cenario = montarHook();
  try {
    cenario.useRenderHook({ obra: { ...OBRA, origem: "local" } });
    cenario.executarTimers();
    cenario.carregamentosRemotos[0].resolver({
      carregado: true,
      obras: new Map([
        [
          OBRA.id,
          {
            visualizacoes: 10,
            interacoesDiretas: { curtidas: 4, comentarios: 3, seguidores: 2 },
            comunidade: { teorias: 1, reviews: 2, posts: 3 },
            usuario: { curtiu: true, seguiu: true, favoritou: true, concluiu: true },
          },
        ],
      ]),
    });
    await Promise.resolve();
    await Promise.resolve();

    assert.equal(cenario.estado.seguida, true);
    assert.equal(cenario.estado.favoritada, true);
    assert.equal(cenario.estado.concluida, true);
    assert.equal(cenario.estado.metricas.curtidas, 4);
    assert.equal(cenario.estado.totalComentarios, 3);
    assert.deepEqual(
      cenario.persistencias.filter(([tipo]) => tipo === "colecao"),
      [
        ["colecao", "favoritas", true, "usuario-a"],
        ["colecao", "concluidas", true, "usuario-a"],
      ],
    );
  } finally {
    cenario.desmontar();
  }
});

test("snapshot remoto iniciado antes das acoes nao sobrescreve as interacoes novas", async () => {
  const cenario = montarHook();
  try {
    cenario.useRenderHook({ obra: { ...OBRA, origem: "local" } });
    cenario.executarTimers();

    cenario.estado.seguida = true;
    cenario.estado.favoritada = true;
    cenario.estado.concluida = true;
    cenario.estado.metricas = {
      ...cenario.estado.metricas,
      curtidaAtiva: true,
      curtidas: 1,
      seguidores: 1,
    };
    cenario.versoesInteracoesRef.current.seguimento += 1;
    cenario.versoesInteracoesRef.current.curtida += 1;
    cenario.versoesInteracoesRef.current.favorito += 1;
    cenario.versoesInteracoesRef.current.conclusao += 1;

    cenario.carregamentosRemotos[0].resolver({
      carregado: true,
      obras: new Map([
        [
          OBRA.id,
          {
            visualizacoes: 10,
            interacoesDiretas: { curtidas: 0, comentarios: 2, seguidores: 0 },
            comunidade: { teorias: 0, reviews: 0, posts: 0 },
            usuario: {
              curtiu: false,
              seguiu: false,
              favoritou: false,
              concluiu: false,
            },
          },
        ],
      ]),
    });
    await Promise.resolve();
    await Promise.resolve();

    assert.equal(cenario.estado.seguida, true);
    assert.equal(cenario.estado.favoritada, true);
    assert.equal(cenario.estado.concluida, true);
    assert.equal(cenario.estado.metricas.curtidaAtiva, true);
    assert.equal(cenario.estado.metricas.curtidas, 1);
    assert.equal(cenario.estado.metricas.seguidores, 1);
  } finally {
    cenario.desmontar();
  }
});

test("storage invalido preserva fallback local falso", () => {
  const cenario = montarHook({
    storage: {
      "usuario-a:seguidas": new Error("storage indisponivel"),
      "usuario-a:curtidas": "{invalido",
    },
  });
  try {
    cenario.useRenderHook();
    cenario.executarTimers();
    assert.equal(cenario.estado.seguida, false);
    assert.equal(cenario.estado.metricas.curtidaAtiva, false);
  } finally {
    cenario.desmontar();
  }
});
