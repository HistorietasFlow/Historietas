import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL(
    "../../app/explorar/components/explorar-genre-work-sections.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/explorar/page.tsx", import.meta.url),
  "utf8",
);

test("ExplorarGenreWorkSections preserva seções de obras por gênero", () => {
  assert.match(componente, /export function ExplorarGenreWorkSections/);
  assert.match(componente, /genero: string;/);
  assert.match(componente, /obras: ObraLocal\[\];/);
  assert.match(componente, /secoes\.map\(\(secao\) =>/);
  assert.match(componente, /key=\{`obras-\$\{normalizarTexto\(secao\.genero\)\}`\}/);
  assert.match(componente, /obterTituloCriativoObrasExplorar\(secao\.genero\)/);
  assert.match(componente, /tema=\{obterTemaCategoria\(\)\}/);
  assert.match(componente, /genero: secao\.genero,/);
  assert.match(componente, /modo: "obras",/);
  assert.match(componente, /<ExplorarCarouselRow isDesktop=\{isDesktop\} variant="obra">/);
  assert.match(componente, /key=\{`\$\{secao\.genero\}-\$\{obra\.id\}`\}/);
  assert.match(componente, /desktopExplorarObraCarouselItemStyle/);
  assert.match(componente, /explorarObraCarouselItemStyle/);
  assert.match(componente, /<ObraPublicadaCard obra=\{obra\} isDesktop=\{isDesktop\} \/>/);
});

test("Explorar mantém a condição das seções por gênero na página", () => {
  assert.match(pagina, /import \{ ExplorarGenreWorkSections \} from "\.\/components\/explorar-genre-work-sections";/);
  assert.match(
    pagina,
    /modoConteudo === "obras" &&\s*!categoriaSelecionada &&\s*!termoBusca && \(\s*<ExplorarGenreWorkSections/,
  );
  assert.match(pagina, /secoes=\{secoesObrasPorGenero\}/);
  assert.doesNotMatch(pagina, /secoesObrasPorGenero\.map/);
});
