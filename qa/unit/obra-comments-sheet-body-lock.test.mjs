import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL(
    "../../app/obra/[slug]/hooks/use-obra-comments-sheet-body-lock.ts",
    import.meta.url,
  ),
  "utf8",
);
const cliente = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("hook preserva o lock do body somente com comentarios abertos", () => {
  assert.match(
    hook,
    /export function useObraCommentsSheetBodyLock\(\s*comentariosAbertos: boolean,\s*comentariosDragResetTimerRef: MutableRefObject<number \| null>,\s*\)/,
  );
  assert.match(hook, /if \(!comentariosAbertos\) \{\s*return;\s*\}/);
  assert.match(
    hook,
    /const overflowAnterior = document\.body\.style\.overflow;\s*const overscrollAnterior = document\.body\.style\.overscrollBehavior;/,
  );
  assert.match(hook, /document\.body\.style\.overflow = "hidden";/);
  assert.match(hook, /document\.body\.style\.overscrollBehavior = "none";/);
  assert.match(hook, /\}, \[comentariosAbertos\]\);/);
});

test("hook preserva a ordem de cleanup do body e do timer de drag", () => {
  assert.match(
    hook,
    /document\.body\.style\.overflow = overflowAnterior;\s*document\.body\.style\.overscrollBehavior = overscrollAnterior;\s*if \(comentariosDragResetTimerRef\.current !== null\) \{\s*window\.clearTimeout\(comentariosDragResetTimerRef\.current\);\s*comentariosDragResetTimerRef\.current = null;\s*\}/,
  );
});

test("cliente delega somente o lifecycle do painel ao hook e preserva o drag", () => {
  assert.match(
    cliente,
    /import \{ useObraCommentsSheetBodyLock \} from "\.\/hooks\/use-obra-comments-sheet-body-lock";/,
  );
  assert.match(
    cliente,
    /useObraCommentsSheetBodyLock\(\s*comentariosAbertos,\s*comentariosDragResetTimerRef,\s*\);/,
  );
  assert.doesNotMatch(cliente, /const overflowAnterior = document\.body\.style\.overflow;/);
  assert.match(cliente, /function iniciarArrasteComentariosObra\(/);
  assert.match(cliente, /function moverArrasteComentariosObra\(/);
  assert.match(cliente, /function finalizarArrasteComentariosObra\(\)/);
  assert.match(cliente, /}, 350\);/);
});
