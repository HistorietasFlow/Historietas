import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const mergeUtils = readFileSync(
  new URL(
    "../../app/notificacoes/lib/notificacoes-merge-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/notificacoes/page.tsx", import.meta.url),
  "utf8",
);

test("preserva a deduplicacao, prioridades e fronteira pura", () => {
  for (const contrato of [
    "export function notificacoesRepresentamMesmoEvento(",
    "export function mesclarNotificacoes(",
    "novo-capitulo:${capituloId}",
    "solicitacao-seguidor:${autor}",
    "curtida-obra:${autor}:${obraId || link}",
    "curtida-capitulo:${autor}:${capituloId}",
    "curtida-comunidade:${autor}:${link}",
    "normalizarNotificacao(notificacao, 0)",
    "dataNotificacao(b) - dataNotificacao(a)",
  ]) {
    assert.ok(mergeUtils.includes(contrato), "contrato ausente: " + contrato);
  }

  assert.doesNotMatch(
    mergeUtils,
    /from ["'][^"']*supabase|localStorage|useEffect|useState|from "react"/i,
  );
  assert.match(pagina, /from "\.\/lib\/notificacoes-merge-utils";/);
  assert.doesNotMatch(pagina, /function mesclarNotificacoes\(/);
  assert.doesNotMatch(pagina, /function notificacoesRepresentamMesmoEvento\(/);
});
