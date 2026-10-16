import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const hero = readFileSync(
  new URL("../../components/HomeHero.tsx", import.meta.url),
  "utf8",
);

test("HomeHero estabelece a fronteira visual completa do Hero", () => {
  assert.match(hero, /^"use client";/);
  assert.match(hero, /export default function HomeHero/);
  assert.match(hero, /isDesktop: boolean;/);
  assert.match(hero, /language: HistorietasLanguage;/);
  assert.match(hero, /obrasHero: Obra\[\];/);
  assert.match(hero, /setHeroIndex: Dispatch<SetStateAction<number>>;/);
  assert.match(hero, /onToggleFavorite: \(\) => unknown;/);
  assert.match(hero, /import HomeHeroCarouselDots from "\.\/HomeHeroCarouselDots";/);
  assert.match(hero, /import type \{ Obra \} from "\.\.\/app\/lib\/home-page-models";/);
  assert.match(hero, /criarMobileHeroFrameBackground\(\)/);
  assert.match(hero, /criarMobileHeroImageLayerStyle\(heroObra\)/);
  assert.match(hero, /criarDesktopHeroPosterStyle\(heroObra\)/);
  assert.match(hero, /aria-label=\{`Abrir \$\{heroObra\.titulo\}`\}/);
  assert.match(hero, /\["✦", "◌", "✧", "◇"\]/);
  assert.match(hero, /Conheça o Historietas/);
  assert.match(hero, /Em destaque/);
  assert.match(hero, /Autor não informado/);
  assert.match(hero, /Nenhuma sinopse informada\./);
  assert.match(hero, /Explorar obras/);
  assert.match(hero, /Ler agora/);
  assert.match(hero, /Ver obra/);
  assert.match(hero, /Publicar obra/);
  assert.match(hero, /\{heroEstaSalvo \? "Salvo" : "Salvar"\}/);
  assert.match(hero, /onClick=\{onToggleFavorite\}/);
  assert.match(hero, /aria-pressed=\{heroEstaSalvo\}/);
  assert.match(hero, /traduzirGeneroHome\(heroObra\.genero, language\)/);
  assert.match(hero, /traduzirClassificacaoHome\(heroObra\.classificacaoIndicativa, language\)/);
  assert.match(hero, /formatarSinopseHeroMobile\(heroObra\.sinopse\)/);
  assert.match(hero, /metricasHeroHome\.map/);
  assert.match(hero, /desktopMetricasHeroHome\.map/);
  assert.match(hero, /isDesktop=\{true\}/);
  assert.match(hero, /isDesktop=\{false\}/);
  assert.match(hero, /onSelect=\{setHeroIndex\}/);
});

test("Home delega apenas a composição e preserva preparação e ação do Hero", () => {
  assert.match(pagina, /import HomeHero from "\.\.\/components\/HomeHero";/);
  assert.match(
    pagina,
    /<HomeHero[\s\S]*?isDesktop=\{isDesktop\}[\s\S]*?language=\{language\}[\s\S]*?obrasHero=\{obrasHero\}[\s\S]*?heroIndex=\{heroIndex\}[\s\S]*?setHeroIndex=\{setHeroIndex\}[\s\S]*?onToggleFavorite=\{alternarHeroFavorito\}/,
  );
  assert.match(pagina, /const \{ heroIndex, setHeroIndex \} = useHomeHeroCarousel\(/);
  assert.match(pagina, /function alternarHeroFavorito\(\) \{/);
  assert.match(pagina, /return alternarHeroFavoritoHome\(/);
  assert.doesNotMatch(pagina, /<HomeHeroCarouselDots\b/);
  assert.doesNotMatch(pagina, /<section[\s\S]*?desktopHeroPosterFrameStyle/);
});
