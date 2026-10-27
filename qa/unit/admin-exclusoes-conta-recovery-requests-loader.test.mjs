import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(new URL("../../app/admin/exclusoes-conta/loaders/buscar-operacoes-recuperaveis-admin.ts", import.meta.url), "utf8");
const pageSource = readFileSync(new URL("../../app/admin/exclusoes-conta/page.tsx", import.meta.url), "utf8");
const javascript = typescript.transpileModule(source, { compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 } }).outputText;
const { buscarOperacoesRecuperaveisAdmin } = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);

async function comFetch(fetchMock, callback) {
  const original = globalThis.fetch;
  try { globalThis.fetch = fetchMock; return await callback(); } finally { globalThis.fetch = original; }
}

test("loader preserva GET, opções, response e JSON válido", async () => {
  const response = { json: async () => ({ ok: true, operacoes: [{ id: "op-1" }] }) };
  const chamadas = [];
  const resultado = await comFetch(async (...args) => { chamadas.push(args); return response; }, buscarOperacoesRecuperaveisAdmin);
  assert.deepEqual(chamadas, [["/api/admin/operacoes-exclusao", { method: "GET", credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" } }]]);
  assert.strictEqual(resultado.response, response);
  assert.deepEqual(resultado.data, { ok: true, operacoes: [{ id: "op-1" }] });
});

test("loader retorna data nulo quando JSON falha", async () => {
  const response = { json: async () => { throw new Error("json"); } };
  const resultado = await comFetch(async () => response, buscarOperacoesRecuperaveisAdmin);
  assert.strictEqual(resultado.response, response);
  assert.equal(resultado.data, null);
});

test("página mantém decisões HTTP, normalização e estado das recuperações", () => {
  assert.match(pageSource, /import \{ buscarOperacoesRecuperaveisAdmin \} from "\.\/loaders\/buscar-operacoes-recuperaveis-admin";/);
  assert.match(pageSource, /const \{ response, data \} = await buscarOperacoesRecuperaveisAdmin\(\);/);
  assert.match(pageSource, /if \(response\.status === 401\) \{\s*router\.replace\(criarLoginHrefAdminExclusoesConta\(\)\);/);
  assert.match(pageSource, /if \(response\.status === 403\) \{\s*setAcessoNegado\(true\);\s*setOperacoesRecuperaveis\(\[\]\);/);
  assert.match(pageSource, /\.map\(normalizarOperacaoRecuperavel\)/);
  assert.match(pageSource, /setOperacoesRecuperaveis\(/);
  assert.doesNotMatch(pageSource, /type RespostaOperacoes\s*=/);
  assert.doesNotMatch(source, /response\.status === 401|response\.status === 403|router|set[A-Z]|supabase|localStorage|sessionStorage|useState|useEffect|useMemo|useCallback|<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/);
});
