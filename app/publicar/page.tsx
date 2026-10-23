"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePublicarDesktopMode } from "./hooks/use-publicar-desktop-mode";
import { usePublicarInitialAccess } from "./hooks/use-publicar-initial-access";
import { usePublicarCoverUpload } from "./hooks/use-publicar-cover-upload";
import { usePublicarBasicFields } from "./hooks/use-publicar-basic-fields";
import { usePublicarContentFileUpload } from "./hooks/use-publicar-content-file-upload";
import { usePublicarPublicationOptions } from "./hooks/use-publicar-publication-options";
import { usePublicarTags } from "./hooks/use-publicar-tags";
import { usePublicarFormValidation } from "./hooks/use-publicar-form-validation";
import { usePublicarSubmission } from "./hooks/use-publicar-submission";
import { useHistorietasTheme } from "../../lib/historietasTheme";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import {
  obterTextoPublicar,
  traduzirClassificacaoPublicar,
  traduzirMensagemPublicar,
  type ChaveTextoPublicar,
} from "./lib/publicar-translations";
import {
  PublicarLoadingShell,
  PublicarPageShell,
} from "./components/PublicarPageShell";
import { PublicarPageBackdrop } from "./components/PublicarPageBackdrop";
import { PublicarWorkPreview } from "./components/PublicarWorkPreview";
import { PublicarPublicationForm } from "./components/PublicarPublicationForm";
import {
  pageStyle,
} from "./lib/publicar-layout-styles";
import {
  desktopMainGridSingleStyle,
  mainGridStyle,
} from "./lib/publicar-form-upload-styles";
import { obterMetadadosFormularioPublicar } from "./lib/publicar-form-display-metadata";


export default function PublicarPage() {
  const router = useRouter();

  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");
  const {
    atualizarAutor,
    atualizarSinopse,
    atualizarTitulo,
    autor,
    setAutor,
    sinopse,
    titulo,
  } = usePublicarBasicFields({ setErro });
  const {
    atualizarTagPersonalizada,
    atualizarTagSelecionada,
    tagPersonalizada,
    tags,
    tagsDaObra,
    usarTagPersonalizada,
  } = usePublicarTags({ setErro });
  const {
    alternarAvisoConteudo18,
    atualizarClassificacaoIndicativa,
    atualizarFormato,
    atualizarFormatoPersonalizado,
    atualizarGenero,
    atualizarGeneroPersonalizado,
    avisosConteudo18,
    classificacaoIndicativa,
    formato,
    formatoPersonalizado,
    genero,
    generoPersonalizado,
  } = usePublicarPublicationOptions({ setErro });
  const {
    capa,
    capaArquivo,
    capaErro,
    capaInputRef,
    capaNome,
    removerCapa,
    selecionarCapa,
  } = usePublicarCoverUpload({ setErro });
  const {
    anexarArquivoCompleto,
    arquivoCapituloErro,
    arquivoCapituloNome,
    arquivoCapituloTexto,
    arquivoCapituloTitulo,
    arquivoConteudoInputRef,
    arquivoObra,
    arquivoObraArquivo,
    arquivoObraErro,
    arquivoTextoPendente,
    cancelarEscolhaArquivoTexto,
    limparSelecaoConteudoArquivo,
    selecionarConteudoArquivo,
    transformarArquivoTextoEmCapitulo,
  } = usePublicarContentFileUpload({ setErro });
  const [verificandoAutenticacao, setVerificandoAutenticacao] = useState(true);
  const isDesktop = usePublicarDesktopMode();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const { language: idioma } = useHistorietasLanguage();
  const t = (chave: ChaveTextoPublicar) => obterTextoPublicar(idioma, chave);

  usePublicarInitialAccess({
    router,
    setAutor,
    setVerificandoAutenticacao,
  });

  const {
    avisosConteudo18Normalizados,
    classificacao18Selecionada,
    classificacaoFinal,
    formatoEhPersonalizado,
    formatoFinal,
    generoEhPersonalizado,
    generoFinal,
    progresso,
    previewTemConteudo,
    sinopseValida,
    temCapituloImportado,
    temConteudoPorArquivo,
    validarFormulario,
  } = usePublicarFormValidation({
    arquivoCapituloTexto,
    arquivoObra,
    autor,
    avisosConteudo18,
    capa,
    classificacaoIndicativa,
    formato,
    formatoPersonalizado,
    genero,
    generoPersonalizado,
    sinopse,
    tagPersonalizada,
    tags,
    titulo,
    usarTagPersonalizada,
  });

  const {
    arquivoCapituloMinutos,
    arquivoCapituloPalavras,
    arquivoObraTamanhoTexto,
    arquivoObraTipoTexto,
    arquivoTextoPendenteTamanhoTexto,
    sinopseCaracteresValidos,
    sinopsePalavras,
  } = obterMetadadosFormularioPublicar({
    arquivoCapituloTexto,
    arquivoObra,
    arquivoTextoPendente,
    sinopse,
    t,
  });
  const { salvarObra } = usePublicarSubmission({
    arquivoCapituloTexto,
    arquivoCapituloTitulo,
    arquivoObra,
    arquivoObraArquivo,
    autor,
    avisosConteudo18Normalizados,
    capaArquivo,
    capaNome,
    classificacaoFinal,
    formatoFinal,
    generoFinal,
    router,
    setAutor,
    setErro,
    setProcessando,
    sinopse,
    tagsDaObra,
    temCapituloImportado,
    titulo,
    validarFormulario,
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
            traduzirMensagem={(mensagem) => traduzirMensagemPublicar(idioma, mensagem)}
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
                ? traduzirClassificacaoPublicar(idioma, classificacaoFinal)
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
