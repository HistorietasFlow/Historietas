import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const helpers = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-work-fallback-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url), "utf8");

test("fallback de obra preserva parsing, mensagens, conteúdo e campos locais", () => {
  for (const contrato of [
    "export function extrairSlugObraDeLinkNotificacao",
    "/\\/obra\\/([^/?#]+)(?:\\/|$)/i",
    "decodeURIComponent(slugCodificado)",
    "export function formatarTituloSlugNotificacao",
    '.replace(/[-_]+/g, " ")',
    'return "Obra";',
    "export function extrairTituloObraDeMensagemNotificacao",
    "/^sua obra$/i",
    "export function extrairTituloCapituloDeMensagemNotificacao",
    'return match?.[1]?.trim() || "Capítulo";',
    "export function criarObraFallbackNotificacaoDireta",
    "if (!obraId)",
    'autor: "Autor não informado"',
    'tags: ["sem tags"]',
    "progressoLeitura: calcularProgressoLeitura(capitulos)",
    "link: slug ? `/obra/${slug}` : notificacao.link",
  ]) {
    assert.ok(helpers.includes(contrato), "contrato ausente: " + contrato);
  }

  assert.match(pagina, /from "\.\/lib\/notificacoes-work-fallback-utils"/);
  assert.doesNotMatch(pagina, /function extrairSlugObraDeLinkNotificacao/);
  assert.doesNotMatch(pagina, /function formatarTituloSlugNotificacao/);
  assert.doesNotMatch(pagina, /function extrairTituloObraDeMensagemNotificacao/);
  assert.doesNotMatch(pagina, /function extrairTituloCapituloDeMensagemNotificacao/);
  assert.doesNotMatch(pagina, /function criarObraFallbackNotificacaoDireta/);
  assert.doesNotMatch(helpers, /React|use[A-Z]|supabase|localStorage/);
});
