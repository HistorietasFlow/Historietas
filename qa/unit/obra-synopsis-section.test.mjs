import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const synopsisSection = readFileSync(
  new URL(
    "../../app/obra/[slug]/components/obra-synopsis-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("secao Sinopse preserva estrutura, estilos e texto ignorado pela traducao", () => {
  for (const trecho of [
    '<section id="sinopse" style={synopsisSectionStyle}>',
    "sectionHeaderStyle",
    "accentSectionTitleStyle",
    "SINOPSE",
    "synopsisCardStyle",
    'data-historietas-i18n-ignore="true"',
    "synopsisTextStyle",
    "{texto}",
  ]) {
    assert.ok(synopsisSection.includes(trecho), trecho);
  }
});

test("cliente preserva condicao, derivacao e ramo de Capitulos via componente", () => {
  for (const trecho of [
    "sinopseAberta ? (",
    "<ObraSynopsisSection texto={sinopseObraExibida} />",
    "sinopseObraExibida",
    "obterSinopseObraExibida(obra)",
    "capitulosDaObra.length > 0",
    "<ObraChaptersSection",
    "capitulos={capitulosDaObra}",
  ]) {
    assert.ok(paginaObra.includes(trecho), trecho);
  }

  assert.doesNotMatch(synopsisSection, /capitulosDaObra|chaptersSectionStyle/);
});
