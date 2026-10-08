import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL("../../app/hooks/use-home-hero-carousel.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");

test("useHomeHeroCarousel preserva o lifecycle do índice do hero", () => {
  assert.match(hook, /^"use client";/);
  assert.match(
    hook,
    /export default function useHomeHeroCarousel\(\s*termoBusca: string,\s*totalObrasHero: number,?\s*\)/,
  );
  assert.match(hook, /const \[heroIndex, setHeroIndex\] = useState\(0\);/);
  assert.match(
    hook,
    /const redefinirHeroTimer = window\.setTimeout\(\(\) => \{\s*setHeroIndex\(0\);\s*\}, 0\);[\s\S]*?window\.clearTimeout\(redefinirHeroTimer\);[\s\S]*?\}, \[termoBusca\]\);/,
  );
  assert.match(
    hook,
    /if \(totalObrasHero === 0\) \{\s*return;\s*\}[\s\S]*?const ajustarHeroTimer = window\.setTimeout\(\(\) => \{\s*setHeroIndex\(\(indexAtual\) =>\s*indexAtual >= totalObrasHero \? 0 : indexAtual\s*\);\s*\}, 0\);[\s\S]*?window\.clearTimeout\(ajustarHeroTimer\);[\s\S]*?\}, \[totalObrasHero\]\);/,
  );
  assert.match(
    hook,
    /if \(totalObrasHero <= 1\) \{\s*return;\s*\}[\s\S]*?const intervalo = window\.setInterval\(\(\) => \{\s*setHeroIndex\(\(indexAtual\) => \(indexAtual \+ 1\) % totalObrasHero\);\s*\}, 9000\);[\s\S]*?return \(\) => window\.clearInterval\(intervalo\);[\s\S]*?\}, \[totalObrasHero\]\);/,
  );
  assert.match(hook, /return \{\s*heroIndex,\s*setHeroIndex,\s*\};/);
});

test("Home delega somente o lifecycle do índice e preserva os consumidores do hero", () => {
  assert.match(
    pagina,
    /import useHomeHeroCarousel from "\.\/hooks\/use-home-hero-carousel";/,
  );
  assert.match(
    pagina,
    /const \{ heroIndex, setHeroIndex \} = useHomeHeroCarousel\(\s*termoBusca,\s*obrasHero\.length,?\s*\);/,
  );
  assert.doesNotMatch(
    pagina,
    /const \[heroIndex, setHeroIndex\] = useState\(0\);/,
  );
  assert.doesNotMatch(pagina, /const redefinirHeroTimer = window\.setTimeout/);
  assert.doesNotMatch(pagina, /const ajustarHeroTimer = window\.setTimeout/);
  assert.doesNotMatch(pagina, /const intervalo = window\.setInterval/);
  assert.match(pagina, /const obrasHero = useMemo/);
  assert.match(
    pagina,
    /const heroObra = obrasHero\[heroIndex\] \|\| obrasHero\[0\] \|\| HERO_INICIAL_HOME;/,
  );

  const indicadores = pagina.match(/<HomeHeroCarouselDots/g) || [];
  assert.equal(indicadores.length, 2);
  assert.match(
    pagina,
    /<HomeHeroCarouselDots[\s\S]*?activeIndex=\{heroIndex\}[\s\S]*?onSelect=\{setHeroIndex\}[\s\S]*?isDesktop=\{true\}[\s\S]*?\/>/,
  );
  assert.match(
    pagina,
    /<HomeHeroCarouselDots[\s\S]*?activeIndex=\{heroIndex\}[\s\S]*?onSelect=\{setHeroIndex\}[\s\S]*?isDesktop=\{false\}[\s\S]*?\/>/,
  );
});
