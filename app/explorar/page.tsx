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
import { ExplorarLoadingState } from "./components/explorar-loading-state";
import { ExplorarLoadMoreButton } from "./components/explorar-load-more-button";
import { ExplorarLoginNotice } from "./components/explorar-login-notice";
import { ExplorarCollectionFilterOptions } from "./components/explorar-collection-filter-options";
import { ExplorarCategoriesBar } from "./components/explorar-categories-bar";
import { ExplorarDesktopHeader } from "./components/explorar-desktop-header";
import { ExplorarMobileHeader } from "./components/explorar-mobile-header";
import { ExplorarAdvancedFiltersShell } from "./components/explorar-advanced-filters-shell";
import { ExplorarAdultContentFilter } from "./components/explorar-adult-content-filter";
import { ExplorarOrderingOptions } from "./components/explorar-ordering-options";
import { ExplorarClearFiltersAction } from "./components/explorar-clear-filters-action";
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
import { obterAutorIdsExplorar } from "./lib/explorar-author-ids";
import { categorias } from "./lib/explorar-categories";
import { criarTextoBotaoFiltrosAvancadosExplorar } from "./lib/explorar-filter-button-label";
import { criarLoginHrefExplorar } from "./lib/explorar-login-route-utils";
import { atualizarUrlExplorar } from "./lib/explorar-page-route-utils";
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
import { useExplorarDesktopMode } from "./hooks/use-explorar-desktop-mode";
import { useExplorarInitialLoad } from "./hooks/use-explorar-initial-load";
import { useExplorarCatalogQuery } from "./hooks/use-explorar-catalog-query";
import { themePageCss } from "./lib/explorar-page-css";
import { explorarBuscaToggleCss } from "./lib/explorar-search-toggle-css";
import {
  criarSearchBoxStyle,
  criarDesktopSearchBoxStyle,
  pageStyle,
  criarExplorarPageStyle,
  containerStyle,
  explorarModalSectionLabelStyle,
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
            onBuscaChange={setBusca}
            onAbrirFiltros={() => setMostrarFiltrosAvancados(true)}
          />
        ) : (
          <ExplorarMobileHeader
            busca={busca}
            buscaMobileAberta={buscaMobileAberta}
            modoConteudo={modoConteudo}
            textoBotaoFiltrosAvancados={textoBotaoFiltrosAvancados}
            language={language}
            onBuscaChange={setBusca}
            onAbrirBusca={() => setBuscaMobileAberta(true)}
            onFecharBusca={() => {
              setBusca("");
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
          <ExplorarAdvancedFiltersShell
            isDesktop={isDesktop}
            language={language}
            onFechar={() => {
              setMostrarFiltrosAvancados(false);
              setMostrarConfirmacaoConteudo18(false);
              setConfirmouIdadeConteudo18(false);
            }}
          >
            <p style={explorarModalSectionLabelStyle}>
                  {traduzirTextoExplorar("Mostrar", language)}
                </p>

                <ExplorarCollectionFilterOptions filtroColecao={filtroColecao} language={language} onSelecionar={selecionarFiltroColecao} />

                {modoConteudo === "obras" && (
                  <ExplorarAdultContentFilter
                    filtroClassificacao={filtroClassificacao}
                    mostrarConfirmacao={mostrarConfirmacaoConteudo18}
                    confirmouIdade={confirmouIdadeConteudo18}
                    acessoTemporariamenteBloqueado={
                      ACESSO_CONTEUDO_18_TEMPORARIAMENTE_BLOQUEADO
                    }
                    language={language}
                    onSelecionarClassificacao={
                      selecionarFiltroClassificacaoExplorar
                    }
                    onConfirmouIdadeChange={setConfirmouIdadeConteudo18}
                    onVoltar={() => {
                      setMostrarConfirmacaoConteudo18(false);
                      setConfirmouIdadeConteudo18(false);
                    }}
                    onConfirmar={confirmarFiltroConteudo18Explorar}
                  />
                )}

                {!mostrarConfirmacaoConteudo18 && (
                  <>
                    <p style={explorarModalSectionLabelStyle}>
                      {traduzirTextoExplorar("Ordenar", language)}
                    </p>

                    <ExplorarOrderingOptions
                      ordenacao={ordenacao}
                      language={language}
                      onSelecionar={setOrdenacao}
                    />
                  </>
                )}

                {!mostrarConfirmacaoConteudo18 && filtrosAtivos && (
                  <ExplorarClearFiltersAction
                    language={language}
                    onLimpar={limparFiltros}
                  />
                )}
          </ExplorarAdvancedFiltersShell>
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
