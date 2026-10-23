import type { usePublicarFormController } from "../hooks/use-publicar-form-controller";
import type { usePublicarPagePresentation } from "../hooks/use-publicar-page-presentation";
import type { ChaveTextoPublicar } from "./publicar-translations";

type CriarPropsComponentesPaginaPublicarParams = {
  erro: string;
  formulario: ReturnType<typeof usePublicarFormController>;
  isDesktop: boolean;
  presentation: ReturnType<typeof usePublicarPagePresentation>;
  processando: boolean;
};

export function criarPropsComponentesPaginaPublicar({
  erro,
  formulario,
  isDesktop,
  presentation,
  processando,
}: CriarPropsComponentesPaginaPublicarParams) {
  const {
    idioma,
    t,
    traduzirClassificacao,
    traduzirMensagem,
  } = presentation;

  return {
    publicationFormProps: {
      arquivoCapituloErro: formulario.arquivoCapituloErro,
      arquivoCapituloMinutos: formulario.arquivoCapituloMinutos,
      arquivoCapituloNome: formulario.arquivoCapituloNome,
      arquivoCapituloPalavras: formulario.arquivoCapituloPalavras,
      arquivoCapituloTitulo: formulario.arquivoCapituloTitulo,
      arquivoConteudoInputRef: formulario.arquivoConteudoInputRef,
      arquivoObra: formulario.arquivoObra,
      arquivoObraErro: formulario.arquivoObraErro,
      arquivoObraTamanhoTexto: formulario.arquivoObraTamanhoTexto,
      arquivoObraTipoTexto: formulario.arquivoObraTipoTexto,
      arquivoTextoPendente: formulario.arquivoTextoPendente,
      arquivoTextoPendenteTamanhoTexto:
        formulario.arquivoTextoPendenteTamanhoTexto,
      autor: formulario.autor,
      avisosConteudo18: formulario.avisosConteudo18,
      capa: formulario.capa,
      capaErro: formulario.capaErro,
      capaInputRef: formulario.capaInputRef,
      capaNome: formulario.capaNome,
      caracteresValidos: formulario.sinopseCaracteresValidos,
      classificacao18Selecionada: formulario.classificacao18Selecionada,
      classificacaoIndicativa: formulario.classificacaoIndicativa,
      erro,
      formato: formulario.formato,
      formatoEhPersonalizado: formulario.formatoEhPersonalizado,
      formatoPersonalizado: formulario.formatoPersonalizado,
      genero: formulario.genero,
      generoEhPersonalizado: formulario.generoEhPersonalizado,
      generoPersonalizado: formulario.generoPersonalizado,
      idioma,
      isDesktop,
      onAlternarAviso: formulario.alternarAvisoConteudo18,
      onAnexarArquivoCompleto: formulario.anexarArquivoCompleto,
      onAutorChange: formulario.atualizarAutor,
      onCancelarEscolhaArquivoTexto: formulario.cancelarEscolhaArquivoTexto,
      onClassificacaoChange: formulario.atualizarClassificacaoIndicativa,
      onFormatoChange: formulario.atualizarFormato,
      onFormatoPersonalizadoChange: formulario.atualizarFormatoPersonalizado,
      onGeneroChange: formulario.atualizarGenero,
      onGeneroPersonalizadoChange: formulario.atualizarGeneroPersonalizado,
      onLimparSelecaoConteudoArquivo:
        formulario.limparSelecaoConteudoArquivo,
      onRemoverCapa: formulario.removerCapa,
      onSelecionarCapa: formulario.selecionarCapa,
      onSelecionarConteudoArquivo: formulario.selecionarConteudoArquivo,
      onSinopseChange: formulario.atualizarSinopse,
      onSubmit: formulario.salvarObra,
      onTagChange: formulario.atualizarTagSelecionada,
      onTagPersonalizadaChange: formulario.atualizarTagPersonalizada,
      onTituloChange: formulario.atualizarTitulo,
      onTransformarArquivoTextoEmCapitulo:
        formulario.transformarArquivoTextoEmCapitulo,
      palavras: formulario.sinopsePalavras,
      processando,
      progresso: formulario.progresso,
      sinopse: formulario.sinopse,
      sinopseValida: formulario.sinopseValida,
      t,
      tagPersonalizada: formulario.tagPersonalizada,
      tagsDaObra: formulario.tagsDaObra,
      temCapituloImportado: formulario.temCapituloImportado,
      temConteudoPorArquivo: formulario.temConteudoPorArquivo,
      titulo: formulario.titulo,
      traduzirMensagem,
      usarTagPersonalizada: formulario.usarTagPersonalizada,
    },
    workPreviewProps: {
      arquivoCapituloMinutos: formulario.arquivoCapituloMinutos,
      arquivoCapituloPalavras: formulario.arquivoCapituloPalavras,
      arquivoCapituloTitulo: formulario.arquivoCapituloTitulo,
      autor: formulario.autor,
      capa: formulario.capa,
      classificacaoTexto: formulario.classificacaoFinal
        ? traduzirClassificacao(formulario.classificacaoFinal)
        : t("classificacao"),
      formatoFinal: formulario.formatoFinal,
      generoFinal: formulario.generoFinal,
      idioma,
      isDesktop,
      previewTemConteudo: formulario.previewTemConteudo,
      t: (chave: string) => t(chave as ChaveTextoPublicar),
      temCapituloImportado: formulario.temCapituloImportado,
      titulo: formulario.titulo,
    },
  };
}
