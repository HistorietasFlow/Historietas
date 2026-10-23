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
const backdrop = readFileSync(
  new URL("../../app/publicar/components/PublicarPageBackdrop.tsx", import.meta.url),
  "utf8",
);
const conteudoPagina = readFileSync(
  new URL("../../app/publicar/components/PublicarPageContent.tsx", import.meta.url),
  "utf8",
);
const erroFormulario = readFileSync(
  new URL("../../app/publicar/components/PublicarFormError.tsx", import.meta.url),
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
const formularioPublicacao = readFileSync(
  new URL("../../app/publicar/components/PublicarPublicationForm.tsx", import.meta.url),
  "utf8",
);
const opcoesPublicacao = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-publication-options.ts", import.meta.url),
  "utf8",
);
const uploadConteudo = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-content-file-upload.ts", import.meta.url),
  "utf8",
);
const camposBasicosEstado = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-basic-fields.ts", import.meta.url),
  "utf8",
);
const tagsEstado = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-tags.ts", import.meta.url),
  "utf8",
);
const apresentacaoPagina = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-page-presentation.ts", import.meta.url),
  "utf8",
);
const controladorFormulario = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-form-controller.ts", import.meta.url),
  "utf8",
);
const propsComponentesPagina = readFileSync(
  new URL("../../app/publicar/lib/publicar-page-component-props.ts", import.meta.url),
  "utf8",
);

test("Publicar delega a composição visual do cabeçalho", () => {
  assert.match(pagina, /from "\.\/components\/PublicarPageContent";/);
  assert.match(conteudoPagina, /from "\.\/PublicarPageShell";/);
  assert.match(shell, /<PublicarPageHeader[\s\S]*?isDesktop=\{isDesktop\}[\s\S]*?voltarHome=\{voltarHome\}[\s\S]*?novaObra=\{novaObra\}/);
  assert.doesNotMatch(pagina, /<header style=\{isDesktop \? desktopTitleHeaderStyle : titleHeaderStyle\}/);

  assert.match(cabecalho, /href="\/"/);
  assert.match(cabecalho, /aria-label=\{voltarHome\}/);
  assert.match(cabecalho, /isDesktop \? desktopTitleHeaderStyle : titleHeaderStyle/);
});

test("Publicar delega a prévia sem deslocar estados ou regras de publicação", () => {
  assert.match(pagina, /<PublicarPageContent[\s\S]*?workPreviewProps=\{workPreviewProps\}/);
  assert.match(conteudoPagina, /import \{ PublicarWorkPreview \} from "\.\/PublicarWorkPreview";/);
  assert.match(conteudoPagina, /<PublicarWorkPreview \{\.\.\.workPreviewProps\} \/>/);
  assert.match(propsComponentesPagina, /arquivoCapituloMinutos: formulario\.arquivoCapituloMinutos,[\s\S]*?classificacaoTexto: formulario\.classificacaoFinal[\s\S]*?traduzirClassificacao\(formulario\.classificacaoFinal\)[\s\S]*?previewTemConteudo: formulario\.previewTemConteudo,/);
  assert.match(apresentacaoPagina, /traduzirClassificacaoPublicar\(idioma, classificacao\)/);
  assert.doesNotMatch(pagina, /<aside style=\{isDesktop \? desktopPreviewPanelStyle : previewPanelStyle\}/);

  assert.match(previa, /export function PublicarWorkPreview\(/);
  assert.match(previa, /criarPreviewCoverStyle\(capa\)/);
  assert.match(previa, /traduzirFormatoPublicar\(idioma, formatoFinal\)/);
  assert.match(previa, /traduzirGeneroPublicar\(idioma, generoFinal\)/);
  assert.match(previa, /temCapituloImportado \? "100%" : "0%"/);
  assert.match(previa, /t\("dicaPrevia"\)/);
});

test("Publicar delega os uploads visuais e o lifecycle local do arquivo", () => {
  assert.match(conteudoPagina, /import \{ PublicarPublicationForm \} from "\.\/PublicarPublicationForm";/);
  assert.match(pagina, /import \{ usePublicarFormController \} from "\.\/hooks\/use-publicar-form-controller";/);
  assert.match(controladorFormulario, /import \{ usePublicarContentFileUpload \} from "\.\/use-publicar-content-file-upload";/);
  assert.match(conteudoPagina, /<PublicarPublicationForm \{\.\.\.publicationFormProps\} \/>/);
  assert.match(propsComponentesPagina, /capaInputRef: formulario\.capaInputRef,[\s\S]*?onRemoverCapa: formulario\.removerCapa,[\s\S]*?onSelecionarCapa: formulario\.selecionarCapa,/);
  assert.match(propsComponentesPagina, /arquivoConteudoInputRef: formulario\.arquivoConteudoInputRef,[\s\S]*?onAnexarArquivoCompleto: formulario\.anexarArquivoCompleto,[\s\S]*?onSelecionarConteudoArquivo: formulario\.selecionarConteudoArquivo,[\s\S]*?onTransformarArquivoTextoEmCapitulo:[\s\S]*?formulario\.transformarArquivoTextoEmCapitulo,/);
  assert.match(formularioPublicacao, /import \{ PublicarCoverUpload \} from "\.\/PublicarCoverUpload";/);
  assert.match(formularioPublicacao, /import \{ PublicarContentFileUpload \} from "\.\/PublicarContentFileUpload";/);
  assert.match(formularioPublicacao, /<PublicarCoverUpload[\s\S]*?capaInputRef=\{capaInputRef\}[\s\S]*?onRemoverCapa=\{onRemoverCapa\}[\s\S]*?onSelecionarCapa=\{onSelecionarCapa\}/);
  assert.match(formularioPublicacao, /<PublicarContentFileUpload[\s\S]*?arquivoConteudoInputRef=\{arquivoConteudoInputRef\}[\s\S]*?onAnexarArquivoCompleto=\{onAnexarArquivoCompleto\}[\s\S]*?onSelecionarConteudoArquivo=\{onSelecionarConteudoArquivo\}[\s\S]*?onTransformarArquivoTextoEmCapitulo=\{onTransformarArquivoTextoEmCapitulo\}/);
  assert.doesNotMatch(pagina, /ref=\{capaInputRef\}/);
  assert.doesNotMatch(pagina, /ref=\{arquivoConteudoInputRef\}/);
  assert.doesNotMatch(pagina, /function selecionarConteudoArquivo\(event: ChangeEvent<HTMLInputElement>\)/);
  assert.doesNotMatch(pagina, /function transformarArquivoTextoEmCapitulo\(arquivo: File\)/);

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
  assert.match(uploadConteudo, /export function usePublicarContentFileUpload/);
  assert.match(uploadConteudo, /leitor\.readAsDataURL\(arquivo\);/);
  assert.match(uploadConteudo, /leitor\.readAsText\(arquivo, "UTF-8"\);/);
});

test("Publicar delega campos controlados sem deslocar seus estados e callbacks", () => {
  assert.match(conteudoPagina, /import \{ PublicarPublicationForm \} from "\.\/PublicarPublicationForm";/);
  assert.match(controladorFormulario, /import \{ usePublicarBasicFields \} from "\.\/use-publicar-basic-fields";/);
  assert.match(propsComponentesPagina, /onSinopseChange: formulario\.atualizarSinopse,[\s\S]*?sinopse: formulario\.sinopse,[\s\S]*?t,/);
  assert.match(propsComponentesPagina, /processando,[\s\S]*?progresso: formulario\.progresso,/);
  assert.match(formularioPublicacao, /import \{ PublicarSynopsisField \} from "\.\/PublicarSynopsisField";/);
  assert.match(formularioPublicacao, /import \{ PublicarFormActions \} from "\.\/PublicarFormActions";/);
  assert.match(formularioPublicacao, /<PublicarFormActions[\s\S]*?processando=\{processando\}[\s\S]*?progresso=\{progresso\}[\s\S]*?salvando=\{t\("salvando"\)\}/);
  assert.match(controladorFormulario, /usePublicarBasicFields\(\{ setErro \}\)/);
  assert.match(controladorFormulario, /usePublicarPublicationOptions\(\{ setErro \}\)/);
  assert.match(opcoesPublicacao, /function alternarAvisoConteudo18\(aviso: AvisoConteudo18\)[\s\S]*?setAvisosConteudo18[\s\S]*?setErro\(""\)/);
  assert.doesNotMatch(pagina, /function atualizarSinopse\(valor: string\)/);
  assert.doesNotMatch(pagina, /function atualizarTitulo\(valor: string\)/);
  assert.doesNotMatch(pagina, /function atualizarAutor\(valor: string\)/);
  assert.match(camposBasicosEstado, /function atualizarSinopse\(valor: string\)[\s\S]*?setSinopse\(valor\)[\s\S]*?setErro\(""\)/);
  assert.match(camposBasicosEstado, /function atualizarTitulo\(valor: string\)[\s\S]*?setTitulo\(valor\)[\s\S]*?setErro\(""\)/);
  assert.match(camposBasicosEstado, /function atualizarAutor\(valor: string\)[\s\S]*?setAutor\(valor\)[\s\S]*?setErro\(""\)/);
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

test("Publicar delega os metadados controlados ao hook de opções", () => {
  assert.match(conteudoPagina, /import \{ PublicarPublicationForm \} from "\.\/PublicarPublicationForm";/);
  assert.match(propsComponentesPagina, /onAutorChange: formulario\.atualizarAutor,[\s\S]*?onTituloChange: formulario\.atualizarTitulo,/);
  assert.match(propsComponentesPagina, /onFormatoChange: formulario\.atualizarFormato,[\s\S]*?onGeneroChange: formulario\.atualizarGenero,/);
  assert.match(propsComponentesPagina, /onAlternarAviso: formulario\.alternarAvisoConteudo18,[\s\S]*?onClassificacaoChange: formulario\.atualizarClassificacaoIndicativa,[\s\S]*?onTagChange: formulario\.atualizarTagSelecionada,/);
  assert.match(formularioPublicacao, /import \{ PublicarBasicFields \} from "\.\/PublicarBasicFields";/);
  assert.match(formularioPublicacao, /import \{ PublicarFormatGenreFields \} from "\.\/PublicarFormatGenreFields";/);
  assert.match(formularioPublicacao, /import \{ PublicarTagClassificationFields \} from "\.\/PublicarTagClassificationFields";/);
  assert.match(formularioPublicacao, /<PublicarBasicFields[\s\S]*?onAutorChange=\{onAutorChange\}[\s\S]*?onTituloChange=\{onTituloChange\}/);
  assert.match(formularioPublicacao, /<PublicarFormatGenreFields[\s\S]*?onFormatoChange=\{onFormatoChange\}[\s\S]*?onGeneroChange=\{onGeneroChange\}/);
  assert.match(formularioPublicacao, /<PublicarTagClassificationFields[\s\S]*?onAlternarAviso=\{onAlternarAviso\}[\s\S]*?onClassificacaoChange=\{onClassificacaoChange\}[\s\S]*?onTagChange=\{onTagChange\}/);
  assert.match(controladorFormulario, /import \{ usePublicarPublicationOptions \} from "\.\/use-publicar-publication-options";/);
  assert.match(controladorFormulario, /import \{ usePublicarTags \} from "\.\/use-publicar-tags";/);
  assert.match(controladorFormulario, /usePublicarTags\(\{ setErro \}\)/);
  assert.doesNotMatch(pagina, /function atualizarFormato\(valor: string\)/);
  assert.doesNotMatch(pagina, /function atualizarGenero\(valor: string\)/);
  assert.doesNotMatch(pagina, /function atualizarClassificacaoIndicativa\(valor: string\)/);
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
  assert.match(opcoesPublicacao, /export function usePublicarPublicationOptions/);
  assert.match(opcoesPublicacao, /if \(!ehClassificacao18\(valor\)\) \{[\s\S]*?setAvisosConteudo18\(\[\]\);/);
  assert.match(tagsEstado, /export function usePublicarTags/);
  assert.match(tagsEstado, /function atualizarTagSelecionada\(tag: string\)/);
  assert.match(tagsEstado, /function atualizarTagPersonalizada\(valor: string\)/);
});

test("Publicar delegates loading and page shells without moving composition", () => {
  assert.match(pagina, /import \{[\s\S]*?PublicarLoadingShell,[\s\S]*?\} from "\.\/components\/PublicarPageShell";/);
  assert.match(pagina, /<PublicarLoadingShell[\s\S]*?isDesktop=\{isDesktop\}[\s\S]*?pageThemeStyle=\{presentation\.pageThemeStyle\}/);
  assert.match(pagina, /<PublicarPageContent[\s\S]*?isDesktop=\{isDesktop\}[\s\S]*?novaObra=\{presentation\.t\("novaObra"\)\}[\s\S]*?voltarHome=\{presentation\.t\("voltarHome"\)\}/);
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

test("Publicar delegates backdrop and form feedback without moving publication state", () => {
  assert.match(pagina, /import \{ PublicarPageContent \} from "\.\/components\/PublicarPageContent";/);
  assert.match(conteudoPagina, /import \{ PublicarPageBackdrop \} from "\.\/PublicarPageBackdrop";/);
  assert.match(conteudoPagina, /<PublicarPageBackdrop isDesktop=\{isDesktop\} \/>/);
  assert.match(conteudoPagina, /import \{ PublicarPublicationForm \} from "\.\/PublicarPublicationForm";/);
  assert.match(conteudoPagina, /<PublicarPublicationForm \{\.\.\.publicationFormProps\} \/>/);
  assert.match(propsComponentesPagina, /erro,[\s\S]*?traduzirMensagem,/);
  assert.match(apresentacaoPagina, /traduzirMensagemPublicar\(idioma, mensagem\)/);
  assert.match(formularioPublicacao, /import \{ PublicarFormError \} from "\.\/PublicarFormError";/);
  assert.match(formularioPublicacao, /\{erro && \([\s\S]*?<PublicarFormError[\s\S]*?mensagem=\{traduzirMensagem\(erro\)\}[\s\S]*?titulo=\{t\("ajusteNecessario"\)\}/);
  assert.doesNotMatch(pagina, /\["✦", "◇", "\+"\]\.map/);
  assert.doesNotMatch(pagina, /<strong style=\{safeTextStyle\}>\{t\("ajusteNecessario"\)\}<\/strong>/);

  assert.match(backdrop, /<style>\{`\$\{historietasThemeCss\}\$\{publicarPageCss\}`\}<\/style>/);
  assert.match(backdrop, /\["✦", "◇", "\+"\]\.map/);
  assert.match(backdrop, /criarDecoracaoPaginaStyle\(\)/);
  assert.match(backdrop, /isDesktop && <div style=\{desktopTopWaterFadeStyle\} aria-hidden="true" \/>/);
  assert.match(backdrop, /!isDesktop && <div style=\{mobileTopWaterFadeStyle\} aria-hidden="true" \/>/);

  assert.match(erroFormulario, /isDesktop \? desktopFullWidthErrorBoxStyle : errorBoxStyle/);
  assert.match(erroFormulario, /<strong style=\{safeTextStyle\}>\{titulo\}<\/strong>/);
  assert.match(erroFormulario, /<span style=\{safeTextStyle\}>\{mensagem\}<\/span>/);
});

test("componentes visuais de Publicar permanecem sem runtime de dados", () => {
  for (const componente of [cabecalho, shell, backdrop, conteudoPagina, erroFormulario, progresso, previa, capa, arquivo, avisosAdultos, sinopse, acoesFormulario, camposBasicos, camposFormatoGenero, camposTagClassificacao, formularioPublicacao, propsComponentesPagina]) {
    assert.doesNotMatch(componente, /supabase|localStorage|useEffect|useState|window\.|document\./);
  }
});
