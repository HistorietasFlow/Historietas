import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagina = readFileSync(
  new URL("../../app/publicar/page.tsx", import.meta.url),
  "utf8",
);
const cabecalho = readFileSync(
  new URL("../../app/publicar/components/PublicarPageHeader.tsx", import.meta.url),
  "utf8",
);
const progresso = readFileSync(
  new URL("../../app/publicar/components/PublicarProgress.tsx", import.meta.url),
  "utf8",
);
const previa = readFileSync(
  new URL("../../app/publicar/components/PublicarWorkPreview.tsx", import.meta.url),
  "utf8",
);

test("Publicar delega a composição visual do cabeçalho e progresso", () => {
  assert.match(pagina, /import \{ PublicarPageHeader \} from "\.\/components\/PublicarPageHeader";/);
  assert.match(pagina, /import \{ PublicarProgress \} from "\.\/components\/PublicarProgress";/);
  assert.match(pagina, /<PublicarPageHeader[\s\S]*?isDesktop=\{isDesktop\}[\s\S]*?voltarHome=\{t\("voltarHome"\)\}[\s\S]*?novaObra=\{t\("novaObra"\)\}/);
  assert.match(pagina, /<PublicarProgress[\s\S]*?isDesktop=\{isDesktop\}[\s\S]*?progresso=\{progresso\}[\s\S]*?rotulo=\{t\("progresso"\)\}/);
  assert.doesNotMatch(pagina, /<header style=\{isDesktop \? desktopTitleHeaderStyle : titleHeaderStyle\}/);

  assert.match(cabecalho, /href="\/"/);
  assert.match(cabecalho, /aria-label=\{voltarHome\}/);
  assert.match(cabecalho, /isDesktop \? desktopTitleHeaderStyle : titleHeaderStyle/);
  assert.match(progresso, /isDesktop[\s\S]*?desktopProgressBoxStyle[\s\S]*?progressBoxStyle/);
  assert.match(progresso, /width: `\$\{progresso\}%`/);
});

test("Publicar delega a prévia sem deslocar estados ou regras de publicação", () => {
  assert.match(pagina, /import \{ PublicarWorkPreview \} from "\.\/components\/PublicarWorkPreview";/);
  assert.match(pagina, /<PublicarWorkPreview[\s\S]*?arquivoCapituloMinutos=\{arquivoCapituloMinutos\}[\s\S]*?classificacaoTexto=\{[\s\S]*?traduzirClassificacaoPublicar\(idioma, classificacaoFinal\)[\s\S]*?previewTemConteudo=\{previewTemConteudo\}/);
  assert.doesNotMatch(pagina, /<aside style=\{isDesktop \? desktopPreviewPanelStyle : previewPanelStyle\}/);

  assert.match(previa, /export function PublicarWorkPreview\(/);
  assert.match(previa, /criarPreviewCoverStyle\(capa\)/);
  assert.match(previa, /traduzirFormatoPublicar\(idioma, formatoFinal\)/);
  assert.match(previa, /traduzirGeneroPublicar\(idioma, generoFinal\)/);
  assert.match(previa, /temCapituloImportado \? "100%" : "0%"/);
  assert.match(previa, /t\("dicaPrevia"\)/);
});

test("componentes visuais de Publicar permanecem sem runtime de dados", () => {
  for (const componente of [cabecalho, progresso, previa]) {
    assert.doesNotMatch(componente, /supabase|localStorage|useEffect|useState|window\.|document\./);
  }
});
