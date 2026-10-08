import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL("../../components/HomeHeroCarouselDots.tsx", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/page.tsx", import.meta.url),
  "utf8",
);

test("HomeHeroCarouselDots preserva os indicadores desktop e mobile", () => {
  assert.match(componente, /export default function HomeHeroCarouselDots/);
  assert.match(componente, /obras: Array<\{ titulo: string \}>;/);
  assert.match(componente, /activeIndex: number;/);
  assert.match(componente, /onSelect: \(index: number\) => void;/);
  assert.match(componente, /isDesktop: boolean;/);
  assert.match(componente, /aria-label="Obras em destaque"/);
  assert.match(componente, /key=\{`\$\{obra\.titulo\}-\$\{index\}`\}/);
  assert.match(componente, /type="button"/);
  assert.match(componente, /onClick=\{\(\) => onSelect\(index\)\}/);
  assert.match(componente, /aria-label=\{`Mostrar \$\{obra\.titulo\}`\}/);
  assert.match(componente, /index === activeIndex/);
  assert.match(componente, /isDesktop \? desktopHeroDotsStyle : mobileHeroDotsStyle/);
  assert.match(componente, /\? desktopHeroDotActiveStyle\s*:\s*mobileHeroDotActiveStyle/);
  assert.match(componente, /\? desktopHeroDotStyle\s*:\s*mobileHeroDotStyle/);

  assert.match(
    componente,
    /const desktopHeroDotsStyle: CSSProperties = \{[\s\S]*?gap: "7px",[\s\S]*?flexWrap: "nowrap",[\s\S]*?\};/,
  );
  assert.match(
    componente,
    /const desktopHeroDotStyle: CSSProperties = \{[\s\S]*?width: "28px",[\s\S]*?height: "4px",[\s\S]*?\};/,
  );
  assert.match(
    componente,
    /const desktopHeroDotActiveStyle: CSSProperties = \{[\s\S]*?width: "46px",[\s\S]*?background: "#FFFFFF",[\s\S]*?\};/,
  );
  assert.match(
    componente,
    /const heroDotStyle: CSSProperties = \{[\s\S]*?width: "18px",[\s\S]*?height: "5px",[\s\S]*?color-mix\(in srgb, var\(--historietas-text-secondary, #FFFFFF\) 24%, transparent\)/,
  );
  assert.match(
    componente,
    /const mobileHeroDotsStyle: CSSProperties = \{[\s\S]*?gap: "6px",[\s\S]*?\};/,
  );
  assert.match(componente, /const mobileHeroDotStyle: CSSProperties = \{[\s\S]*?width: "16px",/);
  assert.match(
    componente,
    /const mobileHeroDotActiveStyle: CSSProperties = \{[\s\S]*?width: "34px",[\s\S]*?background: "rgba\(255,255,255,0\.58\)",/,
  );
});

test("Home delega os dois indicadores sem mover o lifecycle do hero", () => {
  assert.match(
    pagina,
    /import HomeHeroCarouselDots from "\.\.\/components\/HomeHeroCarouselDots";/,
  );
  assert.equal((pagina.match(/<HomeHeroCarouselDots\b/g) || []).length, 2);
  assert.match(
    pagina,
    /<HomeHeroCarouselDots[\s\S]*?obras=\{obrasHero\}[\s\S]*?activeIndex=\{heroIndex\}[\s\S]*?onSelect=\{setHeroIndex\}[\s\S]*?isDesktop=\{true\}[\s\S]*?\/>/,
  );
  assert.match(
    pagina,
    /<HomeHeroCarouselDots[\s\S]*?obras=\{obrasHero\}[\s\S]*?activeIndex=\{heroIndex\}[\s\S]*?onSelect=\{setHeroIndex\}[\s\S]*?isDesktop=\{false\}[\s\S]*?\/>/,
  );

  for (const estilo of [
    "heroDotsStyle",
    "heroDotStyle",
    "desktopHeroDotsStyle",
    "desktopHeroDotStyle",
    "desktopHeroDotActiveStyle",
    "mobileHeroDotsStyle",
    "mobileHeroDotStyle",
    "mobileHeroDotActiveStyle",
  ]) {
    assert.doesNotMatch(pagina, new RegExp(`\\b${estilo}\\b`));
  }

  assert.doesNotMatch(pagina, /<div style=\{desktopHeroDotsStyle\}/);
  assert.doesNotMatch(pagina, /<div style=\{mobileHeroDotsStyle\}/);
  assert.match(pagina, /const \[heroIndex, setHeroIndex\] = useState\(0\);/);
  assert.match(pagina, /const obrasHero = useMemo/);
  assert.match(pagina, /setHeroIndex\(\(indexAtual\) => \(indexAtual \+ 1\) % obrasHero\.length\)/);
  assert.match(pagina, /const desktopHeroFooterStyle: CSSProperties/);
  assert.match(pagina, /const mobileHeroFooterStyle: CSSProperties/);
  assert.match(pagina, /alternarHeroFavorito/);
});
