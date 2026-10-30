import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const fonte = ler("../../app/ler-capitulo/hooks/use-ler-capitulo-comments-body-lock.ts");
const pagina = ler("../../app/ler-capitulo/page.tsx");

test("body lock preserva os estilos anteriores e o cleanup completo", () => {
  for (const trecho of [
    "mostrarComentario",
    "document.body",
    "document.documentElement",
    '"overflow"',
    '"overscroll-behavior"',
    '"hidden"',
    '"none"',
    "getPropertyValue",
    "setProperty",
    "removeProperty",
  ]) {
    assert.ok(fonte.includes(trecho));
  }

  assert.match(fonte, /return \(\) => \{[\s\S]*?overflowAnterior[\s\S]*?overscrollAnterior[\s\S]*?removeProperty/);
  assert.match(fonte, /\}, \[mostrarComentario\]\);/);
});

test("página delega apenas o lifecycle de body lock", () => {
  assert.match(pagina, /import \{ useLerCapituloCommentsBodyLock \} from "\.\/hooks\/use-ler-capitulo-comments-body-lock";/);
  assert.match(pagina, /useLerCapituloCommentsBodyLock\(\s*mostrarComentario,?\s*\);/);
  assert.doesNotMatch(pagina, /document\.body\.style/);
  assert.doesNotMatch(pagina, /overscroll-behavior/);
});
