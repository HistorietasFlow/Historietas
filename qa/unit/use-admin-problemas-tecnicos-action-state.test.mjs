import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const hook = ler(
  "../../app/admin/problemas-tecnicos/hooks/use-admin-problemas-tecnicos-action-state.ts",
);
const page = ler("../../app/admin/problemas-tecnicos/page.tsx");

test("hook centraliza estados de ação, feedback e abertura exclusiva", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function useAdminProblemasTecnicosActionState\(/);
  for (const state of [
    "chamadoAbertoId, setChamadoAbertoId",
    "acaoEmAndamento, setAcaoEmAndamento",
    "erro, setErro",
    "sucesso, setSucesso",
  ]) {
    assert.match(
      hook,
      new RegExp(`const \\[${state}\\] = useState\\(\"\"\\);`),
    );
  }
  assert.match(hook, /function alternarChamadoAberto\(chamadoId: string\)/);
  assert.match(
    hook,
    /atual === chamadoId \? "" : chamadoId/,
  );
});

test("hook preserva a recarga, feedback e finalização", () => {
  assert.match(
    hook,
    /async function recarregarProblemasTecnicos\([\s\S]*?carregarProblemas: CarregarProblemasTecnicos/,
  );
  const ordem = [
    'setAcaoEmAndamento("recarregar")',
    'setErro("")',
    'setSucesso("")',
    "await carregarProblemas()",
    'criarMensagemErro(\n          "Erro ao atualizar problemas técnicos"',
    "finally {",
    'setAcaoEmAndamento("")',
  ].map((trecho) => hook.indexOf(trecho));
  assert.ok(ordem.every((indice) => indice >= 0));
  assert.deepEqual([...ordem].sort((a, b) => a - b), ordem);
  assert.doesNotMatch(
    hook,
    /supabase|router|localStorage|useEffect|atualizarChamado|return\s*\(\s*</,
  );
});

test("página delega estados e mantém integrações existentes", () => {
  assert.match(
    page,
    /import \{ useAdminProblemasTecnicosActionState \} from "\.\/hooks\/use-admin-problemas-tecnicos-action-state";/,
  );
  assert.match(page, /\} = useAdminProblemasTecnicosActionState\(\);/);
  assert.doesNotMatch(page, /const \[chamadoAbertoId, setChamadoAbertoId\]/);
  assert.doesNotMatch(page, /const \[acaoEmAndamento, setAcaoEmAndamento\]/);
  assert.match(page, /useAdminProblemasTecnicosInitialData\(\{[\s\S]*?setErro,[\s\S]*?setSucesso,/);
  assert.match(page, /useAdminProblemasTecnicosActions\(\{[\s\S]*?setAcaoEmAndamento,[\s\S]*?setErro,[\s\S]*?setSucesso,/);
  assert.match(page, /recarregarProblemasTecnicos\(carregarProblemas\)/);
  assert.match(page, /alternarChamadoAberto\(problema\.id\)/);
  assert.match(page, /acaoEmAndamento === "recarregar"/);
});
