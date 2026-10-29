import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL(
    "../../app/explorar/components/explorar-filtered-works-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/explorar/page.tsx", import.meta.url),
  "utf8",
);

test("ExplorarFilteredWorksSection preserva grade, cards e children", () => {
  assert.match(componente, /import type \{ ReactNode \} from "react";/);
  assert.match(componente, /export function ExplorarFilteredWorksSection/);
  assert.match(componente, /obras: ObraLocal\[\];/);
  assert.match(componente, /titulo: string;/);
  assert.match(componente, /tema: TemaCategoriaExplorar;/);
  assert.match(componente, /children\?: ReactNode;/);
  assert.match(componente, /style=\{isDesktop \? desktopSectionStyle : sectionStyle\}/);
  assert.match(componente, /<SectionHeader title=\{titulo\} tema=\{tema\} isDesktop=\{isDesktop\} \/>/);
  assert.match(componente, /style=\{isDesktop \? desktopPublishedGridStyle : gridStyle\}/);
  assert.match(componente, /obras\.map\(\(obra\) =>/);
  assert.match(componente, /key=\{obra\.id\}/);
  assert.match(componente, /<ObraPublicadaCard/);
  assert.match(componente, /\{children\}/);
});

test("Explorar mantém filtros, título e paginação na página", () => {
  assert.match(pagina, /import \{ ExplorarFilteredWorksSection \} from "\.\/components\/explorar-filtered-works-section";/);
  assert.match(
    pagina,
    /modoConteudo === "obras" &&\s*\(Boolean\(categoriaSelecionada\) \|\|\s*Boolean\(termoBusca\) \|\|\s*filtroConteudo18Ativo\) &&\s*obrasLocaisFiltradas\.length > 0 && \(/,
  );
  assert.match(pagina, /<ExplorarFilteredWorksSection/);
  assert.match(pagina, /obras=\{obrasLocaisFiltradas\}/);
  assert.match(pagina, /\? `Publicações em \$\{categoriaSelecionada\}`/);
  assert.match(pagina, /\? "Resultados da busca"/);
  assert.match(pagina, /: "Conteúdo 18\+"/);
  assert.match(pagina, /consultaCatalogoPersonalizada && catalogoTemMais/);
  assert.match(pagina, /onCarregarMais=\{\(\) =>\s*void carregarMaisObrasCatalogo\(\)\s*\}/);
  assert.doesNotMatch(pagina, /obrasLocaisFiltradas\.map/);
});
