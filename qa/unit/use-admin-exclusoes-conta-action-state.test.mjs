import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const hook = ler(
  "../../app/admin/exclusoes-conta/hooks/use-admin-exclusoes-conta-action-state.ts",
);
const page = ler("../../app/admin/exclusoes-conta/page.tsx");

test("hook centraliza estados de ação, feedback e abertura exclusiva", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function useAdminExclusoesContaActionState\(/);
  for (const state of [
    "abertaId, setAbertaId",
    "acaoEmAndamento, setAcaoEmAndamento",
    "erro, setErro",
    "sucesso, setSucesso",
  ]) {
    assert.match(hook, new RegExp(`const \\[${state}\\] = useState\\(\"\"\\);`));
  }
  assert.match(hook, /function alternarSolicitacaoAberta\(solicitacaoId: string\)/);
  assert.match(hook, /atual === solicitacaoId \? "" : solicitacaoId/);
});

test("hook preserva a recarga paralela, feedback e finalização", () => {
  assert.match(hook, /async function recarregarFila\(/);
  const ordem = [
    'setAcaoEmAndamento("recarregar")',
    'setErro("")',
    'setSucesso("")',
    "await Promise.all([",
    "carregarSolicitacoes()",
    "carregarOperacoesRecuperaveis()",
    "error instanceof Error",
    'pt: "Não foi possível atualizar a fila."',
    "finally {",
    'setAcaoEmAndamento("")',
  ].map((trecho) => hook.indexOf(trecho));
  assert.ok(ordem.every((indice) => indice >= 0));
  assert.deepEqual([...ordem].sort((a, b) => a - b), ordem);
  assert.doesNotMatch(
    hook,
    /supabase|router|localStorage|useEffect|salvarSolicitacao|return\s*\(\s*</,
  );
});

test("página delega estados e mantém integrações existentes", () => {
  assert.match(
    page,
    /import \{ useAdminExclusoesContaActionState \} from "\.\/hooks\/use-admin-exclusoes-conta-action-state";/,
  );
  assert.match(page, /\} = useAdminExclusoesContaActionState\(t\);/);
  assert.doesNotMatch(page, /const \[abertaId, setAbertaId\]/);
  assert.doesNotMatch(page, /const \[acaoEmAndamento, setAcaoEmAndamento\]/);
  assert.match(page, /useAdminExclusoesContaInitialData\(\{[\s\S]*?setErro,[\s\S]*?setSucesso,/);
  assert.match(page, /useAdminExclusoesContaActions\(\{[\s\S]*?setAcaoEmAndamento,[\s\S]*?setErro,[\s\S]*?setSucesso,/);
  assert.match(page, /recarregarFila\(\{[\s\S]*?carregarSolicitacoes,[\s\S]*?carregarOperacoesRecuperaveis,[\s\S]*?\}\)/);
  assert.match(page, /alternarSolicitacaoAberta\(solicitacao\.id\)/);
  assert.match(page, /acaoEmAndamento === "recarregar"/);
});
