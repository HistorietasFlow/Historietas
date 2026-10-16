"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
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
  criarAutorAvatarRankingStyle,
  criarAutorCardTitleRankingStyle,
  criarAutorPointsBadgeStyle,
  criarAutorTierInlineBadgeStyle,
  criarCardRankingStyle,
  criarDecoracaoPaginaStyle,
  criarObraCardTitleRankingStyle,
  criarRankingCoverStyle,
  criarRankingTierInlineBadgeStyle,
  desktopCarouselShellStyle,
  desktopCarouselStyle,
  safeTextStyle,
} from "./lib/em-alta-ranking-visual-style-utils";
import { obterTemaPosicao } from "./lib/em-alta-ranking-position-theme";
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

function obterTemaRanking(tipo: TipoRanking) {
  if (tipo === "geral") {
    return {
      icone: "👑",
      label: "Ranking Mestre",
      titleColor: "var(--historietas-accent, var(--historietas-em-alta-hex-fdba74, #FDBA74))",
      accent: "var(--historietas-accent, var(--historietas-em-alta-hex-fdba74, #FDBA74))",
      border:
        "color-mix(in srgb, var(--historietas-accent, #FFFFFF) 42%, transparent)",
      borderStrong:
        "color-mix(in srgb, var(--historietas-accent, #FFFFFF) 58%, transparent)",
      glow: "color-mix(in srgb, var(--historietas-accent, #FFFFFF) 12%, transparent)",
      background:
        "linear-gradient(135deg, var(--historietas-em-alta-rgba-41-27-53-0-82, rgba(41,27,53,0.82)) 0%, var(--historietas-em-alta-rgba-18-12-30-0-92, rgba(18,12,30,0.92)) 100%)",
    };
  }

  if (tipo === "lidas") {
    return {
      icone: "👁",
      label: "Alcance",
      titleColor: "#FFFFFF",
      accent: "var(--historietas-em-alta-hex-38bdf8, #38BDF8)",
      border: "var(--historietas-em-alta-rgba-56-189-248-0-42, rgba(56,189,248,0.42))",
      borderStrong: "var(--historietas-em-alta-rgba-56-189-248-0-58, rgba(56,189,248,0.58))",
      glow: "var(--historietas-em-alta-rgba-56-189-248-0-12, rgba(56,189,248,0.12))",
      background:
        "linear-gradient(135deg, var(--historietas-em-alta-rgba-18-36-54-0-82, rgba(18,36,54,0.82)) 0%, var(--historietas-em-alta-rgba-11-17-32-0-92, rgba(11,17,32,0.92)) 100%)",
    };
  }

  if (tipo === "curtidas") {
    return {
      icone: "❤",
      label: "Reação",
      titleColor: "#FFFFFF",
      accent: "var(--historietas-em-alta-hex-fb7185, #FB7185)",
      border: "var(--historietas-em-alta-rgba-251-113-133-0-42, rgba(251,113,133,0.42))",
      borderStrong: "var(--historietas-em-alta-rgba-251-113-133-0-58, rgba(251,113,133,0.58))",
      glow: "var(--historietas-em-alta-rgba-251-113-133-0-12, rgba(251,113,133,0.12))",
      background:
        "linear-gradient(135deg, var(--historietas-em-alta-rgba-54-20-38-0-82, rgba(54,20,38,0.82)) 0%, var(--historietas-em-alta-rgba-29-13-27-0-92, rgba(29,13,27,0.92)) 100%)",
    };
  }

  if (tipo === "comentadas") {
    return {
      icone: "💬",
      label: "Discussão",
      titleColor: "#FFFFFF",
      accent: "var(--historietas-em-alta-hex-c084fc, #C084FC)",
      border: "var(--historietas-em-alta-rgba-192-132-252-0-42, rgba(192,132,252,0.42))",
      borderStrong: "var(--historietas-em-alta-rgba-192-132-252-0-58, rgba(192,132,252,0.58))",
      glow: "var(--historietas-em-alta-rgba-192-132-252-0-12, rgba(192,132,252,0.12))",
      background:
        "linear-gradient(135deg, var(--historietas-em-alta-rgba-40-25-62-0-82, rgba(40,25,62,0.82)) 0%, var(--historietas-em-alta-rgba-20-12-34-0-92, rgba(20,12,34,0.92)) 100%)",
    };
  }

  if (tipo === "salvas") {
    return {
      icone: "👥",
      label: "Seguidores",
      titleColor: "#FFFFFF",
      accent: "var(--historietas-em-alta-hex-34d399, #34D399)",
      border: "var(--historietas-em-alta-rgba-52-211-153-0-42, rgba(52,211,153,0.42))",
      borderStrong: "var(--historietas-em-alta-rgba-52-211-153-0-58, rgba(52,211,153,0.58))",
      glow: "var(--historietas-em-alta-rgba-52-211-153-0-11, rgba(52,211,153,0.11))",
      background:
        "linear-gradient(135deg, var(--historietas-em-alta-rgba-17-48-39-0-82, rgba(17,48,39,0.82)) 0%, var(--historietas-em-alta-rgba-10-29-25-0-92, rgba(10,29,25,0.92)) 100%)",
    };
  }

  if (tipo === "recentes") {
    return {
      icone: "✨",
      label: "Novidade",
      titleColor: "#FFFFFF",
      accent: "var(--historietas-em-alta-hex-f472b6, #F472B6)",
      border: "var(--historietas-em-alta-rgba-244-114-182-0-42, rgba(244,114,182,0.42))",
      borderStrong: "var(--historietas-em-alta-rgba-244-114-182-0-58, rgba(244,114,182,0.58))",
      glow: "var(--historietas-em-alta-rgba-244-114-182-0-11, rgba(244,114,182,0.11))",
      background:
        "linear-gradient(135deg, var(--historietas-em-alta-rgba-54-22-45-0-82, rgba(54,22,45,0.82)) 0%, var(--historietas-em-alta-rgba-30-13-31-0-92, rgba(30,13,31,0.92)) 100%)",
    };
  }

  return {
    icone: "📚",
    label: "Conteúdo",
    titleColor: "#FFFFFF",
    accent: "var(--historietas-em-alta-hex-a78bfa, #A78BFA)",
    border: "var(--historietas-em-alta-rgba-167-139-250-0-42, rgba(167,139,250,0.42))",
    borderStrong: "var(--historietas-em-alta-rgba-167-139-250-0-58, rgba(167,139,250,0.58))",
    glow: "var(--historietas-em-alta-rgba-167-139-250-0-12, rgba(167,139,250,0.12))",
    background:
      "linear-gradient(135deg, var(--historietas-em-alta-rgba-37-27-60-0-82, rgba(37,27,60,0.82)) 0%, var(--historietas-em-alta-rgba-18-12-34-0-92, rgba(18,12,34,0.92)) 100%)",
  };
}
function criarSectionHeaderTemaStyle(
  _tema: ReturnType<typeof obterTemaRanking>,
): CSSProperties {
  void _tema;

  return {
    ...sectionHeaderStyle,
    background: "transparent",
    border: "none",
    boxShadow: "none",
  };
}

function criarDesktopSectionHeaderTemaStyle(
  _tema: ReturnType<typeof obterTemaRanking>,
): CSSProperties {
  void _tema;

  return {
    ...desktopSectionHeaderStyle,
    background: "transparent",
    border: "none",
    boxShadow: "none",
  };
}

function criarSectionIconStyle(
  tema: ReturnType<typeof obterTemaRanking>,
): CSSProperties {
  return {
    width: "auto",
    height: "auto",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "none",
    color: tema.accent,
    fontSize: "28px",
    lineHeight: 1,
    flex: "0 0 auto",
    boxShadow: "none",
  };
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

function AutorRankingCard({
  autor,
  posicao,
  isDesktop,
}: {
  autor: AutorRanking;
  posicao: number;
  isDesktop: boolean;
}) {
  const router = useRouter();
  const inicialAutor = autor.nome.trim().charAt(0).toUpperCase() || "A";
  const temaPosicao = obterTemaPosicao(posicao);
  const avatarAutor = autor.avatar.trim();

  function abrirPerfil() {
    router.push(autor.href);
  }

  return (
    <article
      className="historietas-ranking-card historietas-ranking-author-card"
      data-ranking-level={temaPosicao.nome.toLowerCase()}
      style={criarCardRankingStyle(posicao, true, "geral", isDesktop)}
      role="link"
      tabIndex={0}
      aria-label={`Abrir perfil de ${autor.nome}`}
      onClick={abrirPerfil}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          abrirPerfil();
        }
      }}
    >
      <div
        style={criarAutorAvatarRankingStyle(avatarAutor, posicao, isDesktop)}
      >
        {!avatarAutor && (
          <span style={authorRankingAvatarInitialStyle}>{inicialAutor}</span>
        )}
      </div>

      <div style={isDesktop ? desktopCardContentStyle : cardContentStyle}>
        <div style={authorRankingTitleAreaStyle}>
          <h3 data-historietas-i18n-ignore="true" style={criarAutorCardTitleRankingStyle()}>{autor.nome}</h3>
        </div>

        <div style={authorRankingMetaStackStyle}>
          <span style={authorRankingWorksBadgeStyle}>
            {formatarNumero(autor.obras)}{" "}
            {autor.obras === 1 ? "Obra Publicada" : "Obras Publicadas"}
          </span>
        </div>

        <div style={statsStyle}>
          <span style={statsItemStyle}>
            <span className="historietas-em-alta-emoji-icon" style={metricIconStyle} aria-hidden="true">
              💬
            </span>
            <span style={metricValueStyle}>
              {formatarNumero(autor.comentarios)}
            </span>
          </span>

          <span style={statsItemStyle}>
            <span className="historietas-em-alta-emoji-icon" style={metricIconStyle} aria-hidden="true">
              👥
            </span>
            <span style={metricValueStyle}>
              {formatarNumero(autor.seguidores)}
            </span>
          </span>

          <span style={statsItemStyle}>
            <span className="historietas-em-alta-emoji-icon" style={metricIconStyle} aria-hidden="true">
              📚
            </span>
            <span style={metricValueStyle}>
              {formatarNumero(autor.capitulos)}
            </span>
          </span>
        </div>

        <div style={ratingStatsStyle}>
          <span style={statsItemStyle}>
            <span className="historietas-em-alta-emoji-icon" style={metricIconStyle} aria-hidden="true">
              👁
            </span>
            <span style={metricValueStyle}>{formatarNumero(autor.views)}</span>
          </span>

          <span style={statsItemStyle}>
            <span className="historietas-em-alta-emoji-icon" style={heartMetricIconStyle} aria-hidden="true">
              ❤️
            </span>
            <span style={metricValueStyle}>
              {formatarNumero(autor.curtidas)}
            </span>
          </span>

          <span style={statsItemStyle}>
            <span className="historietas-em-alta-emoji-icon" style={starMetricIconStyle} aria-hidden="true">
              ★
            </span>
            <span style={metricValueStyle}>
              {formatarMediaRanking(autor.mediaAvaliacao)}
            </span>
          </span>
        </div>

        <div style={authorRankingScoreRowStyle}>
          <span className="historietas-ranking-level-line" style={criarAutorPointsBadgeStyle()}>
            {formatarNumero(autor.pontuacao)} pts
          </span>

          <span
            className="historietas-ranking-level-line historietas-ranking-tier-badge"
            style={criarAutorTierInlineBadgeStyle(posicao)}
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

const pageDecorationLayerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  pointerEvents: "none",
  zIndex: 0,
};

const mobileTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(340px, 48vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  WebkitMaskImage: "none",
  maskImage: "none",
};

const desktopTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(620px, 68vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  WebkitMaskImage: "none",
  maskImage: "none",
};

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  backgroundColor: "var(--historietas-em-alta-hex-070212, #000000)",
  background: "var(--historietas-em-alta-hex-070212, #000000)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(820px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "14px 0 116px",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: "18px 0 84px",
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "14px",
  minWidth: 0,
};

const titleStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  margin: 0,
  fontSize: "clamp(30px, 8vw, 46px)",
  lineHeight: 1.04,
  fontWeight: 950,
  letterSpacing: "-0.074em",
  maxWidth: "100%",
  textAlign: "center",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, var(--historietas-em-alta-hex-f5f3ff, #F5F3FF)) 42%, var(--historietas-title-to, var(--historietas-em-alta-hex-fdba74, #FDBA74)) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "none",
  ...safeTextStyle,
};


const titleHeaderStyle: CSSProperties = {
  ...topStyle,
  justifyContent: "center",
  marginTop: "4px",
  marginBottom: "18px",
  textAlign: "center",
};

const desktopTitleHeaderStyle: CSSProperties = {
  ...titleHeaderStyle,
  position: "relative",
  marginTop: "6px",
  marginBottom: "22px",
};



const headerTitleLinkStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "3px",
  width: "100%",
  maxWidth: "100%",
  margin: "0 auto",
  minWidth: 0,
  textAlign: "center",
};

const desktopHeaderTitleLinkStyle: CSSProperties = {
  ...headerTitleLinkStyle,
  gap: "4px",
};

const headerTitleMarkStyle: CSSProperties = {
  width: "clamp(36px, 8vw, 48px)",
  height: "clamp(36px, 8vw, 48px)",
  borderRadius: "clamp(12px, 2.6vw, 16px)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-em-alta-hex-04000a, #04000A)",
  color: "#FFFFFF",
  fontSize: "clamp(18px, 4.3vw, 24px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.04em",
  flex: "0 0 auto",
  border: "1px solid var(--historietas-em-alta-rgba-59-7-100-0-58, rgba(59, 7, 100, 0.58))",
  boxShadow: "none",
};

const desktopHeaderTitleMarkStyle: CSSProperties = {
  ...headerTitleMarkStyle,
  width: "50px",
  height: "50px",
  borderRadius: "17px",
  fontSize: "25px",
};

const headerTitleTextStyle: CSSProperties = {
  ...titleStyle,
  margin: 0,
  fontSize: "clamp(26px, 6.8vw, 40px)",
  maxWidth: "calc(100vw - 86px)",
  textAlign: "center",
  background: "none",
  WebkitBackgroundClip: "initial",
  backgroundClip: "initial",
  color: "#FFFFFF",
  textShadow: "none",
  textTransform: "uppercase",
  wordSpacing: "0.1em",
  whiteSpace: "nowrap",
};

const desktopHeaderTitleTextStyle: CSSProperties = {
  ...headerTitleTextStyle,
  fontSize: "clamp(34px, 3.6vw, 44px)",
  maxWidth: "760px",
};

const sectionStyle: CSSProperties = {
  marginTop: "32px",
  paddingBottom: "14px",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

const desktopSectionStyle: CSSProperties = {
  ...sectionStyle,
  marginTop: "40px",
  paddingBottom: "18px",
};

const sectionHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  justifyItems: "center",
  gap: "6px",
  marginBottom: "14px",
  maxWidth: "100%",
  minWidth: 0,
  textAlign: "center",
};

const desktopSectionHeaderStyle: CSSProperties = {
  ...sectionHeaderStyle,
  padding: "8px 0 12px",
  borderRadius: 0,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "clamp(24px, 4vw, 30px)",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  maxWidth: "100%",
  textAlign: "center",
  textShadow: "none",
  ...safeTextStyle,
};

const sectionHeaderContentStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  minWidth: 0,
  textAlign: "center",
};

const desktopSectionHeaderContentStyle: CSSProperties = {
  ...sectionHeaderContentStyle,
  justifyContent: "center",
  textAlign: "center",
};

const sectionTextBlockStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  justifyItems: "center",
  textAlign: "center",
};

const desktopSectionTextBlockStyle: CSSProperties = {
  ...sectionTextBlockStyle,
  maxWidth: "760px",
  textAlign: "center",
};

const coroaNumberStyle: CSSProperties = {
  fontSize: "11px",
  fontWeight: 950,
  lineHeight: 1,
  color: "#FFFFFF",
  textShadow: "0 1px 4px rgba(0,0,0,0.28)",
};

const cardContentStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  display: "grid",
  alignContent: "center",
  gap: "7px",
};

const desktopCardContentStyle: CSSProperties = {
  ...cardContentStyle,
  gap: "7px",
  alignContent: "center",
};

const cardTopStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "8px",
  minWidth: 0,
};

const statusRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  minWidth: 0,
};

const cardMetaRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  maxWidth: "100%",
  minWidth: 0,
};

const rankingCardActionRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginTop: "2px",
  maxWidth: "100%",
  minWidth: 0,
  overflow: "hidden",
  boxSizing: "border-box",
};

const desktopRankingCardActionRowStyle: CSSProperties = {
  ...rankingCardActionRowStyle,
  overflow: "visible",
};

const rankingThemeBadgeStyle: CSSProperties = {
  flex: "0 1 42%",
  maxWidth: "42%",
  minHeight: "34px",
  padding: "0 10px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 900,
  lineHeight: 1.12,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const desktopRankingThemeBadgeStyle: CSSProperties = {
  ...rankingThemeBadgeStyle,
  flex: "0 1 46%",
  maxWidth: "46%",
  padding: "0 8px",
  textAlign: "center",
  whiteSpace: "normal",
  overflow: "visible",
  textOverflow: "clip",
};

const statusStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background:
    "color-mix(in srgb, var(--historietas-accent, #FFFFFF) 14%, transparent)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #FFFFFF) 28%, transparent)",
  color: "var(--historietas-accent, var(--historietas-em-alta-hex-fdba74, #FDBA74))",
  fontSize: "11px",
  fontWeight: 850,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const publishedStatusStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "var(--historietas-em-alta-rgba-34-197-94-0-14, rgba(34, 197, 94, 0.14))",
  border: "1px solid var(--historietas-em-alta-rgba-34-197-94-0-3, rgba(34, 197, 94, 0.3))",
  color: "var(--historietas-em-alta-hex-86efac, #86EFAC)",
  fontSize: "11px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const formatBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "10px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const classificationBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "10px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const authorStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, var(--historietas-em-alta-hex-d8c8ff, #D8C8FF))",
  fontSize: "12px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 450,
  lineHeight: 1.25,
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

const authorLinkStyle: CSSProperties = {
  ...authorStyle,
  textDecoration: "none",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
  touchAction: "manipulation",
};

const statsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 850,
  maxWidth: "100%",
  minWidth: 0,
};

const ratingStatsStyle: CSSProperties = {
  ...statsStyle,
  flexWrap: "nowrap",
};

const statsItemStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  whiteSpace: "nowrap",
  lineHeight: 1,
};

const metricIconStyle: CSSProperties = {
  width: "14px",
  minWidth: "14px",
  height: "17px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
  fontSize: "13px",
};

const metricValueStyle: CSSProperties = {
  display: "inline-block",
  lineHeight: 1,
  whiteSpace: "nowrap",
  color: "#FFFFFF",
};

const heartMetricIconStyle: CSSProperties = {
  ...metricIconStyle,
  width: "16px",
  minWidth: "16px",
  fontSize: "13px",
  color: "var(--historietas-em-alta-hex-ef4444, #EF4444)",
};

const starMetricIconStyle: CSSProperties = {
  ...metricIconStyle,
  color: "var(--historietas-em-alta-hex-fbbf24, #FBBF24)",
  transform: "translateY(-1px)",
};


















const authorRankingAvatarInitialStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "34px",
  lineHeight: 1,
  fontWeight: 950,
  textShadow: "0 4px 12px rgba(0,0,0,0.42)",
};

const authorRankingTitleAreaStyle: CSSProperties = {
  ...cardTopStyle,
  minHeight: "21px",
  paddingRight: "2px",
};

const authorRankingMetaStackStyle: CSSProperties = {
  display: "grid",
  justifyItems: "start",
  alignItems: "start",
  gap: "5px",
  width: "100%",
  minWidth: 0,
};

const authorRankingWorksBadgeStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, var(--historietas-em-alta-hex-d8c8ff, #D8C8FF))",
  fontSize: "12px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 450,
  lineHeight: 1.25,
  width: "fit-content",
  maxWidth: "100%",
  background: "transparent",
  border: "none",
  padding: 0,
  borderRadius: 0,
  whiteSpace: "normal",
  ...safeTextStyle,
};

const authorRankingScoreRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
  marginTop: "4px",
  maxWidth: "100%",
  minWidth: 0,
};
