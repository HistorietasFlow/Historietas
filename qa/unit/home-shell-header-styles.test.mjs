import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const estilos = readFileSync(
  new URL("../../app/lib/home-shell-header-styles.ts", import.meta.url),
  "utf8",
);

const nomesEstilos = [
  "pageDecorationLayerStyle", "mobileTopWaterFadeStyle", "desktopTopWaterFadeStyle",
  "heroDecorationLayerStyle", "listaPageTitleTypographyStyle", "pageStyle", "containerStyle",
  "navStyle", "desktopNavStyle", "mobileNavStyle", "navInnerStyle", "navTopRowStyle",
  "desktopContainerStyle", "desktopNavInnerStyle", "desktopLogoStyle", "desktopLogoMarkStyle",
  "desktopLogoTextStyle", "logoStyle", "logoMarkStyle", "logoTextStyle", "navIconsStyle",
  "mobileHeaderSearchAreaStyle", "mobileHeaderSearchInputStyle", "mobileSearchToggleStyle",
  "mobileSearchToggleActiveStyle", "desktopMenuStyle", "desktopInlineSearchAreaStyle",
  "desktopLinkStyle", "desktopActiveLinkStyle", "desktopInputStyle", "desktopSearchIconStyle",
  "desktopHeaderActionsStyle", "desktopHeaderIconLinkStyle", "desktopNotificationCountBadgeStyle",
  "desktopProfileLinkStyle", "desktopProfileAvatarStyle",
];

test("home-shell-header-styles exporta os estilos estruturais e do header", () => {
  assert.match(estilos, /import type \{ CSSProperties \} from "react";/);
  assert.match(estilos, /import \{ safeTextStyle \} from "\.\/home-card-style-primitives";/);

  for (const nomeEstilo of nomesEstilos) {
    assert.match(estilos, new RegExp(`export const ${nomeEstilo}: CSSProperties = \\{`));
  }
});

test("home-shell-header-styles preserva valores, spreads e fronteiras", () => {
  assert.match(estilos, /zIndex: 30,/);
  assert.match(estilos, /height: "min\(620px, 68vh\)",/);
  assert.match(estilos, /\.\.\.navStyle,/);
  assert.match(estilos, /\.\.\.containerStyle,/);
  assert.match(estilos, /\.\.\.listaPageTitleTypographyStyle,/);
  assert.match(estilos, /\.\.\.safeTextStyle,/);
  assert.match(estilos, /gridTemplateColumns: "auto minmax\(0, 1fr\) minmax\(176px, 360px\) auto",/);
  assert.match(estilos, /background: "#111113",/);
  assert.match(estilos, /background: "#EF4444",/);
  assert.match(estilos, /WebkitTapHighlightColor: "transparent",/);
  assert.doesNotMatch(estilos, /useState|useEffect|supabase|localStorage/);
});

test("Home delega o shell e o header sem alterar seus consumidores", () => {
  assert.match(pagina, /from "\.\/lib\/home-shell-header-styles";/);

  for (const nomeEstilo of nomesEstilos) {
    assert.doesNotMatch(pagina, new RegExp(`const ${nomeEstilo}: CSSProperties = \\{`));
  }

  assert.match(pagina, /useHistorietasTheme\(pageStyle\)/);
  assert.match(pagina, /style=\{isDesktop \? desktopNavStyle : mobileNavStyle\}/);
  assert.match(pagina, /style=\{isDesktop \? desktopContainerStyle : containerStyle\}/);
  assert.match(pagina, /style=\{heroDecorationLayerStyle\}/);
  assert.match(pagina, /style=\{desktopHeaderActionsStyle\}/);
  assert.match(
    pagina,
    /buscaMobileAberta\s*\? mobileSearchToggleActiveStyle\s*:\s*mobileSearchToggleStyle/,
  );
  assert.doesNotMatch(pagina, /const desktopHeroStyle: CSSProperties = \{/);
  assert.match(pagina, /const summaryStripStyle: CSSProperties = \{/);
});
