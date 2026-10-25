import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const cssSource = readFileSync(
  new URL(
    "../../app/editar-obra/styles/editar-obra-page-css.ts",
    import.meta.url,
  ),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);

test("CSS estático de Editar Obra preserva variáveis e seletores", () => {
  assert.match(cssSource, /^export const editarObraPageCss = `/);

  for (const trecho of [
    "--historietas-editar-obra-bg-page: #000000;",
    "--historietas-editar-obra-cover-surface: #0B0714;",
    "--historietas-editar-obra-cover-surface: #050505;",
    "--historietas-editar-obra-heart: #E11D48;",
    "--historietas-editar-obra-heart: #FFFFFF;",
    'html[data-historietas-tema-visual="original"] body,',
    'html[data-historietas-tema-visual] main > div[aria-hidden="true"] {',
    'html[data-historietas-tema-visual] nav a[href="/painel-autor"],',
    'html [data-bottom-nav] a[href="/painel-autor"],',
    "html[data-historietas-tema-visual] textarea::placeholder {",
    "html option {",
  ]) {
    assert.ok(cssSource.includes(trecho), trecho);
  }

  assert.equal((cssSource.match(/^  html \{/gm) || []).length, 2);
  assert.deepEqual([...cssSource.matchAll(/@media\b/g)], []);
  assert.doesNotMatch(cssSource, /\$\{/);
});

test("Editar Obra consome o CSS extraído sem alterar a concatenação", () => {
  const consumidor = "<style>{`${historietasThemeCss}${editarObraPageCss}`}</style>";

  assert.ok(
    pageSource.includes(
      'import { editarObraPageCss } from "./styles/editar-obra-page-css";',
    ),
  );
  assert.doesNotMatch(pageSource, /const editarObraPageCss = `/);
  assert.equal(pageSource.split(consumidor).length - 1, 3);
});
