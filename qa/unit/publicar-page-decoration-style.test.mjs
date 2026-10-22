import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const style = readFileSync(new URL("../../app/publicar/lib/publicar-page-decoration-style.ts", import.meta.url), "utf8");
const page = readFileSync(new URL("../../app/publicar/page.tsx", import.meta.url), "utf8");
test("decoração de Publicar mantém o estilo e a delegação", () => {
  assert.match(style, /export function criarDecoracaoPaginaStyle\(/);
  assert.match(style, /display: "none"/);
  assert.match(page, /from "\.\/lib\/publicar-page-decoration-style";/);
  assert.doesNotMatch(page, /function criarDecoracaoPaginaStyle\(/);
  assert.match(page, /criarDecoracaoPaginaStyle\(\)/);
});
