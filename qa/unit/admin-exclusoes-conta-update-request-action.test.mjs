import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(new URL("../../app/admin/exclusoes-conta/actions/atualizar-solicitacao-exclusao-admin.ts", import.meta.url), "utf8");
const pageSource = readFileSync(new URL("../../app/admin/exclusoes-conta/page.tsx", import.meta.url), "utf8");
const hookSource = readFileSync(new URL("../../app/admin/exclusoes-conta/hooks/use-admin-exclusoes-conta-actions.ts", import.meta.url), "utf8");
const executable = source.replace('import type { StatusSolicitacaoExclusao } from "../lib/admin-exclusoes-conta-normalization-utils";\n\n', "");
const javascript = typescript.transpileModule(executable, { compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 } }).outputText;
const { atualizarSolicitacaoExclusaoAdmin } = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);

async function comFetch(fetchMock, callback) { const original = globalThis.fetch; try { globalThis.fetch = fetchMock; return await callback(); } finally { globalThis.fetch = original; } }

test("action preserva PATCH, payload, headers, response e JSON válido", async () => {
  const response = { json: async () => ({ ok: true, solicitacao: { id: "s-1" } }) };
  const chamadas = [];
  const resultado = await comFetch(async (...args) => { chamadas.push(args); return response; }, () => atualizarSolicitacaoExclusaoAdmin({ id: "s-1", status: "verificando", observacaoInterna: "nota" }));
  assert.deepEqual(chamadas, [["/api/admin/solicitacoes-exclusao", { method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ id: "s-1", status: "verificando", observacaoInterna: "nota" }) }]]);
  assert.strictEqual(resultado.response, response);
  assert.deepEqual(resultado.data, { ok: true, solicitacao: { id: "s-1" } });
});

test("action retorna data nulo quando JSON falha", async () => {
  const response = { json: async () => { throw new Error("json"); } };
  const resultado = await comFetch(async () => response, () => atualizarSolicitacaoExclusaoAdmin({ id: "s", status: "pendente", observacaoInterna: "" }));
  assert.strictEqual(resultado.response, response);
  assert.equal(resultado.data, null);
});

test("hook mantém validação, decisões HTTP, normalização e três estados", () => {
  assert.match(hookSource, /import \{ atualizarSolicitacaoExclusaoAdmin \} from "\.\.\/actions\/atualizar-solicitacao-exclusao-admin";/);
  assert.match(hookSource, /observacaoInterna\.length > 4000/);
  assert.match(hookSource, /await atualizarSolicitacaoExclusaoAdmin\(\{\s*id: solicitacao\.id,\s*status: novoStatus,\s*observacaoInterna,/);
  assert.match(hookSource, /if \(response\.status === 401\) \{\s*router\.replace\(criarLoginHrefAdminExclusoesConta\(\)\);/);
  assert.match(hookSource, /if \(response\.status === 403\) \{\s*setAcessoNegado\(true\);/);
  assert.match(hookSource, /normalizarSolicitacao\(data\.solicitacao\)/);
  for (const setter of ["setSolicitacoes", "setStatusRascunho", "setObservacoes"]) assert.match(hookSource, new RegExp(`${setter}\\(`));
  assert.match(pageSource, /useAdminExclusoesContaActions/);
  assert.doesNotMatch(pageSource, /type RespostaAtualizacao\s*=/);
  assert.doesNotMatch(source, /response\.status === 401|response\.status === 403|router|set[A-Z]|supabase|localStorage|sessionStorage|useState|useEffect|useMemo|useCallback|<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/);
});
