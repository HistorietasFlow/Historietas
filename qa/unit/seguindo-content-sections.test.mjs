import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../../app/seguindo/page.tsx", import.meta.url), "utf8");
const pageContent = readFileSync(
  new URL("../../app/seguindo/components/seguindo-page-content.tsx", import.meta.url),
  "utf8",
);
const loadedState = readFileSync(
  new URL(
    "../../app/seguindo/components/seguindo-page-loaded-state.tsx",
    import.meta.url,
  ),
  "utf8",
);
const worksSection = readFileSync(
  new URL("../../app/seguindo/components/seguindo-works-section.tsx", import.meta.url),
  "utf8",
);
const peopleSections = readFileSync(
  new URL("../../app/seguindo/components/seguindo-people-sections.tsx", import.meta.url),
  "utf8",
);

test("Seguindo delega somente a composição visual das seções de conteúdo", () => {
  assert.match(page, /import \{ SeguindoPageLoadedState \} from "\.\/components\/seguindo-page-loaded-state";/);
  assert.match(page, /<SeguindoPageLoadedState[\s\S]*?obrasFiltradas,/);
  assert.match(loadedState, /import \{ SeguindoPageContent \} from "\.\/seguindo-page-content";/);
  assert.match(loadedState, /<SeguindoPageContent \{\.\.\.content\} \/>/);
  assert.match(pageContent, /totalSemFiltros === 0 && !buscaSugestoesUsuariosAtiva/);
  assert.match(pageContent, /<SeguindoWorksSection[\s\S]*?obrasFiltradas=\{obrasFiltradas\}/);
  assert.match(pageContent, /<SeguindoPeopleSections[\s\S]*?solicitacoesSeguidoresFiltradas=\{solicitacoesSeguidoresFiltradas\}/);
  assert.match(pageContent, /onSeguirUsuarioSugestao=\{onSeguirUsuarioSugestao\}/);
  assert.match(pageContent, /onDeixarDeSeguirAutor=\{onDeixarDeSeguirAutor\}/);

  assert.match(worksSection, /^"use client";/);
  assert.match(worksSection, /Nenhuma obra seguida encontrada/);
  assert.match(worksSection, /isDesktop \? desktopGridStyle : gridStyle/);
  assert.match(worksSection, /visualizandoListaSocialDoPerfil/);

  assert.match(peopleSections, /^"use client";/);
  assert.match(peopleSections, /abaConteudo === "seguidores"/);
  assert.match(peopleSections, /SOLICITAÇÕES PARA SEGUIR/);
  assert.match(peopleSections, /SUGESTÕES PARA SEGUIR/);
  assert.match(peopleSections, /AUTORES SEGUIDOS/);
  assert.match(peopleSections, /Carregando sugestões para seguir/);
  assert.match(peopleSections, /solicitacoesEnviadasIds\.includes/);
  assert.match(peopleSections, /!visualizandoListaSocialDoPerfil && abaConteudo === "pessoas"/);

  for (const component of [pageContent, worksSection, peopleSections]) {
    assert.doesNotMatch(component, /supabase|localStorage|useEffect|useState/);
  }
});
