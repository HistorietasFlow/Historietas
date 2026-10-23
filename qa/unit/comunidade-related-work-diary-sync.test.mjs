import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/comunidade/hooks/use-comunidade-related-work-diary-sync.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/comunidade/page.tsx", import.meta.url),
  "utf8",
);

test("useComunidadeRelatedWorkDiarySync preserva o carregamento cancelavel das obras relacionadas", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function useComunidadeRelatedWorkDiarySync\(/);
  assert.match(
    hook,
    /await prepararSugestoesObrasRelacionadasComunidade\(usuarioId \|\| ""\);/,
  );
  assert.match(
    hook,
    /if \(!cancelado\) \{\s*setObrasRelacionadasSugestoes\(sugestoesObrasRelacionadas\);/,
  );
  assert.match(
    hook,
    /return \(\) => \{\s*cancelado = true;\s*\};/,
  );
});

test("useComunidadeRelatedWorkDiarySync preserva os refs e a sincronizacao sequencial de reviews", () => {
  assert.match(hook, /const userId = usuarioId\?\.trim\(\) \|\| "";/);
  assert.match(
    hook,
    /if \(!userId\) \{[\s\S]*?reviewsDiarioSincronizadasRef\.current\.clear\(\);[\s\S]*?usuarioReviewsDiarioRef\.current = "";/,
  );
  assert.match(
    hook,
    /if \(usuarioReviewsDiarioRef\.current !== userId\) \{[\s\S]*?reviewsDiarioSincronizadasRef\.current\.clear\(\);[\s\S]*?usuarioReviewsDiarioRef\.current = userId;/,
  );
  assert.match(
    hook,
    /post\.autorId\.trim\(\) === userId[\s\S]*?post\.tipoPublicacao === "Review"[\s\S]*?!reviewsDiarioSincronizadasRef\.current\.has\(post\.id\)/,
  );
  assert.match(hook, /if \(reviewsPendentes\.length === 0\) \{\s*return;\s*\}/);
  assert.match(
    hook,
    /sincronizarReviewsPendentesSequencialmenteComunidade\(\{[\s\S]*?reviewsPendentes,[\s\S]*?reviewsSincronizadas: reviewsDiarioSincronizadasRef\.current,[\s\S]*?cancelamentoSolicitado: \(\) => cancelado/,
  );
  assert.match(
    hook,
    /registrarReviewComunidadeNoDiario\(\{[\s\S]*?userId,[\s\S]*?texto: post\.texto,[\s\S]*?obraRelacionada: post\.obraRelacionada,[\s\S]*?postId: post\.id,[\s\S]*?criadaEm: post\.criadoEm,[\s\S]*?sugestoesObras: obrasRelacionadasSugestoes,[\s\S]*?visibilidade: post\.visibilidade/,
  );
});

test("Comunidade delega apenas os lifecycles de sugestões e reviews ao hook", () => {
  assert.match(
    pagina,
    /import \{ useComunidadeRelatedWorkDiarySync \} from "\.\/hooks\/use-comunidade-related-work-diary-sync";/,
  );
  assert.match(
    pagina,
    /useComunidadeRelatedWorkDiarySync\(\{[\s\S]*?usuarioId: usuario\?\.id,[\s\S]*?posts,[\s\S]*?obrasRelacionadasSugestoes,[\s\S]*?setObrasRelacionadasSugestoes,[\s\S]*?reviewsDiarioSincronizadasRef,[\s\S]*?usuarioReviewsDiarioRef,[\s\S]*?\}\);/,
  );
  assert.doesNotMatch(pagina, /void sincronizarReviewsPendentesSequencialmenteComunidade\(/);
  assert.doesNotMatch(pagina, /await prepararSugestoesObrasRelacionadasComunidade\(/);
  assert.match(pagina, /async function publicarPost\(/);
  assert.match(pagina, /async function atualizarVisibilidadePost\(/);
  assert.match(pagina, /async function removerPost\(/);
  assert.match(pagina, /useComunidadeAuthAccountLifecycle\(/);
});
