import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL(
    "../../app/em-alta/lib/em-alta-ranking-local-interactions.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);
const executavel = modulo
  .replace(
    /import \{[\s\S]*?\} from "\.\/em-alta-local-storage-utils";\r?\n/,
    `const VIEWED_WORKS_STORAGE_KEY = "historietas-obras-visualizacoes";
const RATED_WORKS_STORAGE_KEY = "historietas-obras-avaliacoes";
const criarStorageKeyUsuarioEmAlta = (chave, userId) => {
  const userIdLimpo = userId.trim();
  return userIdLimpo ? \`${"${chave}"}:${"${userIdLimpo}"}\` : "";
};
`,
  )
  .replace(
    /import \{[\s\S]*?\} from "\.\/em-alta-ranking-data-utils";\r?\n/,
    `const normalizarVisualizacoesRanking = (valor) => Object.fromEntries(
  Object.entries(valor || {}).flatMap(([chave, total]) => {
    const chaveLimpa = chave.trim();
    return chaveLimpa && typeof total === "number" && Number.isFinite(total) && total > 0
      ? [[chaveLimpa, Math.round(total)]]
      : [];
  }),
);
const normalizarAvaliacoesLocaisRanking = (valor) => Object.fromEntries(
  Object.entries(valor || {}).flatMap(([chave, nota]) => {
    const chaveLimpa = chave.trim();
    const notaNumerica = typeof nota === "number" && Number.isFinite(nota)
      ? Math.round(nota * 2) / 2
      : 0;
    return chaveLimpa && notaNumerica >= 0.5 && notaNumerica <= 5
      ? [[chaveLimpa, notaNumerica]]
      : [];
  }),
);
`,
  );
const javascript = typescript.transpileModule(executavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { carregarInteracoesLocaisRankingEmAlta } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

function comBrowser(armazenamento, executar) {
  const windowOriginal = globalThis.window;
  const storageOriginal = globalThis.localStorage;

  globalThis.window = {};
  globalThis.localStorage = armazenamento;

  try {
    executar();
  } finally {
    if (windowOriginal === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = windowOriginal;
    }

    if (storageOriginal === undefined) {
      delete globalThis.localStorage;
    } else {
      globalThis.localStorage = storageOriginal;
    }
  }
}

test("carrega e normaliza visualizações e avaliações na ordem atual", () => {
  const leituras = [];

  comBrowser(
    {
      getItem(chave) {
        leituras.push(chave);

        if (chave === "historietas-obras-visualizacoes:usuario-a") {
          return JSON.stringify({ " obra-a ": 1.6, ignorar: 0 });
        }

        return JSON.stringify({ " obra-a ": 4.26, baixa: 0.25 });
      },
    },
    () => {
      assert.deepEqual(carregarInteracoesLocaisRankingEmAlta(" usuario-a "), {
        visualizacoesNormalizadas: { "obra-a": 2 },
        avaliacoesLocaisNormalizadas: { "obra-a": 4.5, baixa: 0.5 },
      });
    },
  );

  assert.deepEqual(leituras, [
    "historietas-obras-visualizacoes:usuario-a",
    "historietas-obras-avaliacoes:usuario-a",
  ]);
});

test("preserva os fallbacks vazios e a propagação de falhas do storage", () => {
  comBrowser(
    { getItem: () => null },
    () => {
      assert.deepEqual(carregarInteracoesLocaisRankingEmAlta(""), {
        visualizacoesNormalizadas: {},
        avaliacoesLocaisNormalizadas: {},
      });
    },
  );

  comBrowser(
    {
      getItem() {
        throw new Error("storage bloqueado");
      },
    },
    () => {
      assert.throws(() => carregarInteracoesLocaisRankingEmAlta("usuario-a"));
    },
  );

  comBrowser(
    { getItem: () => "{inválido" },
    () => {
      assert.throws(() => carregarInteracoesLocaisRankingEmAlta("usuario-a"));
    },
  );
});

test("a página delega a leitura local sem alterar o lifecycle do ranking", () => {
  assert.match(
    modulo,
    /export function carregarInteracoesLocaisRankingEmAlta\(userId: string\)/,
  );
  assert.match(
    modulo,
    /criarStorageKeyUsuarioEmAlta\(VIEWED_WORKS_STORAGE_KEY, userId\)/,
  );
  assert.match(
    modulo,
    /criarStorageKeyUsuarioEmAlta\(RATED_WORKS_STORAGE_KEY, userId\)/,
  );
  assert.match(modulo, /normalizarVisualizacoesRanking\(visualizacoesJson\)/);
  assert.match(modulo, /normalizarAvaliacoesLocaisRanking\(avaliacoesLocaisJson\)/);
  assert.doesNotMatch(modulo, /from ["']react["']/i);
  assert.doesNotMatch(modulo, /supabase/i);
  assert.doesNotMatch(modulo, /function carregarRanking\(/);
  assert.match(
    pagina,
    /import \{ carregarInteracoesLocaisRankingEmAlta \} from "\.\/lib\/em-alta-ranking-local-interactions";/,
  );
  assert.match(pagina, /carregarInteracoesLocaisRankingEmAlta\(userIdAtual\)/);
  assert.match(pagina, /async function carregarRanking\(/);
  assert.doesNotMatch(pagina, /const chaveVisualizacoesUsuario =/);
  assert.doesNotMatch(pagina, /const chaveAvaliacoesUsuario =/);
});
