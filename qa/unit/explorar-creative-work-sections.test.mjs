import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componente = readFileSync(
  new URL(
    "../../app/explorar/components/explorar-creative-work-sections.tsx",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/explorar/page.tsx", import.meta.url),
  "utf8",
);

test("ExplorarCreativeWorkSections preserva seções criativas de obras", () => {
  assert.match(componente, /export function ExplorarCreativeWorkSections/);
  assert.match(componente, /titulo: string;/);
  assert.match(componente, /obras: ObraLocal\[\];/);
  assert.match(componente, /secoes\.map\(\(secao\) =>/);
  assert.match(componente, /key=\{`obras-criativas-\$\{normalizarTexto\(secao\.titulo\)\}`\}/);
  assert.match(componente, /title=\{secao\.titulo\}/);
  assert.match(componente, /criarHrefListaExplorar\(\{\s*titulo: secao\.titulo,\s*modo: "obras",/);
  assert.match(componente, /<ExplorarCarouselRow isDesktop=\{isDesktop\} variant="obra">/);
  assert.match(componente, /key=\{`\$\{secao\.titulo\}-\$\{obra\.id\}`\}/);
  assert.match(componente, /desktopExplorarObraCarouselItemStyle/);
  assert.match(componente, /explorarObraCarouselItemStyle/);
  assert.match(componente, /<ObraPublicadaCard obra=\{obra\} isDesktop=\{isDesktop\} \/>/);
});

test("Explorar mantém a condição das seções criativas na página", () => {
  assert.match(pagina, /import \{ ExplorarCreativeWorkSections \} from "\.\/components\/explorar-creative-work-sections";/);
  const condicao = [
    'modoConteudo === "obras"',
    "!categoriaSelecionada", "!termoBusca", "!filtroFormatoAtivo", "!filtroTagAtivo",
    "!tagExcluidaAtiva", "!generoExcluidoAtivo", "!statusEditorialAtivo", "!palavrasAtivas",
    "!notaMinimaAtiva", "!ordenacaoPorCapitulosAtiva", "!filtroColecaoAtivo",
  ].join(" && ");
  const trecho = pagina.replace(/\s+/g, " ").split(condicao + " && (")[1];
  assert.ok(trecho, "as seções de descoberta pertencem ao catálogo sem filtros");
  assert.match(trecho, /^ <> \{!filtroConteudo18Ativo && <ExplorarNovasVozes[^>]*\/>\} <ExplorarCreativeWorkSections/);
  assert.match(pagina, /secoes=\{secoesCriativasObras\}/);
  assert.match(pagina, /tema=\{temaPagina\}/);
  assert.doesNotMatch(pagina, /secoesCriativasObras\.map/);
});
