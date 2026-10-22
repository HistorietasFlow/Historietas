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
const capa = readFileSync(
  new URL("../../app/publicar/components/PublicarCoverUpload.tsx", import.meta.url),
  "utf8",
);
const arquivo = readFileSync(
  new URL("../../app/publicar/components/PublicarContentFileUpload.tsx", import.meta.url),
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

test("Publicar delega os uploads visuais sem deslocar estado ou leitura de arquivos", () => {
  assert.match(pagina, /import \{ PublicarCoverUpload \} from "\.\/components\/PublicarCoverUpload";/);
  assert.match(pagina, /import \{ PublicarContentFileUpload \} from "\.\/components\/PublicarContentFileUpload";/);
  assert.match(pagina, /<PublicarCoverUpload[\s\S]*?capaInputRef=\{capaInputRef\}[\s\S]*?onRemoverCapa=\{removerCapa\}[\s\S]*?onSelecionarCapa=\{selecionarCapa\}/);
  assert.match(pagina, /<PublicarContentFileUpload[\s\S]*?arquivoConteudoInputRef=\{arquivoConteudoInputRef\}[\s\S]*?onAnexarArquivoCompleto=\{anexarArquivoCompleto\}[\s\S]*?onSelecionarConteudoArquivo=\{selecionarConteudoArquivo\}[\s\S]*?onTransformarArquivoTextoEmCapitulo=\{transformarArquivoTextoEmCapitulo\}/);
  assert.doesNotMatch(pagina, /ref=\{capaInputRef\}/);
  assert.doesNotMatch(pagina, /ref=\{arquivoConteudoInputRef\}/);

  assert.match(capa, /accept="\.png,\.jpg,\.jpeg,\.webp,\.gif,image\/png,image\/jpeg,image\/webp,image\/gif"/);
  assert.match(capa, /criarCoverUploadIconBoxStyle\(capa\)/);
  assert.match(capa, /isDesktop \? desktopCoverButtonStyle : coverButtonStyle/);
  assert.match(capa, /onClick=\{onRemoverCapa\}/);

  assert.match(arquivo, /accept="\.pdf,\.txt,\.md,\.png,\.jpg,\.jpeg,\.webp,\.gif,application\/pdf,text\/plain,text\/markdown,image\/png,image\/jpeg,image\/webp,image\/gif"/);
  assert.match(arquivo, /temCapituloImportado \? "⇧" : "▣"/);
  assert.match(arquivo, /onTransformarArquivoTextoEmCapitulo\(arquivoTextoPendente\)/);
  assert.match(arquivo, /onAnexarArquivoCompleto\(arquivoTextoPendente\)/);
  assert.match(arquivo, /arquivoConteudoInputRef\.current\?\.click\(\)/);
  assert.match(arquivo, /isDesktop \? desktopFullWidthArquivoObraBoxStyle : chapterImportBoxStyle/);
});

test("componentes visuais de Publicar permanecem sem runtime de dados", () => {
  for (const componente of [cabecalho, progresso, previa, capa, arquivo]) {
    assert.doesNotMatch(componente, /supabase|localStorage|useEffect|useState|window\.|document\./);
  }
});
