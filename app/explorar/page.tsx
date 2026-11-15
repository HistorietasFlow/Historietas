"use client";

import { useRouter } from "next/navigation";
import { lazy, Suspense, useEffect, useMemo, useRef } from "react";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import { filtroStatusEditorial } from "../../lib/statusEditorial";
import { INTERVALO_PALAVRAS_VAZIO, validarIntervaloPalavras, type IntervaloPalavrasTexto } from "../../lib/catalogo-palavras";
import { textosFiltroPalavras } from "./lib/explorar-word-filter-text";
import { normalizarTexto } from "../../lib/utils";
import { normalizarGeneroExcluido } from "../../lib/catalogo-genero";
import { normalizarTagCatalogo } from "../../lib/catalogo-tag";
import { normalizarNotaMinimaCatalogo } from "../../lib/catalogo-nota-minima";
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
import { ExplorarCatalogErrorNotice } from "./components/explorar-catalog-error-notice";
import { ExplorarCategoriesBar } from "./components/explorar-categories-bar";
import { ExplorarActiveCatalogFilters } from "./components/explorar-active-catalog-filters";
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
import { useExplorarPersonalCollectionsSync } from "./hooks/use-explorar-personal-collections-sync";
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
  traduzirGeneroExplorar,
  traduzirFormatoExplorar,
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
  const containerExplorarRef = useRef<HTMLElement>(null);
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
    obraIdsBuscaRemota,
    setObraIdsBuscaRemota,
    erroCatalogoExplorar,
    setErroCatalogoExplorar,
    versaoRetryCatalogo,
    setVersaoRetryCatalogo,
  } = useExplorarCatalogPaginationState();
  const {
    obrasFavoritas,
    setObrasFavoritas,
    obrasConcluidas,
    setObrasConcluidas,
    obrasComLeitura,
    setObrasComLeitura,
    colecoesCarregadas,
    setColecoesCarregadas,
    erroColecoesExplorar,
    setErroColecoesExplorar,
    versaoRetryColecoes,
    setVersaoRetryColecoes,
  } = useExplorarPersonalCollectionsState();
  const {
    modoConteudo,
    intervaloPalavras,
    setIntervaloPalavras,
    setModoConteudo,
    categoriaSelecionada,
    setCategoriaSelecionada,
    busca,
    setBusca,
    filtroFormato,
    setFiltroFormato,
    filtroTag,
    setFiltroTag,
    tagExcluida,
    generoExcluido,
    statusEditorial,
    setTagExcluida,
    setGeneroExcluido,
    setStatusEditorial,
    notaMinima,
    setNotaMinima,
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
    usuarioIdExplorar,
    setUsuarioIdExplorar,
    usuarioLogado,
    setUsuarioLogado,
    mensagemLogin,
    setMensagemLogin,
  } = useExplorarAuthLoginState();
  const obrasCacheLocalRef = useRef<ObraLocal[]>([]);
  const usuarioIdExplorarRef = useRef("");

  useExplorarAuthState({
    setUsuarioIdExplorar,
    setUsuarioLogado,
    setMensagemLogin,
    setFiltroColecao,
  });

  useEffect(() => {
    usuarioIdExplorarRef.current = usuarioIdExplorar;
  }, [usuarioIdExplorar]);

  useExplorarAdvancedFiltersBodyLock(mostrarFiltrosAvancados);

  useExplorarInitialLoad({
    setIntervaloPalavras,
    obrasCacheLocalRef,
    usuarioIdExplorarRef,
    setModoConteudo,
    setCategoriaSelecionada,
    setBusca,
    setOrdenacao,
    setFiltroFormato,
    setFiltroTag,
    setTagExcluida,
    setGeneroExcluido,
    setStatusEditorial,
    setNotaMinima,
    setUsuarioLogado,
    setObrasLocais,
    setProximoCursorCatalogo,
    setCatalogoTemMais,
    setErroCatalogoExplorar,
    setDadosExplorarCarregados,
  });

  useExplorarPersonalCollectionsSync({
    usuarioIdExplorar,
    versaoRetryColecoes,
    obrasCacheLocalRef,
    setObrasFavoritas,
    setObrasConcluidas,
    setObrasComLeitura,
    setColecoesCarregadas,
    setErroColecoesExplorar,
    FAVORITES_STORAGE_KEY,
    COMPLETED_STORAGE_KEY,
  });

  useExplorarRouteFilterSync({
    setIntervaloPalavras,
    setModoConteudo,
    setCategoriaSelecionada,
    setBusca,
    setOrdenacao,
    setFiltroFormato,
    setFiltroTag,
    setTagExcluida,
    setGeneroExcluido,
    setStatusEditorial,
    setNotaMinima,
  });

  useExplorarAuthorData({
    obrasLocais,
    setPerfisAutores,
    setAvaliacoesAutores,
  });

  const termoBusca = normalizarTexto(busca);
  const { consultaCatalogoPersonalizada, carregarMaisObrasCatalogo, notaMinimaVerificada, tagExcluidaVerificada, generoExcluidoVerificado, statusEditorialVerificado, palavrasVerificadas } =
    useExplorarCatalogQuery({
      modoConteudo,
      busca,
      termoBusca,
      categoriaSelecionada,
      filtroFormato,
      filtroTag: normalizarTagCatalogo(filtroTag),
      tagExcluida: modoConteudo === "obras" ? normalizarTagCatalogo(tagExcluida) : "",
      generoExcluido: modoConteudo === "obras" ? normalizarGeneroExcluido(generoExcluido) : "",
      statusEditorial: modoConteudo === "obras" ? filtroStatusEditorial(statusEditorial) : "",
      palavrasMinimas: intervaloPalavras.minimo,
      palavrasMaximas: intervaloPalavras.maximo,
      notaMinima,
      usuarioIdExplorar,
      filtroClassificacao,
      filtroCapitulos,
      ordenacao,
      filtroColecao,
      obrasFavoritas,
      obrasConcluidas,
      obrasComLeitura,
      colecoesCarregadas,
      dadosExplorarCarregados,
      obrasLocais,
      proximoCursorCatalogo,
      carregandoMaisCatalogo,
      versaoRetryCatalogo,
      obrasCacheLocalRef,
      usuarioIdExplorarRef,
      setObrasLocais,
      setProximoCursorCatalogo,
      setCatalogoTemMais,
      setCarregandoMaisCatalogo,
      setObraIdsBuscaRemota,
      setErroCatalogoExplorar,
    });

  function tentarCarregarCatalogoNovamente() {
    if (erroColecoesExplorar && !erroCatalogoExplorar) {
      setVersaoRetryColecoes((versaoAtual) => versaoAtual + 1);
      return;
    }

    if (erroCatalogoExplorar === "paginacao") {
      void carregarMaisObrasCatalogo();
      return;
    }

    setVersaoRetryCatalogo((versaoAtual) => versaoAtual + 1);
  }

  const filtroColecaoAtivo =
    usuarioLogado && filtroColecao !== "todos";
  const filtroFormatoAtivo = filtroFormato !== "todos";
  const filtroTagAtivo = Boolean(normalizarTagCatalogo(filtroTag));
  const tagExcluidaAtiva = modoConteudo === "obras" && Boolean(normalizarTagCatalogo(tagExcluida));
  const generoExcluidoAtivo = modoConteudo === "obras" && Boolean(normalizarGeneroExcluido(generoExcluido));
  const statusEditorialAtivo = modoConteudo === "obras" && Boolean(filtroStatusEditorial(statusEditorial));
  const notaMinimaAtiva = notaMinima !== null;
  const palavrasAtivas = modoConteudo === "obras" && (intervaloPalavras.minimo !== "" || intervaloPalavras.maximo !== "");
  const palavrasInvalidas = palavrasAtivas && !validarIntervaloPalavras(intervaloPalavras).valido;
  const palavrasCompartilhadas = modoConteudo === "obras"
    ? { palavrasMinimas: intervaloPalavras.minimo, palavrasMaximas: intervaloPalavras.maximo } : {};
  const ordenacaoPorCapitulosAtiva = ordenacao === "mais-capitulos";

  const obrasBaseFiltradas = useMemo(() => {
    return filtrarObrasBaseExplorar({
      obrasLocais,
      filtroFormato,
      filtroTag,
      tagExcluida: modoConteudo === "obras" ? tagExcluida : "",
      generoExcluido: modoConteudo === "obras" ? generoExcluido : "",
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
    filtroTag,
    tagExcluida,
    generoExcluido,
    modoConteudo,
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
      statusEditorial: modoConteudo === "obras" ? statusEditorial : "",
      palavrasAtivas,
      obraIdsBuscaRemota: palavrasVerificadas && notaMinimaVerificada && tagExcluidaVerificada && generoExcluidoVerificado && statusEditorialVerificado ? obraIdsBuscaRemota : null,
      notaMinima,
      tagExcluida: modoConteudo === "obras" ? tagExcluida : "",
      generoExcluido: modoConteudo === "obras" ? generoExcluido : "",
    });
  }, [
    obrasBaseFiltradas,
    categoriaSelecionada,
    termoBusca,
    obraIdsBuscaRemota,
    notaMinimaVerificada,
    notaMinima,
    tagExcluidaVerificada,
    generoExcluidoVerificado,
    statusEditorialVerificado,
    palavrasAtivas,
    palavrasVerificadas,
    tagExcluida,
    generoExcluido,
    statusEditorial,
    modoConteudo,
  ]);

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
      filtroTag: normalizarTagCatalogo(filtroTag),
      tagExcluida: modoConteudo === "obras" ? normalizarTagCatalogo(tagExcluida) : "",
      generoExcluido: modoConteudo === "obras" ? normalizarGeneroExcluido(generoExcluido) : "",
      statusEditorial: modoConteudo === "obras" ? filtroStatusEditorial(statusEditorial) : "",
      notaMinima,
      palavrasAtivas,
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
    filtroTag: normalizarTagCatalogo(filtroTag),
    tagExcluida: modoConteudo === "obras" ? normalizarTagCatalogo(tagExcluida) : "",
    generoExcluido: modoConteudo === "obras" ? normalizarGeneroExcluido(generoExcluido) : "",
    statusEditorial: modoConteudo === "obras" ? filtroStatusEditorial(statusEditorial) : "",
    notaMinima,
    palavrasAtivas,
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
      setIntervaloPalavras(INTERVALO_PALAVRAS_VAZIO);
      setFiltroClassificacao("todos");
      setTagExcluida("");
      setGeneroExcluido("");
    setStatusEditorial("");
      setNotaMinima(null);
      if (ordenacaoPorCapitulosAtiva) {
        setOrdenacao("relevancia");
      }
    }

    setMostrarFiltrosAvancados(false);
    atualizarUrlExplorar({
      modoConteudo: modo,
      ...(modo === "obras" ? palavrasCompartilhadas : {}),
      categoriaSelecionada: "",
      busca,
      ordenacao: modo === "autores" && ordenacaoPorCapitulosAtiva ? "relevancia" : ordenacao,
      filtroFormato,
      filtroTag,
      tagExcluida: modo === "autores" ? "" : tagExcluida,
      generoExcluido: modo === "autores" ? "" : generoExcluido,
      statusEditorial: modo === "autores" ? "" : statusEditorial,
      notaMinima: modo === "autores" ? null : notaMinima,
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
      ...palavrasCompartilhadas,
      busca,
      ordenacao,
      filtroFormato,
      filtroTag,
      tagExcluida,
      generoExcluido,
      statusEditorial,
      notaMinima,
    });
  }

  function atualizarBuscaExplorar(valor: string) {
    setBusca(valor);
    atualizarUrlExplorar(
      {
        modoConteudo,
        categoriaSelecionada,
        busca: valor,
        ...palavrasCompartilhadas,
        ordenacao,
        filtroFormato,
        filtroTag,
        tagExcluida,
        generoExcluido,
        statusEditorial,
        notaMinima,
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
      ...palavrasCompartilhadas,
      filtroFormato,
      filtroTag,
      tagExcluida,
      generoExcluido,
      statusEditorial,
      notaMinima,
    });
  }

  function selecionarFormatoExplorar(formato: string) {
    setFiltroFormato(formato);
    atualizarUrlExplorar({
      modoConteudo,
      categoriaSelecionada,
      busca,
      ordenacao,
      filtroFormato: formato,
      ...palavrasCompartilhadas,
      filtroTag,
      tagExcluida,
      generoExcluido,
      statusEditorial,
      notaMinima,
    });
  }

  function selecionarTagExplorar(tag: string) {
    setFiltroTag(tag);
    atualizarUrlExplorar({
      modoConteudo, categoriaSelecionada, busca, ordenacao, filtroFormato,
      filtroTag: tag,
      ...palavrasCompartilhadas,
      tagExcluida,
      generoExcluido,
      statusEditorial,
      notaMinima,
    }, "replace");
  }

  function selecionarStatusEditorialExplorar(valor: string) {
    const status = filtroStatusEditorial(valor);
    setStatusEditorial(status);
    atualizarUrlExplorar({
      modoConteudo, categoriaSelecionada, busca, ordenacao, filtroFormato,
      filtroTag, notaMinima, generoExcluido, tagExcluida, statusEditorial: status,
      ...palavrasCompartilhadas,
    });
  }

  function selecionarNotaMinimaExplorar(valor: string) {
    const nota = normalizarNotaMinimaCatalogo(valor);
    setNotaMinima(nota);
    atualizarUrlExplorar({
      modoConteudo, categoriaSelecionada, busca, ordenacao, filtroFormato,
      filtroTag, tagExcluida, generoExcluido, statusEditorial, notaMinima: nota,
      ...palavrasCompartilhadas,
    });
  }

  function selecionarGeneroExcluidoExplorar(valor: string) {
    const genero = normalizarGeneroExcluido(valor);
    setGeneroExcluido(genero);
    atualizarUrlExplorar({
      modoConteudo, categoriaSelecionada, busca, ordenacao, filtroFormato,
      filtroTag, notaMinima, tagExcluida, statusEditorial, generoExcluido: genero,
      ...palavrasCompartilhadas,
    });
  }

  function selecionarTagExcluidaExplorar(tag: string) {
    setTagExcluida(tag);
    atualizarUrlExplorar({
      modoConteudo, categoriaSelecionada, busca, ordenacao, filtroFormato,
      filtroTag, notaMinima, generoExcluido, statusEditorial, tagExcluida: tag,
      ...palavrasCompartilhadas,
    }, "replace");
  }

  function aplicarIntervaloPalavras(intervalo: IntervaloPalavrasTexto) {
    if (!validarIntervaloPalavras(intervalo).valido) return;
    setIntervaloPalavras(intervalo);
    atualizarUrlExplorar({ modoConteudo, categoriaSelecionada, busca, ordenacao, filtroFormato,
      filtroTag, tagExcluida, generoExcluido, statusEditorial, notaMinima,
      palavrasMinimas: intervalo.minimo, palavrasMaximas: intervalo.maximo });
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
    setIntervaloPalavras(INTERVALO_PALAVRAS_VAZIO);
    setModoConteudo("obras");
    setCategoriaSelecionada("");
    setBusca("");
    setFiltroFormato("todos");
    setFiltroTag("");
    setTagExcluida("");
    setGeneroExcluido("");
      setStatusEditorial("");
    setNotaMinima(null);
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

      <section ref={containerExplorarRef} style={isDesktop ? desktopContainerStyle : containerStyle}>
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

        <ExplorarActiveCatalogFilters
          language={language}
          modoConteudo={modoConteudo}
          filtroFormato={filtroFormato}
          filtroTag={filtroTag}
          tagExcluida={tagExcluida}
          generoExcluido={generoExcluido}
          statusEditorial={statusEditorial}
          onSelecionarStatusEditorial={selecionarStatusEditorialExplorar}
          notaMinima={notaMinima}
          intervaloPalavras={intervaloPalavras}
          onAplicarPalavras={aplicarIntervaloPalavras}
          onSelecionarFormato={selecionarFormatoExplorar}
          onSelecionarTag={selecionarTagExplorar}
          onSelecionarTagExcluida={selecionarTagExcluidaExplorar}
          onSelecionarGeneroExcluido={selecionarGeneroExcluidoExplorar}
          onSelecionarNotaMinima={selecionarNotaMinimaExplorar}
          onFocarFiltros={() => containerExplorarRef.current?.querySelector<HTMLButtonElement>('button[aria-haspopup="dialog"]')?.focus({ preventScroll: true })}
        />

        {palavrasInvalidas && <div role="alert">
          <p>{textosFiltroPalavras(language).erro}</p>
          <button type="button" onClick={() => setMostrarFiltrosAvancados(true)}>{textosFiltroPalavras(language).corrigir}</button>
          <button type="button" onClick={limparFiltros}>{traduzirTextoExplorar("Limpar filtros", language)}</button>
        </div>}

        {!palavrasInvalidas && (erroCatalogoExplorar || erroColecoesExplorar) && (
          <ExplorarCatalogErrorNotice
            possuiDados={!palavrasAtivas && obrasLocais.length > 0}
            carregando={
              carregandoMaisCatalogo ||
              (filtroColecaoAtivo && !colecoesCarregadas)
            }
            onTentarNovamente={tentarCarregarCatalogoNovamente}
          />
        )}

        {mostrarFiltrosAvancados && (
          <Suspense fallback={null}>
            <ExplorarAdvancedFiltersComposition
              isDesktop={isDesktop}
              language={language}
              modoConteudo={modoConteudo}
              filtroColecao={filtroColecao}
              filtroFormato={filtroFormato}
              filtroTag={filtroTag}
              onSelecionarTag={selecionarTagExplorar}
              tagExcluida={tagExcluida}
              generoExcluido={generoExcluido}
              statusEditorial={statusEditorial}
              onSelecionarStatusEditorial={selecionarStatusEditorialExplorar}
              onSelecionarTagExcluida={selecionarTagExcluidaExplorar}
              onSelecionarGeneroExcluido={selecionarGeneroExcluidoExplorar}
              notaMinima={notaMinima}
              intervaloPalavras={intervaloPalavras}
              onAplicarPalavras={aplicarIntervaloPalavras}
              onSelecionarNotaMinima={selecionarNotaMinimaExplorar}
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
              onSelecionarFormato={selecionarFormatoExplorar}
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
          !termoBusca &&
          !filtroFormatoAtivo &&
          !filtroTagAtivo &&
          !tagExcluidaAtiva &&
          !generoExcluidoAtivo &&
          !statusEditorialAtivo &&
          !palavrasAtivas &&
          !notaMinimaAtiva &&
          !ordenacaoPorCapitulosAtiva &&
          !filtroColecaoAtivo && (
            <ExplorarCreativeWorkSections
              secoes={secoesCriativasObras}
              isDesktop={isDesktop}
              tema={temaPagina}
            />
          )}

        {modoConteudo === "obras" &&
          !categoriaSelecionada &&
          !termoBusca &&
          !filtroFormatoAtivo &&
          !filtroTagAtivo &&
          !tagExcluidaAtiva &&
          !generoExcluidoAtivo &&
          !statusEditorialAtivo &&
          !palavrasAtivas &&
          !notaMinimaAtiva &&
          !ordenacaoPorCapitulosAtiva &&
          !filtroColecaoAtivo && (
            <ExplorarGenreWorkSections
              secoes={secoesObrasPorGenero}
              isDesktop={isDesktop}
            />
          )}

        {modoConteudo === "obras" &&
          (Boolean(categoriaSelecionada) ||
            Boolean(termoBusca) ||
            filtroConteudo18Ativo ||
            filtroFormatoAtivo ||
            filtroTagAtivo ||
            tagExcluidaAtiva ||
            generoExcluidoAtivo || statusEditorialAtivo ||
            palavrasAtivas ||
            notaMinimaAtiva ||
            ordenacaoPorCapitulosAtiva ||
            filtroColecaoAtivo) &&
          obrasLocaisFiltradas.length > 0 && (
            <ExplorarFilteredWorksSection
              obras={obrasLocaisFiltradas}
              titulo={
                categoriaSelecionada
                  ? `Publicações em ${categoriaSelecionada}`
                  : termoBusca
                    ? "Resultados da busca"
                    : filtroColecao === "favoritas"
                      ? "Na lista"
                      : filtroColecao === "concluidas"
                        ? "Concluídas"
                        : filtroColecao === "lendo"
                          ? "Lendo agora"
                          : filtroColecao === "sem-leitura"
                            ? "Sem leitura"
                            : filtroFormatoAtivo
                              ? traduzirFormatoExplorar(filtroFormato, language)
                              : filtroTagAtivo
                                ? `${traduzirTextoExplorar("Tag da obra", language)}: ${normalizarTagCatalogo(filtroTag)}`
                              : notaMinimaAtiva
                                ? traduzirTextoExplorar("Avaliação mínima", language)
                              : palavrasAtivas
                                ? textosFiltroPalavras(language).titulo
                              : tagExcluidaAtiva
                                ? `${traduzirTextoExplorar("Excluir tag", language)}: ${normalizarTagCatalogo(tagExcluida)}`
                              : generoExcluidoAtivo
                                ? `${traduzirTextoExplorar("Excluir gênero", language)}: ${traduzirGeneroExplorar(categorias.find((genero) => normalizarGeneroExcluido(genero) === generoExcluido) || generoExcluido, language)}`
                              : ordenacaoPorCapitulosAtiva
                                ? traduzirTextoExplorar("Mais capítulos", language)
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

        {modoConteudo === "autores" && catalogoTemMais && (
          <ExplorarLoadMoreButton
            carregando={carregandoMaisCatalogo}
            language={language}
            onCarregarMais={() => void carregarMaisObrasCatalogo()}
          />
        )}

        {!palavrasInvalidas && (palavrasAtivas || notaMinimaAtiva || tagExcluidaAtiva || generoExcluidoAtivo || statusEditorialAtivo) && (!palavrasVerificadas || !notaMinimaVerificada || !tagExcluidaVerificada || !generoExcluidoVerificado || !statusEditorialVerificado || obraIdsBuscaRemota === null) &&
          !erroCatalogoExplorar && !erroColecoesExplorar && (
            <p role="status">{traduzirTextoExplorar(notaMinimaAtiva ? "Consultando avaliações" : "Carregando Explorar", language)}</p>
        )}

        {totalResultados === 0 &&
          !((palavrasAtivas || notaMinimaAtiva || tagExcluidaAtiva || generoExcluidoAtivo || statusEditorialAtivo) && (!palavrasVerificadas || !notaMinimaVerificada || !tagExcluidaVerificada || !generoExcluidoVerificado || !statusEditorialVerificado || obraIdsBuscaRemota === null)) &&
          !erroCatalogoExplorar &&
          !erroColecoesExplorar &&
          (!filtroColecaoAtivo || colecoesCarregadas) && (
          <EstadoVazioExplorar
            possuiObrasPublicadas={possuiObrasPublicadas || palavrasAtivas}
            modoConteudo={modoConteudo}
          />
        )}
      </section>
    </main>
  );
}
