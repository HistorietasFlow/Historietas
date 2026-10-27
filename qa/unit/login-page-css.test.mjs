import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync("app/login/page.tsx", "utf8");
const cssSource = readFileSync(
  "app/login/lib/login-page-css.ts",
  "utf8",
);

test("Login delega o CSS global ao módulo extraído", () => {
  assert.doesNotMatch(pageSource, /const loginPageCss\s*=/);
  assert.match(
    pageSource,
    /import \{ loginPageCss \} from "\.\/lib\/login-page-css";/,
  );
  assert.ok(
    pageSource.includes(
      "<style>{" + "`" + "${historietasThemeCss}" + "${loginPageCss}" + "`" + "}</style>",
    ),
  );
});

test("módulo de CSS preserva a configuração visual do Login", () => {
  assert.match(cssSource, /^export const loginPageCss = `+/);
  assert.equal((cssSource.match(/^  html \{/gm) || []).length, 2);

  const primeiroLogoMid = cssSource.indexOf(
    "--historietas-login-logo-mid: #D4D4D8;",
  );
  const segundoLogoMid = cssSource.indexOf(
    "--historietas-login-logo-mid: #FFFFFF;",
  );

  assert.ok(primeiroLogoMid >= 0);
  assert.ok(segundoLogoMid > primeiroLogoMid);

  [
    "html,",
    "body {",
    "overflow-x: hidden !important;",
    "overflow-y: auto !important;",
    "overscroll-behavior-y: contain !important;",
    'html[data-historietas-tema-visual="original"]',
    "input::placeholder",
    "input {",
    ".historietas-theme-logo-text",
    ".historietas-theme-title",
    "background: #000000 !important;",
    "color: #FFFFFF !important;",
    "!important",
  ].forEach((trecho) => assert.ok(cssSource.includes(trecho), trecho));

  assert.doesNotMatch(
    cssSource,
    /from\s+["']react["']|useState|useEffect|supabase|localStorage|router|<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/,
  );
});
