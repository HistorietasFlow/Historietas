import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL("../../components/HomeCarouselRow.tsx", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/page.tsx", import.meta.url),
  "utf8",
);

test("HomeCarouselRow preserva as regras, lifecycle e controles do carrossel", () => {
  assert.match(
    componente,
    /export default function HomeCarouselRow\(\{[\s\S]*?variant = "obra",/,
  );
  assert.match(componente, /children: ReactNode;/);
  assert.match(componente, /isDesktop: boolean;/);
  assert.match(componente, /variant\?: "obra" \| "autor";/);
  assert.match(componente, /const rowRef = useRef<HTMLDivElement \| null>\(null\);/);
  assert.match(componente, /const totalItems = Children\.count\(children\);/);
  assert.match(
    componente,
    /const precisaDeCarrossel = isDesktop && totalItems > 3;/,
  );
  assert.match(componente, /variant === "autor"[\s\S]*?authorListStyle/);
  assert.match(componente, /desktopAuthorListStyle/);
  assert.match(componente, /desktopStaticAuthorListStyle/);
  assert.match(componente, /desktopStoryListStyle/);
  assert.match(componente, /desktopStaticStoryListStyle/);
  assert.match(componente, /row\.scrollLeft = 0;/);
  assert.match(
    componente,
    /window\.requestAnimationFrame\(voltarParaInicio\)/,
  );
  assert.match(componente, /window\.setTimeout\(voltarParaInicio, 90\)/);
  assert.match(componente, /window\.cancelAnimationFrame\(frame\);/);
  assert.match(componente, /window\.clearTimeout\(timer\);/);
  assert.match(
    componente,
    /\}, \[isDesktop, precisaDeCarrossel, totalItems, variant\]\);/,
  );
  assert.match(
    componente,
    /rowRef\.current\?\.scrollBy\(\{\s*left: direcao \* 450,\s*behavior: "smooth",\s*\}\);/,
  );
  assert.match(
    componente,
    /if \(!isDesktop \|\| !precisaDeCarrossel\) \{[\s\S]*?<div ref=\{rowRef\} style=\{listStyle\}>/,
  );
  assert.match(componente, /<div style=\{desktopCarouselShellStyle\}>/);
  assert.match(componente, /aria-label="Rolar carrossel para a esquerda"/);
  assert.match(componente, /aria-label="Rolar carrossel para a direita"/);
  assert.match(componente, /desktopCarouselArrowLeftIconStyle/);
  assert.match(componente, /desktopCarouselArrowRightIconStyle/);
});

test("Home delega somente as linhas de carrossel e preserva seus consumidores", () => {
  assert.match(
    pagina,
    /import HomeCarouselRow from "\.\.\/components\/HomeCarouselRow";/,
  );
  assert.doesNotMatch(pagina, /function CarouselRow\(/);
  assert.equal((pagina.match(/<HomeCarouselRow\b/g) || []).length, 18);
  assert.equal((pagina.match(/<\/HomeCarouselRow>/g) || []).length, 18);
  assert.doesNotMatch(pagina, /<CarouselRow\b/);

  for (const estilo of [
    "storyListStyle",
    "desktopCarouselShellStyle",
    "desktopStoryListStyle",
    "desktopStaticStoryListStyle",
    "desktopCarouselArrowBaseStyle",
    "desktopCarouselArrowLeftStyle",
    "desktopCarouselArrowRightStyle",
    "desktopCarouselArrowIconBaseStyle",
    "desktopCarouselArrowLeftIconStyle",
    "desktopCarouselArrowRightIconStyle",
    "authorListStyle",
    "desktopAuthorListStyle",
    "desktopStaticAuthorListStyle",
  ]) {
    assert.doesNotMatch(pagina, new RegExp(`\\b${estilo}\\b`));
  }

  assert.match(pagina, /function MobileObraLocalCard\(/);
  assert.match(pagina, /function MobileAutorCard\(/);
  assert.match(pagina, /function MobileObraCard\(/);
  assert.match(pagina, /async function carregarObrasSupabaseHome\(/);
  assert.match(pagina, /async function sincronizarColecaoObraHome\(/);
});
