import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const modulo = readFileSync(
  new URL("../../app/ajuda/lib/ajuda-layout-styles.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/ajuda/page.tsx", import.meta.url),
  "utf8",
);

const estilos = [
  "pageStyle",
  "containerStyle",
  "headerStyle",
  "backButtonStyle",
  "headerTextStyle",
  "eyebrowStyle",
  "pageTitleStyle",
  "heroStyle",
  "heroIconStyle",
  "heroTextStyle",
  "heroTitleStyle",
  "heroDescriptionStyle",
  "searchBoxStyle",
  "searchInputStyle",
  "sectionStyle",
  "sectionHeadingStyle",
  "sectionKickerStyle",
  "sectionTitleStyle",
  "resultsCountStyle",
  "categoriesGridStyle",
  "faqListStyle",
  "emptyStateStyle",
  "emptyIconStyle",
  "emptyTitleStyle",
  "emptyDescriptionStyle",
  "shortcutsGridStyle",
  "noticeStyle",
  "noticeIconStyle",
  "noticeTextStyle",
];

test("os estilos gerais da Ajuda são exportados pelo módulo dedicado", () => {
  assert.match(modulo, /import type \{\s*CSSProperties,\s*\} from "react";/);
  assert.equal(
    (modulo.match(/export const \w+Style: CSSProperties/g) || []).length,
    estilos.length,
  );

  for (const estilo of estilos) {
    assert.match(modulo, new RegExp(`export const ${estilo}: CSSProperties`));
    assert.match(pagina, new RegExp(`\\b${estilo}\\b`));
    assert.doesNotMatch(
      pagina,
      new RegExp(`const ${estilo}: CSSProperties`),
    );
  }

  assert.match(modulo, /minHeight: "100vh"/);
  assert.match(modulo, /gridTemplateColumns: "42px minmax\(0, 1fr\)"/);
  assert.match(modulo, /repeat\(auto-fit, minmax\(min\(210px, 100%\), 1fr\)\)/);
  assert.match(modulo, /margin: "8px 0 16px"/);
});

test("a página consome os estilos gerais e mantém o tema no pageStyle", () => {
  assert.match(pagina, /from "\.\/lib\/ajuda-layout-styles";/);
  assert.match(pagina, /useHistorietasTheme\(pageStyle\)/);
  assert.doesNotMatch(pagina, /import type \{ CSSProperties, FormEvent \} from "react";/);
});
