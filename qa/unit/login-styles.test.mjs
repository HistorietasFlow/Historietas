import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync("app/login/page.tsx", "utf8");
const stylesSource = readFileSync("app/login/lib/login-styles.ts", "utf8");

const estilosExportados = [
  "mobileTopWaterFadeStyle",
  "desktopTopWaterFadeStyle",
  "pageStyle",
  "containerStyle",
  "topStyle",
  "languageSelectShellStyle",
  "languageSelectWrapperStyle",
  "languageSelectStyle",
  "logoStyle",
  "logoMarkStyle",
  "logoTextStyle",
  "heroStyle",
  "heroGlowStyle",
  "heroContentStyle",
  "introStyle",
  "titleStyle",
  "descriptionStyle",
  "formPanelStyle",
  "tabsStyle",
  "tabStyle",
  "tabActiveStyle",
  "formStyle",
  "fieldStyle",
  "labelStyle",
  "inputStyle",
  "consentGroupStyle",
  "consentLabelStyle",
  "checkboxStyle",
  "legalLinkStyle",
  "primaryButtonStyle",
  "secondaryButtonStyle",
  "textButtonStyle",
  "errorStyle",
  "successStyle",
  "helperTextStyle",
];

test("Login concentra os 36 contratos CSSProperties no módulo de estilos", () => {
  assert.match(stylesSource, /import type \{ CSSProperties \} from "react";/);
  assert.equal(
    (stylesSource.match(/^(?:export )?const [A-Za-z][A-Za-z0-9]*Style: CSSProperties =/gm) || [])
      .length,
    36,
  );
  assert.match(stylesSource, /^const safeTextStyle: CSSProperties =/m);
  assert.doesNotMatch(stylesSource, /^export const safeTextStyle/m);

  estilosExportados.forEach((nome) => {
    assert.match(
      stylesSource,
      new RegExp(`export const ${nome}: CSSProperties =`),
    );
  });
});

test("Login preserva os spreads e os contratos visuais relevantes", () => {
  assert.ok((stylesSource.match(/\.\.\.safeTextStyle/g) || []).length >= 7);
  assert.match(stylesSource, /export const tabActiveStyle: CSSProperties = \{\s*\.\.\.tabStyle,/);
  assert.match(
    stylesSource,
    /export const secondaryButtonStyle: CSSProperties = \{\s*\.\.\.primaryButtonStyle/,
  );

  [
    'height: "min(520px, 72vh)"',
    'fontSize: "clamp(27px, 6.6vw, 64px)"',
    'background: "var(--historietas-login-bg-page, #000000)"',
    'boxSizing: "border-box"',
    'wordBreak: "break-word"',
    'overflowWrap: "anywhere"',
    'whiteSpace: "normal"',
    'transform: "translateY(clamp(16px, 2.4vh, 26px))"',
  ].forEach((trecho) => assert.ok(stylesSource.includes(trecho), trecho));
});

test("Login consome os estilos extraídos sem alterar a composição", () => {
  assert.doesNotMatch(pageSource, /const [A-Za-z][A-Za-z0-9]*Style: CSSProperties =/);
  assert.match(pageSource, /from "\.\/lib\/login-styles";/);
  assert.match(pageSource, /useHistorietasTheme\(pageStyle\)/);

  estilosExportados.forEach((nome) => {
    assert.match(pageSource, new RegExp(`\\b${nome}\\b`));
  });
  assert.doesNotMatch(
    stylesSource,
    /useState|useEffect|supabase|localStorage|router|<(?:[A-Z][A-Za-z0-9]*|[a-z][a-z0-9-]*)(?:\s|\/?>)/,
  );
});
