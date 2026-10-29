import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagina = await readFile("app/ajuda/page.tsx", "utf8");
const display = await readFile("app/ajuda/lib/ajuda-display-utils.ts", "utf8");

test("display utils preservam tradução, status e formatação de data", () => {
  for (const contrato of [
    "export function traduzirTexto",
    'idioma === "en"',
    "return texto.en;",
    'idioma === "es"',
    "return texto.es;",
    "return texto.pt;",
    "export function rotuloStatusProblema",
    'pt: "Aberto",',
    'en: "Open",',
    'es: "Abierto",',
    'pt: "Em análise",',
    'en: "Under review",',
    'es: "En revisión",',
    'pt: "Aguardando você",',
    'en: "Waiting for you",',
    'es: "Esperando tu respuesta",',
    'pt: "Resolvido",',
    'en: "Resolved",',
    'es: "Resuelto",',
    'pt: "Fechado",',
    'en: "Closed",',
    'es: "Cerrado",',
    "export function formatarDataChamado",
    "Number.isFinite(timestamp)",
    'return "";',
    '"en-US"',
    '"es-ES"',
    '"pt-BR"',
    'dateStyle: "medium"',
    'timeStyle: "short"',
  ]) assert.ok(display.includes(contrato), contrato);
});

test("a página delega display e preserva idioma nos pontos de exibição", () => {
  assert.match(pagina, /from "\.\/lib\/ajuda-display-utils"/);
  assert.doesNotMatch(pagina, /function traduzirTexto/);
  assert.doesNotMatch(pagina, /function rotuloStatusProblema/);
  assert.doesNotMatch(pagina, /function formatarDataChamado/);
  assert.match(pagina, /rotuloStatusProblema\(chamado\.status, language\)/);
  assert.match(pagina, /formatarDataChamado\(chamado\.criadoEm, language\)/);
});
