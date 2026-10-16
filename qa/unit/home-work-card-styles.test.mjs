import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const secoes = readFileSync(
  new URL("../../components/HomeContentSections.tsx", import.meta.url),
  "utf8",
);const estilos = readFileSync(
  new URL("../../app/lib/home-work-card-styles.ts", import.meta.url),
  "utf8",
);
const componente = readFileSync(
  new URL("../../components/HomeCatalogWorkCard.tsx", import.meta.url),
  "utf8",
);
const componenteLocal = readFileSync(
  new URL("../../components/HomeLocalWorkCard.tsx", import.meta.url),
  "utf8",
);
const hero = readFileSync(
  new URL("../../components/HomeHero.tsx", import.meta.url),
  "utf8",
);

const nomesEstilos = [
  "publishedCardStyle",
  "desktopPublishedCardStyle",
  "publishedCardCompactHeightStyle",
  "desktopPublishedCardCompactHeightStyle",
  "desktopCoverPlaceholderStyle",
  "coverPlaceholderCompactHeightStyle",
  "desktopCoverPlaceholderCompactHeightStyle",
  "publishedInfoStyle",
  "cardTopRowStyle",
  "publishedTitleStyle",
  "desktopPublishedTitleStyle",
  "statusRowStyle",
  "formatBadgeStyle",
  "classificationBadgeStyle",
  "authorLinkStyle",
  "latestChapterInfoStyle",
  "cardStatsStyle",
  "cardStatItemStyle",
  "cardStatIconStyle",
  "cardStatHeartIconStyle",
  "cardStatValueStyle",
  "mobileCardActionRowStyle",
  "mobileCardGenreBadgeStyle",
  "progressCompactStyle",
  "progressTrackStyle",
  "progressBarStyle",
  "progressTextStyle",
  "readNowStyle",
  "continueActionTextWrapStyle",
  "continueActionMainTextStyle",
  "continueActionSubTextStyle",
  "mobileCardPrimaryActionStyle",
  "pageBackgroundActionButtonStyle",
  "mobileCardSecondaryActionStyle",
  "desktopCardActionRowStyle",
  "desktopCardGenreBadgeStyle",
  "desktopCardPrimaryActionStyle",
  "desktopCardSecondaryActionStyle",
  "obraCardStyle",
  "desktopObraCardStyle",
  "obraCardSoonStyle",
  "desktopObraCardSoonStyle",
  "obraInfoStyle",
  "obraTitleStyle",
  "desktopObraTitleStyle",
  "authorStyle",
];

test("home-work-card-styles exporta todos os estilos dos cards de obra", () => {
  assert.match(estilos, /import type \{ CSSProperties \} from "react";/);
  assert.match(
    estilos,
    /import \{[\s\S]*?listaAuthorMetaTypographyStyle,[\s\S]*?listaWorkTitleTypographyStyle,[\s\S]*?safeTextStyle,[\s\S]*?\} from "\.\/home-card-style-primitives";/,
  );

  for (const nomeEstilo of nomesEstilos) {
    assert.match(estilos, new RegExp(`export const ${nomeEstilo}: CSSProperties = \\{`));
  }
});

test("home-work-card-styles preserva os valores e spreads centrais", () => {
  assert.match(estilos, /flex: "0 0 min\(360px, 88vw\)",/);
  assert.match(estilos, /gridTemplateColumns: "minmax\(88px, 98px\) minmax\(0, 1fr\)",/);
  assert.match(estilos, /\.\.\.publishedCardStyle,/);
  assert.match(estilos, /\.\.\.obraCardStyle,/);
  assert.match(estilos, /WebkitLineClamp: 2,/);
  assert.match(estilos, /background: "linear-gradient\(90deg, #FFFFFF 0%, #A1A1AA 100%\)",/);
  assert.match(estilos, /background: "var\(--historietas-bg-start, #000000\)",/);
  assert.match(estilos, /\.\.\.safeTextStyle,/);
  assert.match(estilos, /\.\.\.listaWorkTitleTypographyStyle,/);
  assert.match(estilos, /\.\.\.listaAuthorMetaTypographyStyle,/);
  assert.doesNotMatch(estilos, /useState|useEffect|supabase|localStorage/);
});

test("Home delega os estilos e os cards de obra para suas fronteiras", () => {
  assert.match(pagina, /import HomeHero from "\.\.\/components\/HomeHero";/);
  assert.match(hero, /from "\.\.\/app\/lib\/home-work-card-styles";/);
  assert.match(secoes, /import MobileObraLocalCard from "\.\/HomeLocalWorkCard";/);
  assert.doesNotMatch(pagina, /function MobileObraLocalCard\(/);
  assert.match(componenteLocal, /export default function MobileObraLocalCard\(/);
  assert.match(componenteLocal, /from "\.\.\/app\/lib\/home-work-card-styles";/);
  assert.match(secoes, /import MobileObraCard from "\.\/HomeCatalogWorkCard";/);
  assert.doesNotMatch(pagina, /function MobileObraCard\(/);
  assert.match(componente, /export default function MobileObraCard\(/);
  assert.match(componente, /from "\.\.\/app\/lib\/home-work-card-styles";/);

  for (const nomeEstilo of nomesEstilos) {
    assert.doesNotMatch(pagina, new RegExp(`const ${nomeEstilo}: CSSProperties = \\{`));
  }

  [
    "publishedCardStyle",
    "mobileCardPrimaryActionStyle",
    "obraCardStyle",
    "desktopObraCardStyle",
  ].forEach((nomeEstilo) => {
    assert.match(`${pagina}\n${componente}\n${componenteLocal}`, new RegExp(`\\b${nomeEstilo}\\b`));
  });
});
