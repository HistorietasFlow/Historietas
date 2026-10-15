import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const estilos = readFileSync(
  new URL("../../app/lib/home-summary-section-styles.ts", import.meta.url),
  "utf8",
);

const nomesEstilos = [
  "summaryStripStyle",
  "desktopSummaryStripStyle",
  "summaryItemStyle",
  "summaryDividerLineStyle",
  "summaryNumberStyle",
  "sectionStyle",
  "lastSectionStyle",
  "desktopSectionStyle",
  "desktopLastSectionStyle",
];

test("home-summary-section-styles exporta os estilos finais de summary e seções", () => {
  assert.match(estilos, /import type \{ CSSProperties \} from "react";/);
  assert.match(estilos, /import \{ safeTextStyle \} from "\.\/home-card-style-primitives";/);

  for (const nomeEstilo of nomesEstilos) {
    assert.match(estilos, new RegExp(`export const ${nomeEstilo}: CSSProperties = \\{`));
  }
});

test("home-summary-section-styles preserva spreads, valores e espaçamentos", () => {
  assert.match(estilos, /export const desktopSummaryStripStyle: CSSProperties = \{\s*\.\.\.summaryStripStyle,/);
  assert.match(estilos, /gridTemplateColumns: "minmax\(0, 1fr\) auto minmax\(0, 1fr\)",/);
  assert.match(estilos, /marginTop: "14px",/);
  assert.match(estilos, /\.\.\.safeTextStyle,/);
  assert.match(estilos, /export const desktopSectionStyle: CSSProperties = \{\s*\.\.\.sectionStyle,\s*marginTop: "30px",/);
  assert.match(estilos, /export const lastSectionStyle: CSSProperties = \{[\s\S]*?marginTop: "24px",[\s\S]*?paddingBottom: "22px",/);
  assert.match(estilos, /export const desktopLastSectionStyle: CSSProperties = \{\s*\.\.\.lastSectionStyle,\s*marginTop: "30px",\s*paddingBottom: "76px",/);
  assert.doesNotMatch(estilos, /useState|useEffect|supabase|localStorage/);
});

test("Home delega todos os estilos finais sem alterar seus consumidores", () => {
  assert.match(pagina, /from "\.\/lib\/home-summary-section-styles";/);

  for (const nomeEstilo of nomesEstilos) {
    assert.doesNotMatch(pagina, new RegExp(`const ${nomeEstilo}: CSSProperties = \\{`));
  }

  assert.doesNotMatch(pagina, /const \w+Style: CSSProperties = \{/);
  assert.match(pagina, /isDesktop \? desktopSummaryStripStyle : summaryStripStyle/);
  assert.match(pagina, /style=\{summaryItemStyle\}/);
  assert.match(pagina, /style=\{summaryDividerLineStyle\}/);
  assert.match(pagina, /style=\{summaryNumberStyle\}/);
  assert.match(pagina, /isDesktop \? desktopSectionStyle : sectionStyle/);
  assert.match(pagina, /isDesktop \? desktopLastSectionStyle : lastSectionStyle/);
});
