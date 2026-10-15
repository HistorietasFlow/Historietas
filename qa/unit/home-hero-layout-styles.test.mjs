import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const estilos = readFileSync(
  new URL("../../app/lib/home-hero-layout-styles.ts", import.meta.url),
  "utf8",
);

const nomesEstilos = [
  "desktopHeroStyle", "desktopHeroShellStyle", "desktopHeroPosterFrameStyle",
  "desktopHeroPosterGlowStyle", "desktopHeroPosterTitleStyle", "desktopHeroPosterStatusStyle",
  "heroGlowStyle", "mobileHeroImageGlowStyle", "heroContentStyle", "desktopHeroContentStyle",
  "desktopHeroMetaStyle", "desktopHeroKickerStyle", "desktopHeroAuthorStyle",
  "desktopHeroMetaDividerStyle", "desktopHeroGenreStyle", "desktopHeroClassificationStyle",
  "heroPillStyle", "heroTitleStyle", "desktopHeroTitleStyle", "heroDescriptionStyle",
  "desktopHeroDescriptionStyle", "heroButtonsStyle", "mobileHeroButtonsStyle",
  "desktopHeroButtonsStyle", "desktopHeroInitialButtonsStyle", "desktopPrimaryButtonStyle",
  "desktopSecondaryButtonStyle", "desktopHeroSaveButtonStyle", "desktopHeroLoginNoticeStyle",
  "mobileHeroInitialButtonsStyle", "primaryButtonStyle", "secondaryButtonStyle", "heroSaveButtonStyle",
  "heroLoginNoticeStyle", "desktopHeroFooterStyle", "desktopHeroStatsStyle",
  "desktopHeroStatItemStyle", "desktopHeroStatIconStyle", "desktopHeroStatValueStyle",
  "mobileHeroContentStyle", "mobileHeroMetaStyle", "mobileHeroPillStyle", "mobileHeroTextBlockStyle",
  "mobileHeroTitleStyle", "mobileHeroDescriptionStyle", "mobileHeroFooterStyle", "mobileHeroStatsStyle",
  "mobileHeroStatItemStyle", "mobileHeroStatIconStyle", "mobileHeroStatValueStyle",
];

test("home-hero-layout-styles exporta todos os estilos de layout do Hero", () => {
  assert.match(estilos, /import type \{ CSSProperties \} from "react";/);
  assert.match(
    estilos,
    /import \{[\s\S]*?listaAuthorMetaTypographyStyle,[\s\S]*?listaWorkTitleTypographyStyle,[\s\S]*?safeTextStyle,[\s\S]*?\} from "\.\/home-card-style-primitives";/,
  );

  for (const nomeEstilo of nomesEstilos) {
    assert.match(estilos, new RegExp(`export const ${nomeEstilo}: CSSProperties = \\{`));
  }
});

test("home-hero-layout-styles preserva valores centrais, spreads e fronteiras", () => {
  assert.match(estilos, /gridTemplateColumns: "minmax\(350px, 1\.03fr\) minmax\(0, 0\.97fr\)",/);
  assert.match(estilos, /borderRadius: "28px",/);
  assert.match(estilos, /background: "#000000",/);
  assert.match(estilos, /WebkitLineClamp: 4,/);
  assert.match(estilos, /overflowWrap: "anywhere",/);
  assert.match(estilos, /wordBreak: "break-word",/);
  assert.match(estilos, /\.\.\.listaWorkTitleTypographyStyle,/);
  assert.match(estilos, /\.\.\.listaAuthorMetaTypographyStyle,/);
  assert.match(estilos, /\.\.\.safeTextStyle,/);
  assert.match(estilos, /\.\.\.heroTitleStyle,/);
  assert.match(estilos, /\.\.\.heroDescriptionStyle,/);
  assert.match(estilos, /\.\.\.heroButtonsStyle,/);
  assert.match(estilos, /\.\.\.desktopHeroButtonsStyle,/);
  assert.match(estilos, /\.\.\.mobileHeroButtonsStyle,/);
  assert.match(estilos, /\.\.\.desktopPrimaryButtonStyle,/);
  assert.match(estilos, /\.\.\.primaryButtonStyle,/);
  assert.match(estilos, /\.\.\.heroContentStyle,/);
  assert.match(estilos, /\.\.\.heroPillStyle,/);
  assert.doesNotMatch(estilos, /useState|useEffect|supabase|localStorage/);
  assert.doesNotMatch(estilos, /summaryStripStyle|sectionStyle/);
});

test("Home delega os estilos do Hero e mantém consumers e estilos de seções", () => {
  assert.match(pagina, /from "\.\/lib\/home-hero-layout-styles";/);

  for (const nomeEstilo of nomesEstilos) {
    assert.doesNotMatch(pagina, new RegExp(`const ${nomeEstilo}: CSSProperties = \\{`));
  }

  assert.match(pagina, /isDesktop\s*\? \{[\s\S]*?\.\.\.heroStyle,[\s\S]*?\.\.\.desktopHeroStyle,/);
  assert.match(pagina, /style=\{desktopHeroContentStyle\}/);
  assert.match(pagina, /style=\{mobileHeroContentStyle\}/);
  assert.match(pagina, /style=\{desktopHeroTitleStyle\}/);
  assert.match(pagina, /style=\{mobileHeroTitleStyle\}/);
  assert.match(pagina, /style=\{desktopHeroFooterStyle\}/);
  assert.match(pagina, /style=\{desktopPrimaryButtonStyle\}/);
  assert.match(pagina, /style=\{primaryButtonStyle\}/);
  assert.match(pagina, /const summaryStripStyle: CSSProperties = \{/);
  assert.match(pagina, /const desktopSummaryStripStyle: CSSProperties = \{/);
  assert.match(pagina, /const sectionStyle: CSSProperties = \{/);
  assert.match(pagina, /const desktopSectionStyle: CSSProperties = \{/);
});
