"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useHistorietasLanguage } from "../components/HistorietasLanguageProvider";
import HomeContentSections from "../components/HomeContentSections";
import HomeHeader from "../components/HomeHeader";
import HomeHero from "../components/HomeHero";
import { LoadingSpinner } from "../components/HomeStatusStates";
import useHomeAuthorRatings from "./hooks/use-home-author-ratings";
import useHomeDesktopMode from "./hooks/use-home-desktop-mode";
import useHomeHeroCarousel from "./hooks/use-home-hero-carousel";
import useHomePageTranslations from "./hooks/use-home-page-translations";
import useHomeAuthSession from "./hooks/use-home-auth-session";
import { themePageCss } from "./lib/home-page-css";
import {
  desktopSummaryStripStyle,
  summaryDividerLineStyle,
  summaryItemStyle,
  summaryNumberStyle,
  summaryStripStyle,
} from "./lib/home-summary-section-styles";
import {
  containerStyle,
  desktopContainerStyle,
  desktopTopWaterFadeStyle,
  mobileTopWaterFadeStyle,
  pageDecorationLayerStyle,
  pageStyle,
} from "./lib/home-shell-header-styles";
import {
  criarObrasAcaoRivalidadesHome,
  criarObrasEmBreveHome,
  criarObrasFantasiaPoderesHome,
  criarObrasRomanceDramaHome,
  criarObrasScifiCodigoHome,
  criarObrasTerrorSuspenseHome,
} from "./lib/home-catalog-theme-list-utils";
import {
  criarObrasCatalogoFiltradasHome,
  criarObrasPublicadasFiltradasHome,
} from "./lib/home-search-list-utils";
import {
  criarObrasCatalogoMinhaListaHome,
  criarObrasMinhaListaHome,
  criarObrasParaContinuarHome,
} from "./lib/home-user-library-list-utils";
import {
  criarObrasCatalogoRecomendadasHome,
  criarObrasRecomendadasHome,
  criarTemasRecomendadosUsuarioHome,
} from "./lib/home-recommendation-list-utils";
import useHomeInitialData, {
  FAVORITES_STORAGE_KEY,
} from "./hooks/use-home-initial-data";
import useHomeCatalogSearch from "./hooks/use-home-catalog-search";
import type { AutorHome } from "./lib/home-author-composition-utils";
import { criarAutoresParaConhecerHome } from "./lib/home-author-list-utils";
import {
  criarLeiturasRapidasHome,
  criarObrasComArquivoAnexadoHome,
  criarObrasComNovosCapitulosHome,
  criarObrasMaisComentadasHome,
  criarObrasMaisCurtidasHome,
} from "./lib/home-local-work-list-utils";
import {
  obraTemConteudoPublicoHome,
} from "./lib/home-local-work-utils";
import { alternarHeroFavoritoHome } from "./lib/home-hero-favorite-action";
import { criarObrasHeroHome } from "./lib/home-hero-selection-utils";
import { criarDadosHeroHome } from "./lib/home-hero-view-utils";
import {
  criarDecoracaoHomeStyle,
} from "./lib/home-hero-visual-style-utils";
import { useNotificacoes } from "../components/NotificacoesProvider";
import { normalizarTexto } from "../lib/utils";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../lib/historietasTheme";
import { ehClassificacao18 } from "../lib/historietasAdultContent";
import {
  HERO_INICIAL_HOME,
  OBRAS_CATALOGO_HOME,
} from "./lib/home-page-models";
import type { ObraLocal } from "./lib/home-page-models";

export default function Home() {
  const { language } = useHistorietasLanguage();
  const homeTranslationRootRef = useRef<HTMLElement | null>(null);
  useHomePageTranslations(homeTranslationRootRef, language);
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const [busca, setBusca] = useState("");
  const { notificacoesNaoLidas } = useNotificacoes();
  const [buscaMobileAberta, setBuscaMobileAberta] = useState(false);
  const isDesktop = useHomeDesktopMode();
  const {
    usuarioLogado,
    usuarioIdLogado,
    avisoLogin,
    setAvisoLogin,
    exigirLoginHome,
  } = useHomeAuthSession();
  const obrasCacheLocalHomeRef = useRef<ObraLocal[]>([]);
  const {
    obrasLocais,
    obrasFavoritas,
    perfisAutores,
    dadosHomeCarregados,
    setObrasLocais,
    setObrasFavoritas,
  } = useHomeInitialData(usuarioIdLogado, obrasCacheLocalHomeRef);
  const termoBusca = normalizarTexto(busca);

  useHomeCatalogSearch({
    dadosHomeCarregados,
    termoBusca,
    usuarioIdLogado,
    obrasCacheLocalHomeRef,
    setObrasLocais,
  });

  const obrasPublicadas = useMemo(() => {
    return obrasLocais.filter((obra) => {
      return (
        obra.publicado &&
        obraTemConteudoPublicoHome(obra) &&
        !ehClassificacao18(obra.classificacaoIndicativa)
      );
    });
  }, [obrasLocais]);

  const homeSemObrasReais =
    dadosHomeCarregados && !termoBusca && obrasPublicadas.length === 0;

  const obrasHero = useMemo(() => {
    return criarObrasHeroHome(obrasPublicadas, termoBusca);
  }, [obrasPublicadas, termoBusca]);

  const { heroIndex, setHeroIndex } = useHomeHeroCarousel(
    termoBusca,
    obrasHero.length,
  );

  const {
    usandoHeroInicial,
    heroObra,
    heroObraHref,
    heroTemImagem,
    heroFavoritoId,
    metricasHeroHome,
    desktopMetricasHeroHome,
    heroEstaSalvo,
  } = criarDadosHeroHome({
    obrasHero,
    heroIndex,
    heroInicial: HERO_INICIAL_HOME,
    usuarioLogado,
    obrasFavoritas,
  });

  function alternarHeroFavorito() {
    return alternarHeroFavoritoHome({
      heroObra,
      heroFavoritoId,
      obrasLocais,
      obrasFavoritas,
      exigirLoginHome,
      favoritesStorageKey: FAVORITES_STORAGE_KEY,
      setObrasFavoritas,
      setAvisoLogin,
    });
  }

  const obrasPublicadasFiltradas = useMemo(() => {
    return criarObrasPublicadasFiltradasHome(obrasPublicadas, termoBusca);
  }, [obrasPublicadas, termoBusca]);

  const obrasParaContinuar = useMemo(() => {
    return criarObrasParaContinuarHome(
      obrasPublicadas,
      termoBusca,
      usuarioLogado
    );
  }, [obrasPublicadas, termoBusca, usuarioLogado]);

  const obrasMinhaLista = useMemo(() => {
    return criarObrasMinhaListaHome(
      obrasPublicadas,
      obrasFavoritas,
      termoBusca,
      usuarioLogado
    );
  }, [obrasPublicadas, obrasFavoritas, termoBusca, usuarioLogado]);

  const obrasCatalogoMinhaLista = useMemo(() => {
    return criarObrasCatalogoMinhaListaHome(
      OBRAS_CATALOGO_HOME,
      obrasFavoritas,
      termoBusca,
      usuarioLogado
    );
  }, [obrasFavoritas, termoBusca, usuarioLogado]);

  const temasRecomendadosUsuario = useMemo(() => {
    return criarTemasRecomendadosUsuarioHome(
      obrasParaContinuar,
      obrasMinhaLista,
      obrasCatalogoMinhaLista
    );
  }, [obrasCatalogoMinhaLista, obrasMinhaLista, obrasParaContinuar]);

  const obrasRecomendadas = useMemo(() => {
    return criarObrasRecomendadasHome(
      obrasPublicadas,
      obrasParaContinuar,
      obrasMinhaLista,
      temasRecomendadosUsuario,
      termoBusca
    );
  }, [
    obrasMinhaLista,
    obrasParaContinuar,
    obrasPublicadas,
    temasRecomendadosUsuario,
    termoBusca,
  ]);

  const obrasCatalogoRecomendadas = useMemo(() => {
    return criarObrasCatalogoRecomendadasHome(
      OBRAS_CATALOGO_HOME,
      obrasCatalogoMinhaLista,
      temasRecomendadosUsuario,
      termoBusca
    );
  }, [obrasCatalogoMinhaLista, temasRecomendadosUsuario, termoBusca]);

  const totalMinhaListaHome =
    obrasMinhaLista.length + obrasCatalogoMinhaLista.length;
  const totalRecomendacoesHome =
    obrasRecomendadas.length + obrasCatalogoRecomendadas.length;

  const obrasFiltradas = useMemo(() => {
    return criarObrasCatalogoFiltradasHome(OBRAS_CATALOGO_HOME, termoBusca);
  }, [termoBusca]);

  const obrasComNovosCapitulos = useMemo(() => {
    return criarObrasComNovosCapitulosHome(
      obrasPublicadas,
      termoBusca
    );
  }, [obrasPublicadas, termoBusca]);

  const obrasMaisCurtidas = useMemo(() => {
    return criarObrasMaisCurtidasHome(obrasPublicadas, termoBusca);
  }, [obrasPublicadas, termoBusca]);

  const obrasMaisComentadas = useMemo(() => {
    return criarObrasMaisComentadasHome(obrasPublicadas, termoBusca);
  }, [obrasPublicadas, termoBusca]);

  const obrasComArquivoAnexado = useMemo(() => {
    return criarObrasComArquivoAnexadoHome(obrasPublicadas, termoBusca);
  }, [obrasPublicadas, termoBusca]);

  const leiturasRapidas = useMemo(() => {
    return criarLeiturasRapidasHome(obrasPublicadas, termoBusca);
  }, [obrasPublicadas, termoBusca]);

  const autoresParaConhecer = useMemo<AutorHome[]>(() => {
    return criarAutoresParaConhecerHome({
      obrasPublicadas,
      obrasFiltradas,
      perfisAutores,
      termoBusca,
    });
  }, [obrasPublicadas, obrasFiltradas, perfisAutores, termoBusca]);

  const avaliacoesAutoresHome = useHomeAuthorRatings(autoresParaConhecer);

  const obrasFantasiaPoderes = useMemo(() => {
    return criarObrasFantasiaPoderesHome(obrasFiltradas);
  }, [obrasFiltradas]);

  const obrasTerrorSuspense = useMemo(() => {
    return criarObrasTerrorSuspenseHome(obrasFiltradas);
  }, [obrasFiltradas]);

  const obrasRomanceDrama = useMemo(() => {
    return criarObrasRomanceDramaHome(obrasFiltradas);
  }, [obrasFiltradas]);

  const obrasAcaoRivalidades = useMemo(() => {
    return criarObrasAcaoRivalidadesHome(obrasFiltradas);
  }, [obrasFiltradas]);

  const obrasScifiCodigo = useMemo(() => {
    return criarObrasScifiCodigoHome(obrasFiltradas);
  }, [obrasFiltradas]);

  const obrasEmBreve = useMemo(() => {
    return criarObrasEmBreveHome(obrasFiltradas);
  }, [obrasFiltradas]);

  if (!dadosHomeCarregados) {
    return (
      <main ref={homeTranslationRootRef} style={pageThemeStyle} aria-busy="true">
        <style>{`${themePageCss}${historietasThemeCss}`}</style>
        <LoadingSpinner label="Carregando página inicial" />
      </main>
    );
  }

  if (!heroObra) {
    return (
      <main
        ref={homeTranslationRootRef}
        style={{
          ...pageThemeStyle,
          display: "grid",
          placeItems: "center",
          padding: "40px",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#FFFFFF",
            fontSize: "12px",
            fontWeight: 800,
            textAlign: "center",
          }}
        >
          Nenhuma obra cadastrada
        </p>
      </main>
    );
  }

  return (
    <main ref={homeTranslationRootRef} style={pageThemeStyle}>
      <style>{`${themePageCss}${historietasThemeCss}`}</style>

      <div style={pageDecorationLayerStyle} aria-hidden="true">
        {["✦", "◌", "✧"].map((decoracao, index) => (
          <span key={`${decoracao}-${index}`} style={criarDecoracaoHomeStyle()}>
            {decoracao}
          </span>
        ))}
      </div>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}

      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      <HomeHeader
        isDesktop={isDesktop}
        busca={busca}
        setBusca={setBusca}
        buscaMobileAberta={buscaMobileAberta}
        setBuscaMobileAberta={setBuscaMobileAberta}
        notificacoesNaoLidas={notificacoesNaoLidas}
        usuarioLogado={usuarioLogado}
      />
      <div style={isDesktop ? desktopContainerStyle : containerStyle}>
        <HomeHero
          isDesktop={isDesktop}
          language={language}
          obrasHero={obrasHero}
          heroIndex={heroIndex}
          setHeroIndex={setHeroIndex}
          usandoHeroInicial={usandoHeroInicial}
          heroObra={heroObra}
          heroObraHref={heroObraHref}
          heroTemImagem={heroTemImagem}
          heroEstaSalvo={heroEstaSalvo}
          avisoLogin={avisoLogin}
          metricasHeroHome={metricasHeroHome}
          desktopMetricasHeroHome={desktopMetricasHeroHome}
          onToggleFavorite={alternarHeroFavorito}
        />

        <section style={isDesktop ? desktopSummaryStripStyle : summaryStripStyle} aria-label="Atalhos principais">
          <Link href="/em-breve" style={summaryItemStyle}>
            <strong style={summaryNumberStyle}>Em breve</strong>
          </Link>

          <span style={summaryDividerLineStyle} aria-hidden="true" />

          <Link href="/em-alta" style={summaryItemStyle}>
            <strong style={summaryNumberStyle}>Em Alta</strong>
          </Link>
        </section>

        <HomeContentSections
          isDesktop={isDesktop}
          termoBusca={termoBusca}
          homeSemObrasReais={homeSemObrasReais}
          obrasParaContinuar={obrasParaContinuar}
          totalMinhaListaHome={totalMinhaListaHome}
          obrasMinhaLista={obrasMinhaLista}
          obrasCatalogoMinhaLista={obrasCatalogoMinhaLista}
          autoresParaConhecer={autoresParaConhecer}
          avaliacoesAutoresHome={avaliacoesAutoresHome}
          totalRecomendacoesHome={totalRecomendacoesHome}
          temasRecomendadosUsuario={temasRecomendadosUsuario}
          obrasRecomendadas={obrasRecomendadas}
          obrasCatalogoRecomendadas={obrasCatalogoRecomendadas}
          obrasPublicadasFiltradas={obrasPublicadasFiltradas}
          obrasComNovosCapitulos={obrasComNovosCapitulos}
          obrasMaisCurtidas={obrasMaisCurtidas}
          obrasMaisComentadas={obrasMaisComentadas}
          obrasComArquivoAnexado={obrasComArquivoAnexado}
          leiturasRapidas={leiturasRapidas}
          obrasFiltradas={obrasFiltradas}
          obrasFantasiaPoderes={obrasFantasiaPoderes}
          obrasTerrorSuspense={obrasTerrorSuspense}
          obrasRomanceDrama={obrasRomanceDrama}
          obrasAcaoRivalidades={obrasAcaoRivalidades}
          obrasScifiCodigo={obrasScifiCodigo}
          obrasEmBreve={obrasEmBreve}
        />
      </div>
    </main>
  );
}
