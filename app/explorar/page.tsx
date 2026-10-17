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
  ehClassificacao18,
} from "../../lib/historietasAdultContent";
import { carregarMetricasConteudos } from "../../lib/metricas";
import {
  listarSelecaoCatalogo,
  type ConsultaCatalogo,
  type CursorCatalogo,
  type PaginaCatalogo,
} from "../../lib/catalogo";
import {
  carregarTodasPaginasPorLotesSupabase,
  carregarTodasPaginasSupabase,
} from "../../lib/supabase/paginacao.mjs";
import { LoadingSpinner } from "./components/explorar-loading-spinner";
import { useExplorarAdvancedFiltersBodyLock } from "./hooks/use-explorar-advanced-filters-body-lock";
import { useExplorarDesktopMode } from "./hooks/use-explorar-desktop-mode";
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
  obterLocaleExplorar,
  traduzirTextoExplorar,
  traduzirGeneroExplorar,
  traduzirFormatoExplorar,
  traduzirClassificacaoExplorar,
} from "./lib/explorar-translations";
import {
  normalizarContadorExplorar,
  totalCurtidasObra,
  totalComentariosObra,
  totalSalvosObra,
  obraTemAtividadeLeitura,
  calcularProgressoLeitura,
  dataCriacaoObra,
  dataUltimoCapituloObraExplorar,
  pontuacaoRecomendacaoObraExplorar,
  obraTemConteudoPublicadoExplorar,
  normalizarObra,
  normalizarObraSupabase,
  mesclarObrasSemDuplicar,
} from "./lib/explorar-work-normalizers";
import type {
  ObraLocal,
  SupabaseObraRow,
  SupabaseCapituloRow,
} from "./lib/explorar-work-normalizers";
import {
  lerStorageUsuarioExplorar,
  salvarJsonStorageUsuarioExplorar,
  carregarListaIdsUsuarioExplorar,
  salvarListaIdsUsuarioExplorar,
  colecaoTemObraExplorar,
  obterArquivoObraComBackup,
  salvarBackupsArquivosObras,
} from "./lib/explorar-local-storage";
import {
  carregarNomesProfilesExplorar,
  aplicarNomesProfilesEmObrasExplorar,
  criarIniciaisAutorExplorar,
  criarBioAutorExplorar,
  formatarMediaAvaliacaoAutorExplorar,
  carregarPerfisAutoresExplorar,
  carregarAvaliacoesAutoresExplorar,
} from "./lib/explorar-author-profile-utils";
import type {
  AvaliacaoAutorExplorar,
  AvaliacoesAutoresExplorar,
  PerfisAutoresExplorar,
} from "./lib/explorar-author-profile-utils";


type ModoConteudoExplorar = "obras" | "autores";


type AutorExplorar = {
  chave: string;
  nome: string;
  autorId: string;
  avatar: string;
  bio: string;
  totalObras: number;
  totalCurtidas: number;
  totalComentarios: number;
  generos: string[];
  href: string;
  avaliacao?: AvaliacaoAutorExplorar;
};

type OrdenacaoExplorar =
  | "relevancia"
  | "mais-curtidas"
  | "mais-salvas"
  | "mais-comentadas"
  | "mais-recentes"
  | "mais-capitulos";

type FiltroColecaoExplorar =
  | "todos"
  | "favoritas"
  | "concluidas"
  | "lendo"
  | "sem-leitura";

const STORAGE_KEY = "historietas-obras";
const FAVORITES_STORAGE_KEY = "historietas-obras-favoritas";
const COMPLETED_STORAGE_KEY = "historietas-obras-concluidas";
const CONSULTAS_INICIAIS_CATALOGO_EXPLORAR = [
  { ordenacao: "recentes", limite: 50 },
  { ordenacao: "geral", limite: 24 },
  { ordenacao: "curtidas", limite: 12 },
  { ordenacao: "comentadas", limite: 12 },
  { ordenacao: "salvas", limite: 12 },
  { ordenacao: "capitulos", limite: 12 },
] as const satisfies readonly ConsultaCatalogo[];

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


function categoriaCombinaComGenero(categoria: string, genero: string) {
  const categoriaNormalizada = normalizarTexto(categoria);
  const generoNormalizado = normalizarTexto(genero);

  if (!categoriaNormalizada || !generoNormalizado) {
    return false;
  }

  if (categoriaNormalizada === "ficcao") {
    return (
      generoNormalizado.includes("ficcao") ||
      generoNormalizado.includes("sci-fi") ||
      generoNormalizado.includes("sci fi")
    );
  }

  return generoNormalizado.includes(categoriaNormalizada);
}


async function carregarIdsColecaoUsuarioExplorar(
  tabela: "favoritos" | "concluidas",
  userId: string
) {
  if (!userId.trim()) {
    return [] as string[];
  }

  try {
    const data = await carregarTodasPaginasSupabase<{ obra_id: string }>({
      nomeColecao: `${tabela} do Explorar`,
      buscarPagina: async (inicio, fim) =>
        supabase
          .from(tabela)
          .select("obra_id")
          .eq("user_id", userId)
          .order("obra_id", { ascending: true })
          .range(inicio, fim),
    });

    return data
      .map((registro) => {
        if (!registro || typeof registro !== "object" || Array.isArray(registro)) {
          return "";
        }

        const obraId = (registro as Record<string, unknown>).obra_id;

        return typeof obraId === "string" ? obraId.trim() : "";
      })
      .filter(Boolean);
  } catch (error) {
    console.warn(`Não consegui acessar ${tabela} no Explorar:`, error);
    return [] as string[];
  }
}

async function carregarColecoesUsuarioExplorar(userId: string) {
  const [favoritas, concluidas] = await Promise.all([
    carregarIdsColecaoUsuarioExplorar("favoritos", userId),
    carregarIdsColecaoUsuarioExplorar("concluidas", userId),
  ]);

  return {
    favoritas,
    concluidas,
  };
}


async function aplicarMetricasExplorar(
  obrasParaAtualizar: ObraLocal[],
  userId: string,
) {
  const obraIds = Array.from(
    new Set(obrasParaAtualizar.map((obra) => obra.id.trim()).filter(Boolean)),
  );
  const capituloIds = Array.from(
    new Set(
      obrasParaAtualizar.flatMap((obra) =>
        obra.capitulos.map((capitulo) => capitulo.id.trim()).filter(Boolean),
      ),
    ),
  );

  if (obraIds.length === 0 && capituloIds.length === 0) {
    return obrasParaAtualizar;
  }

  const metricas = await carregarMetricasConteudos({ obraIds, capituloIds });

  if (!metricas.carregado) {
    return obrasParaAtualizar;
  }

  const aplicarProgresso = Boolean(userId.trim());

  return obrasParaAtualizar.map((obra) => {
    const metricaObra = metricas.obras.get(obra.id);
    let ultimoCapituloLidoId = aplicarProgresso
      ? ""
      : obra.ultimoCapituloLidoId;
    let ultimaLeituraEm = aplicarProgresso ? "" : obra.ultimaLeituraEm;

    const capitulos = obra.capitulos.map((capitulo) => {
      const metricaCapitulo = metricas.capitulos.get(capitulo.id);
      const progressoRemotoDisponivel =
        aplicarProgresso && Boolean(metricaCapitulo);
      const lido = progressoRemotoDisponivel
        ? Boolean(metricaCapitulo?.usuario.leu)
        : capitulo.lido;
      const lidoEm = progressoRemotoDisponivel && lido
        ? metricaCapitulo?.usuario.lidoEm || ""
        : capitulo.lidoEm;

      if (lido) {
        const tempoAtual = new Date(lidoEm).getTime();
        const tempoUltimo = new Date(ultimaLeituraEm).getTime();
        const tempoAtualSeguro = Number.isNaN(tempoAtual) ? 0 : tempoAtual;
        const tempoUltimoSeguro = Number.isNaN(tempoUltimo) ? 0 : tempoUltimo;

        if (!ultimoCapituloLidoId || tempoAtualSeguro >= tempoUltimoSeguro) {
          ultimoCapituloLidoId = capitulo.id;
          ultimaLeituraEm = lidoEm;
        }
      }

      return {
        ...capitulo,
        lido,
        lidoEm,
        totalCurtidas:
          metricaCapitulo?.interacoes.curtidas ??
          normalizarContadorExplorar(capitulo.totalCurtidas),
        totalComentarios:
          metricaCapitulo?.interacoes.comentarios ??
          normalizarContadorExplorar(capitulo.totalComentarios),
        totalSalvos:
          metricaCapitulo?.interacoes.salvos ??
          normalizarContadorExplorar(capitulo.totalSalvos),
        // O contrato nunca transforma progresso privado em total publico.
        totalLidos: normalizarContadorExplorar(capitulo.totalLidos),
      };
    });

    return {
      ...obra,
      capitulos,
      ultimoCapituloLidoId,
      ultimaLeituraEm,
      progressoLeitura: calcularProgressoLeitura(capitulos),
      totalCurtidas:
        metricaObra?.audiencia.curtidoresUnicos ??
        normalizarContadorExplorar(obra.totalCurtidas),
      totalComentarios:
        metricaObra?.audiencia.comentaristasUnicos ??
        normalizarContadorExplorar(obra.totalComentarios),
      totalSalvos:
        metricaObra?.audiencia.salvadoresUnicos ??
        normalizarContadorExplorar(obra.totalSalvos),
      totalLidos: normalizarContadorExplorar(obra.totalLidos),
      totalFavoritos:
        metricaObra?.interacoesDiretas.favoritos ??
        normalizarContadorExplorar(obra.totalFavoritos),
      totalConcluidas:
        metricaObra?.interacoesDiretas.concluidas ??
        normalizarContadorExplorar(obra.totalConcluidas),
    };
  });
}
async function carregarObrasPublicadasSupabase(
  obrasLocais: ObraLocal[],
  userId = "",
  consultasCatalogo: readonly ConsultaCatalogo[] =
    CONSULTAS_INICIAIS_CATALOGO_EXPLORAR,
): Promise<{ obras: ObraLocal[]; pagina: PaginaCatalogo | null }> {
  try {
    let obraIdsCatalogo: readonly string[] = [];
    let catalogoDisponivel = true;
    let paginaCatalogo: PaginaCatalogo | null = null;

    try {
      const selecao = await listarSelecaoCatalogo(consultasCatalogo);
      obraIdsCatalogo = selecao.obraIds;
      paginaCatalogo = selecao.paginas.length === 1 ? selecao.paginas[0] : null;
    } catch (error) {
      catalogoDisponivel = false;
      console.warn(
        "O catálogo paginado do Explorar ainda não está disponível; usando uma amostra limitada:",
        error,
      );
    }

    let consultaObras = supabase
      .from("obras")
      .select(
        "id,user_id,titulo,autor,genero,formato,classificacao_indicativa,avisos_conteudo,sinopse,tags,capa_url,capa_nome,arquivo_url,arquivo_nome,arquivo_tipo,arquivo_tamanho,arquivo_categoria,publicado,visualizacoes,slug,link,criada_em,atualizado_em"
      )
      .eq("publicado", true);

    if (catalogoDisponivel) {
      if (obraIdsCatalogo.length === 0) {
        return {
          obras: await aplicarMetricasExplorar(obrasLocais, userId),
          pagina: paginaCatalogo,
        };
      }

      consultaObras = consultaObras.in("id", [...obraIdsCatalogo]);
    } else {
      consultaObras = consultaObras
        .order("criada_em", { ascending: false })
        .order("id", { ascending: false })
        .range(0, 49);
    }

    const { data: obrasData, error: obrasError } = await consultaObras;

    if (obrasError) {
      throw obrasError;
    }

    const obrasBanco = (obrasData || []) as SupabaseObraRow[];

    const obrasSupabase = obrasBanco.filter(
      (obra) => Boolean(obra.id)
    );

    const nomesProfiles = await carregarNomesProfilesExplorar([
      ...obrasLocais.map((obra) => obra.autorId || ""),
      ...obrasSupabase.map((obra) => obra.user_id || ""),
    ]);
    const obrasLocaisComProfiles = aplicarNomesProfilesEmObrasExplorar(
      obrasLocais,
      nomesProfiles
    );

    if (obrasSupabase.length === 0) {
      return {
        obras: await aplicarMetricasExplorar(obrasLocaisComProfiles, userId),
        pagina: paginaCatalogo,
      };
    }

    const idsObras = obrasSupabase.map((obra) => obra.id);
    let capitulosBanco: SupabaseCapituloRow[] = [];

    try {
      capitulosBanco =
        await carregarTodasPaginasPorLotesSupabase<SupabaseCapituloRow, string>({
          nomeColecao: "capítulos publicados do Explorar",
          itens: idsObras,
          buscarPaginaLote: async (obraIdsLote, inicio, fim) =>
            supabase
              .from("capitulos")
              .select("id,obra_id,user_id,titulo,ordem,publicado,criado_em,atualizado_em")
              .in("obra_id", obraIdsLote)
              .eq("publicado", true)
              .order("obra_id", { ascending: true })
              .order("ordem", { ascending: true })
              .order("id", { ascending: true })
              .range(inicio, fim),
        });
    } catch (error) {
      console.warn(
        "Não consegui carregar capítulos do Supabase no Explorar:",
        error,
      );
    }

    const capitulosPorObra = new Map<string, SupabaseCapituloRow[]>();

    capitulosBanco.forEach(
      (capitulo) => {
        const capitulosAtuais = capitulosPorObra.get(capitulo.obra_id) || [];
        capitulosAtuais.push(capitulo);
        capitulosPorObra.set(capitulo.obra_id, capitulosAtuais);
      }
    );

    const obrasSupabaseNormalizadas = obrasSupabase
      .map((obraBanco, index) => {
        const slugBanco = obraBanco.slug?.trim() || "";
        const obraLocal = obrasLocais.find((obraLocalAtual) => {
          const slugLocal =
            obraLocalAtual.slug || criarSlugBase(obraLocalAtual.titulo);

          return obraLocalAtual.id === obraBanco.id || slugLocal === slugBanco;
        });

        const obraNormalizada = normalizarObraSupabase(
          obraBanco,
          capitulosPorObra.get(obraBanco.id) || [],
          obraLocal,
          index
        );
        const nomeProfile =
          nomesProfiles.get(obraNormalizada.autorId || "") || "";

        return nomeProfile
          ? {
              ...obraNormalizada,
              autor: nomeProfile,
            }
          : obraNormalizada;
      })
      .filter((obra) => obraTemConteudoPublicadoExplorar(obra));

    const obrasMescladas = mesclarObrasSemDuplicar(
      obrasLocaisComProfiles,
      obrasSupabaseNormalizadas
    );
    const obrasComProgresso = await aplicarMetricasExplorar(
      obrasMescladas,
      userId,
    );

    salvarBackupsArquivosObras(obrasComProgresso, userId);
    salvarJsonStorageUsuarioExplorar(STORAGE_KEY, userId, obrasComProgresso);

    return {
      obras: obrasComProgresso,
      pagina: paginaCatalogo,
    };
  } catch (error) {
    console.warn("Não consegui acessar o Supabase no Explorar:", error);
    return {
      obras: await aplicarMetricasExplorar(obrasLocais, userId),
      pagina: null,
    };
  }
}

function ordenarObrasLocais(lista: ObraLocal[], ordenacao: OrdenacaoExplorar) {
  const novaLista = [...lista];

  if (ordenacao === "mais-curtidas") {
    return novaLista.sort(
      (a, b) => totalCurtidasObra(b) - totalCurtidasObra(a)
    );
  }

  if (ordenacao === "mais-salvas") {
    return novaLista.sort((a, b) => totalSalvosObra(b) - totalSalvosObra(a));
  }

  if (ordenacao === "mais-comentadas") {
    return novaLista.sort(
      (a, b) => totalComentariosObra(b) - totalComentariosObra(a)
    );
  }

  if (ordenacao === "mais-recentes") {
    return novaLista.sort((a, b) => dataCriacaoObra(b) - dataCriacaoObra(a));
  }

  if (ordenacao === "mais-capitulos") {
    return novaLista.sort((a, b) => b.capitulos.length - a.capitulos.length);
  }

  return novaLista;
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
  const consultaCatalogoRef = useRef(0);
  const consultaPersonalizadaAtivaRef = useRef(false);

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

  useEffect(() => {
    let cancelado = false;

    async function carregarExplorar() {
      const params = new URLSearchParams(window.location.search);
      const categoriaParam = params.get("categoria") || "";
      const tipoParam = params.get("tipo") === "autores" ? "autores" : "obras";

      setModoConteudo(tipoParam);
      setCategoriaSelecionada(categoriaParam.trim());

      try {
        let userIdAtual = "";

        try {
          const { data } = await supabase.auth.getUser();
          userIdAtual = data.user?.id || "";
        } catch {
          userIdAtual = "";
        }

        if (!cancelado) {
          setUsuarioLogado(Boolean(userIdAtual));
        }

        const obrasSalvasTexto = lerStorageUsuarioExplorar(
          STORAGE_KEY,
          userIdAtual
        );
        const obrasSalvasJson = obrasSalvasTexto
          ? JSON.parse(obrasSalvasTexto)
          : [];

        const obrasNormalizadas: ObraLocal[] = Array.isArray(obrasSalvasJson)
          ? obrasSalvasJson.map((obra, index) =>
              normalizarObra(obra, index, userIdAtual, obterArquivoObraComBackup)
            )
          : [];

        obrasCacheLocalRef.current = obrasNormalizadas;
        usuarioIdExplorarRef.current = userIdAtual;

        salvarBackupsArquivosObras(obrasNormalizadas, userIdAtual);
        salvarJsonStorageUsuarioExplorar(STORAGE_KEY, userIdAtual, obrasNormalizadas);

        const favoritasGlobais: string[] = [];
        const favoritasDoUsuario = userIdAtual
          ? carregarListaIdsUsuarioExplorar(FAVORITES_STORAGE_KEY, userIdAtual)
          : [];

        const concluidasGlobais: string[] = [];
        const concluidasDoUsuario = userIdAtual
          ? carregarListaIdsUsuarioExplorar(COMPLETED_STORAGE_KEY, userIdAtual)
          : [];

        const colecoesSupabase = userIdAtual
          ? await carregarColecoesUsuarioExplorar(userIdAtual)
          : { favoritas: [] as string[], concluidas: [] as string[] };

        const obrasFavoritasNormalizadas = Array.from(
          new Set([
            ...favoritasGlobais,
            ...favoritasDoUsuario,
            ...colecoesSupabase.favoritas,
          ])
        );
        const obrasConcluidasNormalizadas = Array.from(
          new Set([
            ...concluidasGlobais,
            ...concluidasDoUsuario,
            ...colecoesSupabase.concluidas,
          ])
        );

        salvarListaIdsUsuarioExplorar(
          FAVORITES_STORAGE_KEY,
          userIdAtual,
          obrasFavoritasNormalizadas
        );
        salvarListaIdsUsuarioExplorar(
          COMPLETED_STORAGE_KEY,
          userIdAtual,
          obrasConcluidasNormalizadas
        );

        if (!cancelado) {
          setObrasLocais(obrasNormalizadas);
          setObrasFavoritas(obrasFavoritasNormalizadas);
          setObrasConcluidas(obrasConcluidasNormalizadas);
        }

        const resultadoCatalogo = await carregarObrasPublicadasSupabase(
          obrasNormalizadas,
          userIdAtual
        );

        if (!cancelado) {
          setObrasLocais(resultadoCatalogo.obras);
          setProximoCursorCatalogo(resultadoCatalogo.pagina?.proximoCursor || null);
          setCatalogoTemMais(Boolean(resultadoCatalogo.pagina?.temMais));
        }
      } catch {
        if (!cancelado) {
          setObrasLocais([]);
          setObrasFavoritas([]);
          setObrasConcluidas([]);
        }
      } finally {
        if (!cancelado) {
          setDadosExplorarCarregados(true);
        }
      }
    }

    void carregarExplorar();

    return () => {
      cancelado = true;
    };
  }, []);

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
  const buscaCatalogo = busca.trim();

  const consultaCatalogoAtual = useMemo<ConsultaCatalogo>(() => ({
    busca: buscaCatalogo,
    genero: categoriaSelecionada,
    formato: filtroFormato === "todos" ? "" : filtroFormato,
    classificacao:
      filtroClassificacao === "todos" ? "" : filtroClassificacao,
    filtroCapitulos:
      filtroCapitulos === "com-capitulos" ||
      filtroCapitulos === "sem-capitulos"
        ? filtroCapitulos
        : "todos",
    ordenacao,
    limite: 24,
  }), [
    buscaCatalogo,
    categoriaSelecionada,
    filtroCapitulos,
    filtroClassificacao,
    filtroFormato,
    ordenacao,
  ]);
  const consultaCatalogoPersonalizada = Boolean(
    termoBusca ||
      categoriaSelecionada ||
      filtroFormato !== "todos" ||
      filtroClassificacao !== "todos" ||
      filtroCapitulos !== "todos" ||
      ordenacao !== "relevancia",
  );

  useEffect(() => {
    if (!dadosExplorarCarregados) {
      return;
    }

    if (
      !consultaCatalogoPersonalizada &&
      !consultaPersonalizadaAtivaRef.current
    ) {
      return;
    }

    consultaPersonalizadaAtivaRef.current = consultaCatalogoPersonalizada;
    const numeroConsulta = consultaCatalogoRef.current + 1;
    consultaCatalogoRef.current = numeroConsulta;
    let cancelado = false;
    const timer = window.setTimeout(async () => {
      setCarregandoMaisCatalogo(true);

      try {
        const consultas = consultaCatalogoPersonalizada
          ? [consultaCatalogoAtual]
          : CONSULTAS_INICIAIS_CATALOGO_EXPLORAR;
        const resultado = await carregarObrasPublicadasSupabase(
          obrasCacheLocalRef.current,
          usuarioIdExplorarRef.current,
          consultas,
        );

        if (!cancelado && consultaCatalogoRef.current === numeroConsulta) {
          setObrasLocais(resultado.obras);
          setProximoCursorCatalogo(
            resultado.pagina?.proximoCursor || null,
          );
          setCatalogoTemMais(Boolean(resultado.pagina?.temMais));
        }
      } finally {
        if (!cancelado && consultaCatalogoRef.current === numeroConsulta) {
          setCarregandoMaisCatalogo(false);
        }
      }
    }, 350);

    return () => {
      cancelado = true;
      window.clearTimeout(timer);
    };
  }, [
    consultaCatalogoAtual,
    consultaCatalogoPersonalizada,
    dadosExplorarCarregados,
  ]);

  async function carregarMaisObrasCatalogo() {
    if (
      !consultaCatalogoPersonalizada ||
      !proximoCursorCatalogo ||
      carregandoMaisCatalogo
    ) {
      return;
    }

    const numeroConsulta = consultaCatalogoRef.current + 1;
    consultaCatalogoRef.current = numeroConsulta;
    setCarregandoMaisCatalogo(true);

    try {
      const resultado = await carregarObrasPublicadasSupabase(
        obrasLocais,
        usuarioIdExplorarRef.current,
        [{ ...consultaCatalogoAtual, cursor: proximoCursorCatalogo }],
      );

      if (consultaCatalogoRef.current === numeroConsulta) {
        setObrasLocais(resultado.obras);
        setProximoCursorCatalogo(resultado.pagina?.proximoCursor || null);
        setCatalogoTemMais(Boolean(resultado.pagina?.temMais));
      }
    } finally {
      if (consultaCatalogoRef.current === numeroConsulta) {
        setCarregandoMaisCatalogo(false);
      }
    }
  }

  const obrasBaseFiltradas = useMemo(() => {
    const filtradas = obrasLocais.filter((obra) => {
      const passaFormato =
        filtroFormato === "todos" ? true : obra.formato === filtroFormato;

      const classificacao18 = ehClassificacao18(obra.classificacaoIndicativa);
      const passaClassificacao =
        filtroClassificacao === "18+"
          ? classificacao18
          : filtroClassificacao === "todos"
            ? !classificacao18
            : !classificacao18 &&
              obra.classificacaoIndicativa === filtroClassificacao;

      const passaPublicacao =
        obra.publicado && obraTemConteudoPublicadoExplorar(obra);

      const passaCapitulos =
        filtroCapitulos === "todos"
          ? true
          : filtroCapitulos === "com-capitulos"
            ? obra.capitulos.length > 0
            : obra.capitulos.length === 0;

      const passaColecao =
        !usuarioLogado || filtroColecao === "todos"
          ? true
          : filtroColecao === "favoritas"
            ? colecaoTemObraExplorar(obrasFavoritas, obra)
            : filtroColecao === "concluidas"
              ? colecaoTemObraExplorar(obrasConcluidas, obra)
              : filtroColecao === "lendo"
                ? obraTemAtividadeLeitura(obra)
                : !obraTemAtividadeLeitura(obra);

      return (
        passaFormato &&
        passaClassificacao &&
        passaPublicacao &&
        passaCapitulos &&
        passaColecao
      );
    });

    return ordenarObrasLocais(filtradas, ordenacao);
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
    return obrasBaseFiltradas.filter((obra) => {
      const passaCategoria = categoriaSelecionada
        ? categoriaCombinaComGenero(categoriaSelecionada, obra.genero)
        : true;

      const textoBusca = normalizarTexto(
        [
          obra.titulo,
          obra.autor,
          obra.genero,
          obra.formato,
          obra.classificacaoIndicativa,
          obra.sinopse,
          obra.tags.join(" "),
          obra.capaNome,
          obra.arquivoObra?.nome || "",
          obra.capitulos.map((capitulo) => capitulo.titulo).join(" "),
        ].join(" ")
      );

      const passaBusca = termoBusca ? textoBusca.includes(termoBusca) : true;

      return passaCategoria && passaBusca;
    });
  }, [obrasBaseFiltradas, categoriaSelecionada, termoBusca]);

  const autoresExplorar = useMemo(() => {
    type AutorAcumulado = {
      chave: string;
      nome: string;
      autorId: string;
      obrasIds: Set<string>;
      totalCurtidas: number;
      totalComentarios: number;
      generos: Set<string>;
    };

    const autores = new Map<string, AutorAcumulado>();

    obrasBaseFiltradas.forEach((obra) => {
      const autorId = obra.autorId?.trim() || "";
      const perfil = autorId ? perfisAutores[autorId] : undefined;
      const nome = perfil?.nome.trim() || obra.autor.trim() || "Autor não informado";
      const chave = autorId || normalizarTexto(nome);

      if (!chave) {
        return;
      }

      const atual = autores.get(chave) || {
        chave,
        nome,
        autorId,
        obrasIds: new Set<string>(),
        totalCurtidas: 0,
        totalComentarios: 0,
        generos: new Set<string>(),
      };

      atual.nome = perfil?.nome.trim() || atual.nome;
      atual.obrasIds.add(obra.id || obra.slug || criarSlugBase(obra.titulo));
      atual.totalCurtidas += totalCurtidasObra(obra);
      atual.totalComentarios += totalComentariosObra(obra);

      categorias.forEach((categoria) => {
        if (categoriaCombinaComGenero(categoria, obra.genero)) {
          atual.generos.add(categoria);
        }
      });

      autores.set(chave, atual);
    });

    return Array.from(autores.values())
      .map<AutorExplorar>((autor) => {
        const perfil = autor.autorId
          ? perfisAutores[autor.autorId]
          : undefined;
        const generos = Array.from(autor.generos);

        return {
          chave: autor.chave,
          nome: autor.nome,
          autorId: autor.autorId,
          avatar: perfil?.avatar || "",
          bio:
            perfil?.bio ||
            criarBioAutorExplorar(autor.nome, generos, language),
          totalObras: autor.obrasIds.size,
          totalCurtidas: autor.totalCurtidas,
          totalComentarios: autor.totalComentarios,
          generos,
          href: criarPerfilAutorHrefExplorar(autor.nome, autor.autorId),
          avaliacao: autor.autorId
            ? avaliacoesAutores[autor.autorId]
            : undefined,
        };
      })
      .sort(
        (autorA, autorB) =>
          autorB.totalObras - autorA.totalObras ||
          autorB.totalCurtidas - autorA.totalCurtidas ||
          autorA.nome.localeCompare(autorB.nome, obterLocaleExplorar(language))
      );
  }, [
    obrasBaseFiltradas,
    perfisAutores,
    avaliacoesAutores,
    language,
  ]);

  const filtroConteudo18Ativo = filtroClassificacao === "18+";

  const autoresFiltrados = useMemo(() => {
    return autoresExplorar.filter((autor) => {
      const passaCategoria = categoriaSelecionada
        ? autor.generos.some(
            (genero) =>
              normalizarTexto(genero) === normalizarTexto(categoriaSelecionada)
          )
        : true;
      const passaBusca = termoBusca
        ? normalizarTexto(autor.nome).includes(termoBusca)
        : true;

      return passaCategoria && passaBusca;
    });
  }, [autoresExplorar, categoriaSelecionada, termoBusca]);

  const secoesCriativasObras = useMemo(() => {
    if (categoriaSelecionada || termoBusca || filtroConteudo18Ativo) {
      return [] as Array<{ titulo: string; obras: ObraLocal[] }>;
    }

    const limitar = (lista: ObraLocal[]) => lista.slice(0, 12);
    const recomendacoes = limitar(
      [...obrasBaseFiltradas].sort(
        (obraA, obraB) =>
          pontuacaoRecomendacaoObraExplorar(obraB) -
            pontuacaoRecomendacaoObraExplorar(obraA) ||
          dataUltimoCapituloObraExplorar(obraB) -
            dataUltimoCapituloObraExplorar(obraA)
      )
    );
    const publicacoesRecentes = limitar(
      [...obrasBaseFiltradas]
        .filter((obra) => dataCriacaoObra(obra) > 0)
        .sort((obraA, obraB) => dataCriacaoObra(obraB) - dataCriacaoObra(obraA))
    );
    const novosCapitulos = limitar(
      [...obrasBaseFiltradas]
        .filter(
          (obra) =>
            obra.capitulos.length > 0 &&
            dataUltimoCapituloObraExplorar(obra) > 0
        )
        .sort(
          (obraA, obraB) =>
            dataUltimoCapituloObraExplorar(obraB) -
            dataUltimoCapituloObraExplorar(obraA)
        )
    );
    const maisCurtidas = limitar(
      [...obrasBaseFiltradas]
        .filter((obra) => totalCurtidasObra(obra) > 0)
        .sort(
          (obraA, obraB) =>
            totalCurtidasObra(obraB) - totalCurtidasObra(obraA)
        )
    );
    const maisComentadas = limitar(
      [...obrasBaseFiltradas]
        .filter((obra) => totalComentariosObra(obra) > 0)
        .sort(
          (obraA, obraB) =>
            totalComentariosObra(obraB) - totalComentariosObra(obraA)
        )
    );
    const paraLerAgora = limitar(
      [...obrasBaseFiltradas]
        .filter(
          (obra) =>
            obra.capitulos.length > 0 && obra.capitulos.length <= 3
        )
        .sort(
          (obraA, obraB) =>
            obraA.capitulos.length - obraB.capitulos.length ||
            pontuacaoRecomendacaoObraExplorar(obraB) -
              pontuacaoRecomendacaoObraExplorar(obraA)
        )
    );

    return [
      { titulo: "Recomendações para você", obras: recomendacoes },
      { titulo: "Publicações recentes", obras: publicacoesRecentes },
      { titulo: "Novos capítulos", obras: novosCapitulos },
      { titulo: "Mais curtidas", obras: maisCurtidas },
      { titulo: "Mais comentadas", obras: maisComentadas },
      { titulo: "Para ler agora", obras: paraLerAgora },
    ].filter((secao) => secao.obras.length > 0);
  }, [
    obrasBaseFiltradas,
    categoriaSelecionada,
    termoBusca,
    filtroConteudo18Ativo,
  ]);

  const secoesCriativasAutores = useMemo(() => {
    if (categoriaSelecionada || termoBusca) {
      return [] as Array<{ titulo: string; autores: AutorExplorar[] }>;
    }

    const autoresParaConhecer = autoresExplorar.slice(0, 12);
    const autoresEmDestaque = [...autoresExplorar]
      .sort(
        (autorA, autorB) =>
          autorB.totalObras * 12 +
            autorB.totalCurtidas * 4 +
            autorB.totalComentarios * 3 -
          (autorA.totalObras * 12 +
            autorA.totalCurtidas * 4 +
            autorA.totalComentarios * 3)
      )
      .slice(0, 12);
    const maisBemAvaliados = [...autoresExplorar]
      .filter(
        (autor) =>
          Boolean(autor.avaliacao) &&
          (autor.avaliacao?.total || 0) > 0 &&
          (autor.avaliacao?.media || 0) > 0
      )
      .sort(
        (autorA, autorB) =>
          (autorB.avaliacao?.media || 0) -
            (autorA.avaliacao?.media || 0) ||
          (autorB.avaliacao?.total || 0) -
            (autorA.avaliacao?.total || 0)
      )
      .slice(0, 12);

    return [
      { titulo: "Autores para conhecer", autores: autoresParaConhecer },
      { titulo: "Autores em destaque", autores: autoresEmDestaque },
      { titulo: "Mais bem avaliados", autores: maisBemAvaliados },
    ].filter((secao) => secao.autores.length > 0);
  }, [autoresExplorar, categoriaSelecionada, termoBusca]);

  const secoesObrasPorGenero = useMemo(() => {
    if (categoriaSelecionada || termoBusca || filtroConteudo18Ativo) {
      return [] as Array<{ genero: string; obras: ObraLocal[] }>;
    }

    const secoes = categorias
      .map((genero) => ({
        genero,
        obras: obrasBaseFiltradas.filter((obra) =>
          categoriaCombinaComGenero(genero, obra.genero)
        ),
      }))
      .filter((secao) => secao.obras.length > 0);
    const obrasCategorizadas = new Set(
      secoes.flatMap((secao) => secao.obras.map((obra) => obra.id))
    );
    const obrasOutros = obrasBaseFiltradas.filter(
      (obra) => !obrasCategorizadas.has(obra.id)
    );

    return obrasOutros.length > 0
      ? [...secoes, { genero: "Outros", obras: obrasOutros }]
      : secoes;
  }, [
    obrasBaseFiltradas,
    categoriaSelecionada,
    termoBusca,
    filtroConteudo18Ativo,
  ]);

  const secoesAutoresPorGenero = useMemo(() => {
    if (categoriaSelecionada || termoBusca) {
      return [] as Array<{ genero: string; autores: AutorExplorar[] }>;
    }

    const secoes = categorias
      .map((genero) => ({
        genero,
        autores: autoresExplorar.filter((autor) =>
          autor.generos.some(
            (generoAutor) =>
              normalizarTexto(generoAutor) === normalizarTexto(genero)
          )
        ),
      }))
      .filter((secao) => secao.autores.length > 0);
    const autoresCategorizados = new Set(
      secoes.flatMap((secao) => secao.autores.map((autor) => autor.chave))
    );
    const autoresOutros = autoresExplorar.filter(
      (autor) => !autoresCategorizados.has(autor.chave)
    );

    return autoresOutros.length > 0
      ? [...secoes, { genero: "Outros", autores: autoresOutros }]
      : secoes;
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
