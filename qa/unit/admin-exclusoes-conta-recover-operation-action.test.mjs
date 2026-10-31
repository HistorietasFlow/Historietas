import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(new URL("../../app/admin/exclusoes-conta/actions/recuperar-operacao-exclusao-admin.ts", import.meta.url), "utf8");
const pageSource = readFileSync(new URL("../../app/admin/exclusoes-conta/page.tsx", import.meta.url), "utf8");
const hookSource = readFileSync(new URL("../../app/admin/exclusoes-conta/hooks/use-admin-exclusoes-conta-actions.ts", import.meta.url), "utf8");
const javascript = typescript.transpileModule(source, { compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 } }).outputText;
const { recuperarOperacaoExclusaoAdmin } = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);
async function comFetch(fetchMock, callback) { const original = globalThis.fetch; try { globalThis.fetch = fetchMock; return await callback(); } finally { globalThis.fetch = original; } }

test("action preserva POST, payload, headers, response e JSON válido", async () => {
  const response = { json: async () => ({ ok: true, exclusaoConcluida: true }) };
  const chamadas = [];
  const resultado = await comFetch(async (...args) => { chamadas.push(args); return response; }, () => recuperarOperacaoExclusaoAdmin({ id: "op-1" }));
  assert.deepEqual(chamadas, [["/api/admin/operacoes-exclusao", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ id: "op-1" }) }]]);
  assert.strictEqual(resultado.response, response);
  assert.deepEqual(resultado.data, { ok: true, exclusaoConcluida: true });
});
test("action retorna data nulo quando JSON falha", async () => {
  const response = { json: async () => { throw new Error("json"); } };
  const resultado = await comFetch(async () => response, () => recuperarOperacaoExclusaoAdmin({ id: "op" }));
  assert.strictEqual(resultado.response, response);
  assert.equal(resultado.data, null);
});
test("hook mantém HTTP, recarga, feedback e controle de fluxo", () => {
  assert.match(hookSource, /import \{ recuperarOperacaoExclusaoAdmin \} from "\.\.\/actions\/recuperar-operacao-exclusao-admin";/);
  assert.match(hookSource, /await recuperarOperacaoExclusaoAdmin\(\{\s*id: operacao\.id,/);
  assert.match(hookSource, /if \(response\.status === 401\) \{\s*router\.replace\(criarLoginHrefAdminExclusoesConta\(\)\);/);
  assert.match(hookSource, /if \(response\.status === 403\) \{\s*setAcessoNegado\(true\);/);
  assert.match(hookSource, /await carregarOperacoesRecuperaveis\(\);/);
  assert.match(hookSource, /data\.exclusaoConcluida/);
  assert.match(hookSource, /catch \(error\)/);
  assert.match(hookSource, /finally \{\s*setAcaoEmAndamento\(""\);/);
  assert.match(pageSource, /useAdminExclusoesContaActions/);
  assert.doesNotMatch(pageSource, /type RespostaRecuperacao\s*=/);
  assert.doesNotMatch(source, /response\.status === 401|response\.status === 403|router|set[A-Z]|supabase|localStorage|sessionStorage|useState|useEffect|useMemo|useCallback|carregarOperacoesRecuperaveis|<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/);
});
