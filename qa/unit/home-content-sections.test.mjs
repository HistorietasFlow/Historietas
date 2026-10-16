import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL("../../components/HomeContentSections.tsx", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");

const secoes = [
  "Continuar lendo",
  "Minha lista",
  "Autores para conhecer",
  "Recomendações para você",
  "Publicações recentes",
  "Novos capítulos",
  "Mais curtidas",
  "Mais comentadas",
  "Extras e arquivos",
  "Para ler agora",
  "Catálogo",
  "Fantasia e poderes",
  "Terror e suspense",
  "Romance e drama",
  "Ação e rivalidades",
  "Sci-fi e códigos",
  "Em breve na Historietas",
  "Obras em destaque",
];

test("HomeContentSections preserva a composição e contratos das seções", () => {
  assert.match(componente, /export default function HomeContentSections/);
  for (const prop of [
    "isDesktop",
    "termoBusca",
    "homeSemObrasReais",
    "obrasParaContinuar",
    "autoresParaConhecer",
    "obrasFiltradas",
    "obrasEmBreve",
  ]) {
    assert.match(componente, new RegExp(`${prop}:`));
  }
  for (const secao of secoes) {
    assert.match(componente, new RegExp(secao));
  }
  assert.match(componente, /homeSemObrasReais && <HomeEmptyState \/>/);
  assert.match(componente, /obrasFiltradas\.length > 0 \|\| Boolean\(termoBusca\)/);
  assert.match(componente, /<EmptySearch \/>/);
  assert.match(componente, /obra publicada/);
  assert.match(componente, /obras publicadas/);
  assert.match(componente, /temasRecomendadosUsuario\.size > 0/);
  assert.match(componente, /variant="autor"/);
  assert.match(componente, /tipo="continuar"/);
  assert.match(componente, /tipo="catalogo"/);
  assert.match(componente, /tipo="novo-capitulo"/);
  assert.match(componente, /desktopLastSectionStyle : lastSectionStyle/);
  assert.doesNotMatch(componente, /useMemo|useEffect|supabase|localStorage/);
});

test("Home delega somente o JSX das seções e retém as listas derivadas", () => {
  assert.match(
    pagina,
    /import HomeContentSections from "\.\.\/components\/HomeContentSections";/,
  );
  assert.match(pagina, /<HomeContentSections[\s\S]*?obrasEmBreve=\{obrasEmBreve\}/);
  assert.equal((pagina.match(/<HomeSectionHeader\b/g) || []).length, 0);
  assert.match(pagina, /const obrasParaContinuar = useMemo/);
  assert.match(pagina, /const obrasMinhaLista = useMemo/);
  assert.match(pagina, /const obrasFiltradas = useMemo/);
  assert.match(pagina, /const obrasEmBreve = useMemo/);
});
