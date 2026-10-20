import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const normalizadores = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-data-normalizers.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url), "utf8");

test("normalizadores de dados preservam texto, booleanos e tags do Supabase", () => {
  for (const contrato of [
    "export function pegarTexto",
    "typeof valor === \"string\" && valor.trim() ? valor.trim() : fallback",
    "return limparTextoExibicao(texto);",
    "export function pegarBooleano",
    "typeof valor === \"boolean\" ? valor : fallback",
    "export function pegarTagsSupabase",
    "Array.isArray(valor)",
    ".split(\",\")",
    '["sem tags"]',
  ]) {
    assert.ok(normalizadores.includes(contrato), "contrato ausente: " + contrato);
  }

  assert.match(pagina, /from "\.\/lib\/notificacoes-data-normalizers"/);
  assert.doesNotMatch(pagina, /function pegarTexto/);
  assert.doesNotMatch(pagina, /function pegarBooleano/);
  assert.doesNotMatch(pagina, /function pegarTagsSupabase/);
  assert.doesNotMatch(normalizadores, /React|use[A-Z]|supabase|localStorage/);
});
