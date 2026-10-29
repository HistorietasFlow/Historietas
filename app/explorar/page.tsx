"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import { supabase } from "../../lib/supabase/client";
import { normalizarTexto } from "../../lib/utils";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import {
  ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO,
  acessoConteudo18Confirmado,
  confirmarAcessoConteudo18,
} from "../../lib/historietasAdultContent";
import {
  type CursorCatalogo,
} from "../../lib/catalogo";
import { LoadingSpinner } from "./components/explorar-loading-spinner";
import {
  EstadoVazioExplorar,
  ExplorarCarouselRow,
  SectionHeader,
} from "./components/explorar-section-components";
import type {
  ModoConteudoExplorar,
} from "./components/explorar-section-components";
import AutorExplorarCard from "./components/explorar-autor-card";
import ObraPublicadaCard from "./components/explorar-obra-publicada-card";
import { criarPerfilAutorHrefExplorar } from "./lib/explorar-author-route-utils";
import {
  obterTituloCriativoAutoresExplorar,
  obterTituloCriativoObrasExplorar,
} from "./lib/explorar-category-titles";
import { contarFiltrosAvancadosAtivosExplorar } from "./lib/explorar-active-filter-count";
import { obterAutorIdsExplorar } from "./lib/explorar-author-ids";
import { categorias } from "./lib/explorar-categories";
import { criarLoginHrefExplorar } from "./lib/explorar-login-route-utils";
import { criarHrefListaExplorar } from "./lib/explorar-list-route-utils";
import { atualizarUrlExplorar } from "./lib/explorar-page-route-utils";
import { possuiObrasPublicadasExplorar } from "./lib/explorar-published-state";
import { calcularTotalResultadosExplorar } from "./lib/explorar-result-count";
import {
  COMPLETED_STORAGE_KEY,
  FAVORITES_STORAGE_KEY,
} from "./lib/explorar-storage-keys";
import {
  criarTemaPaginaVisualExplorar,
  obterTemaCategoria,
} from "./lib/explorar-theme";
import { useExplorarAdvancedFiltersBodyLock } from "./hooks/use-explorar-advanced-filters-body-lock";
import { useExplorarDesktopMode } from "./hooks/use-explorar-desktop-mode";
import { useExplorarInitialLoad } from "./hooks/use-explorar-initial-load";
import { useExplorarCatalogQuery } from "./hooks/use-explorar-catalog-query";
import { themePageCss } from "./lib/explorar-page-css";
import { explorarBuscaToggleCss } from "./lib/explorar-search-toggle-css";
import {
  criarActiveCategoryStyle,
  criarSearchBoxStyle,
  criarDesktopSearchBoxStyle,
  pageStyle,
  criarExplorarPageStyle,
  criarExplorarTopWaterFadeStyle,
  containerStyle,
  titleHeaderStyle,
  desktopTitleHeaderStyle,
  desktopExplorarHeaderTitleStyle,
  desktopExplorarHeaderActionsStyle,
  desktopExplorarHeaderSearchIconStyle,
  desktopExplorarHeaderSearchInputStyle,
  mobileSearchToggleStyle,
  explorarHeaderFilterButtonStyle,
  explorarCarregarMaisButtonStyle,
  desktopExplorarHeaderFilterButtonStyle,
  explorarHeaderFilterIconStyle,
  categoriesStyle,
  categoryStyle,
  loginNoticeStyle,
  explorarHeaderSearchShellStyle,
  desktopExplorarHeaderSearchShellStyle,
  explorarHeaderSearchInputStyle,
  explorarModalOverlayStyle,
  explorarModalSheetStyle,
  desktopExplorarModalSheetStyle,
  explorarModalHandleStyle,
  explorarModalTitleStyle,
  explorarModalContentStyle,
  explorarModalSectionLabelStyle,
  criarExplorarModalOptionStyle,
  criarExplorarModalRadioStyle,
  explorarModalClearDividerStyle,
  explorarModalClearButtonStyle,
  explorarAdultConfirmationStyle,
  explorarAdultConfirmationTitleStyle,
  explorarAdultConfirmationTextStyle,
  explorarAdultConfirmationCheckStyle,
  explorarAdultConfirmationCheckboxStyle,
  explorarAdultConfirmationActionsStyle,
  explorarAdultConfirmationBackStyle,
  explorarAdultConfirmationContinueStyle,
  explorarAdultConfirmationDisabledStyle,
  desktopContainerStyle,
  desktopCategoriesStyle,
} from "./lib/explorar-layout-styles";
import {
  sectionStyle,
  explorarObraCarouselItemStyle,
  desktopExplorarObraCarouselItemStyle,
  autoresExplorarGridStyle,
  desktopAutoresExplorarGridStyle,
  gridStyle,
  desktopSectionStyle,
  desktopPublishedGridStyle,
} from "./lib/explorar-content-styles";
import {
  traduzirTextoExplorar,
  traduzirGeneroExplorar,
} from "./lib/explorar-translations";
import type { ObraLocal } from "./lib/explorar-work-normalizers";
import {
  colecaoTemObraExplorar,
} from "./lib/explorar-local-storage";
import {
  criarBioAutorExplorar,
  carregarPerfisAutoresExplorar,
  carregarAvaliacoesAutoresExplorar,
} from "./lib/explorar-author-profile-utils";
import type {
  AvaliacoesAutoresExplorar,
  PerfisAutoresExplorar,
} from "./lib/explorar-author-profile-utils";


import {
  filtrarObrasBaseExplorar,
  filtrarObrasExplorar,
  criarAutoresExplorar,
  filtrarAutoresExplorar,
  criarSecoesCriativasObrasExplorar,
  criarSecoesCriativasAutoresExplorar,
  criarSecoesObrasPorGeneroExplorar,
  criarSecoesAutoresPorGeneroExplorar,
} from "./lib/explorar-derived-utils";
import type {
  OrdenacaoExplorar,
  FiltroColecaoExplorar,
} from "./lib/explorar-derived-utils";

export default function ExplorarPage() {
  const router = useRouter();
  const { language } = useHistorietasLanguage();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const [obrasLocais, setObrasLocais] = useState<ObraLocal[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [modoConteudo, setModoConteudo] =
    useState<ModoConteudoExplorar>("obras");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [perfisAutores, setPerfisAutores] =
    useState<PerfisAutoresExplorar>({});
  const [avaliacoesAutores, setAvaliacoesAutores] =
    useState<AvaliacoesAutoresExplorar>({});
  const [busca, setBusca] = useState("");
  const [buscaMobileAberta, setBuscaMobileAberta] = useState(false);
  const [filtroFormato, setFiltroFormato] = useState("todos");
  const [filtroClassificacao, setFiltroClassificacao] = useState("todos");
  const [filtroCapitulos, setFiltroCapitulos] = useState("todos");
  const [filtroColecao, setFiltroColecao] =
    useState<FiltroColecaoExplorar>("todos");
  const [ordenacao, setOrdenacao] = useState<OrdenacaoExplorar>("relevancia");
  const [mostrarFiltrosAvancados, setMostrarFiltrosAvancados] = useState(false);
  const [mostrarConfirmacaoConteudo18, setMostrarConfirmacaoConteudo18] =
    useState(false);
  const [confirmouIdadeConteudo18, setConfirmouIdadeConteudo18] =
    useState(false);
  const isDesktop = useExplorarDesktopMode();
  const [usuarioLogado, setUsuarioLogado] = useState(false);
  const [mensagemLogin, setMensagemLogin] = useState("");
  const [dadosExplorarCarregados, setDadosExplorarCarregados] = useState(false);
  const [proximoCursorCatalogo, setProximoCursorCatalogo] =
    useState<CursorCatalogo | null>(null);
  const [catalogoTemMais, setCatalogoTemMais] = useState(false);
  const [carregandoMaisCatalogo, setCarregandoMaisCatalogo] = useState(false);
  const obrasCacheLocalRef = useRef<ObraLocal[]>([]);
  const usuarioIdExplorarRef = useRef("");

  useEffect(() => {
    let componenteAtivo = true;

    async function verificarUsuarioLogado() {
      try {
        const { data } = await supabase.auth.getUser();

        if (componenteAtivo) {
          const userId = data.user?.id || "";

          setUsuarioLogado(Boolean(userId));
        }
      } catch {
        if (componenteAtivo) {
          setUsuarioLogado(false);
        }
      }
    }

    void verificarUsuarioLogado();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id || "";

      setUsuarioLogado(Boolean(userId));

      if (session?.user) {
        setMensagemLogin("");
        return;
      }

      setFiltroColecao("todos");
    });

    return () => {
      componenteAtivo = false;
      subscription.unsubscribe();
    };
  }, []);

  useExplorarAdvancedFiltersBodyLock(mostrarFiltrosAvancados);

  useExplorarInitialLoad({
    obrasCacheLocalRef,
    usuarioIdExplorarRef,
    setModoConteudo,
    setCategoriaSelecionada,
    setUsuarioLogado,
    setObrasLocais,
    setObrasFavoritas,
    setObrasConcluidas,
    setProximoCursorCatalogo,
    setCatalogoTemMais,
    setDadosExplorarCarregados,
    FAVORITES_STORAGE_KEY,
    COMPLETED_STORAGE_KEY,
  });

  useEffect(() => {
    const autorIds = obterAutorIdsExplorar(obrasLocais);

    let cancelado = false;

    async function carregarDadosAutores() {
      if (autorIds.length === 0) {
        await Promise.resolve();

        if (!cancelado) {
          setPerfisAutores({});
          setAvaliacoesAutores({});
        }

        return;
      }

      const [perfis, avaliacoes] = await Promise.all([
        carregarPerfisAutoresExplorar(autorIds),
        carregarAvaliacoesAutoresExplorar(autorIds),
      ]);

      if (!cancelado) {
        setPerfisAutores(perfis);
        setAvaliacoesAutores(avaliacoes);
      }
    }

    void carregarDadosAutores();

    return () => {
      cancelado = true;
    };
  }, [obrasLocais]);

  const termoBusca = normalizarTexto(busca);
  const { consultaCatalogoPersonalizada, carregarMaisObrasCatalogo } =
    useExplorarCatalogQuery({
      busca,
      termoBusca,
      categoriaSelecionada,
      filtroFormato,
      filtroClassificacao,
      filtroCapitulos,
      ordenacao,
      dadosExplorarCarregados,
      obrasLocais,
      proximoCursorCatalogo,
      carregandoMaisCatalogo,
      obrasCacheLocalRef,
      usuarioIdExplorarRef,
      setObrasLocais,
      setProximoCursorCatalogo,
      setCatalogoTemMais,
      setCarregandoMaisCatalogo,
    });

  const obrasBaseFiltradas = useMemo(() => {
    return filtrarObrasBaseExplorar({
      obrasLocais,
      filtroFormato,
      filtroClassificacao,
      filtroCapitulos,
      filtroColecao,
      usuarioLogado,
      ordenacao,
      obrasFavoritas,
      obrasConcluidas,
      colecaoTemObraExplorar,
    });
  }, [
    obrasLocais,
    filtroFormato,
    filtroClassificacao,
    filtroCapitulos,
    filtroColecao,
    usuarioLogado,
    ordenacao,
    obrasFavoritas,
    obrasConcluidas,
  ]);

  const obrasLocaisFiltradas = useMemo(() => {
    return filtrarObrasExplorar({
      obrasBaseFiltradas,
      categoriaSelecionada,
      termoBusca,
    });
  }, [obrasBaseFiltradas, categoriaSelecionada, termoBusca]);

  const autoresExplorar = useMemo(() => {
    return criarAutoresExplorar({
      obrasBaseFiltradas,
      perfisAutores,
      avaliacoesAutores,
      language,
      categorias,
      criarBioAutorExplorar,
      criarPerfilAutorHrefExplorar,
    });
  }, [
    obrasBaseFiltradas,
    perfisAutores,
    avaliacoesAutores,
    language,
  ]);

  const filtroConteudo18Ativo = filtroClassificacao === "18+";

  const autoresFiltrados = useMemo(() => {
    return filtrarAutoresExplorar({
      autoresExplorar,
      categoriaSelecionada,
      termoBusca,
    });
  }, [autoresExplorar, categoriaSelecionada, termoBusca]);

  const secoesCriativasObras = useMemo(() => {
    return criarSecoesCriativasObrasExplorar({
      obrasBaseFiltradas,
      categoriaSelecionada,
      termoBusca,
      filtroConteudo18Ativo,
    });
  }, [
    obrasBaseFiltradas,
    categoriaSelecionada,
    termoBusca,
    filtroConteudo18Ativo,
  ]);

  const secoesCriativasAutores = useMemo(() => {
    return criarSecoesCriativasAutoresExplorar({
      autoresExplorar,
      categoriaSelecionada,
      termoBusca,
    });
  }, [autoresExplorar, categoriaSelecionada, termoBusca]);

  const secoesObrasPorGenero = useMemo(() => {
    return criarSecoesObrasPorGeneroExplorar({
      obrasBaseFiltradas,
      categoriaSelecionada,
      termoBusca,
      filtroConteudo18Ativo,
      categorias,
    });
  }, [
    obrasBaseFiltradas,
    categoriaSelecionada,
    termoBusca,
    filtroConteudo18Ativo,
  ]);

  const secoesAutoresPorGenero = useMemo(() => {
    return criarSecoesAutoresPorGeneroExplorar({
      autoresExplorar,
      categoriaSelecionada,
      termoBusca,
      categorias,
    });
  }, [autoresExplorar, categoriaSelecionada, termoBusca]);

  const totalResultados =
    calcularTotalResultadosExplorar(
      modoConteudo,
      autoresFiltrados.length,
      obrasLocaisFiltradas.length,
    );
  const possuiObrasPublicadas =
    possuiObrasPublicadasExplorar(obrasLocais);

  const filtrosAtivos = Boolean(
    categoriaSelecionada ||
      termoBusca ||
      filtroFormato !== "todos" ||
      filtroClassificacao !== "todos" ||
      filtroCapitulos !== "todos" ||
      (usuarioLogado && filtroColecao !== "todos") ||
      ordenacao !== "relevancia"
  );

  const totalFiltrosAvancadosAtivos = contarFiltrosAvancadosAtivosExplorar({
    usuarioLogado,
    filtroColecao,
    filtroFormato,
    filtroClassificacao,
    filtroCapitulos,
    ordenacao,
  });

  const textoBotaoFiltrosAvancados = traduzirTextoExplorar(
    totalFiltrosAvancadosAtivos > 0
      ? `Explorar (${totalFiltrosAvancadosAtivos})`
      : "Explorar",
    language
  );

  const temaPagina = criarTemaPaginaVisualExplorar();

  function selecionarModoConteudo(modo: ModoConteudoExplorar) {
    setModoConteudo(modo);
    setCategoriaSelecionada("");
    setMensagemLogin("");
    setMostrarConfirmacaoConteudo18(false);
    setConfirmouIdadeConteudo18(false);

    if (modo === "autores") {
      setFiltroClassificacao("todos");
    }

    setMostrarFiltrosAvancados(false);
    atualizarUrlExplorar("", modo);
  }

  function selecionarFiltroClassificacaoExplorar(filtro: string) {
    if (filtro !== "18+") {
      setFiltroClassificacao(filtro);
      setMostrarConfirmacaoConteudo18(false);
      setConfirmouIdadeConteudo18(false);
      return;
    }

    if (ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO) {
      setFiltroClassificacao("todos");
      setConfirmouIdadeConteudo18(false);
      setMostrarConfirmacaoConteudo18(true);
      return;
    }

    if (acessoConteudo18Confirmado()) {
      setFiltroClassificacao("18+");
      setMostrarFiltrosAvancados(false);
      return;
    }

    setConfirmouIdadeConteudo18(false);
    setMostrarConfirmacaoConteudo18(true);
  }

  function confirmarFiltroConteudo18Explorar() {
    if (!confirmouIdadeConteudo18) {
      return;
    }

    if (!confirmarAcessoConteudo18()) {
      setFiltroClassificacao("todos");
      setConfirmouIdadeConteudo18(false);
      setMostrarConfirmacaoConteudo18(true);
      return;
    }

    setFiltroClassificacao("18+");
    setMostrarConfirmacaoConteudo18(false);
    setConfirmouIdadeConteudo18(false);
    setMostrarFiltrosAvancados(false);
  }

  function selecionarCategoria(categoria: string) {
    setCategoriaSelecionada(categoria);
    atualizarUrlExplorar(categoria, modoConteudo);
  }

  function selecionarFiltroColecao(filtro: FiltroColecaoExplorar) {
    if (filtro === "todos") {
      setMensagemLogin("");
      setFiltroColecao("todos");
      return;
    }

    if (!usuarioLogado) {
      setMensagemLogin("Entre na sua conta para usar filtros pessoais.");
      setFiltroColecao("todos");
      router.push(criarLoginHrefExplorar());
      return;
    }

    setMensagemLogin("");
    setFiltroColecao(filtro);
  }

  function limparFiltros() {
    setModoConteudo("obras");
    setCategoriaSelecionada("");
    setBusca("");
    setFiltroFormato("todos");
    setFiltroClassificacao("todos");
    setFiltroCapitulos("todos");
    setFiltroColecao("todos");
    setOrdenacao("relevancia");
    setMensagemLogin("");
    setMostrarConfirmacaoConteudo18(false);
    setConfirmouIdadeConteudo18(false);
    setMostrarFiltrosAvancados(false);
    window.history.pushState(null, "", "/explorar");
  }

  if (!dadosExplorarCarregados) {
    return (
      <main
        style={criarExplorarPageStyle(pageThemeStyle)}
        aria-busy="true"
      >
        <style>{`${themePageCss}${historietasThemeCss}`}</style>
        <LoadingSpinner label={traduzirTextoExplorar("Carregando Explorar", language)} />
      </main>
    );
  }

  return (
    <main style={criarExplorarPageStyle(pageThemeStyle)}>
      <style>{`${themePageCss}${historietasThemeCss}`}</style>
      <style>{explorarBuscaToggleCss}</style>

      {isDesktop && (
        <div style={criarExplorarTopWaterFadeStyle(true)} aria-hidden="true" />
      )}

      {!isDesktop && (
        <div style={criarExplorarTopWaterFadeStyle(false)} aria-hidden="true" />
      )}

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        {isDesktop ? (
          <header style={desktopTitleHeaderStyle}>
            <h1 style={desktopExplorarHeaderTitleStyle}>
              {traduzirTextoExplorar("Explorar", language)}
            </h1>

            <div style={desktopExplorarHeaderActionsStyle}>
              <label style={desktopExplorarHeaderSearchShellStyle}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  style={desktopExplorarHeaderSearchIconStyle}
                >
                  <circle
                    cx="10.85"
                    cy="10.85"
                    r="6.65"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M16.05 16.05L20.25 20.25"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>

                <input
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  aria-label={traduzirTextoExplorar(
                    modoConteudo === "autores"
                      ? "Buscar autores..."
                      : "Buscar histórias...",
                    language
                  )}
                  placeholder={traduzirTextoExplorar(
                    modoConteudo === "autores"
                      ? "Buscar autores..."
                      : "Buscar histórias...",
                    language
                  )}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={90}
                  style={desktopExplorarHeaderSearchInputStyle}
                  type="text"
                />
              </label>

              <button
                type="button"
                onClick={() => setMostrarFiltrosAvancados(true)}
                style={desktopExplorarHeaderFilterButtonStyle}
                aria-label={traduzirTextoExplorar(
                  "Abrir funções do Explorar",
                  language
                )}
              >
                <span>{traduzirTextoExplorar("Filtros", language)}</span>
                <span aria-hidden="true">+</span>
              </button>
            </div>
          </header>
        ) : (
          <header style={titleHeaderStyle}>
            <button
              type="button"
              onClick={() => setMostrarFiltrosAvancados(true)}
              style={explorarHeaderFilterButtonStyle}
              aria-label={traduzirTextoExplorar(
                "Abrir funções do Explorar",
                language
              )}
            >
              <span>{textoBotaoFiltrosAvancados}</span>
              <span style={explorarHeaderFilterIconStyle} aria-hidden="true">
                +
              </span>
            </button>

            {buscaMobileAberta ? (
              <>
                <label style={explorarHeaderSearchShellStyle}>
                  <input
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                    aria-label={traduzirTextoExplorar(
                      modoConteudo === "autores"
                        ? "Buscar autores..."
                        : "Buscar histórias...",
                      language
                    )}
                    placeholder={traduzirTextoExplorar(
                      modoConteudo === "autores"
                        ? "Buscar autores..."
                        : "Buscar histórias...",
                      language
                    )}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={90}
                    style={explorarHeaderSearchInputStyle}
                    type="text"
                    autoFocus
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setBusca("");
                    setBuscaMobileAberta(false);
                  }}
                  aria-label={traduzirTextoExplorar("Fechar busca", language)}
                  aria-expanded="true"
                  style={mobileSearchToggleStyle}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <circle
                      cx="10.85"
                      cy="10.85"
                      r="6.65"
                      stroke="currentColor"
                      strokeWidth="2.15"
                    />
                    <path
                      d="M16.05 16.05L20.25 20.25"
                      stroke="currentColor"
                      strokeWidth="2.15"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setBuscaMobileAberta(true)}
                aria-label={traduzirTextoExplorar("Abrir busca", language)}
                aria-expanded="false"
                style={mobileSearchToggleStyle}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <circle
                    cx="10.85"
                    cy="10.85"
                    r="6.65"
                    stroke="currentColor"
                    strokeWidth="2.15"
                  />
                  <path
                    d="M16.05 16.05L20.25 20.25"
                    stroke="currentColor"
                    strokeWidth="2.15"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </header>
        )}

        <section
          style={
            isDesktop
              ? criarDesktopSearchBoxStyle()
              : criarSearchBoxStyle()
          }
        >
          <section
            className="explorar-carousel"
            style={isDesktop ? desktopCategoriesStyle : categoriesStyle}
            aria-label={traduzirTextoExplorar("Categorias", language)}
          >
            <button
              type="button"
              onClick={() => selecionarModoConteudo("obras")}
              style={
                modoConteudo === "obras" && !categoriaSelecionada
                  ? criarActiveCategoryStyle()
                  : categoryStyle
              }
            >
              {traduzirTextoExplorar("Tudo", language)}
            </button>

            <button
              type="button"
              onClick={() => selecionarModoConteudo("autores")}
              style={
                modoConteudo === "autores" && !categoriaSelecionada
                  ? criarActiveCategoryStyle()
                  : categoryStyle
              }
            >
              {traduzirTextoExplorar("Autores", language)}
            </button>

            {categorias.map((categoria) => (
              <button
                key={categoria}
                type="button"
                onClick={() => selecionarCategoria(categoria)}
                style={
                  categoriaSelecionada === categoria
                    ? criarActiveCategoryStyle()
                    : categoryStyle
                }
              >
                {traduzirGeneroExplorar(categoria, language)}
              </button>
            ))}
          </section>

          {mensagemLogin && (
            <span style={loginNoticeStyle}>
            {traduzirTextoExplorar(mensagemLogin, language)}
          </span>
          )}

        </section>

        {mostrarFiltrosAvancados && (
          <div
            style={explorarModalOverlayStyle}
            onClick={() => {
              setMostrarFiltrosAvancados(false);
              setMostrarConfirmacaoConteudo18(false);
              setConfirmouIdadeConteudo18(false);
            }}
          >
            <section
              style={isDesktop ? desktopExplorarModalSheetStyle : explorarModalSheetStyle}
              onClick={(event) => event.stopPropagation()}
              aria-label={traduzirTextoExplorar("EXPLORAR", language)}
            >
              <span style={explorarModalHandleStyle} aria-hidden="true" />

              <h2 style={explorarModalTitleStyle}>
                {traduzirTextoExplorar("EXPLORAR", language)}
              </h2>

              <div style={explorarModalContentStyle}>
                <p style={explorarModalSectionLabelStyle}>
                  {traduzirTextoExplorar("Mostrar", language)}
                </p>

                {[
                  ["todos", "Todas"],
                  ["lendo", "Lendo agora"],
                  ["favoritas", "Na lista"],
                  ["concluidas", "Concluídas"],
                  ["sem-leitura", "Sem leitura"],
                ].map(([valor, rotulo]) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => selecionarFiltroColecao(valor as FiltroColecaoExplorar)}
                    style={criarExplorarModalOptionStyle(filtroColecao === valor)}
                  >
                    <span>{traduzirTextoExplorar(rotulo, language)}</span>
                    <span style={criarExplorarModalRadioStyle(filtroColecao === valor)}>
                      {filtroColecao === valor ? "✓" : ""}
                    </span>
                  </button>
                ))}

                {modoConteudo === "obras" && (
                  <>
                    <p style={explorarModalSectionLabelStyle}>
                      {traduzirTextoExplorar("Conteúdo 18+", language)}
                    </p>

                    {!mostrarConfirmacaoConteudo18 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => selecionarFiltroClassificacaoExplorar("todos")}
                          style={criarExplorarModalOptionStyle(
                            filtroClassificacao !== "18+",
                          )}
                        >
                          <span>
                            {traduzirTextoExplorar(
                              "Ocultar conteúdo 18+",
                              language,
                            )}
                          </span>
                          <span
                            style={criarExplorarModalRadioStyle(
                              filtroClassificacao !== "18+",
                            )}
                          >
                            {filtroClassificacao !== "18+" ? "✓" : ""}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => selecionarFiltroClassificacaoExplorar("18+")}
                          style={criarExplorarModalOptionStyle(
                            filtroClassificacao === "18+",
                          )}
                        >
                          <span>
                            {traduzirTextoExplorar(
                              "Mostrar conteúdo 18+",
                              language,
                            )}
                          </span>
                          <span
                            style={criarExplorarModalRadioStyle(
                              filtroClassificacao === "18+",
                            )}
                          >
                            {filtroClassificacao === "18+" ? "✓" : ""}
                          </span>
                        </button>
                      </>
                    ) : (
                      <div style={explorarAdultConfirmationStyle}>
                        {ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO ? (
                          <>
                            <strong style={explorarAdultConfirmationTitleStyle}>
                              {traduzirTextoExplorar(
                                "Conteúdo 18+ temporariamente indisponível",
                                language,
                              )}
                            </strong>
                            <p style={explorarAdultConfirmationTextStyle}>
                              {traduzirTextoExplorar(
                                "O acesso a obras 18+ está temporariamente indisponível enquanto o Historietas implementa uma verificação de idade adequada.",
                                language,
                              )}
                            </p>

                            <div style={explorarAdultConfirmationActionsStyle}>
                              <button
                                type="button"
                                onClick={() => {
                                  setMostrarConfirmacaoConteudo18(false);
                                  setConfirmouIdadeConteudo18(false);
                                }}
                                style={{
                                  ...explorarAdultConfirmationBackStyle,
                                  gridColumn: "1 / -1",
                                }}
                              >
                                {traduzirTextoExplorar("Voltar", language)}
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <strong style={explorarAdultConfirmationTitleStyle}>
                              {traduzirTextoExplorar("Confirmação de idade", language)}
                            </strong>
                            <p style={explorarAdultConfirmationTextStyle}>
                              {traduzirTextoExplorar(
                                "O conteúdo 18+ fica oculto por padrão. Para exibi-lo, confirme que você tem 18 anos ou mais.",
                                language,
                              )}
                            </p>

                            <label style={explorarAdultConfirmationCheckStyle}>
                              <input
                                type="checkbox"
                                checked={confirmouIdadeConteudo18}
                                onChange={(event) =>
                                  setConfirmouIdadeConteudo18(event.target.checked)
                                }
                                style={explorarAdultConfirmationCheckboxStyle}
                              />
                              <span>
                                {traduzirTextoExplorar(
                                  "Confirmo que tenho 18 anos ou mais.",
                                  language,
                                )}
                              </span>
                            </label>

                            <div style={explorarAdultConfirmationActionsStyle}>
                              <button
                                type="button"
                                onClick={() => {
                                  setMostrarConfirmacaoConteudo18(false);
                                  setConfirmouIdadeConteudo18(false);
                                }}
                                style={explorarAdultConfirmationBackStyle}
                              >
                                {traduzirTextoExplorar("Voltar", language)}
                              </button>
                              <button
                                type="button"
                                onClick={confirmarFiltroConteudo18Explorar}
                                disabled={!confirmouIdadeConteudo18}
                                style={{
                                  ...explorarAdultConfirmationContinueStyle,
                                  ...(!confirmouIdadeConteudo18
                                    ? explorarAdultConfirmationDisabledStyle
                                    : {}),
                                }}
                              >
                                {traduzirTextoExplorar(
                                  "Ativar conteúdo 18+",
                                  language,
                                )}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}

                {!mostrarConfirmacaoConteudo18 && (
                  <p style={explorarModalSectionLabelStyle}>
                    {traduzirTextoExplorar("Ordenar", language)}
                  </p>
                )}

                {!mostrarConfirmacaoConteudo18 &&
                  [
                    ["relevancia", "Relevância"],
                    ["mais-curtidas", "Mais curtidas"],
                    ["mais-recentes", "Mais recentes"],
                  ].map(([valor, rotulo]) => (
                    <button
                      key={valor}
                      type="button"
                      onClick={() => setOrdenacao(valor as OrdenacaoExplorar)}
                      style={criarExplorarModalOptionStyle(ordenacao === valor)}
                    >
                      <span>{traduzirTextoExplorar(rotulo, language)}</span>
                      <span style={criarExplorarModalRadioStyle(ordenacao === valor)}>
                        {ordenacao === valor ? "✓" : ""}
                      </span>
                    </button>
                  ))}

                {!mostrarConfirmacaoConteudo18 && filtrosAtivos && (
                  <>
                    <span style={explorarModalClearDividerStyle} aria-hidden="true" />

                    <button
                      type="button"
                      onClick={limparFiltros}
                      style={explorarModalClearButtonStyle}
                    >
                      {traduzirTextoExplorar("Limpar filtros", language)}
                    </button>
                  </>
                )}
              </div>
            </section>
          </div>
        )}

        {modoConteudo === "obras" &&
          !categoriaSelecionada &&
          !termoBusca &&
          secoesCriativasObras.map((secao) => (
            <section
              key={`obras-criativas-${normalizarTexto(secao.titulo)}`}
              style={isDesktop ? desktopSectionStyle : sectionStyle}
            >
              <SectionHeader
                title={secao.titulo}
                tema={temaPagina}
                isDesktop={isDesktop}
                href={criarHrefListaExplorar({
                  titulo: secao.titulo,
                  modo: "obras",
                })}
              />

              <ExplorarCarouselRow isDesktop={isDesktop} variant="obra">
                {secao.obras.map((obra) => (
                  <div
                    key={`${secao.titulo}-${obra.id}`}
                    style={
                      isDesktop
                        ? desktopExplorarObraCarouselItemStyle
                        : explorarObraCarouselItemStyle
                    }
                  >
                    <ObraPublicadaCard
                      obra={obra}
                      isDesktop={isDesktop}
                    />
                  </div>
                ))}
              </ExplorarCarouselRow>
            </section>
          ))}

        {modoConteudo === "obras" &&
          !categoriaSelecionada &&
          !termoBusca &&
          secoesObrasPorGenero.map((secao) => (
            <section
              key={`obras-${normalizarTexto(secao.genero)}`}
              style={isDesktop ? desktopSectionStyle : sectionStyle}
            >
              <SectionHeader
                title={obterTituloCriativoObrasExplorar(secao.genero)}
                tema={obterTemaCategoria()}
                isDesktop={isDesktop}
                href={criarHrefListaExplorar({
                  titulo: obterTituloCriativoObrasExplorar(secao.genero),
                  modo: "obras",
                  genero: secao.genero,
                })}
              />

              <ExplorarCarouselRow isDesktop={isDesktop} variant="obra">
                {secao.obras.map((obra) => (
                  <div
                    key={`${secao.genero}-${obra.id}`}
                    style={
                      isDesktop
                        ? desktopExplorarObraCarouselItemStyle
                        : explorarObraCarouselItemStyle
                    }
                  >
                    <ObraPublicadaCard
                      obra={obra}
                      isDesktop={isDesktop}
                    />
                  </div>
                ))}
              </ExplorarCarouselRow>
            </section>
          ))}

        {modoConteudo === "obras" &&
          (Boolean(categoriaSelecionada) ||
            Boolean(termoBusca) ||
            filtroConteudo18Ativo) &&
          obrasLocaisFiltradas.length > 0 && (
            <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
              <SectionHeader
                title={
                  categoriaSelecionada
                    ? `Publicações em ${categoriaSelecionada}`
                    : termoBusca
                      ? "Resultados da busca"
                      : "Conteúdo 18+"
                }
                tema={temaPagina}
                isDesktop={isDesktop}
              />

              <div style={isDesktop ? desktopPublishedGridStyle : gridStyle}>
                {obrasLocaisFiltradas.map((obra) => (
                  <ObraPublicadaCard
                    key={obra.id}
                    obra={obra}
                    isDesktop={isDesktop}
                  />
                ))}
              </div>

              {consultaCatalogoPersonalizada && catalogoTemMais && (
                <button
                  type="button"
                  onClick={() => void carregarMaisObrasCatalogo()}
                  disabled={carregandoMaisCatalogo}
                  style={explorarCarregarMaisButtonStyle}
                >
                  {traduzirTextoExplorar(
                    carregandoMaisCatalogo ? "Carregando" : "Carregar mais",
                    language,
                  )}
                </button>
              )}
            </section>
          )}

        {modoConteudo === "autores" &&
          !categoriaSelecionada &&
          !termoBusca &&
          secoesCriativasAutores.map((secao) => (
            <section
              key={`autores-criativos-${normalizarTexto(secao.titulo)}`}
              style={isDesktop ? desktopSectionStyle : sectionStyle}
            >
              <SectionHeader
                title={secao.titulo}
                tema={temaPagina}
                isDesktop={isDesktop}
                href={criarHrefListaExplorar({
                  titulo: secao.titulo,
                  modo: "autores",
                })}
              />

              <ExplorarCarouselRow isDesktop={isDesktop} variant="autor">
                {secao.autores.map((autor) => (
                  <AutorExplorarCard
                    key={`${secao.titulo}-${autor.chave}`}
                    autor={autor}
                    isDesktop={isDesktop}
                  />
                ))}
              </ExplorarCarouselRow>
            </section>
          ))}

        {modoConteudo === "autores" &&
          !categoriaSelecionada &&
          !termoBusca &&
          secoesAutoresPorGenero.map((secao) => (
            <section
              key={`autores-${normalizarTexto(secao.genero)}`}
              style={isDesktop ? desktopSectionStyle : sectionStyle}
            >
              <SectionHeader
                title={obterTituloCriativoAutoresExplorar(secao.genero)}
                tema={obterTemaCategoria()}
                isDesktop={isDesktop}
                href={criarHrefListaExplorar({
                  titulo: obterTituloCriativoAutoresExplorar(secao.genero),
                  modo: "autores",
                  genero: secao.genero,
                })}
              />

              <ExplorarCarouselRow isDesktop={isDesktop} variant="autor">
                {secao.autores.map((autor) => (
                  <AutorExplorarCard
                    key={`${secao.genero}-${autor.chave}`}
                    autor={autor}
                    isDesktop={isDesktop}
                  />
                ))}
              </ExplorarCarouselRow>
            </section>
          ))}

        {modoConteudo === "autores" &&
          (Boolean(categoriaSelecionada) || Boolean(termoBusca)) &&
          autoresFiltrados.length > 0 && (
            <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
              <SectionHeader
                title={
                  categoriaSelecionada
                    ? `Autores de ${categoriaSelecionada}`
                    : "Autores encontrados"
                }
                tema={temaPagina}
                isDesktop={isDesktop}
              />

              <div
                style={
                  isDesktop
                    ? desktopAutoresExplorarGridStyle
                    : autoresExplorarGridStyle
                }
              >
                {autoresFiltrados.map((autor) => (
                  <AutorExplorarCard
                    key={autor.chave}
                    autor={autor}
                    isDesktop={isDesktop}
                    emGrade
                  />
                ))}
              </div>
            </section>
          )}

        {totalResultados === 0 && (
          <EstadoVazioExplorar
            possuiObrasPublicadas={possuiObrasPublicadas}
            modoConteudo={modoConteudo}
          />
        )}
      </section>
    </main>
  );
}
