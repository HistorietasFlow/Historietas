import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL(
    "../../app/explorar/components/explorar-filtered-authors-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/explorar/page.tsx", import.meta.url),
  "utf8",
);

test("ExplorarFilteredAuthorsSection preserva grade e cards de autores", () => {
  assert.match(componente, /export function ExplorarFilteredAuthorsSection/);
  assert.match(componente, /autores: AutorExplorar\[\];/);
  assert.match(componente, /titulo: string;/);
  assert.match(componente, /tema: TemaCategoriaExplorar;/);
  assert.match(componente, /isDesktop\s*\? desktopSectionStyle\s*: sectionStyle/);
  assert.match(componente, /<SectionHeader/);
  assert.match(componente, /title=\{titulo\}/);
  assert.match(componente, /tema=\{tema\}/);
  assert.match(componente, /isDesktop\s*\? desktopAutoresExplorarGridStyle\s*: autoresExplorarGridStyle/);
  assert.match(componente, /autores\.map\(\(autor\) =>/);
  assert.match(componente, /key=\{autor\.chave\}/);
  assert.match(componente, /emGrade/);
});

test("Explorar mantém filtros e título derivados de autores na página", () => {
  assert.match(pagina, /import \{ ExplorarFilteredAuthorsSection \} from "\.\/components\/explorar-filtered-authors-section";/);
  assert.match(
    pagina,
    /modoConteudo === "autores" &&\s*\(Boolean\(categoriaSelecionada\) \|\| Boolean\(termoBusca\)\) &&\s*autoresFiltrados\.length > 0 && \(/,
  );
  assert.match(pagina, /<ExplorarFilteredAuthorsSection/);
  assert.match(pagina, /autores=\{autoresFiltrados\}/);
  assert.match(pagina, /categoriaSelecionada\s*\? `Autores de \$\{categoriaSelecionada\}`\s*: "Autores encontrados"/);
  assert.doesNotMatch(pagina, /autoresFiltrados\.map/);
});
