import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagina = await readFile("app/em-breve/page.tsx", "utf8");
const loader = await readFile(
  "app/em-breve/loaders/carregar-lancamentos-salvos-supabase-em-breve.ts",
  "utf8",
);

test("loader de avisos salvos preserva leitura paginada e normalizacao", () => {
  [
    "userId.trim()",
    "return [] as string[]",
    "carregarTodasPaginasSupabase",
    '"avisos reais do Em breve"',
    '.from("seguindo_obras")',
    '.select("obra_id")',
    '.eq("user_id", userIdLimpo)',
    '.order("obra_id", { ascending: true })',
    ".range(inicio, fim)",
    'typeof registro !== "object"',
    "Array.isArray(registro)",
    'typeof obraId === "string"',
    "normalizarListaIdsEmBreve",
    '"Não consegui acessar seguindo_obras no Em breve:"',
  ].forEach((contrato) => assert.ok(loader.includes(contrato), contrato));
  assert.doesNotMatch(loader, /\.insert\(|\.delete\(|\.update\(|\.upsert\(/);
});

test("pagina delega somente o loader e preserva mutations", () => {
  assert.match(pagina, /carregar-lancamentos-salvos-supabase-em-breve/);
  assert.doesNotMatch(pagina, /async function carregarLancamentosSalvosSupabaseEmBreve/);
  assert.match(pagina, /function erroEhRegistroDuplicadoEmBreve/);
  assert.match(pagina, /async function sincronizarAvisoLancamentoSupabaseEmBreve/);
});
