import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/admin/problemas-tecnicos/page.tsx", "utf8");
const card = readFileSync(
  "app/admin/problemas-tecnicos/components/admin-problemas-tecnicos-ticket-card.tsx",
  "utf8",
);
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

test("card compõe a última análise sem reintroduzir detalhes na página", () => {
  assert.match(card, /AdminProblemasTecnicosTicketLastReview/);
  assert.doesNotMatch(card, /formatarData/);
  assert.doesNotMatch(card, /lastReviewStyle/);
  assert.match(card, /atualizarChamado/);
  assert.match(card, /setObservacoes/);
  assert.match(card, /textarea/);
  assert.doesNotMatch(page, /AdminProblemasTecnicosTicketLastReview/);
});
