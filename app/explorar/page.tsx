"use client";

import { useRouter } from "next/navigation";
import { lazy, Suspense, useMemo, useRef } from "react";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
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
import { ExplorarLoadingState } from "./components/explorar-loading-state";
import { ExplorarLoadMoreButton } from "./components/explorar-load-more-button";
import { ExplorarLoginNotice } from "./components/explorar-login-notice";
import { ExplorarCategoriesBar } from "./components/explorar-categories-bar";
import { ExplorarDesktopHeader } from "./components/explorar-desktop-header";
import { ExplorarMobileHeader } from "./components/explorar-mobile-header";
import { ExplorarCreativeWorkSections } from "./components/explorar-creative-work-sections";
import { ExplorarGenreWorkSections } from "./components/explorar-genre-work-sections";
import { ExplorarFilteredWorksSection } from "./components/explorar-filtered-works-section";
import { ExplorarCreativeAuthorSections } from "./components/explorar-creative-author-sections";
import { ExplorarGenreAuthorSections } from "./components/explorar-genre-author-sections";
import { ExplorarFilteredAuthorsSection } from "./components/explorar-filtered-authors-section";
import {
  EstadoVazioExplorar,
} from "./components/explorar-section-components";
import type {
  ModoConteudoExplorar,
} from "./components/explorar-section-components";
import { ExplorarTopWaterFade } from "./components/explorar-top-water-fade";
import { criarPerfilAutorHrefExplorar } from "./lib/explorar-author-route-utils";
import { filtroConteudo18EstaAtivoExplorar } from "./lib/explorar-adult-filter-state";
import { contarFiltrosAvancadosAtivosExplorar } from "./lib/explorar-active-filter-count";
import { possuiFiltrosAtivosExplorar } from "./lib/explorar-active-filters";
import { categorias } from "./lib/explorar-categories";
import { criarTextoBotaoFiltrosAvancadosExplorar } from "./lib/explorar-filter-button-label";
import { criarLoginHrefExplorar } from "./lib/explorar-login-route-utils";
import {
  atualizarUrlExplorar,
  FILTROS_COMPARTILHAVEIS_EXPLORAR_PADRAO,
} from "./lib/explorar-page-route-utils";
import { possuiObrasPublicadasExplorar } from "./lib/explorar-published-state";
import { calcularTotalResultadosExplorar } from "./lib/explorar-result-count";
import {
  COMPLETED_STORAGE_KEY,
  FAVORITES_STORAGE_KEY,
} from "./lib/explorar-storage-keys";
import {
  criarTemaPaginaVisualExplorar,
} from "./lib/explorar-theme";
import { useExplorarAdvancedFiltersBodyLock } from "./hooks/use-explorar-advanced-filters-body-lock";
import { useExplorarAuthState } from "./hooks/use-explorar-auth-state";
import { useExplorarAuthorData } from "./hooks/use-explorar-author-data";
import { useExplorarDesktopMode } from "./hooks/use-explorar-desktop-mode";
import { useExplorarInitialLoad } from "./hooks/use-explorar-initial-load";
import { useExplorarCatalogQuery } from "./hooks/use-explorar-catalog-query";
import { useExplorarCatalogPaginationState } from "./hooks/use-explorar-catalog-pagination-state";
import { useExplorarNavigationFilterState } from "./hooks/use-explorar-navigation-filter-state";
import { useExplorarRouteFilterSync } from "./hooks/use-explorar-route-filter-sync";
import { useExplorarAuthorDataState } from "./hooks/use-explorar-author-data-state";
import { useExplorarPersonalCollectionsState } from "./hooks/use-explorar-personal-collections-state";
import { useExplorarAuthLoginState } from "./hooks/use-explorar-auth-login-state";
import { useExplorarInterfaceControlsState } from "./hooks/use-explorar-interface-controls-state";
import { themePageCss } from "./lib/explorar-page-css";
import { explorarBuscaToggleCss } from "./lib/explorar-search-toggle-css";
import {
  criarSearchBoxStyle,
  criarDesktopSearchBoxStyle,
  pageStyle,
  criarExplorarPageStyle,
  containerStyle,
  desktopContainerStyle,
} from "./lib/explorar-layout-styles";
import {
  traduzirTextoExplorar,
} from "./lib/explorar-translations";
import type { ObraLocal } from "./lib/explorar-work-normalizers";
import {
  colecaoTemObraExplorar,
} from "./lib/explorar-local-storage";
import {
  criarBioAutorExplorar,
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
import type { FiltroColecaoExplorar } from "./lib/explorar-derived-utils";

const ExplorarAdvancedFiltersComposition = lazy(
  () => import("./components/explorar-advanced-filters-composition"),
);

export default function ExplorarPage() {
  const router = useRouter();
  const { language } = useHistorietasLanguage();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const {
    obrasLocais,
    setObrasLocais,
    dadosExplorarCarregados,
    setDadosExplorarCarregados,
    proximoCursorCatalogo,
    setProximoCursorCatalogo,
    catalogoTemMais,
    setCatalogoTemMais,
    carregandoMaisCatalogo,
    setCarregandoMaisCatalogo,
  } = useExplorarCatalogPaginationState();
  const {
    obrasFavoritas,
    setObrasFavoritas,
    obrasConcluidas,
    setObrasConcluidas,
  } = useExplorarPersonalCollectionsState();
  const {
    modoConteudo,
    setModoConteudo,
    categoriaSelecionada,
    setCategoriaSelecionada,
    busca,
    setBusca,
    filtroFormato,
    setFiltroFormato,
    filtroClassificacao,
    setFiltroClassificacao,
    filtroCapitulos,
    setFiltroCapitulos,
    filtroColecao,
    setFiltroColecao,
    ordenacao,
    setOrdenacao,
  } = useExplorarNavigationFilterState();
  const {
    perfisAutores,
    setPerfisAutores,
    avaliacoesAutores,
    setAvaliacoesAutores,
  } = useExplorarAuthorDataState();
  const {
    buscaMobileAberta,
    setBuscaMobileAberta,
    mostrarFiltrosAvancados,
    setMostrarFiltrosAvancados,
    mostrarConfirmacaoConteudo18,
    setMostrarConfirmacaoConteudo18,
    confirmouIdadeConteudo18,
    setConfirmouIdadeConteudo18,
  } = useExplorarInterfaceControlsState();
  const isDesktop = useExplorarDesktopMode();
  const {
    usuarioLogado,
    setUsuarioLogado,
    mensagemLogin,
    setMensagemLogin,
  } = useExplorarAuthLoginState();
  const obrasCacheLocalRef = useRef<ObraLocal[]>([]);
  const usuarioIdExplorarRef = useRef("");

  useExplorarAuthState({
    setUsuarioLogado,
    setMensagemLogin,
    setFiltroColecao,
  });

  useExplorarAdvancedFiltersBodyLock(mostrarFiltrosAvancados);

  useExplorarInitialLoad({
    obrasCacheLocalRef,
    usuarioIdExplorarRef,
    setModoConteudo,
    setCategoriaSelecionada,
    setBusca,
    setOrdenacao,
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

  useExplorarRouteFilterSync({
    setModoConteudo,
    setCategoriaSelecionada,
    setBusca,
    setOrdenacao,
  });

  useExplorarAuthorData({
    obrasLocais,
    setPerfisAutores,
    setAvaliacoesAutores,
  });

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

  const filtroConteudo18Ativo =
    filtroConteudo18EstaAtivoExplorar(
      filtroClassificacao,
    );

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

  const filtrosAtivos =
    possuiFiltrosAtivosExplorar({
      categoriaSelecionada,
      termoBusca,
      filtroFormato,
      filtroClassificacao,
      filtroCapitulos,
      usuarioLogado,
      filtroColecao,
      ordenacao,
    });

  const totalFiltrosAvancadosAtivos = contarFiltrosAvancadosAtivosExplorar({
    usuarioLogado,
    filtroColecao,
    filtroFormato,
    filtroClassificacao,
    filtroCapitulos,
    ordenacao,
  });

  const textoBotaoFiltrosAvancados =
    criarTextoBotaoFiltrosAvancadosExplorar(
      totalFiltrosAvancadosAtivos,
      language,
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
    atualizarUrlExplorar({
      modoConteudo: modo,
      categoriaSelecionada: "",
      busca,
      ordenacao,
    });
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
    atualizarUrlExplorar({
      modoConteudo,
      categoriaSelecionada: categoria,
      busca,
      ordenacao,
    });
  }

  function atualizarBuscaExplorar(valor: string) {
    setBusca(valor);
    atualizarUrlExplorar(
      {
        modoConteudo,
        categoriaSelecionada,
        busca: valor,
        ordenacao,
      },
      "replace",
    );
  }

  function selecionarOrdenacaoExplorar(novaOrdenacao: typeof ordenacao) {
    setOrdenacao(novaOrdenacao);
    atualizarUrlExplorar({
      modoConteudo,
      categoriaSelecionada,
      busca,
      ordenacao: novaOrdenacao,
    });
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
    atualizarUrlExplorar(FILTROS_COMPARTILHAVEIS_EXPLORAR_PADRAO);
  }

  if (!dadosExplorarCarregados) {
    return (
      <ExplorarLoadingState
        mainStyle={criarExplorarPageStyle(pageThemeStyle)}
        themeCss={`${themePageCss}${historietasThemeCss}`}
        label={traduzirTextoExplorar(
          "Carregando Explorar",
          language,
        )}
      />
    );
  }

  return (
    <main style={criarExplorarPageStyle(pageThemeStyle)}>
      <style>{`${themePageCss}${historietasThemeCss}`}</style>
      <style>{explorarBuscaToggleCss}</style>

      <ExplorarTopWaterFade isDesktop={isDesktop} />

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        {isDesktop ? (
          <ExplorarDesktopHeader
            busca={busca}
            modoConteudo={modoConteudo}
            language={language}
            onBuscaChange={atualizarBuscaExplorar}
            onAbrirFiltros={() => setMostrarFiltrosAvancados(true)}
          />
        ) : (
          <ExplorarMobileHeader
            busca={busca}
            buscaMobileAberta={buscaMobileAberta}
            modoConteudo={modoConteudo}
            textoBotaoFiltrosAvancados={textoBotaoFiltrosAvancados}
            language={language}
            onBuscaChange={atualizarBuscaExplorar}
            onAbrirBusca={() => setBuscaMobileAberta(true)}
            onFecharBusca={() => {
              atualizarBuscaExplorar("");
              setBuscaMobileAberta(false);
            }}
            onAbrirFiltros={() => setMostrarFiltrosAvancados(true)}
          />
        )}

        <section
          style={
            isDesktop
              ? criarDesktopSearchBoxStyle()
              : criarSearchBoxStyle()
          }
        >
          <ExplorarCategoriesBar isDesktop={isDesktop} modoConteudo={modoConteudo} categoriaSelecionada={categoriaSelecionada} language={language} onSelecionarModo={selecionarModoConteudo} onSelecionarCategoria={selecionarCategoria} />

          {mensagemLogin && (
            <ExplorarLoginNotice mensagem={traduzirTextoExplorar(mensagemLogin, language)} />
          )}

        </section>

        {mostrarFiltrosAvancados && (
          <Suspense fallback={null}>
            <ExplorarAdvancedFiltersComposition
              isDesktop={isDesktop}
              language={language}
              modoConteudo={modoConteudo}
              filtroColecao={filtroColecao}
              filtroClassificacao={filtroClassificacao}
              mostrarConfirmacaoConteudo18={mostrarConfirmacaoConteudo18}
              confirmouIdadeConteudo18={confirmouIdadeConteudo18}
              acessoConteudo18TemporariamenteBloqueado={
                ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO
              }
              ordenacao={ordenacao}
              filtrosAtivos={filtrosAtivos}
              onFechar={() => {
                setMostrarFiltrosAvancados(false);
                setMostrarConfirmacaoConteudo18(false);
                setConfirmouIdadeConteudo18(false);
              }}
              onSelecionarColecao={selecionarFiltroColecao}
              onSelecionarClassificacao={
                selecionarFiltroClassificacaoExplorar
              }
              onConfirmouIdadeChange={setConfirmouIdadeConteudo18}
              onVoltarConteudo18={() => {
                setMostrarConfirmacaoConteudo18(false);
                setConfirmouIdadeConteudo18(false);
              }}
              onConfirmarConteudo18={confirmarFiltroConteudo18Explorar}
              onSelecionarOrdenacao={selecionarOrdenacaoExplorar}
              onLimparFiltros={limparFiltros}
            />
          </Suspense>
        )}

        {modoConteudo === "obras" &&
          !categoriaSelecionada &&
          !termoBusca && (
            <ExplorarCreativeWorkSections
              secoes={secoesCriativasObras}
              isDesktop={isDesktop}
              tema={temaPagina}
            />
          )}

        {modoConteudo === "obras" &&
          !categoriaSelecionada &&
          !termoBusca && (
            <ExplorarGenreWorkSections
              secoes={secoesObrasPorGenero}
              isDesktop={isDesktop}
            />
          )}

        {modoConteudo === "obras" &&
          (Boolean(categoriaSelecionada) ||
            Boolean(termoBusca) ||
            filtroConteudo18Ativo) &&
          obrasLocaisFiltradas.length > 0 && (
            <ExplorarFilteredWorksSection
              obras={obrasLocaisFiltradas}
              titulo={
                categoriaSelecionada
                  ? `Publicações em ${categoriaSelecionada}`
                  : termoBusca
                    ? "Resultados da busca"
                    : "Conteúdo 18+"
              }
              tema={temaPagina}
              isDesktop={isDesktop}
            >
              {consultaCatalogoPersonalizada && catalogoTemMais && (
                <ExplorarLoadMoreButton
                  carregando={carregandoMaisCatalogo}
                  language={language}
                  onCarregarMais={() =>
                    void carregarMaisObrasCatalogo()
                  }
                />
              )}
            </ExplorarFilteredWorksSection>
          )}

        {modoConteudo === "autores" &&
          !categoriaSelecionada &&
          !termoBusca && (
            <ExplorarCreativeAuthorSections
              secoes={secoesCriativasAutores}
              isDesktop={isDesktop}
              tema={temaPagina}
            />
          )}

        {modoConteudo === "autores" &&
          !categoriaSelecionada &&
          !termoBusca && (
            <ExplorarGenreAuthorSections
              secoes={secoesAutoresPorGenero}
              isDesktop={isDesktop}
            />
          )}

        {modoConteudo === "autores" &&
          (Boolean(categoriaSelecionada) || Boolean(termoBusca)) &&
          autoresFiltrados.length > 0 && (
            <ExplorarFilteredAuthorsSection
              autores={autoresFiltrados}
              titulo={
                categoriaSelecionada
                  ? `Autores de ${categoriaSelecionada}`
                  : "Autores encontrados"
              }
              tema={temaPagina}
              isDesktop={isDesktop}
            />
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
