"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Children, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import { supabase } from "../../lib/supabase/client";
import { criarSlugBase, normalizarTexto } from "../../lib/utils";
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
  criarPublishedCardTemaStyle,
  criarDesktopPublishedCardTemaStyle,
  criarPublishedCoverTemaStyle,
  criarDesktopPublishedCoverStyle,
  criarProgressTrackStyle,
  criarProgressBarStyle,
  criarCardPrimaryActionStyle,
  sectionStyle,
  sectionHeaderStyle,
  sectionHeaderSpacerStyle,
  sectionMoreLinkStyle,
  desktopSectionMoreLinkStyle,
  sectionMoreChevronStyle,
  sectionTitleStyle,
  obrasExplorarCarouselStyle,
  desktopObrasExplorarCarouselStyle,
  explorarObraCarouselItemStyle,
  desktopExplorarObraCarouselItemStyle,
  autoresExplorarCarouselStyle,
  desktopAutoresExplorarCarouselStyle,
  explorarCarouselShellStyle,
  explorarCarouselArrowLeftStyle,
  explorarCarouselArrowRightStyle,
  explorarCarouselArrowLeftIconStyle,
  explorarCarouselArrowRightIconStyle,
  autoresExplorarGridStyle,
  desktopAutoresExplorarGridStyle,
  autorExplorarCardStyle,
  desktopAutorExplorarCardStyle,
  autorExplorarGridCardStyle,
  desktopAutorExplorarGridCardStyle,
  autorExplorarCardGlowStyle,
  autorExplorarTopStyle,
  autorExplorarAvatarShellStyle,
  autorExplorarAvatarImageStyle,
  autorExplorarAvatarInitialsStyle,
  autorExplorarIdentityStyle,
  autorExplorarNameStyle,
  autorExplorarBioStyle,
  autorExplorarMetaRowStyle,
  autorExplorarMetaBadgeStyle,
  autorExplorarRatingStarStyle,
  autorExplorarBottomStyle,
  autorExplorarGenresStyle,
  autorExplorarGenreBadgeStyle,
  autorExplorarProfileButtonStyle,
  gridStyle,
  cardTopStyle,
  publishedTitleStyle,
  statusRowStyle,
  draftStatusStyle,
  formatBadgeStyle,
  classificationBadgeStyle,
  authorLinkStyle,
  publishedInfoStyle,
  desktopPublishedInfoStyle,
  desktopPublishedSynopsisStyle,
  statsStyle,
  metricItemStyle,
  metricIconStyle,
  heartMetricIconStyle,
  progressCompactStyle,
  progressTextStyle,
  cardActionRowStyle,
  cardGenreBadgeStyle,
  desktopCardActionRowStyle,
  desktopCardGenreBadgeStyle,
  desktopSectionStyle,
  desktopSectionHeaderStyle,
  desktopSectionTitleStyle,
  desktopPublishedGridStyle,
  desktopPublishedTitleStyle,
} from "./lib/explorar-content-styles";
import {
  traduzirTextoExplorar,
  traduzirGeneroExplorar,
  traduzirFormatoExplorar,
  traduzirClassificacaoExplorar,
} from "./lib/explorar-translations";
import {
  normalizarContadorExplorar,
  totalCurtidasObra,
  totalComentariosObra,
  calcularProgressoLeitura,
  obraTemConteudoPublicadoExplorar,
} from "./lib/explorar-work-normalizers";
import type { ObraLocal } from "./lib/explorar-work-normalizers";
import {
  colecaoTemObraExplorar,
} from "./lib/explorar-local-storage";
import {
  criarIniciaisAutorExplorar,
  criarBioAutorExplorar,
  formatarMediaAvaliacaoAutorExplorar,
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
  AutorExplorar,
  OrdenacaoExplorar,
  FiltroColecaoExplorar,
} from "./lib/explorar-derived-utils";

type ModoConteudoExplorar = "obras" | "autores";


const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";

const categorias = [
  "Ação",
  "Aventura",
  "Comédia",
  "Drama",
  "Fantasia",
  "Ficção",
  "Mistério",
  "Romance",
  "Suspense",
  "Terror",
  "Sobrenatural",
  "Histórico",
  "Biografia",
];

const TITULOS_CRIATIVOS_OBRAS_EXPLORAR: Record<string, string> = {
  acao: "Ação do começo ao fim",
  aventura: "Aventuras sem limites",
  comedia: "Para rir agora",
  drama: "Histórias que deixam marcas",
  fantasia: "Mundos além da imaginação",
  ficcao: "Além do que é possível",
  misterio: "Mistérios para desvendar",
  romance: "Amores que deixam marcas",
  suspense: "Tensão até a última página",
  terror: "Histórias para perder o sono",
  sobrenatural: "Entre este mundo e o outro",
  historico: "Viagens por outros tempos",
  biografia: "Vidas que merecem ser contadas",
  outros: "Descobertas fora do comum",
};

const TITULOS_CRIATIVOS_AUTORES_EXPLORAR: Record<string, string> = {
  acao: "Autores que aceleram o coração",
  aventura: "Autores de grandes jornadas",
  comedia: "Autores para arrancar risadas",
  drama: "Autores que tocam fundo",
  fantasia: "Criadores de mundos impossíveis",
  ficcao: "Autores que enxergam além",
  misterio: "Mestres dos enigmas",
  romance: "Autores que escrevem sentimentos",
  suspense: "Mestres da tensão",
  terror: "Autores que dominam o medo",
  sobrenatural: "Vozes do desconhecido",
  historico: "Autores que revivem o passado",
  biografia: "Autores de vidas reais",
  outros: "Novas vozes para descobrir",
};

function obterTituloCriativoObrasExplorar(genero: string) {
  return (
    TITULOS_CRIATIVOS_OBRAS_EXPLORAR[normalizarTexto(genero)] ||
    "Histórias para descobrir"
  );
}

function obterTituloCriativoAutoresExplorar(genero: string) {
  return (
    TITULOS_CRIATIVOS_AUTORES_EXPLORAR[normalizarTexto(genero)] ||
    "Autores para descobrir"
  );
}


function criarLoginHrefExplorar() {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/explorar";
  const destinoSeguro =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/explorar";
  const params = new URLSearchParams({
    redirectTo: destinoSeguro,
  });

  return `/login?${params.toString()}`;
}

function criarPerfilAutorHrefExplorar(autor: string, autorId?: string) {
  const parametros = new URLSearchParams();
  const autorLimpo = autor.trim();
  const autorIdLimpo = autorId?.trim() || "";

  if (autorLimpo) {
    parametros.set("autor", autorLimpo);
  }

  if (autorIdLimpo) {
    parametros.set("autorId", autorIdLimpo);
    parametros.set("userId", autorIdLimpo);
  }

  const query = parametros.toString();

  return query ? `/perfil-autor?${query}` : "/perfil-autor";
}

function criarHrefListaExplorar({
  titulo,
  modo,
  genero = "",
}: {
  titulo: string;
  modo: ModoConteudoExplorar;
  genero?: string;
}) {
  const parametros = new URLSearchParams();
  const tituloLimpo = titulo.trim();
  const generoLimpo = genero.trim();
  const tituloNormalizado = normalizarTexto(tituloLimpo);

  parametros.set("modo", modo);

  if (tituloLimpo) {
    parametros.set("titulo", tituloLimpo);
  }

  if (generoLimpo) {
    parametros.set("genero", generoLimpo);
  }

  if (modo === "autores") {
    parametros.set("secao", "autores");

    if (tituloNormalizado === "mais bem avaliados") {
      parametros.set("ordem", "avaliacao");
    } else if (tituloNormalizado === "autores em destaque") {
      parametros.set("ordem", "popularidade");
    } else {
      parametros.set("ordem", "recentes");
    }

    return `/listas?${parametros.toString()}`;
  }

  if (tituloNormalizado === "recomendacoes para voce") {
    parametros.set("secao", "recomendacoes");
    parametros.set("ordem", "popularidade");
  } else if (tituloNormalizado === "publicacoes recentes") {
    parametros.set("secao", "recentes");
    parametros.set("ordem", "recentes");
  } else if (tituloNormalizado === "novos capitulos") {
    parametros.set("secao", "novos-capitulos");
    parametros.set("ordem", "recentes");
  } else if (tituloNormalizado === "mais curtidas") {
    parametros.set("secao", "mais-curtidas");
    parametros.set("ordem", "popularidade");
  } else if (tituloNormalizado === "mais comentadas") {
    parametros.set("secao", "mais-comentadas");
    parametros.set("ordem", "popularidade");
  } else if (tituloNormalizado === "para ler agora") {
    parametros.set("secao", "para-ler-agora");
    parametros.set("ordem", "recentes");
  } else {
    parametros.set("secao", "catalogo");
    parametros.set("ordem", "recentes");
  }

  return `/listas?${parametros.toString()}`;
}


function criarPublishedCoverStyle(
  capa: string,
): CSSProperties {
  const baseStyle = criarPublishedCoverTemaStyle();

  if (!capa) {
    return baseStyle;
  }

  return {
    ...baseStyle,
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: "none",
    opacity: 1,
  };
}

type TemaCategoriaExplorar = {
  accent: string;
  secondary: string;
  bgStart: string;
  bgMid: string;
  bgEnd: string;
  glowPrimary: string;
  glowSecondary: string;
  titleTo: string;
  activeSurface: string;
  secondarySurface: string;
  secondaryButtonText: string;
  pageBackground: string;
  heroBackground: string;
  activeBackground: string;
};

function obterTemaCategoria(): TemaCategoriaExplorar {
  return {
    accent: "#FFFFFF",
    secondary: "#A1A1AA",
    bgStart: "#000000",
    bgMid: "#000000",
    bgEnd: "#000000",
    glowPrimary: "transparent",
    glowSecondary: "transparent",
    titleTo: "#FFFFFF",
    activeSurface: "rgba(255,255,255,0.10)",
    secondarySurface: "rgba(255,255,255,0.06)",
    secondaryButtonText: "#FFFFFF",
    activeBackground: "#050505",
    pageBackground: "#000000",
    heroBackground: "#000000",
  };
}

function criarTemaPaginaVisualExplorar(): TemaCategoriaExplorar {
  return obterTemaCategoria();
}



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
    const autorIds = Array.from(
      new Set(
        obrasLocais
          .filter(
            (obra) =>
              obra.publicado && obraTemConteudoPublicadoExplorar(obra)
          )
          .map((obra) => obra.autorId?.trim() || "")
          .filter(Boolean)
      )
    );

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
    modoConteudo === "autores"
      ? autoresFiltrados.length
      : obrasLocaisFiltradas.length;
  const possuiObrasPublicadas = obrasLocais.some((obra) => {
    return obra.publicado && obraTemConteudoPublicadoExplorar(obra);
  });

  const filtrosAtivos = Boolean(
    categoriaSelecionada ||
      termoBusca ||
      filtroFormato !== "todos" ||
      filtroClassificacao !== "todos" ||
      filtroCapitulos !== "todos" ||
      (usuarioLogado && filtroColecao !== "todos") ||
      ordenacao !== "relevancia"
  );

  const totalFiltrosAvancadosAtivos = [
    usuarioLogado && filtroColecao !== "todos",
    filtroFormato !== "todos",
    filtroClassificacao !== "todos",
    filtroCapitulos !== "todos",
    ordenacao !== "relevancia",
  ].filter(Boolean).length;

  const textoBotaoFiltrosAvancados = traduzirTextoExplorar(
    totalFiltrosAvancadosAtivos > 0
      ? `Explorar (${totalFiltrosAvancadosAtivos})`
      : "Explorar",
    language
  );

  const temaPagina = criarTemaPaginaVisualExplorar();

  function atualizarUrl(
    categoria: string,
    modo: ModoConteudoExplorar = modoConteudo
  ) {
    const params = new URLSearchParams();

    if (modo === "autores") {
      params.set("tipo", "autores");
    }

    if (categoria.trim()) {
      params.set("categoria", categoria.trim());
    }

    const query = params.toString();
    window.history.pushState(null, "", query ? `/explorar?${query}` : "/explorar");
  }

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
    atualizarUrl("", modo);
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
    atualizarUrl(categoria, modoConteudo);
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

function EstadoVazioExplorar({
  possuiObrasPublicadas,
  modoConteudo,
}: {
  possuiObrasPublicadas: boolean;
  modoConteudo: ModoConteudoExplorar;
}) {
  const { language } = useHistorietasLanguage();
  const titulo =
    modoConteudo === "autores"
      ? "Nenhum autor encontrado"
      : possuiObrasPublicadas
        ? "Nenhuma obra encontrada"
        : "PUBLIQUE SUA HISTÓRIA";

  return (
    <p
      style={{
        margin: "10px 0 0",
        color: "#FFFFFF",
        fontSize: "12px",
        fontWeight: 800,
        textAlign: "center",
      }}
    >
      {traduzirTextoExplorar(titulo, language)}
    </p>
  );
}

function SectionHeader({
  title,
  tema,
  isDesktop,
  href,
}: {
  title: string;
  tema: ReturnType<typeof obterTemaCategoria>;
  isDesktop?: boolean;
  href?: string;
}) {
  const { language } = useHistorietasLanguage();
  const tituloTraduzido = traduzirTextoExplorar(title, language);
  const titleStyleTema: CSSProperties = {
    ...(isDesktop ? desktopSectionTitleStyle : sectionTitleStyle),
    background: "none",
    color: "#FFFFFF",
    textAlign: "center",
  };
  const ariaLabelMais =
    language === "en"
      ? `View all in ${tituloTraduzido}`
      : language === "es"
        ? `Ver todo en ${tituloTraduzido}`
        : `Ver tudo em ${tituloTraduzido}`;

  void tema;

  return (
    <div style={isDesktop ? desktopSectionHeaderStyle : sectionHeaderStyle}>
      <span style={sectionHeaderSpacerStyle} aria-hidden="true" />

      <h2 style={titleStyleTema}>{tituloTraduzido}</h2>

      {href ? (
        <Link
          href={href}
          style={isDesktop ? desktopSectionMoreLinkStyle : sectionMoreLinkStyle}
          aria-label={ariaLabelMais}
          title={ariaLabelMais}
        >
          <span style={sectionMoreChevronStyle} aria-hidden="true">
            ›
          </span>
        </Link>
      ) : (
        <span style={sectionHeaderSpacerStyle} aria-hidden="true" />
      )}
    </div>
  );
}

function AutorExplorarCard({
  autor,
  isDesktop,
  emGrade = false,
}: {
  autor: AutorExplorar;
  isDesktop?: boolean;
  emGrade?: boolean;
}) {
  const { language } = useHistorietasLanguage();
  const generos = autor.generos.length > 0 ? autor.generos : ["Historietas"];
  const nomeExibicao =
    autor.nome === "Autor não informado"
      ? traduzirTextoExplorar(autor.nome, language)
      : autor.nome;

  return (
    <Link
      href={autor.href}
      style={
        emGrade
          ? isDesktop
            ? desktopAutorExplorarGridCardStyle
            : autorExplorarGridCardStyle
          : isDesktop
            ? desktopAutorExplorarCardStyle
            : autorExplorarCardStyle
      }
      aria-label={
        language === "en"
          ? `Open author profile for ${nomeExibicao}`
          : language === "es"
            ? `Abrir el perfil del autor ${nomeExibicao}`
            : `Abrir perfil do autor ${nomeExibicao}`
      }
    >
      <span style={autorExplorarCardGlowStyle} aria-hidden="true" />

      <div style={autorExplorarTopStyle}>
        <div style={autorExplorarAvatarShellStyle}>
          {autor.avatar ? (
            <Image
              src={autor.avatar}
              alt={
                language === "en"
                  ? `${nomeExibicao} avatar`
                  : `Avatar de ${nomeExibicao}`
              }
              width={68}
              height={68}
              unoptimized
              style={autorExplorarAvatarImageStyle}
            />
          ) : (
            <span style={autorExplorarAvatarInitialsStyle}>
              {criarIniciaisAutorExplorar(nomeExibicao)}
            </span>
          )}
        </div>

        <div style={autorExplorarIdentityStyle}>
          <h3 style={autorExplorarNameStyle}>{nomeExibicao}</h3>
          <p style={autorExplorarBioStyle}>{autor.bio}</p>
        </div>
      </div>

      <div style={autorExplorarMetaRowStyle}>
        <span
          style={autorExplorarMetaBadgeStyle}
          aria-label={`${autor.totalObras} ${traduzirTextoExplorar(
            autor.totalObras === 1 ? "obra publicada" : "obras publicadas",
            language
          )}`}
        >
          📚 {autor.totalObras}
        </span>

        <span
          style={autorExplorarMetaBadgeStyle}
          aria-label={
            autor.avaliacao && autor.avaliacao.total > 0
              ? language === "en"
                ? `Average rating ${formatarMediaAvaliacaoAutorExplorar(
                    autor.avaliacao,
                    language
                  )} out of 5, from ${autor.avaliacao.total} ${
                    autor.avaliacao.total === 1 ? "rating" : "ratings"
                  }`
                : language === "es"
                  ? `Valoración media ${formatarMediaAvaliacaoAutorExplorar(
                      autor.avaliacao,
                      language
                    )} de 5, con ${autor.avaliacao.total} ${
                      autor.avaliacao.total === 1
                        ? "valoración"
                        : "valoraciones"
                    }`
                  : `Avaliação média ${formatarMediaAvaliacaoAutorExplorar(
                      autor.avaliacao,
                      language
                    )} de 5, com ${autor.avaliacao.total} ${
                      autor.avaliacao.total === 1
                        ? "avaliação"
                        : "avaliações"
                    }`
              : traduzirTextoExplorar("Autor ainda sem avaliações", language)
          }
        >
          <span style={autorExplorarRatingStarStyle} aria-hidden="true">
            ★
          </span>
          {formatarMediaAvaliacaoAutorExplorar(autor.avaliacao, language)}
        </span>

        {autor.totalCurtidas > 0 && (
          <span style={autorExplorarMetaBadgeStyle}>
            ❤️ {autor.totalCurtidas}
          </span>
        )}

        {autor.totalComentarios > 0 && (
          <span style={autorExplorarMetaBadgeStyle}>
            💬 {autor.totalComentarios}
          </span>
        )}
      </div>

      <div style={autorExplorarBottomStyle}>
        <div style={autorExplorarGenresStyle}>
          {generos.slice(0, 2).map((genero) => (
            <span
              key={`${autor.chave}-${genero}`}
              style={autorExplorarGenreBadgeStyle}
            >
              {traduzirGeneroExplorar(genero, language)}
            </span>
          ))}
        </div>

        <span
          data-historietas-page-background-action="true"
          style={autorExplorarProfileButtonStyle}
        >
          {traduzirTextoExplorar("Ver perfil", language)}
        </span>
      </div>
    </Link>
  );
}

function ExplorarCarouselRow({
  children,
  isDesktop,
  variant,
}: {
  children: ReactNode;
  isDesktop: boolean;
  variant: "obra" | "autor";
}) {
  const { language } = useHistorietasLanguage();
  const rowRef = useRef<HTMLDivElement | null>(null);
  const totalItems = Children.count(children);
  const precisaSetas = isDesktop && totalItems > 3;
  const listStyle = isDesktop
    ? variant === "autor"
      ? desktopAutoresExplorarCarouselStyle
      : desktopObrasExplorarCarouselStyle
    : variant === "autor"
      ? autoresExplorarCarouselStyle
      : obrasExplorarCarouselStyle;

  useEffect(() => {
    const row = rowRef.current;

    if (!row) {
      return;
    }

    row.scrollLeft = 0;
  }, [isDesktop, totalItems, variant]);

  function rolar(direcao: -1 | 1) {
    rowRef.current?.scrollBy({
      left: direcao * 460,
      behavior: "smooth",
    });
  }

  if (!precisaSetas) {
    return (
      <div ref={rowRef} style={listStyle}>
        {children}
      </div>
    );
  }

  return (
    <div style={explorarCarouselShellStyle}>
      <button
        type="button"
        onClick={() => rolar(-1)}
        style={explorarCarouselArrowLeftStyle}
        aria-label={traduzirTextoExplorar("Rolar carrossel para a esquerda", language)}
      >
        <span
          aria-hidden="true"
          style={explorarCarouselArrowLeftIconStyle}
        />
      </button>

      <div ref={rowRef} style={listStyle}>
        {children}
      </div>

      <button
        type="button"
        onClick={() => rolar(1)}
        style={explorarCarouselArrowRightStyle}
        aria-label={traduzirTextoExplorar("Rolar carrossel para a direita", language)}
      >
        <span
          aria-hidden="true"
          style={explorarCarouselArrowRightIconStyle}
        />
      </button>
    </div>
  );
}

function ObraPublicadaCard({
  obra,
  isDesktop,
}: {
  obra: ObraLocal;
  isDesktop?: boolean;
}) {
  const { language } = useHistorietasLanguage();
  const totalCurtidas = totalCurtidasObra(obra);
  const totalComentarios = totalComentariosObra(obra);
  const totalVisualizacoes = normalizarContadorExplorar(obra.visualizacoes);
  const progressoLeitura = calcularProgressoLeitura(obra.capitulos);
  const paginaPublicaHref = `/obra/${obra.slug || criarSlugBase(obra.titulo)}`;
  const perfilAutorHref = criarPerfilAutorHrefExplorar(
    obra.autor,
    obra.autorId
  );

  return (
    <article style={isDesktop ? criarDesktopPublishedCardTemaStyle() : criarPublishedCardTemaStyle()}>
      <Link
        href={paginaPublicaHref}
        style={
          isDesktop
            ? criarDesktopPublishedCoverStyle(obra.capa)
            : criarPublishedCoverStyle(obra.capa)
        }
        aria-label={
          obra.titulo === "Obra sem título"
            ? traduzirTextoExplorar(obra.titulo, language)
            : obra.titulo
        }
      >
        {!obra.capa && null}
      </Link>

      <div style={isDesktop ? desktopPublishedInfoStyle : publishedInfoStyle}>
        <div style={cardTopStyle}>
          <h3 style={isDesktop ? desktopPublishedTitleStyle : publishedTitleStyle}>
            {obra.titulo === "Obra sem título"
              ? traduzirTextoExplorar(obra.titulo, language)
              : obra.titulo}
          </h3>

          <Link href={perfilAutorHref} style={authorLinkStyle}>
            {traduzirTextoExplorar("Por", language)}{" "}
            {obra.autor === "Autor não informado"
              ? traduzirTextoExplorar(obra.autor, language)
              : obra.autor}
          </Link>
        </div>

        <div style={statusRowStyle}>
          {!obra.publicado && (
            <span style={draftStatusStyle}>
              {traduzirTextoExplorar("Rascunho", language)}
            </span>
          )}

          <span style={formatBadgeStyle}>
            {traduzirFormatoExplorar(obra.formato, language)}
          </span>

          <span style={classificationBadgeStyle}>
            {traduzirClassificacaoExplorar(
              obra.classificacaoIndicativa,
              language
            )}
          </span>
        </div>

        {isDesktop && (
          <p style={desktopPublishedSynopsisStyle}>
            {obra.sinopse === "Nenhuma sinopse informada."
              ? traduzirTextoExplorar(obra.sinopse, language)
              : obra.sinopse}
          </p>
        )}

        <div style={statsStyle}>
          <span style={metricItemStyle}>
            <span style={metricIconStyle}>👁️</span>
            {totalVisualizacoes}
          </span>

          <span style={metricItemStyle}>
            <span style={heartMetricIconStyle}>❤️</span>
            {totalCurtidas}
          </span>

          <span style={metricItemStyle}>
            <span style={metricIconStyle}>💬</span>
            {totalComentarios}
          </span>

          <span style={metricItemStyle}>
            <span style={metricIconStyle}>
              {obra.capitulos.length > 0 ? "📚" : obra.arquivoObra ? "📄" : "📚"}
            </span>
            {obra.capitulos.length > 0
              ? `${obra.capitulos.length}`
              : obra.arquivoObra
                ? "1"
                : "0"}
          </span>
        </div>

        {progressoLeitura > 0 && (
          <div style={progressCompactStyle}>
            <div style={criarProgressTrackStyle()}>
              <div
                style={{
                  ...criarProgressBarStyle(),
                  width: `${progressoLeitura}%`,
                }}
              />
            </div>

            <span style={progressTextStyle}>{progressoLeitura}%</span>
          </div>
        )}

        <div style={isDesktop ? desktopCardActionRowStyle : cardActionRowStyle}>
          <span style={isDesktop ? desktopCardGenreBadgeStyle : cardGenreBadgeStyle}>
            {traduzirGeneroExplorar(obra.genero, language)}
          </span>

          <Link
            href={paginaPublicaHref}
            data-historietas-page-background-action="true"
            style={criarCardPrimaryActionStyle(isDesktop)}
          >
            {traduzirTextoExplorar("Ver obra", language)}
          </Link>
        </div>
      </div>
    </article>
  );
}
