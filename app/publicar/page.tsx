"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { usePublicarDesktopMode } from "./hooks/use-publicar-desktop-mode";
import { usePublicarInitialAccess } from "./hooks/use-publicar-initial-access";
import { usePublicarCoverUpload } from "./hooks/use-publicar-cover-upload";
import { usePublicarBasicFields } from "./hooks/use-publicar-basic-fields";
import { usePublicarContentFileUpload } from "./hooks/use-publicar-content-file-upload";
import { usePublicarPublicationOptions } from "./hooks/use-publicar-publication-options";
import { usePublicarTags } from "./hooks/use-publicar-tags";
import { usePublicarFormValidation } from "./hooks/use-publicar-form-validation";
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
import { PublicarFormError } from "./components/PublicarFormError";
import { PublicarWorkPreview } from "./components/PublicarWorkPreview";
import { PublicarCoverUpload } from "./components/PublicarCoverUpload";
import { PublicarContentFileUpload } from "./components/PublicarContentFileUpload";
import { PublicarSynopsisField } from "./components/PublicarSynopsisField";
import { PublicarFormActions } from "./components/PublicarFormActions";
import { PublicarBasicFields } from "./components/PublicarBasicFields";
import { PublicarFormatGenreFields } from "./components/PublicarFormatGenreFields";
import { PublicarTagClassificationFields } from "./components/PublicarTagClassificationFields";
import {
  pageStyle,
} from "./lib/publicar-layout-styles";
import {
  desktopFormPanelStyle,
  desktopMainGridSingleStyle,
  formPanelStyle,
  mainGridStyle,
} from "./lib/publicar-form-upload-styles";
import { obterMetadadosFormularioPublicar } from "./lib/publicar-form-display-metadata";
import { salvarObraPublicar } from "./lib/publicar-submission-action";


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

  const jaSalvouRef = useRef(false);

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
  async function salvarObra(event: FormEvent<HTMLFormElement>) {
    return salvarObraPublicar(
      {
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
        jaSalvouRef,
        router,
        setAutor,
        setErro,
        setProcessando,
        sinopse,
        tagsDaObra,
        temCapituloImportado,
        titulo,
        validarFormulario,
      },
      event,
    );
  }

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
          <form onSubmit={salvarObra} style={isDesktop ? desktopFormPanelStyle : formPanelStyle}>
            {erro && (
              <PublicarFormError
                isDesktop={isDesktop}
                mensagem={traduzirMensagemPublicar(idioma, erro)}
                titulo={t("ajusteNecessario")}
              />
            )}


            <PublicarCoverUpload
              capa={capa}
              capaErro={capaErro}
              capaInputRef={capaInputRef}
              capaNome={capaNome}
              isDesktop={isDesktop}
              onRemoverCapa={removerCapa}
              onSelecionarCapa={selecionarCapa}
              t={t}
              traduzirMensagem={(mensagem) => traduzirMensagemPublicar(idioma, mensagem)}
            />


            <PublicarBasicFields
              autor={autor}
              isDesktop={isDesktop}
              onAutorChange={atualizarAutor}
              onTituloChange={atualizarTitulo}
              t={t}
              titulo={titulo}
            />

            <PublicarFormatGenreFields
              formato={formato}
              formatoEhPersonalizado={formatoEhPersonalizado}
              formatoPersonalizado={formatoPersonalizado}
              genero={genero}
              generoEhPersonalizado={generoEhPersonalizado}
              generoPersonalizado={generoPersonalizado}
              idioma={idioma}
              isDesktop={isDesktop}
              onFormatoChange={atualizarFormato}
              onFormatoPersonalizadoChange={atualizarFormatoPersonalizado}
              onGeneroChange={atualizarGenero}
              onGeneroPersonalizadoChange={atualizarGeneroPersonalizado}
              t={t}
            />

            <PublicarTagClassificationFields
              avisosConteudo18={avisosConteudo18}
              classificacao18Selecionada={classificacao18Selecionada}
              classificacaoIndicativa={classificacaoIndicativa}
              idioma={idioma}
              isDesktop={isDesktop}
              onAlternarAviso={alternarAvisoConteudo18}
              onClassificacaoChange={atualizarClassificacaoIndicativa}
              onTagChange={atualizarTagSelecionada}
              onTagPersonalizadaChange={atualizarTagPersonalizada}
              t={t}
              tagPersonalizada={tagPersonalizada}
              tagsDaObra={tagsDaObra}
              usarTagPersonalizada={usarTagPersonalizada}
            />

            <PublicarSynopsisField
              caracteresValidos={sinopseCaracteresValidos}
              isDesktop={isDesktop}
              onSinopseChange={atualizarSinopse}
              palavras={sinopsePalavras}
              sinopse={sinopse}
              sinopseValida={sinopseValida}
              t={t}
            />


            <PublicarContentFileUpload
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
              isDesktop={isDesktop}
              onAnexarArquivoCompleto={anexarArquivoCompleto}
              onCancelarEscolhaArquivoTexto={cancelarEscolhaArquivoTexto}
              onLimparSelecaoConteudoArquivo={limparSelecaoConteudoArquivo}
              onSelecionarConteudoArquivo={selecionarConteudoArquivo}
              onTransformarArquivoTextoEmCapitulo={transformarArquivoTextoEmCapitulo}
              t={t}
              temCapituloImportado={temCapituloImportado}
              temConteudoPorArquivo={temConteudoPorArquivo}
              traduzirMensagem={(mensagem) => traduzirMensagemPublicar(idioma, mensagem)}
            />

            <PublicarFormActions
              cancelar={t("cancelar")}
              criarObra={t("criarObra")}
              isDesktop={isDesktop}
              processando={processando}
              progresso={progresso}
              progressoRotulo={t("progresso")}
              salvando={t("salvando")}
            />
          </form>

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
