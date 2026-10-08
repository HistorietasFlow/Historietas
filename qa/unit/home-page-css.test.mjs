import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const moduloCss = readFileSync(
  new URL("../../app/lib/home-page-css.ts", import.meta.url),
  "utf8",
);
const paginaHome = readFileSync(
  new URL("../../app/page.tsx", import.meta.url),
  "utf8",
);
const styleDaHome = "<style>{`${themePageCss}${historietasThemeCss}`}</style>";

test("themePageCss preserva o CSS global da Home", () => {
  assert.match(moduloCss, /export const themePageCss = `/,);
  assert.match(moduloCss, /@keyframes historietas-loading-spin/);
  assert.match(moduloCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(moduloCss, /nav:has\(a\[href="\/publicar"\]\)/);
  assert.match(
    moduloCss,
    /div:has\(> a\[href="\/publicar"\]\):has\(> a\[href="\/perfil-autor\?aba=biblioteca"\]\)/,
  );
  assert.match(moduloCss, /a\[href="\/publicar"\]/);
  assert.match(moduloCss, /\.historietas-home-search-toggle/);
  assert.match(moduloCss, /\.historietas-home-header-search-input/);
  assert.match(moduloCss, /\.historietas-home-header/);
  assert.match(moduloCss, /\.historietas-home-logo/);
  assert.match(moduloCss, /\.historietas-home-header-actions a/);
  assert.match(moduloCss, /\.historietas-home-desktop-menu a/);
  assert.match(moduloCss, /\.historietas-home-desktop-links::-webkit-scrollbar/);
});

test("Home consome themePageCss duas vezes na ordem de precedencia original", () => {
  assert.match(
    paginaHome,
    /import \{ themePageCss \} from "\.\/lib\/home-page-css";/,
  );
  assert.doesNotMatch(paginaHome, /const themePageCss = `/);
  assert.equal(paginaHome.split(styleDaHome).length - 1, 2);
  assert.equal(
    paginaHome.includes("${historietasThemeCss}${themePageCss}"),
    false,
  );
});
