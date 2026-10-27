import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/admin/exclusoes-conta/loaders/buscar-solicitacoes-exclusao-admin.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/admin/exclusoes-conta/page.tsx", import.meta.url),
  "utf8",
);

const javascript = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { buscarSolicitacoesExclusaoAdmin } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);

async function executarComFetch(fetchMock, callback) {
  const fetchOriginal = globalThis.fetch;

  try {
    globalThis.fetch = fetchMock;
    return await callback();
  } finally {
    globalThis.fetch = fetchOriginal;
  }
}

test("loader preserva endpoint, opções GET, response e JSON válido", async () => {
  const response = {
    json: async () => ({ ok: true, solicitacoes: [{ id: "solicitacao-1" }] }),
  };
  const chamadas = [];

  const resultado = await executarComFetch(async (...args) => {
    chamadas.push(args);
    return response;
  }, buscarSolicitacoesExclusaoAdmin);

  assert.deepEqual(chamadas, [
    [
      "/api/admin/solicitacoes-exclusao",
      {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "application/json" },
      },
    ],
  ]);
  assert.strictEqual(resultado.response, response);
  assert.deepEqual(resultado.data, {
    ok: true,
    solicitacoes: [{ id: "solicitacao-1" }],
  });
});

test("loader retorna data nulo quando response.json falha", async () => {
  const response = {
    json: async () => {
      throw new Error("JSON inválido");
    },
  };

  const resultado = await executarComFetch(
    async () => response,
    buscarSolicitacoesExclusaoAdmin,
  );

  assert.strictEqual(resultado.response, response);
  assert.equal(resultado.data, null);
});

test("Admin Exclusões de Conta mantém decisões HTTP, normalização e estados", () => {
  assert.match(
    pageSource,
    /import \{ buscarSolicitacoesExclusaoAdmin \} from "\.\/loaders\/buscar-solicitacoes-exclusao-admin";/,
  );
  assert.match(
    pageSource,
    /const \{ response, data \} = await buscarSolicitacoesExclusaoAdmin\(\);/,
  );
  assert.match(
    pageSource,
    /if \(response\.status === 401\) \{\s*router\.replace\(criarLoginHrefAdminExclusoesConta\(\)\);/,
  );
  assert.match(
    pageSource,
    /if \(response\.status === 403\) \{\s*setAcessoNegado\(true\);\s*setSolicitacoes\(\[\]\);/,
  );
  assert.match(pageSource, /\.map\(normalizarSolicitacao\)/);
  assert.match(pageSource, /setStatusRascunho\(/);
  assert.match(pageSource, /setObservacoes\(/);
  assert.doesNotMatch(pageSource, /type RespostaLista\s*=/);
  assert.doesNotMatch(source, /response\.status === 401|response\.status === 403/);
  assert.doesNotMatch(source, /router|set[A-Z]|supabase|localStorage|sessionStorage/);
  assert.doesNotMatch(
    source,
    /useState|useEffect|useMemo|useCallback|<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/,
  );
});
