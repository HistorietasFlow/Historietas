import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL(
    "../../app/explorar/components/explorar-genre-author-sections.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/explorar/page.tsx", import.meta.url),
  "utf8",
);

test("ExplorarGenreAuthorSections preserva seções de autores por gênero", () => {
  assert.match(componente, /export function ExplorarGenreAuthorSections/);
  assert.match(componente, /genero: string;/);
  assert.match(componente, /autores: AutorExplorar\[\];/);
  assert.match(componente, /secoes\.map\(\(secao\) =>/);
  assert.match(componente, /key=\{`autores-\$\{normalizarTexto\(secao\.genero\)\}`\}/);
  assert.match(componente, /obterTituloCriativoAutoresExplorar\(secao\.genero\)/);
  assert.match(componente, /tema=\{obterTemaCategoria\(\)\}/);
  assert.match(componente, /modo: "autores",/);
  assert.match(componente, /genero: secao\.genero,/);
  assert.match(componente, /<ExplorarCarouselRow isDesktop=\{isDesktop\} variant="autor">/);
  assert.match(componente, /<AutorExplorarCard/);
  assert.match(componente, /key=\{`\$\{secao\.genero\}-\$\{autor\.chave\}`\}/);
});

test("Explorar mantém a condição das seções de autores por gênero na página", () => {
  assert.match(pagina, /import \{ ExplorarGenreAuthorSections \} from "\.\/components\/explorar-genre-author-sections";/);
  assert.match(
    pagina,
    /modoConteudo === "autores" &&\s*!categoriaSelecionada &&\s*!termoBusca &&\s*\(\s*<ExplorarGenreAuthorSections/,
  );
  assert.match(pagina, /secoes=\{secoesAutoresPorGenero\}/);
  assert.doesNotMatch(pagina, /secoesAutoresPorGenero\.map/);
});
