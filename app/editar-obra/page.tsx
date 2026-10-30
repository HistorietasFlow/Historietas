"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import { EditarObraAssetUploads } from "./components/EditarObraAssetUploads";
import { EditarObraContentRatingField } from "./components/EditarObraContentRatingField";
import { EditarObraFormatGenreFields } from "./components/EditarObraFormatGenreFields";
import { EditarObraIdentityFields } from "./components/EditarObraIdentityFields";
import { EditarObraLanguageBridge } from "./components/EditarObraLanguageBridge";
import { EditarObraFormActions } from "./components/EditarObraFormActions";
import { EditarObraPreview } from "./components/EditarObraPreview";
import { EditarObraSynopsisField } from "./components/EditarObraSynopsisField";
import { EditarObraTagField } from "./components/EditarObraTagField";
import { editarObraPageCss } from "./styles/editar-obra-page-css";
import {
  containerStyle,
  desktopContainerStyle,
  desktopFormStyle,
  desktopHeaderTitleLinkStyle,
  desktopHeaderTitleTextStyle,
  desktopMainGridStyle,
  desktopTitleHeaderStyle,
  desktopTopWaterFadeStyle,
  errorBoxStyle,
  errorTextStyle,
  errorTitleStyle,
  formStyle,
  headerTitleLinkStyle,
  headerTitleTextStyle,
  mainGridStyle,
  mobileTopWaterFadeStyle,
  pageStyle,
  titleHeaderStyle,
} from "./styles/editar-obra-layout-styles";
import type { AvisoConteudo18 } from "../../lib/historietasAdultContent";
import { useEditarObraDesktopMode } from "./hooks/useEditarObraDesktopMode";
import { useEditarObraInitialLoad } from "./hooks/use-editar-obra-initial-load";
import { useEditarObraAssetActions } from "./hooks/use-editar-obra-asset-actions";
import { useEditarObraTagActions } from "./hooks/use-editar-obra-tag-actions";
import { useEditarObraFormChangeActions } from "./hooks/use-editar-obra-form-change-actions";
import { useEditarObraFormDerivedState } from "./hooks/use-editar-obra-form-derived-state";
import { useEditarObraSaveAction } from "./hooks/use-editar-obra-save-action";
import type { ArquivoObraLocal, ObraLocal } from "./types";

export default function EditarObraPage() {
  const router = useRouter();
  const { language } = useHistorietasLanguage();
  const [obraId, setObraId] = useState("");
  const [, setUsuarioIdLogado] = useState("");
  const [obras, setObras] = useState<ObraLocal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [obraEncontrada, setObraEncontrada] = useState(false);
  const [salvou, setSalvou] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");

  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [nomeAutorProfile, setNomeAutorProfile] = useState("");
  const [genero, setGenero] = useState("");
  const [generoPersonalizado, setGeneroPersonalizado] = useState("");
  const [formato, setFormato] = useState("");
  const [formatoPersonalizado, setFormatoPersonalizado] = useState("");
  const [classificacaoIndicativa, setClassificacaoIndicativa] = useState("");
  const [avisosConteudo18, setAvisosConteudo18] = useState<AvisoConteudo18[]>([]);
  const [sinopse, setSinopse] = useState("");
  const [tags, setTags] = useState("");
  const [tagPersonalizada, setTagPersonalizada] = useState("");
  const [usarTagPersonalizada, setUsarTagPersonalizada] = useState(false);
  const [capa, setCapa] = useState("");
  const [capaNome, setCapaNome] = useState("");
  const [capaArquivo, setCapaArquivo] = useState<File | null>(null);
  const [capaErro, setCapaErro] = useState("");
  const [capaRemovidaManualmente, setCapaRemovidaManualmente] =
    useState(false);
  const [arquivoObra, setArquivoObra] = useState<ArquivoObraLocal | null>(null);
  const [arquivoObraArquivo, setArquivoObraArquivo] = useState<File | null>(null);
  const [arquivoObraErro, setArquivoObraErro] = useState("");
  const [arquivoObraRemovidoManualmente, setArquivoObraRemovidoManualmente] =
    useState(false);

  const capaInputRef = useRef<HTMLInputElement | null>(null);
  const arquivoObraInputRef = useRef<HTMLInputElement | null>(null);
  const isDesktop = useEditarObraDesktopMode();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  useEditarObraInitialLoad({
    router,
    setObraId,
    setUsuarioIdLogado,
    setObras,
    setCarregando,
    setObraEncontrada,
    setTitulo,
    setAutor,
    setNomeAutorProfile,
    setGenero,
    setGeneroPersonalizado,
    setFormato,
    setFormatoPersonalizado,
    setClassificacaoIndicativa,
    setAvisosConteudo18,
    setSinopse,
    setTags,
    setTagPersonalizada,
    setUsarTagPersonalizada,
    setCapa,
    setCapaNome,
    setCapaArquivo,
    setCapaRemovidaManualmente,
    setArquivoObra,
    setArquivoObraArquivo,
    setArquivoObraRemovidoManualmente,
  });

  const {
    obraAtual,
    tagsTratadas,
    formatoEhPersonalizado,
    generoEhPersonalizado,
    formatoFinal,
    generoFinal,
    formatoPersonalizadoValido,
    generoPersonalizadoValido,
    tagPersonalizadaValida,
    progresso,
    minhaObraHref,
    autorProfileAtivo,
    autorPreview,
  } = useEditarObraFormDerivedState({
    obras,
    obraId,
    tags,
    formato,
    genero,
    tagPersonalizada,
    usarTagPersonalizada,
    formatoPersonalizado,
    generoPersonalizado,
    titulo,
    autor,
    classificacaoIndicativa,
    avisosConteudo18,
    sinopse,
    nomeAutorProfile,
  });
  const {
    marcarAlteracao,
    alterarTitulo,
    alterarAutor,
    alterarFormato,
    alterarFormatoPersonalizado,
    alterarGenero,
    alterarGeneroPersonalizado,
    alterarClassificacaoIndicativa,
    alternarAvisoConteudo18,
    alterarSinopse,
  } = useEditarObraFormChangeActions({
    salvou,
    erro,
    setSalvou,
    setErro,
    setTitulo,
    setAutor,
    setFormato,
    setFormatoPersonalizado,
    setGenero,
    setGeneroPersonalizado,
    setClassificacaoIndicativa,
    setAvisosConteudo18,
    setSinopse,
  });

  const {
    selecionarCapa,
    removerCapa,
    selecionarArquivoObra,
    removerArquivoObra,
  } = useEditarObraAssetActions({
    marcarAlteracao,
    capaInputRef,
    arquivoObraInputRef,
    setCapaErro,
    setCapa,
    setCapaNome,
    setCapaArquivo,
    setCapaRemovidaManualmente,
    setArquivoObraErro,
    setArquivoObra,
    setArquivoObraArquivo,
    setArquivoObraRemovidoManualmente,
  });

  const {
    atualizarTagPersonalizada,
    adicionarTagSelecionada,
  } = useEditarObraTagActions({
    tagPersonalizada,
    marcarAlteracao,
    setTagPersonalizada,
    setTags,
    setUsarTagPersonalizada,
  });

  const { salvarEdicao } = useEditarObraSaveAction({
    router,
    processando,
    titulo,
    autor,
    autorProfileAtivo,
    generoFinal,
    generoEhPersonalizado,
    generoPersonalizadoValido,
    formatoFinal,
    formatoEhPersonalizado,
    formatoPersonalizadoValido,
    tagPersonalizadaValida,
    classificacaoIndicativa,
    avisosConteudo18,
    sinopse,
    tagsTratadas,
    obraId,
    obras,
    capa,
    capaNome,
    capaArquivo,
    capaRemovidaManualmente,
    arquivoObra,
    arquivoObraArquivo,
    arquivoObraRemovidoManualmente,
    setErro,
    setSalvou,
    setProcessando,
    setNomeAutorProfile,
    setObras,
    setAutor,
    setCapa,
    setCapaNome,
    setCapaArquivo,
    setCapaRemovidaManualmente,
    setArquivoObra,
    setArquivoObraArquivo,
    setArquivoObraRemovidoManualmente,
  });

  if (carregando) {
    return (
      <main data-historietas-editar-obra-root="true" style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${editarObraPageCss}`}</style>
        <EditarObraLanguageBridge />
        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
      </main>
    );
  }

  if (!obraEncontrada) {
    return (
      <main data-historietas-editar-obra-root="true" style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${editarObraPageCss}`}</style>
        <EditarObraLanguageBridge />
        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <p
            style={{
              margin: "10px 0 0",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            Obra não encontrada
          </p>
        </section>
      </main>
    );
  }

  return (
    <main data-historietas-editar-obra-root="true" style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${editarObraPageCss}`}</style>
      <EditarObraLanguageBridge />
        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={isDesktop ? desktopTitleHeaderStyle : titleHeaderStyle}>
          <Link
            href="/"
            style={isDesktop ? desktopHeaderTitleLinkStyle : headerTitleLinkStyle}
            aria-label="Voltar para a Home"
          >
            <span
              className="historietas-theme-title"
              style={isDesktop ? desktopHeaderTitleTextStyle : headerTitleTextStyle}
            >
              EDITAR OBRA
            </span>
          </Link>

        </header>

        {erro && (
          <section style={errorBoxStyle}>
            <h2 style={errorTitleStyle}>Não foi possível salvar</h2>

            <p style={errorTextStyle}>{erro}</p>
          </section>
        )}


        <section style={isDesktop ? desktopMainGridStyle : mainGridStyle}>
          <form onSubmit={salvarEdicao} style={isDesktop ? desktopFormStyle : formStyle}>
            <EditarObraAssetUploads
              isDesktop={isDesktop}
              capa={capa}
              capaErro={capaErro}
              capaInputRef={capaInputRef}
              onSelecionarCapa={selecionarCapa}
              onRemoverCapa={removerCapa}
              arquivoObra={arquivoObra}
              arquivoObraErro={arquivoObraErro}
              arquivoObraInputRef={arquivoObraInputRef}
              onSelecionarArquivoObra={selecionarArquivoObra}
              onRemoverArquivoObra={removerArquivoObra}
            />

            <EditarObraIdentityFields
              titulo={titulo}
              autor={autor}
              onTituloChange={alterarTitulo}
              onAutorChange={alterarAutor}
            />

            <EditarObraFormatGenreFields
              isDesktop={isDesktop}
              formato={formato}
              formatoPersonalizado={formatoPersonalizado}
              formatoEhPersonalizado={formatoEhPersonalizado}
              genero={genero}
              generoPersonalizado={generoPersonalizado}
              generoEhPersonalizado={generoEhPersonalizado}
              onFormatoChange={alterarFormato}
              onFormatoPersonalizadoChange={alterarFormatoPersonalizado}
              onGeneroChange={alterarGenero}
              onGeneroPersonalizadoChange={alterarGeneroPersonalizado}
            />

            <EditarObraTagField
              usarTagPersonalizada={usarTagPersonalizada}
              tagsTratadas={tagsTratadas}
              tagPersonalizada={tagPersonalizada}
              onTagChange={adicionarTagSelecionada}
              onTagPersonalizadaChange={atualizarTagPersonalizada}
            />

            <EditarObraContentRatingField
              classificacaoIndicativa={classificacaoIndicativa}
              avisosConteudo18={avisosConteudo18}
              language={language}
              onClassificacaoChange={alterarClassificacaoIndicativa}
              onToggleAvisoConteudo18={alternarAvisoConteudo18}
            />

            <EditarObraSynopsisField
              isDesktop={isDesktop}
              sinopse={sinopse}
              onSinopseChange={alterarSinopse}
            />

            <EditarObraFormActions
              isDesktop={isDesktop}
              processando={processando}
              salvou={salvou}
              minhaObraHref={minhaObraHref}
              progresso={progresso}
            />
          </form>

          <EditarObraPreview
            isDesktop={isDesktop}
            capa={capa}
            titulo={titulo}
            formatoFinal={formatoFinal}
            classificacaoIndicativa={classificacaoIndicativa}
            autorPreview={autorPreview}
            quantidadeCapitulos={obraAtual?.capitulos.length || 0}
            progresso={progresso}
            generoFinal={generoFinal}
            publicado={obraAtual?.publicado}
          />
        </section>
      </section>
    </main>
  );
}
