import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagina = await readFile("app/ajuda/page.tsx", "utf8");
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

test("RPC e seu lifecycle continuam na página, que delega somente o mapeamento", () => {
  assert.match(pagina, /listar_meus_problemas_tecnicos/);
  assert.match(pagina, /p_limite: 20/);
  assert.match(pagina, /if \(error\) \{\s*throw error;/);
  assert.match(pagina, /const registros: ProblemaTecnicoRpcRow\[\] = Array\.isArray\(data\) \? data : \[\];/);
  assert.match(pagina, /normalizarProblemasTecnicos\(\s*registros,/);
  assert.match(pagina, /setChamadosTecnicos\(chamados\)/);
  assert.match(pagina, /normalizarCategoriaProblemaTecnico\(event\.target\.value\)/);
  assert.doesNotMatch(pagina, /function textoSeguro/);
  assert.doesNotMatch(pagina, /function normalizarCategoriaProblemaTecnico/);
  assert.doesNotMatch(pagina, /function normalizarStatusProblemaTecnico/);
});
