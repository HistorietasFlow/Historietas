import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/admin/problemas-tecnicos/page.tsx", "utf8");
const source = readFileSync(
  "app/admin/problemas-tecnicos/components/admin-problemas-tecnicos-ticket-last-review.tsx",
  "utf8",
);

test("ultima analise preserva conteudo, estilo e fallback", () => {
  [
    "analisadoEm",
    "if (!analisadoEm) return null",
    "Última análise:",
    "Last review:",
    "Última revisión:",
    "formatarData(analisadoEm)",
    "lastReviewStyle",
    '../../../../lib/utils',
  ].forEach((item) => assert.ok(source.includes(item)));
  assert.doesNotMatch(
    source,
    /supabase|useState|useEffect|router|localStorage|atualizarChamado|textarea/,
  );
});

test("pagina delega somente a ultima analise", () => {
  assert.match(page, /AdminProblemasTecnicosTicketLastReview/);
  assert.doesNotMatch(page, /formatarData/);
  assert.doesNotMatch(page, /lastReviewStyle/);
  assert.match(page, /atualizarChamado/);
  assert.match(page, /setObservacoes/);
  assert.match(page, /textarea/);
});
