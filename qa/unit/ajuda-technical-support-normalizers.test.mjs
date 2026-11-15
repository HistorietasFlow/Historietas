import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagina = await readFile("app/ajuda/page.tsx", "utf8");
const hook = await readFile("app/ajuda/hooks/use-ajuda-technical-support.ts", "utf8");
const normalizadores = await readFile(
  "app/ajuda/lib/ajuda-technical-support-normalizers.ts",
  "utf8",
);

test("normalizadores do suporte técnico preservam trims, valores válidos e fallbacks", () => {
  for (const contrato of [
    "export function textoSeguro",
    "valor.trim()",
    'fallback = ""',
    "export function normalizarCategoriaProblemaTecnico",
    "new Set<CategoriaProblemaTecnico>",
    "CATEGORIAS_PROBLEMA_TECNICO.map",
    ': "outro"',
    "export function normalizarStatusProblemaTecnico",
    'valor === "aberto"',
    'valor === "em_analise"',
    'valor === "aguardando_usuario"',
    'valor === "resolvido"',
    'valor === "fechado"',
    ': "aberto"',
    "export function normalizarProblemasTecnicos",
    '"Problema técnico"',
    '"normal"',
    "Boolean(item.id)",
  ]) assert.ok(normalizadores.includes(contrato), contrato);

  for (const campo of [
    "id:",
    "categoria:",
    "titulo:",
    "descricao:",
    "paginaUrl:",
    "status:",
    "prioridade:",
    "observacaoAdmin:",
    "criadoEm:",
    "atualizadoEm:",
  ]) assert.ok(normalizadores.includes(campo), campo);
});

test("o hook mantém RPCs e valida a resposta antes de delegar o mapeamento", () => {
  assert.match(hook, /listar_meus_problemas_tecnicos/);
  assert.match(hook, /p_limite: 20/);
  assert.match(hook, /if \(erroLeitura\) throw erroLeitura/);
  assert.match(hook, /normalizarProblemasTecnicos\(lerChamadosConfirmados\(registros\)\)/);
  assert.match(hook, /setChamadosTecnicos\(chamados\)/);
  assert.match(hook, /normalizarCategoriaProblemaTecnico\(\s*valor,/);
  assert.doesNotMatch(pagina, /supabase|function textoSeguro|function normalizarCategoriaProblemaTecnico|function normalizarStatusProblemaTecnico/);
});
