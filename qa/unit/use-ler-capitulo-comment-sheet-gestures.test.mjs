import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const hook = ler("../../app/ler-capitulo/hooks/use-ler-capitulo-comment-sheet-gestures.ts");
const sheet = ler("../../app/ler-capitulo/components/ler-capitulo-comments-sheet.tsx");

test("hook centraliza expansão, drag, limites, transições e limpeza do sheet", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /export function useLerCapituloCommentSheetGestures\(/);
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
  assert.match(hook, /window\.clearTimeout\(dragResetTimerRef\.current\)/);
  assert.match(hook, /const limiteSuperior = sheetExpandido \? -46 : -58;/);
  assert.match(hook, /const limiteInferior = sheetExpandido \? 112 : 132;/);
  assert.match(hook, /Math\.abs\(deslocamento\) > 6/);
  assert.match(hook, /deslocamento < -34/);
  assert.match(hook, /deslocamento > 52 && sheetExpandido/);
  assert.match(hook, /deslocamento > 118 && !sheetExpandido/);
  assert.match(hook, /\}, 350\);/);
  assert.match(hook, /sheetRef\.current\.style\.transition = "none";/);
  assert.match(hook, /sheetRef\.current\.style\.transition = "height 220ms ease";/);
  assert.match(hook, /handle\.style\.transition = "transform 160ms ease";/);
  assert.match(hook, /handle\.style\.transform = `translate3d\(0, \$\{deslocamento\}px, 0\)`;/);
  assert.match(hook, /handle\.style\.transform = "";/);
  assert.match(hook, /if \(isDesktop\)/);
  assert.match(hook, /onFecharComentarios\(\);/);
  assert.doesNotMatch(hook, /\b(?:supabase|localStorage|onEnviar|renderizarComentario|JSX)\b/);
});

test("sheet delega os gestos, mantendo fechamento semântico e JSX do handle", () => {
  assert.match(sheet, /import \{ useLerCapituloCommentSheetGestures \} from "\.\.\/hooks\/use-ler-capitulo-comment-sheet-gestures";/);
  assert.match(sheet, /\} = useLerCapituloCommentSheetGestures\(\{[\s\S]*?isDesktop,[\s\S]*?onFecharComentarios: fecharComentarios,[\s\S]*?\}\);/);
  for (const nome of [
    "iniciarArraste",
    "moverArraste",
    "finalizarArraste",
    "alternarExpansaoComentarios",
  ]) {
    assert.match(sheet, new RegExp(`\\b${nome}\\b`));
    assert.doesNotMatch(sheet, new RegExp(`function ${nome}\\(`));
  }
  assert.match(sheet, /setMenuOrdenacaoAberto\(false\);[\s\S]*?limparRespostaComentario\(\);[\s\S]*?onFechar\(\);/);
  assert.match(sheet, /onClick=\{fecharSheetComentarios\}/);
  assert.match(sheet, /onTouchStart=\{iniciarArraste\}/);
  assert.match(sheet, /onTouchMove=\{moverArraste\}/);
  assert.match(sheet, /onTouchEnd=\{finalizarArraste\}/);
  assert.match(sheet, /onTouchCancel=\{finalizarArraste\}/);
});
