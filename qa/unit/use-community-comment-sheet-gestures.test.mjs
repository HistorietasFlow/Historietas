import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) =>
  readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const hook = ler(
  "../../app/comunidade/hooks/use-community-comment-sheet-gestures.ts",
);
const sheet = ler(
  "../../app/comunidade/components/community-comments-sheet.tsx",
);

test("hook centraliza expansao, drag, helpers, transicoes e limpeza do sheet", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function useCommunityCommentSheetGestures\(/);
  assert.match(hook, /const \[sheetExpandido, setSheetExpandido\] = useState\(false\);/);
  for (const referencia of [
    "sheetRef",
    "dragStartYRef",
    "dragOffsetYRef",
    "dragIgnorarCliqueRef",
    "dragResetTimerRef",
  ]) {
    assert.match(hook, new RegExp(`const ${referencia} = useRef`));
  }
  for (const helper of [
    "obterPosicaoAtualArrasteComentariosComunidade",
    "obterLimiteSuperiorArrasteComentariosComunidade",
    "obterLimiteInferiorArrasteComentariosComunidade",
    "calcularDeslocamentoArrasteComentariosComunidade",
    "deveIgnorarCliqueAposArrasteComunidade",
    "deveExpandirComentariosPorArrasteComunidade",
    "deveRecolherComentariosPorArrasteComunidade",
    "deveFecharComentariosPorArrasteComunidade",
  ]) {
    assert.match(hook, new RegExp(`\\b${helper}\\b`));
  }
  assert.match(hook, /window\.clearTimeout\(dragResetTimerRef\.current\)/);
  assert.match(hook, /\}, 350\);/);
  assert.match(hook, /sheetRef\.current\.style\.transition = "none";/);
  assert.match(hook, /sheetRef\.current\.style\.transition = "height 220ms ease";/);
  assert.match(hook, /handle\.style\.transition = "transform 160ms ease";/);
  assert.match(hook, /handle\.style\.transform = `translate3d\(0, \$\{deslocamento\}px, 0\)`;/);
  assert.match(hook, /handle\.style\.transform = "";/);
  assert.match(hook, /if \(isDesktop\)/);
  assert.match(hook, /onFecharComentarios\(\);/);
  assert.doesNotMatch(
    hook,
    /\b(?:supabase|localStorage|onEnviar|responderComentario|JSX)\b/,
  );
});

test("sheet delega gestos e mantem fechamento local sem alterar o handle", () => {
  assert.match(
    sheet,
    /import \{ useCommunityCommentSheetGestures \} from "\.\.\/hooks\/use-community-comment-sheet-gestures";/,
  );
  assert.match(
    sheet,
    /\} = useCommunityCommentSheetGestures\(\{[\s\S]*?isDesktop,[\s\S]*?onFecharComentarios: fecharComentarios,[\s\S]*?\}\);/,
  );
  for (const nome of [
    "iniciarArraste",
    "moverArraste",
    "finalizarArraste",
    "alternarExpansaoComentarios",
  ]) {
    assert.match(sheet, new RegExp(`\\b${nome}\\b`));
    assert.doesNotMatch(sheet, new RegExp(`function ${nome}\\(`));
  }
  assert.match(
    sheet,
    /fecharMenuOrdenacao\(\);[\s\S]*?limparRespostaComentario\(\);[\s\S]*?onFechar\(\);/,
  );
  assert.match(sheet, /onClick=\{fecharSheetComentarios\}/);
  assert.match(sheet, /onTouchStart=\{iniciarArraste\}/);
  assert.match(sheet, /onTouchMove=\{moverArraste\}/);
  assert.match(sheet, /onTouchEnd=\{finalizarArraste\}/);
  assert.match(sheet, /onTouchCancel=\{finalizarArraste\}/);
});
