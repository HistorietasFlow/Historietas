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
const secoes = readFileSync(
  new URL("../../components/HomeContentSections.tsx", import.meta.url),
  "utf8",
);
const catalogoCard = readFileSync(
  new URL("../../components/HomeCatalogWorkCard.tsx", import.meta.url),
  "utf8",
);
const obraLocalCard = readFileSync(
  new URL("../../components/HomeLocalWorkCard.tsx", import.meta.url),
  "utf8",
);
const colecoesSupabase = readFileSync(
  new URL("../../app/lib/home-collection-supabase-utils.ts", import.meta.url),
  "utf8",
);
const acaoFavoritoHero = readFileSync(
  new URL("../../app/lib/home-hero-favorite-action.ts", import.meta.url),
  "utf8",
);
const loaderInicial = readFileSync(
  new URL("../../app/lib/home-initial-data-loader.ts", import.meta.url),
  "utf8",
);
const hookInicial = readFileSync(
  new URL("../../app/hooks/use-home-initial-data.ts", import.meta.url),
  "utf8",
);
const hookBuscaCatalogo = readFileSync(
  new URL("../../app/hooks/use-home-catalog-search.ts", import.meta.url),
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

test("Home delega as seções de conteúdo e preserva seus consumidores", () => {
  assert.match(
    secoes,
    /import HomeCarouselRow from "\.\/HomeCarouselRow";/,
  );
  assert.doesNotMatch(pagina, /function CarouselRow\(/);
  assert.equal((secoes.match(/<HomeCarouselRow\b/g) || []).length, 18);
  assert.equal((secoes.match(/<\/HomeCarouselRow>/g) || []).length, 18);
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

  assert.match(secoes, /import MobileObraLocalCard from "\.\/HomeLocalWorkCard";/);
  assert.doesNotMatch(pagina, /function MobileObraLocalCard\(/);
  assert.match(obraLocalCard, /export default function MobileObraLocalCard\(/);
  assert.match(secoes, /import MobileAutorCard from "\.\/HomeAuthorCard";/);
  assert.doesNotMatch(pagina, /function MobileAutorCard\(/);
  assert.match(secoes, /import MobileObraCard from "\.\/HomeCatalogWorkCard";/);
  assert.doesNotMatch(pagina, /function MobileObraCard\(/);
  assert.match(catalogoCard, /export default function MobileObraCard\(/);
  assert.match(pagina, /import useHomeCatalogSearch from "\.\/hooks\/use-home-catalog-search";/);
  assert.match(
    hookBuscaCatalogo,
    /import \{[\s\S]*?carregarObrasSupabaseHome,[\s\S]*?\} from "\.\.\/lib\/home-supabase-works-loader";/,
  );
  assert.doesNotMatch(pagina, /async function carregarObrasSupabaseHome\(/);
  assert.match(pagina, /import[\s\S]*?useHomeInitialData[\s\S]*?from "\.\/hooks\/use-home-initial-data";/);
  assert.match(hookInicial, /import \{ carregarSnapshotInicialHome \} from "\.\.\/lib\/home-initial-data-loader";/);
  assert.match(
    loaderInicial,
    /import \{ carregarIdsColecaoUsuarioHome \} from "\.\/home-collection-supabase-utils";/,
  );
  assert.match(
    acaoFavoritoHero,
    /import \{ sincronizarColecaoObraHome \} from "\.\/home-collection-supabase-utils";/,
  );
  assert.match(colecoesSupabase, /export async function sincronizarColecaoObraHome\(/);
});
