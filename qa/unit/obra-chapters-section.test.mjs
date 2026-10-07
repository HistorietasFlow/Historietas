import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const chaptersSection = readFileSync(
  new URL(
    "../../app/obra/[slug]/components/obra-chapters-section.tsx",
    import.meta.url,
  ),
  "utf8",
);
const paginaObra = readFileSync(
  new URL("../../app/obra/[slug]/ObraDinamicaClient.tsx", import.meta.url),
  "utf8",
);

test("secao Capitulos preserva estrutura, estilos, links e metadados", () => {
  for (const trecho of [
    'import Link from "next/link";',
    'import type { CapituloDinamico } from "../lib/obra-reading-utils";',
    '<section id="capitulos" style={chaptersSectionStyle}>',
    "sectionHeaderStyle",
    "accentSectionTitleStyle",
    "CAPÍTULOS",
    "chapterCountBadgeStyle",
    "{textoDisponibilidade}",
    "isDesktop ? desktopChaptersListStyle : chaptersListStyle",
    "capitulos.map((capitulo) => (",
    "key={capitulo.id || capitulo.numero}",
    "href={capitulo.href}",
    "aria-label={`Abrir ${capitulo.titulo}`}",
    "isDesktop ? desktopChapterCardStyle : chapterCardStyle",
    "chapterNumberStyle",
    'data-historietas-i18n-ignore="true"',
    "chapterContentStyle",
    "chapterTitleStyle",
    "capitulo.descricao ?",
    "chapterMetaStyle",
  ]) {
    assert.ok(chaptersSection.includes(trecho), trecho);
  }
});

test("cliente preserva guard, derivacoes e ramo de Sinopse", () => {
  for (const trecho of [
    "sinopseAberta ? (",
    "<ObraSynopsisSection texto={sinopseObraExibida} />",
    "capitulosDaObra.length > 0 && (",
    "<ObraChaptersSection",
    "capitulos={capitulosDaObra}",
    "isDesktop={isDesktop}",
    "textoDisponibilidade={obterTextoDisponibilidadeCapitulosObra(",
    "capitulosDaObra.length,",
    "obraDisponivel,",
    "const capitulosDaObra = useMemo<CapituloDinamico[]>(",
    "const obraDisponivel = obterObraDisponivelExibida(obra);",
  ]) {
    assert.ok(paginaObra.includes(trecho), trecho);
  }
});

test("secao Capitulos nao absorve carregamento, disponibilidade ou estado", () => {
  assert.doesNotMatch(
    chaptersSection,
    /supabase|useState|useEffect|obterCapitulosObraPublica|obterTextoDisponibilidadeCapitulosObra|\.sort\(/,
  );
});
