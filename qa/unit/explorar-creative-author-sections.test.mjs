import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL(
    "../../app/explorar/components/explorar-creative-author-sections.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/explorar/page.tsx", import.meta.url),
  "utf8",
);

test("ExplorarCreativeAuthorSections preserva seções criativas de autores", () => {
  assert.match(componente, /export function ExplorarCreativeAuthorSections/);
  assert.match(componente, /titulo: string;/);
  assert.match(componente, /autores: AutorExplorar\[\];/);
  assert.match(componente, /secoes\.map\(\(secao\) =>/);
  assert.match(componente, /normalizarTexto\(secao\.titulo\)/);
  assert.match(componente, /key=\{`autores-criativos-\$\{normalizarTexto\(secao\.titulo\)\}`\}/);
  assert.match(componente, /<SectionHeader/);
  assert.match(componente, /title=\{secao\.titulo\}/);
  assert.match(componente, /criarHrefListaExplorar\(\{\s*titulo: secao\.titulo,\s*modo: "autores",/);
  assert.match(componente, /<ExplorarCarouselRow isDesktop=\{isDesktop\} variant="autor">/);
  assert.match(componente, /<AutorExplorarCard/);
  assert.match(componente, /key=\{`\$\{secao\.titulo\}-\$\{autor\.chave\}`\}/);
});

test("Explorar mantém a condição das seções criativas de autores na página", () => {
  assert.match(pagina, /import \{ ExplorarCreativeAuthorSections \} from "\.\/components\/explorar-creative-author-sections";/);
  assert.match(
    pagina,
    /modoConteudo === "autores" &&\s*!categoriaSelecionada &&\s*!termoBusca &&\s*\(\s*<ExplorarCreativeAuthorSections/,
  );
  assert.match(pagina, /secoes=\{secoesCriativasAutores\}/);
  assert.match(pagina, /tema=\{temaPagina\}/);
  assert.doesNotMatch(pagina, /secoesCriativasAutores\.map/);
});
