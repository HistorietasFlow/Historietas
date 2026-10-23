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
const shell = readFileSync(
  new URL("../../app/publicar/components/PublicarPageShell.tsx", import.meta.url),
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
const avisosAdultos = readFileSync(
  new URL("../../app/publicar/components/PublicarAdultWarnings.tsx", import.meta.url),
  "utf8",
);
const sinopse = readFileSync(
  new URL("../../app/publicar/components/PublicarSynopsisField.tsx", import.meta.url),
  "utf8",
);
const acoesFormulario = readFileSync(
  new URL("../../app/publicar/components/PublicarFormActions.tsx", import.meta.url),
  "utf8",
);
const camposBasicos = readFileSync(
  new URL("../../app/publicar/components/PublicarBasicFields.tsx", import.meta.url),
  "utf8",
);
const camposFormatoGenero = readFileSync(
  new URL("../../app/publicar/components/PublicarFormatGenreFields.tsx", import.meta.url),
  "utf8",
);
const camposTagClassificacao = readFileSync(
  new URL("../../app/publicar/components/PublicarTagClassificationFields.tsx", import.meta.url),
  "utf8",
);

test("Publicar delega a composição visual do cabeçalho", () => {
  assert.match(pagina, /from "\.\/components\/PublicarPageShell";/);
  assert.match(shell, /<PublicarPageHeader[\s\S]*?isDesktop=\{isDesktop\}[\s\S]*?voltarHome=\{voltarHome\}[\s\S]*?novaObra=\{novaObra\}/);
  assert.doesNotMatch(pagina, /<header style=\{isDesktop \? desktopTitleHeaderStyle : titleHeaderStyle\}/);

  assert.match(cabecalho, /href="\/"/);
  assert.match(cabecalho, /aria-label=\{voltarHome\}/);
  assert.match(cabecalho, /isDesktop \? desktopTitleHeaderStyle : titleHeaderStyle/);
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

test("Publicar delega campos controlados sem deslocar seus estados e callbacks", () => {
  assert.match(pagina, /import \{ PublicarSynopsisField \} from "\.\/components\/PublicarSynopsisField";/);
  assert.match(pagina, /import \{ PublicarFormActions \} from "\.\/components\/PublicarFormActions";/);
  assert.match(pagina, /<PublicarSynopsisField[\s\S]*?onSinopseChange=\{atualizarSinopse\}[\s\S]*?sinopse=\{sinopse\}[\s\S]*?t=\{t\}/);
  assert.match(pagina, /<PublicarFormActions[\s\S]*?processando=\{processando\}[\s\S]*?progresso=\{progresso\}[\s\S]*?salvando=\{t\("salvando"\)\}/);
  assert.match(pagina, /function alternarAvisoConteudo18\(aviso: AvisoConteudo18\)[\s\S]*?setAvisosConteudo18[\s\S]*?setErro\(""\)/);
  assert.match(pagina, /function atualizarSinopse\(valor: string\)[\s\S]*?setSinopse\(valor\)[\s\S]*?setErro\(""\)/);
  assert.doesNotMatch(pagina, /aria-label="Avisos de conteúdo 18\+"/);
  assert.doesNotMatch(pagina, /id="publicar-sinopse"/);

  assert.match(avisosAdultos, /AVISOS_CONTEUDO_18\.map/);
  assert.match(avisosAdultos, /onChange=\{\(\) => onAlternarAviso\(aviso\)\}/);
  assert.match(avisosAdultos, /traduzirAvisoConteudo18\(aviso, idioma\)/);
  assert.match(sinopse, /id="publicar-sinopse"/);
  assert.match(sinopse, /onSinopseChange\(event\.target\.value\)/);
  assert.match(sinopse, /sinopseValida \? miniCounterOkStyle : miniCounterWarningStyle/);
  assert.match(acoesFormulario, /href="\/"/);
  assert.match(acoesFormulario, /processando \? disabledButtonStyle : primaryButtonStyle/);
  assert.match(acoesFormulario, /<PublicarProgress[\s\S]*?progresso=\{progresso\}[\s\S]*?rotulo=\{progressoRotulo\}/);
});

test("Publicar delega os metadados controlados e preserva os callbacks na pÃ¡gina", () => {
  assert.match(pagina, /import \{ PublicarBasicFields \} from "\.\/components\/PublicarBasicFields";/);
  assert.match(pagina, /import \{ PublicarFormatGenreFields \} from "\.\/components\/PublicarFormatGenreFields";/);
  assert.match(pagina, /import \{ PublicarTagClassificationFields \} from "\.\/components\/PublicarTagClassificationFields";/);
  assert.match(pagina, /<PublicarBasicFields[\s\S]*?onAutorChange=\{atualizarAutor\}[\s\S]*?onTituloChange=\{atualizarTitulo\}/);
  assert.match(pagina, /<PublicarFormatGenreFields[\s\S]*?onFormatoChange=\{atualizarFormato\}[\s\S]*?onGeneroChange=\{atualizarGenero\}/);
  assert.match(pagina, /<PublicarTagClassificationFields[\s\S]*?onAlternarAviso=\{alternarAvisoConteudo18\}[\s\S]*?onClassificacaoChange=\{atualizarClassificacaoIndicativa\}[\s\S]*?onTagChange=\{atualizarTagSelecionada\}/);
  assert.match(pagina, /function atualizarFormato\(valor: string\)[\s\S]*?setFormato\(valor\)[\s\S]*?setErro\(""\)/);
  assert.match(pagina, /function atualizarGenero\(valor: string\)[\s\S]*?setGenero\(valor\)[\s\S]*?setErro\(""\)/);
  assert.match(pagina, /function atualizarClassificacaoIndicativa\(valor: string\)[\s\S]*?setClassificacaoIndicativa\(valor\)[\s\S]*?setAvisosConteudo18\(\[\]\)[\s\S]*?setErro\(""\)/);
  assert.doesNotMatch(pagina, /id="publicar-formato"/);
  assert.doesNotMatch(pagina, /id="publicar-genero"/);
  assert.doesNotMatch(pagina, /id="publicar-tag"/);
  assert.doesNotMatch(pagina, /id="publicar-classificacao"/);

  assert.match(camposBasicos, /id="publicar-titulo"/);
  assert.match(camposBasicos, /id="publicar-autor"/);
  assert.match(camposBasicos, /onTituloChange\(event\.target\.value\)/);
  assert.match(camposBasicos, /onAutorChange\(event\.target\.value\)/);
  assert.match(camposFormatoGenero, /OPCOES_FORMATO_OBRA\.map/);
  assert.match(camposFormatoGenero, /OPCOES_GENERO_OBRA\.map/);
  assert.match(camposFormatoGenero, /traduzirFormatoPublicar\(idioma, opcao\)/);
  assert.match(camposFormatoGenero, /traduzirGeneroPublicar\(idioma, opcao\)/);
  assert.match(camposTagClassificacao, /OPCOES_TAGS_OBRA\.map/);
  assert.match(camposTagClassificacao, /traduzirTagPublicar\(idioma, tag\)/);
  assert.match(camposTagClassificacao, /<PublicarAdultWarnings[\s\S]*?onAlternarAviso=\{onAlternarAviso\}/);
});

test("Publicar delegates loading and page shells without moving composition", () => {
  assert.match(pagina, /import \{[\s\S]*?PublicarLoadingShell,[\s\S]*?PublicarPageShell,[\s\S]*?\} from "\.\/components\/PublicarPageShell";/);
  assert.match(pagina, /return <PublicarLoadingShell isDesktop=\{isDesktop\} pageThemeStyle=\{pageThemeStyle\} \/>;/);
  assert.match(pagina, /<PublicarPageShell[\s\S]*?isDesktop=\{isDesktop\}[\s\S]*?novaObra=\{t\("novaObra"\)\}[\s\S]*?voltarHome=\{t\("voltarHome"\)\}/);
  assert.doesNotMatch(pagina, /<PublicarPageHeader/);

  assert.match(shell, /export function PublicarLoadingShell\(/);
  assert.match(shell, /<style>\{`\$\{historietasThemeCss\}\$\{publicarPageCss\}`\}<\/style>/);
  assert.match(shell, /isDesktop && <div style=\{desktopTopWaterFadeStyle\} aria-hidden="true" \/>/);
  assert.match(shell, /!isDesktop && <div style=\{mobileTopWaterFadeStyle\} aria-hidden="true" \/>/);
  assert.match(shell, /export function PublicarPageShell\(/);
  assert.match(shell, /<section style=\{isDesktop \? desktopContainerStyle : containerStyle\}>/);
  assert.match(shell, /<PublicarPageHeader[\s\S]*?voltarHome=\{voltarHome\}[\s\S]*?novaObra=\{novaObra\}/);
  assert.doesNotMatch(shell, /supabase|localStorage|useEffect|useState|window\.|document\./);
});

test("componentes visuais de Publicar permanecem sem runtime de dados", () => {
  for (const componente of [cabecalho, progresso, previa, capa, arquivo, avisosAdultos, sinopse, acoesFormulario, camposBasicos, camposFormatoGenero, camposTagClassificacao]) {
    assert.doesNotMatch(componente, /supabase|localStorage|useEffect|useState|window\.|document\./);
  }
});
