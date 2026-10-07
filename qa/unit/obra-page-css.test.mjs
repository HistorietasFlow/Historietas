import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const cssSource = readFileSync(
  new URL(
    "../../app/obra/[slug]/lib/obra-page-css.ts",
    import.meta.url,
  ),
  "utf8",
);
const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("obra page css exporta literalmente os keyframes e a redução de movimento", () => {
  assert.match(cssSource, /^export const obraPageCss = `/);
  assert.deepEqual(
    [...cssSource.matchAll(/@keyframes ([\w-]+)/g)].map((match) => match[1]),
    [
      "historietas-loading-spin",
      "historietas-stat-heart-pop",
      "historietas-synopsis-reveal",
    ],
  );
  assert.match(cssSource, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(
    cssSource,
    /\.historietas-loading-spinner \{\n      animation-duration: 1\.4s !important;/,
  );
});

test("obra page css preserva custom properties, valores e whitespace final", () => {
  const propriedades = [
    "--historietas-obra-bg-deep: #000000;",
    "--historietas-obra-bg-deeper: #000000;",
    "--historietas-obra-surface: #050505;",
    "--historietas-obra-bg-deep-96: rgba(0, 0, 0, 0.96);",
    "--historietas-obra-bg-deep-72: rgba(0, 0, 0, 0.72);",
    "--historietas-obra-bg-shadow-42: rgba(0, 0, 0, 0.42);",
    "--historietas-obra-menu-98: rgba(0, 0, 0, 0.98);",
    "--historietas-obra-rating: #FFFFFF;",
    "--historietas-obra-rating-strong: #FFFFFF;",
    "--historietas-obra-rating-muted: rgba(255, 255, 255, 0.32);",
    "--historietas-obra-danger: #FFFFFF;",
    "--historietas-obra-heart: #FFFFFF;",
    "--historietas-obra-logo-mid: #FFFFFF;",
    "--historietas-obra-logo-end: #D4D4D8;",
    "--historietas-obra-purple-48: rgba(255, 255, 255, 0.12);",
    "--historietas-obra-purple-58: rgba(255, 255, 255, 0.16);",
    "--historietas-obra-purple-72: rgba(255, 255, 255, 0.20);",
    "--historietas-obra-secondary-22: rgba(255, 255, 255, 0.08);",
    "--historietas-obra-secondary-72: rgba(255, 255, 255, 0.24);",
    "--historietas-obra-secondary-soft-34: rgba(255, 255, 255, 0.18);",
  ];

  assert.equal(
    (cssSource.match(/--historietas-obra-[\w-]+:/g) || []).length,
    20,
  );
  for (const propriedade of propriedades) {
    assert.ok(cssSource.includes(propriedade), propriedade);
  }
  assert.doesNotMatch(cssSource, /\$\{/);
  assert.ok(cssSource.endsWith("  }\n\n\n\n\n\n`;\n"));
});

test("cliente importa o CSS e preserva seus quatro consumidores", () => {
  const consumidor = "<style>{`${historietasThemeCss}${obraPageCss}`}</style>";

  assert.ok(
    paginaObra.includes(
      'import { obraPageCss } from "./lib/obra-page-css";',
    ),
  );
  assert.doesNotMatch(paginaObra, /const obraPageCss = `/);
  assert.equal(paginaObra.split(consumidor).length - 1, 4);
  assert.ok(paginaObra.includes("historietasThemeCss"));
});
