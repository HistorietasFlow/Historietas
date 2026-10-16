"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import { normalizarTexto } from "../../lib/utils";
import { ehClassificacao18 } from "../../lib/historietasAdultContent";
import { useEmAltaDesktopMode } from "./hooks/use-em-alta-desktop-mode";
import { emAltaPageCss } from "./lib/em-alta-page-css";
import type {
  ObraLocal,
  ObraRanking,
  AutorRanking,
  TipoRanking,
} from "./lib/em-alta-models";
import {
  adicionarRankingObraNaLista,
  listaTemRankingObra,
  normalizarListaIdsEmAlta,
  pegarTopRanking,
  rankingTemInteracaoReal,
  removerRankingObraDaLista,
} from "./lib/em-alta-ranking-list-utils";
import {
  carregarListaIdsLocalEmAlta,
  COMPLETED_STORAGE_KEY,
  criarStorageKeyUsuarioEmAlta,
  FAVORITES_STORAGE_KEY,
  RATED_WORKS_STORAGE_KEY,
  salvarListaIdsLocalEmAlta,
  VIEWED_WORKS_STORAGE_KEY,
} from "./lib/em-alta-local-storage-utils";
import { carregarIdsColecaoUsuarioSupabaseEmAlta } from "./lib/em-alta-collection-supabase-loader";
import { carregarObrasSupabasePublicadas } from "./lib/em-alta-supabase-works-loader";
import { sincronizarColecaoRankingSupabase } from "./lib/em-alta-collection-supabase-sync";
import { registrarColecaoRankingNoDiario } from "./lib/em-alta-diary-activity";
import {
  criarHrefLeituraCapitulo,
  criarLinkPerfilAutorRanking,
  criarLoginHrefEmAlta,
} from "./lib/em-alta-route-utils";
import {
  calcularCapitulosLidos,
  calcularProgressoLeitura,
  encontrarCapituloParaContinuar,
  formatarDataRanking,
  formatarGeneroCard,
  formatarMediaRanking,
  formatarNumero,
  normalizarAvaliacoesLocaisRanking,
  normalizarVisualizacoesRanking,
  obterAvaliacaoLocalRanking,
  obterVisualizacoesRegistradasObra,
} from "./lib/em-alta-ranking-data-utils";
import {
  carouselArrowLeftIconStyle,
  carouselArrowLeftStyle,
  carouselArrowRightIconStyle,
  carouselArrowRightStyle,
  carouselShellStyle,
  carouselStyle,
  authorLinkStyle,
  cardContentStyle,
  cardMetaRowStyle,
  cardTopStyle,
  classificationBadgeStyle,
  coroaNumberStyle,
  criarDesktopSectionHeaderTemaStyle,
  criarCardRankingStyle,
  criarDecoracaoPaginaStyle,
  criarObraCardTitleRankingStyle,
  criarRankingCoverStyle,
  criarRankingTierInlineBadgeStyle,
  criarSectionHeaderTemaStyle,
  criarSectionIconStyle,
  desktopCarouselShellStyle,
  desktopCarouselStyle,
  desktopCardContentStyle,
  desktopContainerStyle,
  desktopHeaderTitleLinkStyle,
  desktopHeaderTitleMarkStyle,
  desktopHeaderTitleTextStyle,
  desktopSectionHeaderContentStyle,
  desktopSectionStyle,
  desktopSectionTextBlockStyle,
  desktopTopWaterFadeStyle,
  desktopTitleHeaderStyle,
  desktopRankingCardActionRowStyle,
  desktopRankingThemeBadgeStyle,
  formatBadgeStyle,
  headerTitleLinkStyle,
  headerTitleMarkStyle,
  headerTitleTextStyle,
  heartMetricIconStyle,
  metricIconStyle,
  metricValueStyle,
  mobileTopWaterFadeStyle,
  pageDecorationLayerStyle,
  pageStyle,
  publishedStatusStyle,
  rankingCardActionRowStyle,
  rankingThemeBadgeStyle,
  ratingStatsStyle,
  containerStyle,
  sectionHeaderContentStyle,
  sectionStyle,
  sectionTextBlockStyle,
  sectionTitleStyle,
  statusRowStyle,
  statusStyle,
  starMetricIconStyle,
  statsItemStyle,
  statsStyle,
  titleHeaderStyle,
} from "./lib/em-alta-ranking-visual-style-utils";
import { obterTemaPosicao } from "./lib/em-alta-ranking-position-theme";
import { obterTemaRanking } from "./lib/em-alta-ranking-category-theme";
import { AutorRankingCard } from "./components/em-alta-author-ranking-card";
import { LoadingSpinner } from "./components/em-alta-loading-spinner";
import { EmAltaLanguageBridge } from "./components/em-alta-language-bridge";

export default function EmAltaPage() {
  const router = useRouter();
  const [obrasLocais, setObrasLocais] = useState<ObraLocal[]>([]);
  const [obrasFavoritas, setObrasFavoritas] = useState<string[]>([]);
  const [obrasConcluidas, setObrasConcluidas] = useState<string[]>([]);
  const [visualizacoesRegistradas, setVisualizacoesRegistradas] = useState<
    Record<string, number>
  >({});
  const [avaliacoesLocaisRegistradas, setAvaliacoesLocaisRegistradas] =
    useState<Record<string, number>>({});
  const isDesktop = useEmAltaDesktopMode();
  const [carregandoRanking, setCarregandoRanking] = useState(true);
  const [usuarioLogado, setUsuarioLogado] = useState(false);
  const [usuarioLogadoId, setUsuarioLogadoId] = useState("");
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  useEffect(() => {
    let ativo = true;

    async function verificarUsuarioLogado() {
      try {
        const { data } = await supabase.auth.getUser();

        window.setTimeout(() => {
          if (ativo) {
            setUsuarioLogado(Boolean(data.user));
            setUsuarioLogadoId(data.user?.id || "");
          }
        }, 0);
      } catch {
        window.setTimeout(() => {
          if (ativo) {
            setUsuarioLogado(false);
            setUsuarioLogadoId("");
          }
        }, 0);
      }
    }

    void verificarUsuarioLogado();

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function carregarRanking() {
      window.setTimeout(() => {
        if (!cancelado) {
          setCarregandoRanking(true);
        }
      }, 0);

      try {
        const obrasNormalizadas: ObraLocal[] = [];
        let userIdAtual = usuarioLogadoId;

        if (!userIdAtual) {
          try {
            const { data } = await supabase.auth.getUser();
            userIdAtual = data.user?.id || "";
          } catch {
            userIdAtual = "";
          }
        }

        const [favoritosSupabase, concluidasSupabase] = await Promise.all([
          carregarIdsColecaoUsuarioSupabaseEmAlta("favoritos", userIdAtual),
          carregarIdsColecaoUsuarioSupabaseEmAlta("concluidas", userIdAtual),
        ]);

        const obrasFavoritasNormalizadas = normalizarListaIdsEmAlta([
          ...carregarListaIdsLocalEmAlta(FAVORITES_STORAGE_KEY, userIdAtual),
          ...favoritosSupabase,
        ]);

        const obrasConcluidasNormalizadas = normalizarListaIdsEmAlta([
          ...carregarListaIdsLocalEmAlta(COMPLETED_STORAGE_KEY, userIdAtual),
          ...concluidasSupabase,
        ]);

        salvarListaIdsLocalEmAlta(
          FAVORITES_STORAGE_KEY,
          userIdAtual,
          obrasFavoritasNormalizadas,
        );
        salvarListaIdsLocalEmAlta(
          COMPLETED_STORAGE_KEY,
          userIdAtual,
          obrasConcluidasNormalizadas,
        );

        const chaveVisualizacoesUsuario = userIdAtual
          ? criarStorageKeyUsuarioEmAlta(VIEWED_WORKS_STORAGE_KEY, userIdAtual)
          : "";
        const visualizacoesTexto = chaveVisualizacoesUsuario
          ? localStorage.getItem(chaveVisualizacoesUsuario)
          : null;
        const visualizacoesJson = visualizacoesTexto
          ? JSON.parse(visualizacoesTexto)
          : {};
        const visualizacoesNormalizadas =
          normalizarVisualizacoesRanking(visualizacoesJson);

        const chaveAvaliacoesUsuario = userIdAtual
          ? criarStorageKeyUsuarioEmAlta(RATED_WORKS_STORAGE_KEY, userIdAtual)
          : "";
        const avaliacoesLocaisTexto = chaveAvaliacoesUsuario
          ? localStorage.getItem(chaveAvaliacoesUsuario)
          : null;
        const avaliacoesLocaisJson = avaliacoesLocaisTexto
          ? JSON.parse(avaliacoesLocaisTexto)
          : {};
        const avaliacoesLocaisNormalizadas =
          normalizarAvaliacoesLocaisRanking(avaliacoesLocaisJson);

        window.setTimeout(() => {
          if (!cancelado) {
            setUsuarioLogado(Boolean(userIdAtual));
            setUsuarioLogadoId(userIdAtual);
            setObrasLocais(obrasNormalizadas);
            setObrasFavoritas(obrasFavoritasNormalizadas);
            setObrasConcluidas(obrasConcluidasNormalizadas);
            setVisualizacoesRegistradas(visualizacoesNormalizadas);
            setAvaliacoesLocaisRegistradas(avaliacoesLocaisNormalizadas);
          }
        }, 0);

        const obrasComSupabase =
          await carregarObrasSupabasePublicadas(
            obrasNormalizadas,
            userIdAtual,
          );

        window.setTimeout(() => {
          if (!cancelado) {
            setObrasLocais(obrasComSupabase);
          }
        }, 0);
      } catch {
        window.setTimeout(() => {
          if (!cancelado) {
            setObrasLocais([]);
            setObrasFavoritas([]);
            setObrasConcluidas([]);
            setVisualizacoesRegistradas({});
            setAvaliacoesLocaisRegistradas({});
          }
        }, 0);
      } finally {
        window.setTimeout(() => {
          if (!cancelado) {
            setCarregandoRanking(false);
          }
        }, 0);
      }
    }

    void carregarRanking();

    return () => {
      cancelado = true;
    };
  }, [usuarioLogadoId]);

  const ranking = useMemo<ObraRanking[]>(() => {
    return obrasLocais
      .filter(
        (obra) =>
          obra.publicado && !ehClassificacao18(obra.classificacaoIndicativa),
      )
      .map((obra) => {
        const totalCurtidas = Math.max(0, obra.totalCurtidasRanking || 0);
        const totalComentarios = Math.max(0, obra.totalComentariosRanking || 0);
        const totalSalvos = Math.max(0, obra.totalSalvosRanking || 0);
        const avaliacaoLocalObra = obterAvaliacaoLocalRanking(
          obra,
          avaliacoesLocaisRegistradas,
        );
        const totalAvaliacoes = Math.max(
          0,
          obra.totalAvaliacoesRanking || 0,
          avaliacaoLocalObra > 0 ? 1 : 0,
        );
        const mediaAvaliacoes = Math.max(
          0,
          Math.min(
            5,
            Math.max(obra.mediaAvaliacoesRanking || 0, avaliacaoLocalObra),
          ),
        );

        const visualizacoesRegistradasObra = obterVisualizacoesRegistradasObra(
          obra,
          visualizacoesRegistradas,
        );
        const capitulosLidos = calcularCapitulosLidos(obra.capitulos);
        const visualizacoes = Math.max(
          obra.totalViewsRanking || 0,
          visualizacoesRegistradasObra,
        );
        const progressoLeitura = calcularProgressoLeitura(obra.capitulos);
        const capituloParaContinuar = encontrarCapituloParaContinuar(obra);
        const ultimoCapituloLidoTitulo = capituloParaContinuar
          ? capituloParaContinuar.titulo
          : "";
        const indiceCapituloParaContinuar = capituloParaContinuar
          ? obra.capitulos.findIndex(
              (capitulo) => capitulo.id === capituloParaContinuar.id,
            )
          : -1;
        const numeroCapituloParaContinuar =
          indiceCapituloParaContinuar >= 0
            ? indiceCapituloParaContinuar + 1
            : 1;
        const ultimoCapituloLidoHref = capituloParaContinuar
          ? criarHrefLeituraCapitulo(
              obra,
              capituloParaContinuar,
              numeroCapituloParaContinuar,
            )
          : "";
        const ultimaLeituraEm =
          obra.ultimaLeituraEm || capituloParaContinuar?.lidoEm || "";

        const criadaEmTimestamp = new Date(obra.criadaEm).getTime();
        const dataValida = Number.isNaN(criadaEmTimestamp)
          ? 0
          : criadaEmTimestamp;

        const pontuacao =
          totalCurtidas * 2 +
          totalComentarios * 3 +
          totalSalvos * 4 +
          visualizacoes * 1 +
          totalAvaliacoes * 4 +
          Math.round(mediaAvaliacoes * 4);

        return {
          id: `local-${obra.id}`,
          storageId: obra.id,
          tipo: "local",
          titulo: obra.titulo,
          autor: obra.autor,
          autorId: obra.autorId || "",
          autorAvatar: obra.autorAvatarRanking || "",
          seguidoresAutor: obra.totalSeguidoresAutorRanking || 0,
          genero: obra.genero,
          formato: obra.formato,
          classificacaoIndicativa: obra.classificacaoIndicativa,
          status: "Publicado",
          href: obra.link || `/obra/${obra.slug}`,
          disponivel: true,
          capa: obra.capa,
          capaNome: obra.capaNome,
          capitulos: obra.capitulos.length,
          capitulosLidos,
          progressoLeitura,
          ultimoCapituloLidoTitulo,
          ultimoCapituloLidoHref,
          ultimaLeituraEm,
          curtidas: totalCurtidas,
          comentarios: totalComentarios,
          salvos: totalSalvos,
          views: visualizacoes,
          avaliacoes: totalAvaliacoes,
          mediaAvaliacao: mediaAvaliacoes,
          pontuacao,
          criadaEmTimestamp: dataValida,
        } satisfies ObraRanking;
      });
  }, [avaliacoesLocaisRegistradas, obrasLocais, visualizacoesRegistradas]);

  const rankingAutores = useMemo<AutorRanking[]>(() => {
    type AutorRankingAcumulado = AutorRanking & {
      somaNotas: number;
      pesoNotas: number;
    };

    const autoresPorChave = new Map<string, AutorRankingAcumulado>();

    ranking.forEach((obra) => {
      const nome = obra.autor.trim();
      const nomeNormalizado = normalizarTexto(nome);

      if (!nome || nomeNormalizado === "autor nao informado") {
        return;
      }

      const autorId = obra.autorId?.trim() || "";
      const chave = autorId || `nome:${nomeNormalizado}`;
      const pesoNota =
        obra.avaliacoes > 0 ? obra.avaliacoes : obra.mediaAvaliacao > 0 ? 1 : 0;
      const existente = autoresPorChave.get(chave);

      if (!existente) {
        autoresPorChave.set(chave, {
          id: chave,
          nome,
          autorId,
          avatar: obra.autorAvatar,
          href: criarLinkPerfilAutorRanking(nome, autorId),
          obras: 1,
          capitulos: obra.capitulos,
          seguidores: obra.seguidoresAutor,
          seguidoresObras: obra.salvos,
          views: obra.views,
          curtidas: obra.curtidas,
          comentarios: obra.comentarios,
          avaliacoes: obra.avaliacoes,
          mediaAvaliacao: 0,
          pontuacao: 0,
          somaNotas: obra.mediaAvaliacao * pesoNota,
          pesoNotas: pesoNota,
        });

        return;
      }

      existente.obras += 1;
      existente.capitulos += obra.capitulos;
      existente.seguidores = Math.max(
        existente.seguidores,
        obra.seguidoresAutor,
      );
      existente.seguidoresObras += obra.salvos;
      existente.views += obra.views;
      existente.curtidas += obra.curtidas;
      existente.comentarios += obra.comentarios;
      existente.avaliacoes += obra.avaliacoes;
      existente.somaNotas += obra.mediaAvaliacao * pesoNota;
      existente.pesoNotas += pesoNota;

      if (!existente.avatar && obra.autorAvatar) {
        existente.avatar = obra.autorAvatar;
      }

      if (!existente.autorId && autorId) {
        existente.autorId = autorId;
        existente.href = criarLinkPerfilAutorRanking(existente.nome, autorId);
      }
    });

    return Array.from(autoresPorChave.values())
      .map((autor) => {
        const mediaAvaliacao =
          autor.pesoNotas > 0 ? autor.somaNotas / autor.pesoNotas : 0;
        const pontuacao =
          autor.obras * 1 +
          autor.seguidores * 4 +
          autor.seguidoresObras * 4 +
          autor.views * 1 +
          autor.curtidas * 2 +
          autor.comentarios * 3 +
          autor.avaliacoes * 4 +
          Math.round(mediaAvaliacao * 4);

        const {
          somaNotas: _somaNotas,
          pesoNotas: _pesoNotas,
          ...autorFinal
        } = autor;
        void _somaNotas;
        void _pesoNotas;

        return {
          ...autorFinal,
          mediaAvaliacao,
          pontuacao,
        };
      })
      .sort((autorA, autorB) => {
        if (autorB.pontuacao !== autorA.pontuacao) {
          return autorB.pontuacao - autorA.pontuacao;
        }

        if (autorB.views !== autorA.views) {
          return autorB.views - autorA.views;
        }

        return autorA.nome.localeCompare(autorB.nome, "pt-BR");
      })
      .slice(0, 5);
  }, [ranking]);

  const obrasFavoritasProtegidas = usuarioLogado ? obrasFavoritas : [];
  const obrasConcluidasProtegidas = usuarioLogado ? obrasConcluidas : [];

  const rankingGeral = useMemo(
    () => pegarTopRanking(ranking, "geral"),
    [ranking],
  );

  const rankingMaisLidas = useMemo(
    () => pegarTopRanking(ranking, "lidas"),
    [ranking],
  );

  const rankingMaisCurtidas = useMemo(
    () => pegarTopRanking(ranking, "curtidas"),
    [ranking],
  );

  const rankingMaisComentadas = useMemo(
    () => pegarTopRanking(ranking, "comentadas"),
    [ranking],
  );

  const rankingMaisSalvas = useMemo(
    () => pegarTopRanking(ranking, "salvas"),
    [ranking],
  );

  const rankingMaisRecentes = useMemo(
    () => pegarTopRanking(ranking, "recentes"),
    [ranking],
  );

  const rankingMaisCapitulos = useMemo(
    () => pegarTopRanking(ranking, "capitulos"),
    [ranking],
  );

  const rankingTemAtividadeReal = useMemo(() => {
    return ranking.some((obra) => rankingTemInteracaoReal(obra));
  }, [ranking]);

  const rankingParaCatalogoInicial = useMemo(() => {
    return rankingMaisRecentes.length > 0 ? rankingMaisRecentes : rankingGeral;
  }, [rankingGeral, rankingMaisRecentes]);

  const tituloCabecalho = carregandoRanking
    ? "ISTORIETAS"
    : rankingTemAtividadeReal
      ? "ISTORIETAS POPULARES"
      : "ISTORIETAS PUBLICADAS";

  function avisarLoginRanking() {
    router.push(criarLoginHrefEmAlta());
  }

  async function usuarioTemSessaoAtiva() {
    try {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id || "";
      const logado = Boolean(userId);

      setUsuarioLogado(logado);
      setUsuarioLogadoId(userId);

      return logado;
    } catch {
      setUsuarioLogado(false);
      setUsuarioLogadoId("");

      return false;
    }
  }

  async function alternarFavorito(obraId: string) {
    const logado = await usuarioTemSessaoAtiva();

    if (!logado) {
      avisarLoginRanking();
      return;
    }

    const obraRanking =
      ranking.find((obra) => {
        return obra.storageId === obraId || obra.id === obraId;
      }) || null;

    const obraVaiFicarFavorita = obraRanking
      ? !listaTemRankingObra(obraRanking, obrasFavoritas)
      : !obrasFavoritas.includes(obraId);

    const novasObrasFavoritas = obraRanking
      ? obraVaiFicarFavorita
        ? adicionarRankingObraNaLista(obraRanking, obrasFavoritas)
        : removerRankingObraDaLista(obraRanking, obrasFavoritas)
      : obraVaiFicarFavorita
        ? normalizarListaIdsEmAlta([...obrasFavoritas, obraId])
        : obrasFavoritas.filter((id) => id !== obraId);

    salvarListaIdsLocalEmAlta(
      FAVORITES_STORAGE_KEY,
      usuarioLogadoId,
      novasObrasFavoritas,
    );

    setObrasFavoritas(novasObrasFavoritas);

    void sincronizarColecaoRankingSupabase(
      "favoritos",
      obraRanking,
      obraVaiFicarFavorita,
    );

    if (obraVaiFicarFavorita) {
      void registrarColecaoRankingNoDiario("favoritou_obra", obraRanking);
    }
  }

  async function alternarConcluido(obraId: string) {
    const logado = await usuarioTemSessaoAtiva();

    if (!logado) {
      avisarLoginRanking();
      return;
    }

    const obraRanking =
      ranking.find((obra) => {
        return obra.storageId === obraId || obra.id === obraId;
      }) || null;

    const obraVaiFicarConcluida = obraRanking
      ? !listaTemRankingObra(obraRanking, obrasConcluidas)
      : !obrasConcluidas.includes(obraId);

    const novasObrasConcluidas = obraRanking
      ? obraVaiFicarConcluida
        ? adicionarRankingObraNaLista(obraRanking, obrasConcluidas)
        : removerRankingObraDaLista(obraRanking, obrasConcluidas)
      : obraVaiFicarConcluida
        ? normalizarListaIdsEmAlta([...obrasConcluidas, obraId])
        : obrasConcluidas.filter((id) => id !== obraId);

    salvarListaIdsLocalEmAlta(
      COMPLETED_STORAGE_KEY,
      usuarioLogadoId,
      novasObrasConcluidas,
    );

    setObrasConcluidas(novasObrasConcluidas);

    void sincronizarColecaoRankingSupabase(
      "concluidas",
      obraRanking,
      obraVaiFicarConcluida,
    );

    if (obraVaiFicarConcluida) {
      void registrarColecaoRankingNoDiario("concluiu_obra", obraRanking);
    }
  }

  if (carregandoRanking) {
    return (
      <main
        className="historietas-em-alta-page"
        data-historietas-em-alta-root="true"
        style={pageThemeStyle}
        aria-busy="true"
      >
        <style>{`${historietasThemeCss}${emAltaPageCss}`}</style>
        <EmAltaLanguageBridge />
        <LoadingSpinner label="Carregando Em Alta" />
      </main>
    );
  }

  return (
    <main
      className="historietas-em-alta-page"
      data-historietas-em-alta-root="true"
      style={pageThemeStyle}
    >
      <style>{`${historietasThemeCss}${emAltaPageCss}`}</style>
      <EmAltaLanguageBridge />

      <div style={pageDecorationLayerStyle} aria-hidden="true">
        {["#", "★"].map((decoracao, index) => (
          <span
            key={`${decoracao}-${index}`}
            style={criarDecoracaoPaginaStyle(index)}
          >
            {decoracao}
          </span>
        ))}
      </div>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}

      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={isDesktop ? desktopTitleHeaderStyle : titleHeaderStyle}>
          <Link
            href="/"
            style={
              isDesktop ? desktopHeaderTitleLinkStyle : headerTitleLinkStyle
            }
            aria-label="Voltar para a Home"
          >
            <span
              className="historietas-em-alta-logo-mark"
              style={
                isDesktop ? desktopHeaderTitleMarkStyle : headerTitleMarkStyle
              }
            >
              H
            </span>
            <span
              className="historietas-em-alta-hero-title"
              style={
                isDesktop ? desktopHeaderTitleTextStyle : headerTitleTextStyle
              }
            >
              {tituloCabecalho}
            </span>
          </Link>

        </header>

        {!carregandoRanking && ranking.length > 0 && rankingTemAtividadeReal && (
          <>
            <AutoresEmAltaSection
              autores={rankingAutores}
              isDesktop={isDesktop}
            />

            <RankingSection
              titulo="Ranking Mestre"
              descricao=""
              obras={rankingGeral}
              tipo="geral"
              obrasFavoritas={obrasFavoritasProtegidas}
              obrasConcluidas={obrasConcluidasProtegidas}
              onAlternarFavorito={alternarFavorito}
              onAlternarConcluido={alternarConcluido}
              isDesktop={isDesktop}
            />

            <RankingSection
              titulo="Alcance Dominante"
              descricao="As histórias que mais chamaram atenção dos leitores."
              obras={rankingMaisLidas}
              tipo="lidas"
              obrasFavoritas={obrasFavoritasProtegidas}
              obrasConcluidas={obrasConcluidasProtegidas}
              onAlternarFavorito={alternarFavorito}
              onAlternarConcluido={alternarConcluido}
              isDesktop={isDesktop}
            />

            <RankingSection
              titulo="Preferidas do Público"
              descricao="As obras que mais receberam curtidas e reações positivas."
              obras={rankingMaisCurtidas}
              tipo="curtidas"
              obrasFavoritas={obrasFavoritasProtegidas}
              obrasConcluidas={obrasConcluidasProtegidas}
              onAlternarFavorito={alternarFavorito}
              onAlternarConcluido={alternarConcluido}
              isDesktop={isDesktop}
            />

            <RankingSection
              titulo="Mais Comentadas"
              descricao="As histórias que mais puxaram conversa entre os leitores."
              obras={rankingMaisComentadas}
              tipo="comentadas"
              obrasFavoritas={obrasFavoritasProtegidas}
              obrasConcluidas={obrasConcluidasProtegidas}
              onAlternarFavorito={alternarFavorito}
              onAlternarConcluido={alternarConcluido}
              isDesktop={isDesktop}
            />

            <RankingSection
              titulo="Mais Seguidas"
              descricao="Obras que mais leitores decidiram acompanhar."
              obras={rankingMaisSalvas}
              tipo="salvas"
              obrasFavoritas={obrasFavoritasProtegidas}
              obrasConcluidas={obrasConcluidasProtegidas}
              onAlternarFavorito={alternarFavorito}
              onAlternarConcluido={alternarConcluido}
              isDesktop={isDesktop}
            />

            <RankingSection
              titulo="Novas Promessas"
              descricao="Publicações recentes começando a aparecer no radar."
              obras={rankingMaisRecentes}
              tipo="recentes"
              obrasFavoritas={obrasFavoritasProtegidas}
              obrasConcluidas={obrasConcluidasProtegidas}
              onAlternarFavorito={alternarFavorito}
              onAlternarConcluido={alternarConcluido}
              isDesktop={isDesktop}
            />

            <RankingSection
              titulo="Grandes Jornadas"
              descricao="Histórias com mais capítulos e conteúdo publicado."
              obras={rankingMaisCapitulos}
              tipo="capitulos"
              obrasFavoritas={obrasFavoritasProtegidas}
              obrasConcluidas={obrasConcluidasProtegidas}
              onAlternarFavorito={alternarFavorito}
              onAlternarConcluido={alternarConcluido}
              isDesktop={isDesktop}
            />
          </>
        )}

        {!carregandoRanking && ranking.length > 0 && !rankingTemAtividadeReal && (
          <>
            <p
              style={{
                margin: "10px 0 18px",
                color: "#FFFFFF",
                fontSize: "12px",
                fontWeight: 800,
                textAlign: "center",
              }}
            >
              Catálogo em formação
            </p>

            <RankingSection
              titulo="Obras publicadas"
              descricao="Catálogo inicial com obras publicadas no HISTORIETAS."
              obras={rankingParaCatalogoInicial}
              tipo="recentes"
              obrasFavoritas={obrasFavoritasProtegidas}
              obrasConcluidas={obrasConcluidasProtegidas}
              onAlternarFavorito={alternarFavorito}
              onAlternarConcluido={alternarConcluido}
              isDesktop={isDesktop}
            />
          </>
        )}

        {!carregandoRanking && ranking.length === 0 && (
          <p
            style={{
              margin: "10px 0 0",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            Ainda não há obras publicadas
          </p>
        )}
      </section>
    </main>
  );
}
function RankingSection({
  titulo,
  obras,
  tipo,
  obrasFavoritas,
  obrasConcluidas,
  onAlternarFavorito: _onAlternarFavorito,
  onAlternarConcluido: _onAlternarConcluido,
  isDesktop,
}: {
  titulo: string;
  descricao: string;
  obras: ObraRanking[];
  tipo: TipoRanking;
  obrasFavoritas: string[];
  obrasConcluidas: string[];
  onAlternarFavorito: (obraId: string) => void;
  onAlternarConcluido: (obraId: string) => void;
  isDesktop: boolean;
}) {
  void _onAlternarFavorito;
  void _onAlternarConcluido;

  const tema = obterTemaRanking(tipo);
  const carrosselRef = useRef<HTMLDivElement | null>(null);
  const obrasComPosicao = obras.map((obra, index) => ({
    obra,
    posicao: index + 1,
  }));
  const obrasEmOrdem = [...obrasComPosicao].reverse();

  function rolarCarrossel(direcao: "esquerda" | "direita") {
    const carrossel = carrosselRef.current;

    if (!carrossel) {
      return;
    }

    const distancia = Math.max(320, Math.floor(carrossel.clientWidth * 0.82));

    carrossel.scrollBy({
      left: direcao === "direita" ? distancia : -distancia,
      behavior: "smooth",
    });
  }

  return (
    <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
      <div
        style={
          isDesktop
            ? criarDesktopSectionHeaderTemaStyle(tema)
            : criarSectionHeaderTemaStyle(tema)
        }
      >
        <div
          style={
            isDesktop
              ? desktopSectionHeaderContentStyle
              : sectionHeaderContentStyle
          }
        >
          <span
            className={`historietas-em-alta-emoji-icon${
              tipo === "curtidas" ? " historietas-em-alta-heart-icon" : ""
            }`}
            style={{
              ...criarSectionIconStyle(tema),
              ...(tipo === "curtidas"
                ? {
                    color:
                      "#EF4444",
                    fontFamily: "Arial, Helvetica, sans-serif",
                  }
                : {}),
            }}
          >
            {tema.icone}
          </span>

          <div
            style={
              isDesktop ? desktopSectionTextBlockStyle : sectionTextBlockStyle
            }
          >
            <h2
              style={
                isDesktop
                  ? {
                      ...sectionTitleStyle,
                      color: "#FFFFFF",
                      textAlign: "center",
                    }
                  : { ...sectionTitleStyle, color: "#FFFFFF" }
              }
            >
              {titulo}
            </h2>
          </div>
        </div>
      </div>

      {obras.length > 0 ? (
        <div style={isDesktop ? desktopCarouselShellStyle : carouselShellStyle}>
          {isDesktop && obras.length > 3 && (
            <button
              type="button"
              aria-label={`Voltar carrossel ${titulo}`}
              onClick={(event) => {
                event.stopPropagation();
                rolarCarrossel("esquerda");
              }}
              style={carouselArrowLeftStyle}
            >
              <span aria-hidden="true" style={carouselArrowLeftIconStyle} />
            </button>
          )}

          <div
            ref={carrosselRef}
            style={isDesktop ? desktopCarouselStyle : carouselStyle}
            aria-label={`${titulo} em carrossel`}
          >
            {obrasEmOrdem.map(({ obra, posicao }) => (
              <RankingCard
                key={`${tipo}-${obra.id}`}
                obra={obra}
                posicao={posicao}
                tipo={tipo}
                favorita={listaTemRankingObra(obra, obrasFavoritas)}
                concluida={listaTemRankingObra(obra, obrasConcluidas)}
                isDesktop={isDesktop}
              />
            ))}
          </div>

          {isDesktop && obras.length > 3 && (
            <button
              type="button"
              aria-label={`Avançar carrossel ${titulo}`}
              onClick={(event) => {
                event.stopPropagation();
                rolarCarrossel("direita");
              }}
              style={carouselArrowRightStyle}
            >
              <span aria-hidden="true" style={carouselArrowRightIconStyle} />
            </button>
          )}
        </div>
      ) : (
        <p
          style={{
            margin: "10px 0 0",
            color: "#FFFFFF",
            fontSize: "12px",
            fontWeight: 800,
            textAlign: "center",
          }}
        >
          Nada para mostrar neste ranking
        </p>
      )}
    </section>
  );
}
function AutoresEmAltaSection({
  autores,
  isDesktop,
}: {
  autores: AutorRanking[];
  isDesktop: boolean;
}) {
  const tema = obterTemaRanking("geral");
  const carrosselRef = useRef<HTMLDivElement | null>(null);
  const autoresComPosicao = autores.map((autor, index) => ({
    autor,
    posicao: index + 1,
  }));
  const autoresEmOrdem = [...autoresComPosicao].reverse();

  function rolarCarrossel(direcao: "esquerda" | "direita") {
    const carrossel = carrosselRef.current;

    if (!carrossel) {
      return;
    }

    const distancia = Math.max(320, Math.floor(carrossel.clientWidth * 0.82));

    carrossel.scrollBy({
      left: direcao === "direita" ? distancia : -distancia,
      behavior: "smooth",
    });
  }

  if (autores.length === 0) {
    return null;
  }

  return (
    <section style={isDesktop ? desktopSectionStyle : sectionStyle}>
      <div
        style={
          isDesktop
            ? criarDesktopSectionHeaderTemaStyle(tema)
            : criarSectionHeaderTemaStyle(tema)
        }
      >
        <div
          style={
            isDesktop
              ? desktopSectionHeaderContentStyle
              : sectionHeaderContentStyle
          }
        >
          <span className="historietas-em-alta-emoji-icon" style={criarSectionIconStyle(tema)}>👤</span>

          <div
            style={
              isDesktop ? desktopSectionTextBlockStyle : sectionTextBlockStyle
            }
          >
            <h2
              style={
                isDesktop
                  ? {
                      ...sectionTitleStyle,
                      color: "#FFFFFF",
                      textAlign: "center",
                    }
                  : { ...sectionTitleStyle, color: "#FFFFFF" }
              }
            >
              Autores em Alta
            </h2>
          </div>
        </div>
      </div>

      <div style={isDesktop ? desktopCarouselShellStyle : carouselShellStyle}>
        {isDesktop && autores.length > 3 && (
          <button
            type="button"
            aria-label="Voltar carrossel Autores em Alta"
            onClick={(event) => {
              event.stopPropagation();
              rolarCarrossel("esquerda");
            }}
            style={carouselArrowLeftStyle}
          >
            <span aria-hidden="true" style={carouselArrowLeftIconStyle} />
          </button>
        )}

        <div
          ref={carrosselRef}
          style={isDesktop ? desktopCarouselStyle : carouselStyle}
          aria-label="Autores em Alta em carrossel"
        >
          {autoresEmOrdem.map(({ autor, posicao }) => (
            <AutorRankingCard
              key={`autor-ranking-${autor.id}`}
              autor={autor}
              posicao={posicao}
              isDesktop={isDesktop}
            />
          ))}
        </div>

        {isDesktop && autores.length > 3 && (
          <button
            type="button"
            aria-label="Avançar carrossel Autores em Alta"
            onClick={(event) => {
              event.stopPropagation();
              rolarCarrossel("direita");
            }}
            style={carouselArrowRightStyle}
          >
            <span aria-hidden="true" style={carouselArrowRightIconStyle} />
          </button>
        )}
      </div>
    </section>
  );
}

function RankingCard({
  obra,
  posicao,
  tipo,
  favorita,
  concluida,
  isDesktop,
}: {
  obra: ObraRanking;
  posicao: number;
  tipo: TipoRanking;
  favorita: boolean;
  concluida: boolean;
  isDesktop: boolean;
}) {
  void favorita;
  void concluida;

  const router = useRouter();
  const mostrarClassificacao =
    obra.classificacaoIndicativa &&
    obra.classificacaoIndicativa !== "Não informada";
  const temaPosicao = obterTemaPosicao(posicao);
  const generoCard = formatarGeneroCard(obra.genero);
  const formatoCard = obra.formato.trim() || "História";
  const mostrarGeneroRanking = Boolean(
    generoCard && normalizarTexto(generoCard) !== "nao informado",
  );
  const mostrarFormatoRanking = Boolean(
    formatoCard && normalizarTexto(formatoCard) !== "nao informado",
  );
  const mostrarStatusRanking = normalizarTexto(obra.status) !== "publicado";
  const mostrarFormatoNoTopoRankingMestre =
    tipo === "geral" && mostrarFormatoRanking;
  const destaque =
    tipo === "geral"
      ? `${formatarNumero(obra.pontuacao)} pts`
      : tipo === "lidas"
        ? `${formatarNumero(obra.views)} visualizações`
        : tipo === "curtidas"
          ? `${formatarNumero(obra.curtidas)} curtidas`
          : tipo === "comentadas"
            ? `${formatarNumero(obra.comentarios)} comentários`
            : tipo === "salvas"
              ? `${formatarNumero(obra.salvos)} seguidores`
              : tipo === "recentes"
                ? formatarDataRanking(obra.criadaEmTimestamp)
                : `${formatarNumero(obra.capitulos)} capítulos`;

  function abrirObra() {
    router.push(obra.href);
  }

  return (
    <article
      className="historietas-ranking-card historietas-ranking-work-card"
      data-ranking-level={temaPosicao.nome.toLowerCase()}
      style={criarCardRankingStyle(posicao, obra.disponivel, tipo, isDesktop)}
      role="link"
      tabIndex={0}
      aria-label={`Abrir página da obra ${obra.titulo}`}
      onClick={abrirObra}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          abrirObra();
        }
      }}
    >
      <div style={criarRankingCoverStyle(obra.capa, isDesktop)}>
        {null}
      </div>

      <div style={isDesktop ? desktopCardContentStyle : cardContentStyle}>
        <div style={cardTopStyle}>
          <h3 data-historietas-i18n-ignore="true" style={criarObraCardTitleRankingStyle()}>{obra.titulo}</h3>
        </div>

        <Link
          href={criarLinkPerfilAutorRanking(obra.autor, obra.autorId)}
          style={authorLinkStyle}
          aria-label={`Abrir perfil de ${obra.autor}`}
          onClick={(event) => {
            event.stopPropagation();
          }}
          onKeyDown={(event) => {
            event.stopPropagation();
          }}
        >
          Por{" "}
          <span data-historietas-i18n-ignore="true">{obra.autor}</span>
        </Link>

        {(mostrarFormatoNoTopoRankingMestre ||
          mostrarGeneroRanking ||
          mostrarClassificacao) && (
          <div style={cardMetaRowStyle}>
            {mostrarFormatoNoTopoRankingMestre && (
              <span className="historietas-ranking-level-line" style={formatBadgeStyle}>{formatoCard}</span>
            )}

            {mostrarGeneroRanking && (
              <span className="historietas-ranking-level-line" style={formatBadgeStyle}>{generoCard}</span>
            )}

            {mostrarClassificacao && (
              <span
                className="historietas-ranking-level-line"
                style={classificationBadgeStyle}
              >
                {obra.classificacaoIndicativa}
              </span>
            )}
          </div>
        )}

        {mostrarStatusRanking && (
          <div style={statusRowStyle}>
            <span
              style={obra.tipo === "local" ? publishedStatusStyle : statusStyle}
            >
              {obra.status}
            </span>
          </div>
        )}

        <div style={statsStyle}>
          <span style={statsItemStyle}>
            <span className="historietas-em-alta-emoji-icon" style={metricIconStyle} aria-hidden="true">
              💬
            </span>
            <span style={metricValueStyle}>
              {formatarNumero(obra.comentarios)}
            </span>
          </span>

          <span style={statsItemStyle}>
            <span className="historietas-em-alta-emoji-icon" style={metricIconStyle} aria-hidden="true">
              👥
            </span>
            <span style={metricValueStyle}>{formatarNumero(obra.salvos)}</span>
          </span>

          <span style={statsItemStyle}>
            <span className="historietas-em-alta-emoji-icon" style={metricIconStyle} aria-hidden="true">
              📚
            </span>
            <span style={metricValueStyle}>
              {formatarNumero(obra.capitulos)}
            </span>
          </span>
        </div>

        <div style={ratingStatsStyle}>
          <span style={statsItemStyle}>
            <span className="historietas-em-alta-emoji-icon" style={metricIconStyle} aria-hidden="true">
              👁
            </span>
            <span style={metricValueStyle}>{formatarNumero(obra.views)}</span>
          </span>

          <span style={statsItemStyle}>
            <span className="historietas-em-alta-emoji-icon" style={heartMetricIconStyle} aria-hidden="true">
              ❤️
            </span>
            <span style={metricValueStyle}>
              {formatarNumero(obra.curtidas)}
            </span>
          </span>

          <span style={statsItemStyle}>
            <span className="historietas-em-alta-emoji-icon" style={starMetricIconStyle} aria-hidden="true">
              ★
            </span>
            <span style={metricValueStyle}>
              {formatarMediaRanking(obra.mediaAvaliacao)}
            </span>
          </span>
        </div>

        <div
          style={
            isDesktop
              ? desktopRankingCardActionRowStyle
              : rankingCardActionRowStyle
          }
        >
          <span
            className="historietas-ranking-level-line"
            style={
              isDesktop ? desktopRankingThemeBadgeStyle : rankingThemeBadgeStyle
            }
          >
            {tipo === "geral"
              ? destaque
              : mostrarFormatoRanking
                ? formatoCard
                : "História"}
          </span>

          <span
            className="historietas-ranking-level-line historietas-ranking-tier-badge"
            style={criarRankingTierInlineBadgeStyle(posicao)}
            aria-label={`Posição ${posicao}º — ${temaPosicao.nome}`}
          >
            <span style={coroaNumberStyle}>{posicao}º</span>
            <span style={coroaNumberStyle}>{temaPosicao.nome}</span>
          </span>
        </div>
      </div>
    </article>
  );
}
