"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useHistorietasLanguage } from "../components/HistorietasLanguageProvider";
import MobileAutorCard from "../components/HomeAuthorCard";
import MobileObraCard from "../components/HomeCatalogWorkCard";
import MobileObraLocalCard from "../components/HomeLocalWorkCard";
import HomeCarouselRow from "../components/HomeCarouselRow";
import HomeHeroCarouselDots from "../components/HomeHeroCarouselDots";
import HomeSectionHeader from "../components/HomeSectionHeader";
import {
  EmptySearch,
  HomeEmptyState,
  LoadingSpinner,
} from "../components/HomeStatusStates";
import useHomeAuthorRatings from "./hooks/use-home-author-ratings";
import useHomeDesktopMode from "./hooks/use-home-desktop-mode";
import useHomeHeroCarousel from "./hooks/use-home-hero-carousel";
import useHomePageTranslations from "./hooks/use-home-page-translations";
import useHomeAuthSession from "./hooks/use-home-auth-session";
import { themePageCss } from "./lib/home-page-css";
import {
  listaAuthorMetaTypographyStyle,
  listaWorkTitleTypographyStyle,
  safeTextStyle,
} from "./lib/home-card-style-primitives";
import {
  containerStyle,
  desktopActiveLinkStyle,
  desktopContainerStyle,
  desktopHeaderActionsStyle,
  desktopHeaderIconLinkStyle,
  desktopInlineSearchAreaStyle,
  desktopInputStyle,
  desktopLinkStyle,
  desktopLogoMarkStyle,
  desktopLogoStyle,
  desktopLogoTextStyle,
  desktopMenuStyle,
  desktopNavInnerStyle,
  desktopNavStyle,
  desktopNotificationCountBadgeStyle,
  desktopProfileAvatarStyle,
  desktopProfileLinkStyle,
  desktopSearchIconStyle,
  desktopTopWaterFadeStyle,
  heroDecorationLayerStyle,
  logoMarkStyle,
  logoStyle,
  logoTextStyle,
  mobileHeaderSearchAreaStyle,
  mobileHeaderSearchInputStyle,
  mobileNavStyle,
  mobileSearchToggleActiveStyle,
  mobileSearchToggleStyle,
  mobileTopWaterFadeStyle,
  navIconsStyle,
  navInnerStyle,
  navTopRowStyle,
  pageDecorationLayerStyle,
  pageStyle,
} from "./lib/home-shell-header-styles";
import { cardStatHeartIconStyle } from "./lib/home-work-card-styles";
import {
  criarHrefObraCatalogoHome,
} from "./lib/home-route-utils";
import {
  formatarGeneroHome,
  traduzirClassificacaoHome,
  traduzirGeneroHome,
} from "./lib/home-metadata-utils";
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
import { compactarNumeroHome } from "./lib/home-format-utils";
import {
  colecaoTemIdentificadorHome,
  criarIdentificadoresObraCatalogoHome,
  obterIdentificadorFavoritoHome,
} from "./lib/home-collection-utils";
import useHomeInitialData, {
  FAVORITES_STORAGE_KEY,
} from "./hooks/use-home-initial-data";
import useHomeCatalogSearch from "./hooks/use-home-catalog-search";
import type { AutorHome } from "./lib/home-author-composition-utils";
import { criarAutoresParaConhecerHome } from "./lib/home-author-list-utils";
import {
  obterImagemObraCatalogo,
  obterTotalCapitulosObraCatalogoHome,
  obraCatalogoTemArquivoAnexadoHome,
} from "./lib/home-catalog-utils";
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
import {
  criarObraHeroLocalHome,
  formatarSinopseHeroMobile,
} from "./lib/home-hero-work-utils";
import { criarDesktopHeroPosterStyle } from "./lib/home-cover-hero-style-utils";
import {
  criarDecoracaoHomeStyle,
  criarMobileHeroFrameBackground,
  criarMobileHeroImageLayerStyle,
  heroStyle,
} from "./lib/home-hero-visual-style-utils";
import { useNotificacoes } from "../components/NotificacoesProvider";
import { normalizarTexto } from "../lib/utils";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../lib/historietasTheme";
import { ehClassificacao18 } from "../lib/historietasAdultContent";

type CapituloLocal = {
  id: string;
  titulo: string;
  texto: string;
  curtiu: boolean;
  salvo: boolean;
  comentario: string;
  criadoEm: string;
  lido: boolean;
  lidoEm: string;
  publicado?: boolean;
};

type Obra = {
  id?: string;
  titulo: string;
  autor: string;
  autorId?: string;
  genero: string;
  classificacaoIndicativa: string;
  status: string;
  views: string;
  likes: string;
  comentarios: string;
  link: string;
  disponivel: boolean;
  slug: string;
  formato: string;
  sinopse: string;
  tags: string[];
  capa?: string;
  capaUrl?: string;
  cover?: string;
  imagem?: string;
  capitulos?: CapituloLocal[];
};

type ObraLocal = {
  id: string;
  titulo: string;
  autor: string;
  autorId?: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  sinopse: string;
  tags: string[];
  capa: string;
  capaNome: string;
  arquivoObra?: unknown;
  publicado: boolean;
  capitulos: CapituloLocal[];
  criadaEm: string;
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  progressoLeitura: number;
  visualizacoes: number;
  totalCurtidas: number;
  totalComentarios: number;
  slug: string;
  link: string;
};

const OBRAS_CATALOGO_HOME: Obra[] = [];

const HERO_INICIAL_HOME = {
  titulo: "DESCUBRA NOVAS HISTÓRIAS",
  autor: "HISTORIETAS",
  genero: "Catálogo em formação",
  classificacaoIndicativa: "Leitores",
  sinopse:
    "O HISTORIETAS está formando seu catálogo inicial. Explore obras publicadas, acompanhe autores e publique sua história quando quiser.",
  status: "Catálogo aberto",
  slug: "inicio",
  formato: "Leitura online",
  tags: ["leitura", "autores", "histórias"],
  views: "",
  likes: "",
  comentarios: "",
  disponivel: false,
  link: "/explorar",
} as Obra & { link: string };

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
    if (!termoBusca) {
      return obrasPublicadas
        .slice(0, 6)
        .map((obra) => criarObraHeroLocalHome(obra));
    }

    return obrasPublicadas
      .map((obra, ordem) => {
        const titulo = normalizarTexto(obra.titulo);
        const autor = normalizarTexto(obra.autor);
        const genero = normalizarTexto(formatarGeneroHome(obra.genero));
        const tags = obra.tags.map((tag) => normalizarTexto(tag));
        const textoCompleto = normalizarTexto(
          [
            obra.titulo,
            obra.autor,
            obra.genero,
            formatarGeneroHome(obra.genero),
            obra.formato,
            obra.classificacaoIndicativa,
            obra.sinopse,
            ...obra.tags,
            ...obra.capitulos.map((capitulo) => capitulo.titulo),
          ].join(" ")
        );

        let relevancia = -1;

        if (titulo.startsWith(termoBusca)) {
          relevancia = 0;
        } else if (titulo.includes(termoBusca)) {
          relevancia = 1;
        } else if (autor.startsWith(termoBusca)) {
          relevancia = 2;
        } else if (
          genero.startsWith(termoBusca) ||
          tags.some((tag) => tag.startsWith(termoBusca))
        ) {
          relevancia = 3;
        } else if (textoCompleto.includes(termoBusca)) {
          relevancia = 4;
        }

        return {
          obra,
          ordem,
          relevancia,
        };
      })
      .filter((resultado) => resultado.relevancia >= 0)
      .sort((resultadoA, resultadoB) => {
        return (
          resultadoA.relevancia - resultadoB.relevancia ||
          resultadoA.ordem - resultadoB.ordem
        );
      })
      .slice(0, 6)
      .map(({ obra }) => criarObraHeroLocalHome(obra));
  }, [obrasPublicadas, termoBusca]);

  const { heroIndex, setHeroIndex } = useHomeHeroCarousel(
    termoBusca,
    obrasHero.length,
  );

  const usandoHeroInicial = obrasHero.length === 0;
  const heroObra = obrasHero[heroIndex] || obrasHero[0] || HERO_INICIAL_HOME;
  const heroObraHref = usandoHeroInicial ? "/explorar" : criarHrefObraCatalogoHome(heroObra);
  const heroTemImagem = Boolean(!usandoHeroInicial && obterImagemObraCatalogo(heroObra));
  const heroFavoritoId = usandoHeroInicial ? "" : obterIdentificadorFavoritoHome(heroObra);
  const heroTotalCapitulos = usandoHeroInicial
    ? 0
    : obterTotalCapitulosObraCatalogoHome(heroObra);
  const desktopHeroTemArquivo = Boolean(
    !usandoHeroInicial && obraCatalogoTemArquivoAnexadoHome(heroObra),
  );
  const desktopHeroTotalConteudo = compactarNumeroHome(
    desktopHeroTemArquivo ? 1 : heroTotalCapitulos,
  );
  const metricasHeroHome = [
    { icone: "👁️", valor: heroObra.views || "0" },
    { icone: "❤️", valor: heroObra.likes || "0", destaque: true },
    { icone: "💬", valor: heroObra.comentarios || "0" },
  ];
  const desktopMetricasHeroHome = [
    ...metricasHeroHome,
    {
      icone: desktopHeroTemArquivo ? "📄" : "📚",
      valor: desktopHeroTotalConteudo,
    },
  ];
  const heroEstaSalvo = Boolean(
    usuarioLogado &&
      heroObra &&
      heroFavoritoId &&
      colecaoTemIdentificadorHome(
        criarIdentificadoresObraCatalogoHome(heroObra),
        obrasFavoritas
      )
  );

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

      <header className="historietas-home-header" style={isDesktop ? desktopNavStyle : mobileNavStyle}>
        {isDesktop && (
          <div style={desktopNavInnerStyle}>
            <Link
              href="/"
              className="historietas-home-logo"
              style={desktopLogoStyle}
              aria-label="Historietas"
            >
              <span className="historietas-home-logo-mark" style={desktopLogoMarkStyle}>H</span>
              <span className="historietas-home-logo-text" style={desktopLogoTextStyle}>istorietas</span>
            </Link>

            <div
              className="historietas-home-desktop-links"
              style={desktopMenuStyle}
              role="navigation"
              aria-label="Navegação principal"
            >
              <Link href="/" className="historietas-home-desktop-link" style={desktopActiveLinkStyle}>
                Início
              </Link>

              <Link href="/explorar" className="historietas-home-desktop-link" style={desktopLinkStyle}>
                Explorar
              </Link>

              <Link href="/publicar" className="historietas-home-desktop-link" style={desktopLinkStyle}>
                Publicar
              </Link>

              <Link href="/comunidade" className="historietas-home-desktop-link" style={desktopLinkStyle}>
                Comunidade
              </Link>

              <Link href="/seguindo" className="historietas-home-desktop-link" style={desktopLinkStyle}>
                Seguindo
              </Link>

            </div>

            <div style={desktopInlineSearchAreaStyle}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                style={desktopSearchIconStyle}
              >
                <circle cx="10.75" cy="10.75" r="6.75" stroke="currentColor" strokeWidth="2" />
                <path d="M16 16L20.25 20.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>

              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                aria-label="Buscar obras, autor, gênero..."
                placeholder="Buscar obras, autor, gênero..."
                className="historietas-home-header-search-input"
                style={desktopInputStyle}
              />
            </div>

            <div className="historietas-home-desktop-actions" style={desktopHeaderActionsStyle}>
              <Link
                href="/notificacoes"
                className="historietas-home-desktop-icon-link"
                style={desktopHeaderIconLinkStyle}
                aria-label={
                  notificacoesNaoLidas > 0
                    ? `Notificações: ${notificacoesNaoLidas} novas`
                    : "Notificações"
                }
                title="Notificações"
              >
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M6.75 9.75C6.75 6.85 8.85 4.5 12 4.5C15.15 4.5 17.25 6.85 17.25 9.75V13.1L18.7 15.7H5.3L6.75 13.1V9.75Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path d="M9.75 18C10.15 18.8 10.9 19.25 12 19.25C13.1 19.25 13.85 18.8 14.25 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>

                {usuarioLogado && notificacoesNaoLidas > 0 ? (
                  <span style={desktopNotificationCountBadgeStyle}>
                    {notificacoesNaoLidas > 99 ? "99+" : notificacoesNaoLidas}
                  </span>
                ) : null}
              </Link>

              <Link
                href="/configuracoes"
                className="historietas-home-desktop-icon-link"
                style={desktopHeaderIconLinkStyle}
                aria-label="Configurações"
                title="Configurações"
              >
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M9.8 4.6L10.35 3H13.65L14.2 4.6L15.65 5.2L17.15 4.45L19.5 6.8L18.75 8.3L19.35 9.75L21 10.35V13.65L19.35 14.25L18.75 15.7L19.5 17.2L17.15 19.55L15.65 18.8L14.2 19.4L13.65 21H10.35L9.8 19.4L8.35 18.8L6.85 19.55L4.5 17.2L5.25 15.7L4.65 14.25L3 13.65V10.35L4.65 9.75L5.25 8.3L4.5 6.8L6.85 4.45L8.35 5.2L9.8 4.6Z"
                    stroke="currentColor"
                    strokeWidth="1.55"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
                </svg>
              </Link>

              <Link
                href="/perfil-autor"
                className="historietas-home-desktop-profile-link"
                style={desktopProfileLinkStyle}
                aria-label="Abrir perfil"
                title="Perfil"
              >
                <span style={desktopProfileAvatarStyle}>
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="8.25" r="3.25" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M5.75 19C6.3 15.75 8.6 14 12 14C15.4 14 17.7 15.75 18.25 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        )}

        {!isDesktop && (
          <div style={navInnerStyle}>
            <div style={navTopRowStyle}>
              <Link href="/" className="historietas-home-logo" style={logoStyle} aria-label="Historietas">
                <span className="historietas-home-logo-mark" style={logoMarkStyle}>H</span>
                <span className="historietas-home-logo-text" style={logoTextStyle}>istorietas</span>
              </Link>

              {buscaMobileAberta ? (
                <div className="historietas-home-mobile-search-area" style={mobileHeaderSearchAreaStyle}>
                  <input
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                    aria-label="Buscar..."
                    placeholder="Buscar..."
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={90}
                    className="historietas-home-header-search-input"
                    style={mobileHeaderSearchInputStyle}
                    type="text"
                    autoFocus
                  />

                </div>
              ) : null}

              <div className="historietas-home-header-actions" style={navIconsStyle}>
                <button
                  type="button"
                  onClick={() => setBuscaMobileAberta((aberta) => !aberta)}
                  aria-label={buscaMobileAberta ? "Fechar busca" : "Abrir busca"}
                  aria-pressed={buscaMobileAberta}
                  className="historietas-home-search-toggle"
                  style={
                    buscaMobileAberta
                      ? mobileSearchToggleActiveStyle
                      : mobileSearchToggleStyle
                  }
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
              </div>
            </div>
          </div>
        )}
      </header>

      <div style={isDesktop ? desktopContainerStyle : containerStyle}>
        <section
          style={
            isDesktop
              ? {
                  ...heroStyle,
                  ...desktopHeroStyle,
                }
              : criarMobileHeroFrameBackground()
          }
        >
          {!isDesktop && (
            <div style={criarMobileHeroImageLayerStyle(heroObra)} aria-hidden="true" />
          )}

          {!isDesktop && (
            <div
              style={
                heroTemImagem
                  ? mobileHeroImageGlowStyle
                  : heroGlowStyle
              }
            />
          )}

          {!isDesktop && !heroTemImagem && (
            <div style={heroDecorationLayerStyle} aria-hidden="true">
              {["✦", "◌", "✧", "◇"].map((decoracao, index) => (
                <span key={`hero-${decoracao}-${index}`} style={criarDecoracaoHomeStyle()}>
                  {decoracao}
                </span>
              ))}
            </div>
          )}

          {isDesktop ? (
            <div style={desktopHeroShellStyle}>
              <div style={desktopHeroPosterFrameStyle}>
                <Link
                  href={heroObraHref}
                  style={criarDesktopHeroPosterStyle(heroObra)}
                  aria-label={`Abrir ${heroObra.titulo}`}
                >
                  {!heroTemImagem && (
                    <>
                      <span style={desktopHeroPosterGlowStyle} aria-hidden="true" />
                      <strong style={desktopHeroPosterTitleStyle}>{heroObra.titulo}</strong>
                      <span style={desktopHeroPosterStatusStyle}>
                        {heroObra.status || "Obra em destaque"}
                      </span>
                    </>
                  )}
                </Link>
              </div>

              <div style={desktopHeroContentStyle}>
                <span style={desktopHeroKickerStyle}>
                  {usandoHeroInicial ? "Conheça o Historietas" : "Em destaque"}
                </span>

                <h1 className="historietas-home-hero-title" style={desktopHeroTitleStyle}>
                  {heroObra.titulo}
                </h1>

                <div style={desktopHeroMetaStyle}>
                  <span style={desktopHeroAuthorStyle}>
                    Por {heroObra.autor || "Autor não informado"}
                  </span>
                  <span style={desktopHeroMetaDividerStyle} aria-hidden="true" />
                  <span style={desktopHeroGenreStyle}>
                    {traduzirGeneroHome(heroObra.genero, language)}
                  </span>
                  <span style={desktopHeroMetaDividerStyle} aria-hidden="true" />
                  <span style={desktopHeroClassificationStyle}>
                    {traduzirClassificacaoHome(heroObra.classificacaoIndicativa, language)}
                  </span>
                </div>

                <p style={desktopHeroDescriptionStyle}>
                  {heroObra.sinopse || "Nenhuma sinopse informada."}
                </p>

                <div style={usandoHeroInicial ? desktopHeroInitialButtonsStyle : desktopHeroButtonsStyle}>
                  <Link href={heroObraHref} style={desktopPrimaryButtonStyle}>
                    {usandoHeroInicial ? "Explorar obras" : "Ler agora"}
                  </Link>

                  {usandoHeroInicial && (
                    <Link href="/publicar" style={desktopSecondaryButtonStyle}>
                      Publicar obra
                    </Link>
                  )}

                  {!usandoHeroInicial && (
                    <button
                      type="button"
                      onClick={alternarHeroFavorito}
                      aria-pressed={heroEstaSalvo}
                      style={desktopHeroSaveButtonStyle}
                    >
                      {heroEstaSalvo ? "Salvo" : "Salvar"}
                    </button>
                  )}
                </div>

                {avisoLogin && <p style={desktopHeroLoginNoticeStyle}>{avisoLogin}</p>}

                {!usandoHeroInicial && (
                  <div style={desktopHeroFooterStyle}>
                    <div style={desktopHeroStatsStyle}>
                      {desktopMetricasHeroHome.map((metrica) => (
                        <span
                          key={`hero-desktop-${metrica.icone}`}
                          style={desktopHeroStatItemStyle}
                        >
                          <span
                            style={
                              metrica.destaque
                                ? cardStatHeartIconStyle
                                : desktopHeroStatIconStyle
                            }
                          >
                            {metrica.icone}
                          </span>
                          <span style={desktopHeroStatValueStyle}>
                            {metrica.valor}
                          </span>
                        </span>
                      ))}
                    </div>

                    <HomeHeroCarouselDots
                      obras={obrasHero}
                      activeIndex={heroIndex}
                      onSelect={setHeroIndex}
                      isDesktop={true}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={mobileHeroContentStyle}>
              <div style={mobileHeroMetaStyle}>
                <span style={mobileHeroPillStyle}>✦ {traduzirGeneroHome(heroObra.genero, language)}</span>
                <span style={mobileHeroPillStyle}>◆ {traduzirClassificacaoHome(heroObra.classificacaoIndicativa, language)}</span>
              </div>

              <div style={mobileHeroTextBlockStyle}>
                <h1
                  className="historietas-home-hero-title"
                  style={mobileHeroTitleStyle}
                >
                  {heroObra.titulo}
                </h1>

                <p style={mobileHeroDescriptionStyle}>
                  {formatarSinopseHeroMobile(heroObra.sinopse)}
                </p>
              </div>

              <div style={usandoHeroInicial ? mobileHeroInitialButtonsStyle : mobileHeroButtonsStyle}>
                <Link href={heroObraHref} style={primaryButtonStyle}>
                  {usandoHeroInicial ? "Explorar obras" : "Ver obra"}
                </Link>

                {usandoHeroInicial && (
                  <Link href="/publicar" style={secondaryButtonStyle}>
                    Publicar obra
                  </Link>
                )}

                {!usandoHeroInicial && (
                  <button
                  type="button"
                  onClick={alternarHeroFavorito}
                  aria-pressed={heroEstaSalvo}
                  style={heroSaveButtonStyle}
                >
                    {heroEstaSalvo ? "Salvo" : "Salvar"}
                  </button>
                )}
              </div>

              {avisoLogin && <p style={heroLoginNoticeStyle}>{avisoLogin}</p>}

              {!usandoHeroInicial && (
                <div style={mobileHeroFooterStyle}>
                  <div style={mobileHeroStatsStyle}>
                    {metricasHeroHome.map((metrica) => (
                      <span
                        key={`hero-mobile-${metrica.icone}`}
                        style={mobileHeroStatItemStyle}
                      >
                        <span
                          style={
                            metrica.destaque
                              ? cardStatHeartIconStyle
                              : mobileHeroStatIconStyle
                          }
                        >
                          {metrica.icone}
                        </span>
                        <span style={mobileHeroStatValueStyle}>
                          {metrica.valor}
                        </span>
                      </span>
                    ))}
                  </div>

                  <HomeHeroCarouselDots
                    obras={obrasHero}
                    activeIndex={heroIndex}
                    onSelect={setHeroIndex}
                    isDesktop={false}
                  />
                </div>
              )}
            </div>
          )}
        </section>

        <section style={isDesktop ? desktopSummaryStripStyle : summaryStripStyle} aria-label="Atalhos principais">
          <Link href="/em-breve" style={summaryItemStyle}>
            <strong style={summaryNumberStyle}>Em breve</strong>
          </Link>

          <span style={summaryDividerLineStyle} aria-hidden="true" />

          <Link href="/em-alta" style={summaryItemStyle}>
            <strong style={summaryNumberStyle}>Em Alta</strong>
          </Link>
        </section>

        {homeSemObrasReais && <HomeEmptyState />}

        {obrasParaContinuar.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <HomeSectionHeader
              title="Continuar lendo"
              subtitle="Continue do ponto em que parou."
            />

            <HomeCarouselRow isDesktop={isDesktop}>
              {obrasParaContinuar.map((obra) => (
                <MobileObraLocalCard
                  key={`continuar-${obra.id}`}
                  obra={obra}
                  tipo="continuar"
                  isDesktop={isDesktop}
                />
              ))}
            </HomeCarouselRow>
          </section>
        )}

        {totalMinhaListaHome > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <HomeSectionHeader
              title="Minha lista"
              subtitle={`${totalMinhaListaHome} na lista para acessar rápido.`}
            />

            <HomeCarouselRow isDesktop={isDesktop}>
              {obrasMinhaLista.map((obra) => (
                <MobileObraLocalCard
                  key={`minha-lista-${obra.id}`}
                  obra={obra}
                  tipo="catalogo"
                  isDesktop={isDesktop}
                />
              ))}

              {obrasCatalogoMinhaLista.map((obra) => (
                <MobileObraCard
                  key={`minha-lista-catalogo-${obra.titulo}`}
                  obra={obra}
                  isDesktop={isDesktop}
                />
              ))}
            </HomeCarouselRow>
          </section>
        )}

        {autoresParaConhecer.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <HomeSectionHeader
              title="Autores para conhecer"
              subtitle="Perfis que dão vida ao catálogo."
            />

            <HomeCarouselRow isDesktop={isDesktop} variant="autor">
              {autoresParaConhecer.map((autor) => (
                <MobileAutorCard
                  key={`autor-${autor.chave}`}
                  autor={autor}
                  avaliacao={avaliacoesAutoresHome[autor.autorId]}
                  isDesktop={isDesktop}
                />
              ))}
            </HomeCarouselRow>
          </section>
        )}

        {totalRecomendacoesHome > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <HomeSectionHeader
              title="Recomendações para você"
              subtitle={
                temasRecomendadosUsuario.size > 0
                  ? "Obras parecidas com o que você lê ou salvou."
                  : "Sugestões para começar sua próxima leitura."
              }
            />

            <HomeCarouselRow isDesktop={isDesktop}>
              {obrasRecomendadas.map((obra) => (
                <MobileObraLocalCard
                  key={`recomendadas-${obra.id}`}
                  obra={obra}
                  tipo="catalogo"
                  isDesktop={isDesktop}
                />
              ))}

              {obrasCatalogoRecomendadas.map((obra) => (
                <MobileObraCard
                  key={`recomendadas-catalogo-${obra.titulo}`}
                  obra={obra}
                  isDesktop={isDesktop}
                />
              ))}
            </HomeCarouselRow>
          </section>
        )}

        {obrasPublicadasFiltradas.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <HomeSectionHeader
              title="Publicações recentes"
              subtitle={`${obrasPublicadasFiltradas.length} ${
                obrasPublicadasFiltradas.length === 1
                  ? "obra publicada"
                  : "obras publicadas"
              }`}
            />

            <HomeCarouselRow isDesktop={isDesktop}>
              {obrasPublicadasFiltradas.map((obra) => (
                <MobileObraLocalCard
                  key={obra.id}
                  obra={obra}
                  tipo="catalogo"
                  isDesktop={isDesktop}
                />
              ))}
            </HomeCarouselRow>
          </section>
        )}

        {obrasComNovosCapitulos.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <HomeSectionHeader
              title="Novos capítulos"
              subtitle="Capítulos novos para acompanhar sem perder o ritmo."
            />

            <HomeCarouselRow isDesktop={isDesktop}>
              {obrasComNovosCapitulos.map((obra) => (
                <MobileObraLocalCard
                  key={`novos-capitulos-${obra.id}`}
                  obra={obra}
                  tipo="novo-capitulo"
                  isDesktop={isDesktop}
                />
              ))}
            </HomeCarouselRow>
          </section>
        )}

        {obrasMaisCurtidas.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <HomeSectionHeader
              title="Mais curtidas"
              subtitle="Na lista da comunidade nesta fase."
            />

            <HomeCarouselRow isDesktop={isDesktop}>
              {obrasMaisCurtidas.map((obra) => (
                <MobileObraLocalCard
                  key={`mais-curtidas-${obra.id}`}
                  obra={obra}
                  tipo="catalogo"
                  isDesktop={isDesktop}
                />
              ))}
            </HomeCarouselRow>
          </section>
        )}

        {obrasMaisComentadas.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <HomeSectionHeader
              title="Mais comentadas"
              subtitle="Histórias que estão puxando conversa."
            />

            <HomeCarouselRow isDesktop={isDesktop}>
              {obrasMaisComentadas.map((obra) => (
                <MobileObraLocalCard
                  key={`mais-comentadas-${obra.id}`}
                  obra={obra}
                  tipo="catalogo"
                  isDesktop={isDesktop}
                />
              ))}
            </HomeCarouselRow>
          </section>
        )}

        {obrasComArquivoAnexado.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <HomeSectionHeader
              title="Extras e arquivos"
              subtitle="Histórias com material extra para abrir depois."
            />

            <HomeCarouselRow isDesktop={isDesktop}>
              {obrasComArquivoAnexado.map((obra) => (
                <MobileObraLocalCard
                  key={`arquivo-anexado-${obra.id}`}
                  obra={obra}
                  tipo="catalogo"
                  isDesktop={isDesktop}
                />
              ))}
            </HomeCarouselRow>
          </section>
        )}

        {leiturasRapidas.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <HomeSectionHeader
              title="Para ler agora"
              subtitle="Obras curtas para entrar rápido no universo."
            />

            <HomeCarouselRow isDesktop={isDesktop}>
              {leiturasRapidas.map((obra) => (
                <MobileObraLocalCard
                  key={`leituras-rapidas-${obra.id}`}
                  obra={obra}
                  tipo="catalogo"
                  isDesktop={isDesktop}
                />
              ))}
            </HomeCarouselRow>
          </section>
        )}

        {(obrasFiltradas.length > 0 || Boolean(termoBusca)) && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <HomeSectionHeader title="Catálogo" subtitle="Obras reais publicadas na plataforma." />

            {obrasFiltradas.length > 0 ? (
              <HomeCarouselRow isDesktop={isDesktop}>
                {obrasFiltradas.map((obra) => (
                  <MobileObraCard key={obra.titulo} obra={obra} isDesktop={isDesktop} />
                ))}
              </HomeCarouselRow>
            ) : (
              <EmptySearch />
            )}
          </section>
        )}

        {obrasFantasiaPoderes.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <HomeSectionHeader
              title="Fantasia e poderes"
              subtitle="Mundos, poderes e mistérios para explorar."
            />

            <HomeCarouselRow isDesktop={isDesktop}>
              {obrasFantasiaPoderes.map((obra) => (
                <MobileObraCard key={`fantasia-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
              ))}
            </HomeCarouselRow>
          </section>
        )}

        {obrasTerrorSuspense.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <HomeSectionHeader
              title="Terror e suspense"
              subtitle="Atmosfera sombria, tensão e mistério."
            />

            <HomeCarouselRow isDesktop={isDesktop}>
              {obrasTerrorSuspense.map((obra) => (
                <MobileObraCard key={`terror-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
              ))}
            </HomeCarouselRow>
          </section>
        )}

        {obrasRomanceDrama.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <HomeSectionHeader
              title="Romance e drama"
              subtitle="Relações intensas e escolhas difíceis."
            />

            <HomeCarouselRow isDesktop={isDesktop}>
              {obrasRomanceDrama.map((obra) => (
                <MobileObraCard key={`romance-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
              ))}
            </HomeCarouselRow>
          </section>
        )}

        {obrasAcaoRivalidades.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <HomeSectionHeader
              title="Ação e rivalidades"
              subtitle="Conflitos, disputas e personagens intensos."
            />

            <HomeCarouselRow isDesktop={isDesktop}>
              {obrasAcaoRivalidades.map((obra) => (
                <MobileObraCard key={`acao-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
              ))}
            </HomeCarouselRow>
          </section>
        )}

        {obrasScifiCodigo.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <HomeSectionHeader
              title="Sci-fi e códigos"
              subtitle="Futuro, sistemas e universos alternativos."
            />

            <HomeCarouselRow isDesktop={isDesktop}>
              {obrasScifiCodigo.map((obra) => (
                <MobileObraCard key={`scifi-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
              ))}
            </HomeCarouselRow>
          </section>
        )}

        {obrasEmBreve.length > 0 && (
          <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
            <HomeSectionHeader
              title="Em breve na Historietas"
              subtitle="Obras chegando ao catálogo em breve."
            />

            <HomeCarouselRow isDesktop={isDesktop}>
              {obrasEmBreve.map((obra) => (
                <MobileObraCard key={`em-breve-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
              ))}
            </HomeCarouselRow>
          </section>
        )}

        {obrasFiltradas.length > 0 && (
          <section style={isDesktop ? desktopLastSectionStyle : lastSectionStyle}>
            <HomeSectionHeader
              title="Obras em destaque"
              subtitle="Obras reais disponíveis para leitura."
            />

            <HomeCarouselRow isDesktop={isDesktop}>
              {obrasFiltradas.map((obra) => (
                <MobileObraCard key={`destaque-${obra.titulo}`} obra={obra} isDesktop={isDesktop} />
              ))}
            </HomeCarouselRow>
          </section>
        )}
      </div>
    </main>
  );
}

const desktopHeroStyle: CSSProperties = {
  marginTop: "-4px",
  minHeight: 0,
  borderRadius: 0,
  border: "none",
  boxShadow: "none",
  background: "transparent",
  overflow: "visible",
};

const desktopHeroShellStyle: CSSProperties = {
  position: "relative",
  zIndex: 2,
  width: "100%",
  display: "grid",
  gridTemplateColumns: "minmax(350px, 1.03fr) minmax(0, 0.97fr)",
  alignItems: "center",
  gap: "clamp(34px, 4.5vw, 82px)",
  minHeight: "clamp(440px, 40vw, 590px)",
  padding: "clamp(18px, 2vw, 32px) 0",
  boxSizing: "border-box",
};

const desktopHeroPosterFrameStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  maxWidth: "650px",
  height: "clamp(400px, 35vw, 530px)",
  minHeight: "400px",
  justifySelf: "start",
  padding: "5px",
  borderRadius: "28px",
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.08)",
  background:
    "linear-gradient(145deg, #050505 0%, #0B0B0D 58%, #000000 100%)",
  boxShadow:
    "0 24px 64px rgba(0,0,0,0.26), inset 0 0 0 1px rgba(255,255,255,0.025)",
  boxSizing: "border-box",
};

const desktopHeroPosterGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, rgba(4, 0, 10, 0.02) 0%, rgba(4, 0, 10, 0.54) 100%)",
  pointerEvents: "none",
};




const desktopHeroPosterTitleStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  color: "#FFFFFF",
  fontSize: "28px",
  lineHeight: 1.06,
  ...listaWorkTitleTypographyStyle,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const desktopHeroPosterStatusStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "fit-content",
  maxWidth: "100%",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "13px",
  fontWeight: 900,
  ...safeTextStyle,
};


const heroGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, rgba(4, 0, 10, 0.18) 0%, #000000 100%)",
};


const mobileHeroImageGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "transparent",
};

const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  minHeight: "min(460px, 68vh)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  gap: "15px",
  padding: "24px 16px 22px",
  boxSizing: "border-box",
  maxWidth: "100%",
  minWidth: 0,
};

const desktopHeroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 3,
  width: "100%",
  maxWidth: "650px",
  minWidth: 0,
  justifySelf: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "center",
  gap: "15px",
  padding: "clamp(8px, 1vw, 18px) clamp(12px, 1.5vw, 28px)",
  textAlign: "left",
  boxSizing: "border-box",
};


const desktopHeroMetaStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
  maxWidth: "100%",
  minWidth: 0,
  color: "#D2D2D5",
  fontSize: "13.5px",
  fontWeight: 650,
  lineHeight: 1.25,
};

const desktopHeroKickerStyle: CSSProperties = {
  color: "#D7D7DA",
  fontSize: "12px",
  fontWeight: 800,
  lineHeight: 1,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  textShadow: "0 2px 12px rgba(0,0,0,0.70)",
};

const desktopHeroAuthorStyle: CSSProperties = {
  color: "#FFFFFF",
  fontWeight: 750,
  textShadow: "0 2px 12px rgba(0,0,0,0.62)",
  ...safeTextStyle,
};

const desktopHeroMetaDividerStyle: CSSProperties = {
  width: "4px",
  height: "4px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.50)",
  flex: "0 0 auto",
};

const desktopHeroGenreStyle: CSSProperties = {
  color: "#D2D2D5",
  textShadow: "0 2px 12px rgba(0,0,0,0.62)",
  ...safeTextStyle,
};

const desktopHeroClassificationStyle: CSSProperties = {
  minHeight: 0,
  padding: 0,
  borderRadius: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-start",
  background: "transparent",
  border: "none",
  color: "#D2D2D5",
  fontSize: "13.5px",
  fontWeight: 650,
  lineHeight: 1.25,
  boxSizing: "border-box",
  textShadow: "0 2px 12px rgba(0,0,0,0.62)",
  ...safeTextStyle,
};


const heroPillStyle: CSSProperties = {
  maxWidth: "100%",
  minHeight: "34px",
  padding: "8px 14px",
  borderRadius: "999px",
  background: "#000000",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  fontSize: "12.5px",
  fontWeight: 950,
  boxShadow: "none",
  textShadow: "0 1px 0 rgba(0,0,0,0.28)",
  ...safeTextStyle,
};

const heroTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(34px, 11vw, 72px)",
  lineHeight: 0.96,
  ...listaWorkTitleTypographyStyle,
  maxWidth: "100%",
  textShadow:
    "0 1px 0 rgba(0,0,0,0.34), 0 2px 12px rgba(0,0,0,0.34)",
  ...safeTextStyle,
};

const desktopHeroTitleStyle: CSSProperties = {
  ...heroTitleStyle,
  width: "100%",
  maxWidth: "700px",
  margin: 0,
  fontSize: "clamp(46px, 5.2vw, 78px)",
  lineHeight: 0.98,
  textAlign: "left",
  color: "#FFFFFF",
  textShadow:
    "0 2px 0 rgba(0,0,0,0.40), 0 8px 28px rgba(0,0,0,0.62)",
};

const heroDescriptionStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "15px",
  ...listaAuthorMetaTypographyStyle,
  lineHeight: 1.55,
  maxWidth: "100%",
  textShadow:
    "0 1px 0 rgba(0,0,0,0.32), 0 2px 10px rgba(0,0,0,0.30)",
  ...safeTextStyle,
};

const desktopHeroDescriptionStyle: CSSProperties = {
  ...heroDescriptionStyle,
  width: "100%",
  maxWidth: "620px",
  minHeight: 0,
  margin: 0,
  color: "#D5D5D8",
  fontSize: "15.5px",
  lineHeight: 1.58,
  display: "-webkit-box",
  WebkitLineClamp: 4,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
  textAlign: "left",
  textShadow: "0 2px 14px rgba(0,0,0,0.74)",
};


const heroButtonsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(138px, 1fr))",
  gap: "10px",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

const mobileHeroButtonsStyle: CSSProperties = {
  ...heroButtonsStyle,
  position: "absolute",
  left: "16px",
  right: "16px",
  bottom: "58px",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  alignSelf: "auto",
  width: "auto",
};

const desktopHeroButtonsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "10px",
  width: "auto",
  maxWidth: "100%",
  marginTop: "5px",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopHeroInitialButtonsStyle: CSSProperties = {
  ...desktopHeroButtonsStyle,
  flexWrap: "wrap",
};

const desktopPrimaryButtonStyle: CSSProperties = {
  minWidth: "164px",
  minHeight: "50px",
  padding: "0 22px",
  borderRadius: "10px",
  border: "1px solid #FFFFFF",
  background: "#FFFFFF",
  color: "#08080A",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "14px",
  fontWeight: 850,
  lineHeight: 1.1,
  textAlign: "center",
  boxSizing: "border-box",
  boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
  cursor: "pointer",
  ...safeTextStyle,
};

const desktopSecondaryButtonStyle: CSSProperties = {
  ...desktopPrimaryButtonStyle,
  minWidth: "154px",
  background: "rgba(10,10,12,0.74)",
  color: "#FFFFFF",
  border: "1px solid rgba(255,255,255,0.34)",
  boxShadow: "none",
};

const desktopHeroSaveButtonStyle: CSSProperties = {
  ...desktopSecondaryButtonStyle,
  minWidth: "140px",
  fontFamily: "inherit",
  appearance: "none",
  WebkitAppearance: "none",
};

const desktopHeroLoginNoticeStyle: CSSProperties = {
  margin: "-2px 0 0",
  color: "#F4F4F5",
  fontSize: "12.5px",
  fontWeight: 700,
  lineHeight: 1.35,
  textShadow: "0 2px 12px rgba(0,0,0,0.72)",
  maxWidth: "100%",
  ...safeTextStyle,
};

const mobileHeroInitialButtonsStyle: CSSProperties = {
  ...mobileHeroButtonsStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  justifyContent: "center",
  justifyItems: "stretch",
};

const primaryButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "50px",
  padding: "0 22px",
  borderRadius: "999px",
  background: "#000000",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "15px",
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,0.08)",
  textAlign: "center",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  boxShadow: "none",
  ...safeTextStyle,
};

const secondaryButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "50px",
  padding: "0 22px",
  borderRadius: "999px",
  background: "#000000",
  color: "#FFFFFF",
  textDecoration: "none",
  fontFamily: "inherit",
  fontSize: "15px",
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,0.08)",
  appearance: "none",
  cursor: "pointer",
  textAlign: "center",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  boxShadow: "none",
  ...safeTextStyle,
};

const heroSaveButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  fontFamily: "inherit",
  appearance: "none",
  cursor: "pointer",
};

const heroLoginNoticeStyle: CSSProperties = {
  margin: "2px 0 0",
  color: "#DDD6FE",
  fontSize: "13px",
  fontWeight: 800,
  lineHeight: 1.35,
  maxWidth: "100%",
  ...safeTextStyle,
};

const desktopHeroFooterStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "flex-start",
  gap: "16px",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  marginTop: "3px",
};

const desktopHeroStatsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "22px",
  color: "#E4E4E7",
  fontSize: "12.5px",
  fontWeight: 750,
  width: "auto",
  maxWidth: "100%",
  minWidth: 0,
  flexWrap: "wrap",
};

const desktopHeroStatItemStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "6px",
  minWidth: 0,
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: 0,
  boxSizing: "border-box",
  whiteSpace: "nowrap",
  textShadow: "0 2px 12px rgba(0,0,0,0.76)",
  ...safeTextStyle,
};

const desktopHeroStatIconStyle: CSSProperties = {
  lineHeight: 1,
  flexShrink: 0,
};


const desktopHeroStatValueStyle: CSSProperties = {
  display: "inline-block",
  minWidth: 0,
  overflow: "visible",
  textOverflow: "clip",
  whiteSpace: "nowrap",
};

const mobileHeroContentStyle: CSSProperties = {
  ...heroContentStyle,
  display: "block",
  minHeight: "min(460px, 68vh)",
  padding: "22px 16px 18px",
  position: "relative",
};

const mobileHeroMetaStyle: CSSProperties = {
  position: "absolute",
  top: "22px",
  left: "16px",
  right: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "8px",
  flexWrap: "wrap",
  maxWidth: "calc(100% - 32px)",
  minWidth: 0,
};

const mobileHeroPillStyle: CSSProperties = {
  ...heroPillStyle,
  padding: "8px 13px",
  background: "#000000",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  boxShadow: "none",
  textShadow: "0 1px 0 rgba(0,0,0,0.28)",
};

const mobileHeroTextBlockStyle: CSSProperties = {
  position: "absolute",
  left: "16px",
  right: "16px",
  bottom: "120px",
  display: "grid",
  justifyItems: "center",
  gap: "4px",
  textAlign: "center",
  width: "auto",
  maxWidth: "none",
  minWidth: 0,
};

const mobileHeroTitleStyle: CSSProperties = {
  ...heroTitleStyle,
  width: "100%",
  textAlign: "center",
  fontSize: "clamp(34px, 10.2vw, 60px)",
  lineHeight: 0.96,
  textShadow:
    "0 1px 0 rgba(0,0,0,0.34), 0 2px 12px rgba(0,0,0,0.34)",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const mobileHeroDescriptionStyle: CSSProperties = {
  ...heroDescriptionStyle,
  justifySelf: "center",
  textAlign: "center",
  color: "#FFFFFF",
  fontSize: "14px",
  lineHeight: 1.5,
  textShadow:
    "0 1px 0 rgba(0,0,0,0.32), 0 2px 10px rgba(0,0,0,0.30)",
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  width: "100%",
  maxWidth: "560px",
  overflow: "hidden",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
  hyphens: "auto",
};

const mobileHeroFooterStyle: CSSProperties = {
  position: "absolute",
  left: "16px",
  right: "16px",
  bottom: "18px",
  display: "grid",
  gridTemplateColumns: "156px minmax(0, 1fr)",
  alignSelf: "auto",
  alignItems: "center",
  gap: "8px",
  width: "auto",
  maxWidth: "none",
  minWidth: 0,
};

const mobileHeroStatsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  alignItems: "center",
  justifyContent: "stretch",
  columnGap: "5px",
  color: "#FFFFFF",
  fontSize: "11.5px",
  fontWeight: 900,
  textShadow: "0 2px 12px rgba(0,0,0,0.78)",
  width: "156px",
  maxWidth: "100%",
  minWidth: "156px",
  whiteSpace: "nowrap",
};

const mobileHeroStatItemStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "3px",
  minWidth: 0,
  width: "100%",
  whiteSpace: "nowrap",
  textShadow: "0 1px 0 rgba(0,0,0,0.28)",
};

const mobileHeroStatIconStyle: CSSProperties = {
  lineHeight: 1,
  flexShrink: 0,
};


const mobileHeroStatValueStyle: CSSProperties = {
  display: "inline-block",
  minWidth: 0,
  overflow: "visible",
  textOverflow: "clip",
  whiteSpace: "nowrap",
};

const summaryStripStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
  alignItems: "center",
  gap: "0",
  marginTop: "14px",
  padding: "0",
  borderRadius: "0",
  background: "transparent",
  border: "0",
  boxShadow: "none",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
  overflow: "visible",
};

const desktopSummaryStripStyle: CSSProperties = {
  ...summaryStripStyle,
  gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
  gap: "0",
  padding: "0",
  borderRadius: "0",
};

const summaryItemStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "42px",
  padding: "8px 10px",
  maxWidth: "100%",
  minWidth: 0,
  borderRadius: "0",
  background: "transparent",
  border: "0",
  textDecoration: "none",
  color: "#FFFFFF",
  boxSizing: "border-box",
};

const summaryDividerLineStyle: CSSProperties = {
  width: "1px",
  height: "30px",
  alignSelf: "center",
  justifySelf: "center",
  background: "rgba(255,255,255,0.20)",
  borderRadius: "999px",
};

const summaryNumberStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "17px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};


const sectionStyle: CSSProperties = {
  marginTop: "24px",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

const lastSectionStyle: CSSProperties = {
  marginTop: "24px",
  paddingBottom: "22px",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopSectionStyle: CSSProperties = {
  ...sectionStyle,
  marginTop: "30px",
};

const desktopLastSectionStyle: CSSProperties = {
  ...lastSectionStyle,
  marginTop: "30px",
  paddingBottom: "76px",
};
