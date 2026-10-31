import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  "app/admin/problemas-tecnicos/hooks/use-admin-problemas-tecnicos-actions.ts",
  "utf8",
);
const page = readFileSync(
  "app/admin/problemas-tecnicos/page.tsx",
  "utf8",
);

test("hook preserva a assinatura e a autorização da atualização", () => {
  assert.match(hook, /function useAdminProblemasTecnicosActions/);
  assert.match(hook, /async function atualizarChamado\(/);
  assert.match(hook, /problema: ProblemaTecnico/);
  assert.match(
    hook,
    /"status" \| "prioridade" \| "observacaoAdmin"/,
  );
  assert.match(hook, /if \(!usuarioId \|\| !ehAdmin\)/);
  assert.match(
    hook,
    /Apenas administradores podem atualizar chamados técnicos\./,
  );
});

test("hook preserva payload, mutation e tratamento de retorno", () => {
  [
    'const payload: TablesUpdate<"problemas_tecnicos"> = {};',
    "if (alteracoes.status) payload.status = alteracoes.status;",
    "if (alteracoes.prioridade) payload.prioridade = alteracoes.prioridade;",
    'typeof alteracoes.observacaoAdmin === "string"',
    "alteracoes.observacaoAdmin.trim()",
    "atualizarProblemaTecnicoAdmin({",
    "id: problema.id,",
    "payload,",
    "if (error)",
    "throw error;",
    "if (!data)",
    "O chamado não foi encontrado ou não pôde ser atualizado.",
  ].forEach((contrato) => assert.ok(hook.includes(contrato), contrato));
  assert.doesNotMatch(hook, /\.from\(|\.update\(|\.select\(/);
});

test("hook preserva atualizações imutáveis, mensagens e limpeza", () => {
  [
    "setAcaoEmAndamento(problema.id);",
    "setErro(\"\");",
    "setSucesso(\"\");",
    "setProblemas((atuais) =>",
    "atuais.map((item) =>",
    "...item,",
    "normalizarStatus(atualizado.status)",
    "normalizarPrioridade(atualizado.prioridade)",
    "analisadoPor: String(atualizado.analisado_por || \"\")",
    "analisadoEm: String(atualizado.analisado_em || \"\")",
    "atualizadoEm: String(atualizado.atualizado_em || \"\")",
    "setObservacoes((atuais) => ({",
    "[problema.id]: String(atualizado.observacao_admin || \"\")",
    "setSucesso(mensagemSucesso);",
    'criarMensagemErro("Erro ao atualizar chamado técnico", error)',
    "finally {",
    "setAcaoEmAndamento(\"\");",
  ].forEach((contrato) => assert.ok(hook.includes(contrato), contrato));

  const ordem = [
    "if (!usuarioId || !ehAdmin)",
    "setAcaoEmAndamento(problema.id)",
    'const payload: TablesUpdate<"problemas_tecnicos"> = {};',
    "atualizarProblemaTecnicoAdmin({",
    "if (error)",
    "if (!data)",
    "setProblemas((atuais) =>",
    "setObservacoes((atuais) => ({",
    "setSucesso(mensagemSucesso)",
    "finally {",
  ].map((trecho) => hook.indexOf(trecho));
  assert.ok(ordem.every((indice) => indice >= 0));
  assert.deepEqual([...ordem].sort((a, b) => a - b), ordem);
});

test("página delega a action e preserva controles e JSX", () => {
  assert.match(
    page,
    /import \{ useAdminProblemasTecnicosActions \} from "\.\/hooks\/use-admin-problemas-tecnicos-actions";/,
  );
  assert.match(page, /const \{ atualizarChamado \} = useAdminProblemasTecnicosActions\(/);
  assert.doesNotMatch(page, /async function atualizarChamado\(/);
  assert.match(page, /void carregarProblemas\(\)/);
  assert.match(page, /Atualizar/);
  assert.equal((page.match(/atualizarChamado\(/g) || []).length, 3);
  assert.match(page, /<AdminProblemasTecnicosTicketStatusControl/);
  assert.match(page, /<AdminProblemasTecnicosTicketPriorityControl/);
  assert.match(page, /textarea/);
});

test("hook não contém estado próprio, router, storage ou JSX", () => {
  assert.doesNotMatch(
    hook,
    /useState|useEffect|useMemo|router|localStorage|fetch\(|return\s*\(\s*</,
  );
});
