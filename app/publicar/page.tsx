"use client";

import { useRouter } from "next/navigation";
import { usePublicarDesktopMode } from "./hooks/use-publicar-desktop-mode";
import { usePublicarInitialAccess } from "./hooks/use-publicar-initial-access";
import { usePublicarPageState } from "./hooks/use-publicar-page-state";
import { usePublicarPagePresentation } from "./hooks/use-publicar-page-presentation";
import { usePublicarFormController } from "./hooks/use-publicar-form-controller";
import type { ChaveTextoPublicar } from "./lib/publicar-translations";
import {
  PublicarLoadingShell,
  PublicarPageShell,
} from "./components/PublicarPageShell";
import { PublicarPageBackdrop } from "./components/PublicarPageBackdrop";
import { PublicarWorkPreview } from "./components/PublicarWorkPreview";
import { PublicarPublicationForm } from "./components/PublicarPublicationForm";
import {
  desktopMainGridSingleStyle,
  mainGridStyle,
} from "./lib/publicar-form-upload-styles";


export default function PublicarPage() {
  const router = useRouter();

  const {
    erro,
    processando,
    setErro,
    setProcessando,
    setVerificandoAutenticacao,
    verificandoAutenticacao,
  } = usePublicarPageState();
  const isDesktop = usePublicarDesktopMode();
  const {
    idioma,
    pageThemeStyle,
    t,
    traduzirClassificacao,
    traduzirMensagem,
  } = usePublicarPagePresentation();

  const {
    alternarAvisoConteudo18,
    anexarArquivoCompleto,
    arquivoCapituloErro,
    arquivoCapituloMinutos,
    arquivoCapituloNome,
    arquivoCapituloPalavras,
    arquivoCapituloTitulo,
    arquivoConteudoInputRef,
    arquivoObra,
    arquivoObraErro,
    arquivoObraTamanhoTexto,
    arquivoObraTipoTexto,
    arquivoTextoPendente,
    arquivoTextoPendenteTamanhoTexto,
    atualizarAutor,
    atualizarClassificacaoIndicativa,
    atualizarFormato,
    atualizarFormatoPersonalizado,
    atualizarGenero,
    atualizarGeneroPersonalizado,
    atualizarSinopse,
    atualizarTagPersonalizada,
    atualizarTagSelecionada,
    atualizarTitulo,
    autor,
    avisosConteudo18,
    capa,
    capaErro,
    capaInputRef,
    capaNome,
    cancelarEscolhaArquivoTexto,
    classificacao18Selecionada,
    classificacaoFinal,
    classificacaoIndicativa,
    formato,
    formatoEhPersonalizado,
    formatoFinal,
    formatoPersonalizado,
    genero,
    generoEhPersonalizado,
    generoFinal,
    generoPersonalizado,
    limparSelecaoConteudoArquivo,
    previewTemConteudo,
    progresso,
    removerCapa,
    salvarObra,
    selecionarCapa,
    selecionarConteudoArquivo,
    setAutor,
    sinopse,
    sinopseCaracteresValidos,
    sinopsePalavras,
    sinopseValida,
    tagPersonalizada,
    tagsDaObra,
    temCapituloImportado,
    temConteudoPorArquivo,
    titulo,
    transformarArquivoTextoEmCapitulo,
    usarTagPersonalizada,
  } = usePublicarFormController({
    router,
    setErro,
    setProcessando,
    t,
  });

  usePublicarInitialAccess({
    router,
    setAutor,
    setVerificandoAutenticacao,
  });

  if (verificandoAutenticacao) {
    return <PublicarLoadingShell isDesktop={isDesktop} pageThemeStyle={pageThemeStyle} />;
  }

  return (
    <main style={pageThemeStyle}>
      <PublicarPageBackdrop isDesktop={isDesktop} />

      <PublicarPageShell
        isDesktop={isDesktop}
        novaObra={t("novaObra")}
        voltarHome={t("voltarHome")}
      >
        <section style={isDesktop ? desktopMainGridSingleStyle : mainGridStyle}>
          <PublicarPublicationForm
            arquivoCapituloErro={arquivoCapituloErro}
            arquivoCapituloMinutos={arquivoCapituloMinutos}
            arquivoCapituloNome={arquivoCapituloNome}
            arquivoCapituloPalavras={arquivoCapituloPalavras}
            arquivoCapituloTitulo={arquivoCapituloTitulo}
            arquivoConteudoInputRef={arquivoConteudoInputRef}
            arquivoObra={arquivoObra}
            arquivoObraErro={arquivoObraErro}
            arquivoObraTamanhoTexto={arquivoObraTamanhoTexto}
            arquivoObraTipoTexto={arquivoObraTipoTexto}
            arquivoTextoPendente={arquivoTextoPendente}
            arquivoTextoPendenteTamanhoTexto={arquivoTextoPendenteTamanhoTexto}
            autor={autor}
            avisosConteudo18={avisosConteudo18}
            capa={capa}
            capaErro={capaErro}
            capaInputRef={capaInputRef}
            capaNome={capaNome}
            caracteresValidos={sinopseCaracteresValidos}
            classificacao18Selecionada={classificacao18Selecionada}
            classificacaoIndicativa={classificacaoIndicativa}
            erro={erro}
            formato={formato}
            formatoEhPersonalizado={formatoEhPersonalizado}
            formatoPersonalizado={formatoPersonalizado}
            genero={genero}
            generoEhPersonalizado={generoEhPersonalizado}
            generoPersonalizado={generoPersonalizado}
            idioma={idioma}
            isDesktop={isDesktop}
            onAlternarAviso={alternarAvisoConteudo18}
            onAnexarArquivoCompleto={anexarArquivoCompleto}
            onAutorChange={atualizarAutor}
            onCancelarEscolhaArquivoTexto={cancelarEscolhaArquivoTexto}
            onClassificacaoChange={atualizarClassificacaoIndicativa}
            onFormatoChange={atualizarFormato}
            onFormatoPersonalizadoChange={atualizarFormatoPersonalizado}
            onGeneroChange={atualizarGenero}
            onGeneroPersonalizadoChange={atualizarGeneroPersonalizado}
            onLimparSelecaoConteudoArquivo={limparSelecaoConteudoArquivo}
            onRemoverCapa={removerCapa}
            onSelecionarCapa={selecionarCapa}
            onSelecionarConteudoArquivo={selecionarConteudoArquivo}
            onSinopseChange={atualizarSinopse}
            onSubmit={salvarObra}
            onTagChange={atualizarTagSelecionada}
            onTagPersonalizadaChange={atualizarTagPersonalizada}
            onTituloChange={atualizarTitulo}
            onTransformarArquivoTextoEmCapitulo={transformarArquivoTextoEmCapitulo}
            palavras={sinopsePalavras}
            processando={processando}
            progresso={progresso}
            sinopse={sinopse}
            sinopseValida={sinopseValida}
            t={t}
            tagPersonalizada={tagPersonalizada}
            tagsDaObra={tagsDaObra}
            temCapituloImportado={temCapituloImportado}
            temConteudoPorArquivo={temConteudoPorArquivo}
            titulo={titulo}
            traduzirMensagem={traduzirMensagem}
            usarTagPersonalizada={usarTagPersonalizada}
          />

          <PublicarWorkPreview
            arquivoCapituloMinutos={arquivoCapituloMinutos}
            arquivoCapituloPalavras={arquivoCapituloPalavras}
            arquivoCapituloTitulo={arquivoCapituloTitulo}
            autor={autor}
            capa={capa}
            classificacaoTexto={
              classificacaoFinal
                ? traduzirClassificacao(classificacaoFinal)
                : t("classificacao")
            }
            formatoFinal={formatoFinal}
            generoFinal={generoFinal}
            idioma={idioma}
            isDesktop={isDesktop}
            previewTemConteudo={previewTemConteudo}
            t={(chave) => t(chave as ChaveTextoPublicar)}
            temCapituloImportado={temCapituloImportado}
            titulo={titulo}
          />
        </section>
      </PublicarPageShell>
    </main>
  );
}
