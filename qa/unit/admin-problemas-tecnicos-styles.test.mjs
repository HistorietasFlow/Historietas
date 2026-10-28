import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/admin/problemas-tecnicos/page.tsx", "utf8");
const source = readFileSync(
  "app/admin/problemas-tecnicos/lib/admin-problemas-tecnicos-styles.ts",
  "utf8",
);

test("estilos estaticos de problemas tecnicos ficam no modulo dedicado", () => {
  const exportedStyles = [
    "pageStyle",
    "containerStyle",
    "stateCardStyle",
    "headerStyle",
    "summaryGridStyle",
    "filtersStyle",
    "cardStyle",
    "detailsStyle",
    "controlsGridStyle",
    "lastReviewStyle",
  ];

  assert.match(source, /import type \{ CSSProperties \} from "react"/);
  assert.match(source, /export const adminProblemasCss = `/);
  exportedStyles.forEach((name) => {
    assert.match(source, new RegExp(`export const ${name}: CSSProperties`));
  });
  assert.match(source, /@media \(max-width: 720px\)/);
  assert.match(source, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(source, /@keyframes admin-tech-spin/);
  assert.match(source, /\.admin-tech-loader/);
  assert.match(source, /\.\.\.badgeStyle/);
  assert.match(source, /\.\.\.environmentValueStyle/);
  assert.doesNotMatch(source, /useState|useEffect|supabase|fetch\(|router|localStorage|set[A-Z]|<\w/);
});

test("pagina consome estilos extraidos sem alterar a composicao", () => {
  assert.match(page, /from "\.\/lib\/admin-problemas-tecnicos-styles"/);
  assert.doesNotMatch(page, /const \w+Style: CSSProperties/);
  assert.doesNotMatch(page, /const adminProblemasCss =/);
  assert.match(page, /useHistorietasTheme\(pageStyle\)/);
  assert.match(page, /\$\{historietasThemeCss\}\$\{adminProblemasCss\}/);
});
