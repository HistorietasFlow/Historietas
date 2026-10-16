"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import {
  historietasThemeCss,
  useHistorietasTheme,
} from "../../lib/historietasTheme";
import { useEmAltaAuthSession } from "./hooks/use-em-alta-auth-session";
import { useEmAltaDesktopMode } from "./hooks/use-em-alta-desktop-mode";
import { emAltaPageCss } from "./lib/em-alta-page-css";
import type {
  ObraLocal,
  ObraRanking,
} from "./lib/em-alta-models";
import {
  adicionarRankingObraNaLista,
  listaTemRankingObra,
  normalizarListaIdsEmAlta,
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
  criarLoginHrefEmAlta,
} from "./lib/em-alta-route-utils";
import { calcularRankingAutores } from "./lib/em-alta-author-ranking-utils";
import { calcularRankingObrasLocais } from "./lib/em-alta-local-ranking-utils";
import { criarVisaoRankingEmAlta } from "./lib/em-alta-ranking-view-utils";
import {
  normalizarAvaliacoesLocaisRanking,
  normalizarVisualizacoesRanking,
} from "./lib/em-alta-ranking-data-utils";
import {
  criarDecoracaoPaginaStyle,
  desktopContainerStyle,
  desktopTopWaterFadeStyle,
  mobileTopWaterFadeStyle,
  pageDecorationLayerStyle,
  pageStyle,
  containerStyle,
} from "./lib/em-alta-ranking-visual-style-utils";
import { EmAltaRankingContent } from "./components/em-alta-ranking-content";
import { LoadingSpinner } from "./components/em-alta-loading-spinner";
import { EmAltaLanguageBridge } from "./components/em-alta-language-bridge";
import { EmAltaHeader } from "./components/em-alta-header";

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
  const { usuarioTemSessaoAtiva } = useEmAltaAuthSession({
    setUsuarioLogado,
    setUsuarioLogadoId,
  });

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

  const ranking = useMemo<ObraRanking[]>(
    () =>
      calcularRankingObrasLocais(
        obrasLocais,
        avaliacoesLocaisRegistradas,
        visualizacoesRegistradas,
      ),
    [avaliacoesLocaisRegistradas, obrasLocais, visualizacoesRegistradas],
  );

  const rankingAutores = useMemo(
    () => calcularRankingAutores(ranking),
    [ranking],
  );

  const {
    rankingGeral,
    rankingMaisLidas,
    rankingMaisCurtidas,
    rankingMaisComentadas,
    rankingMaisSalvas,
    rankingMaisRecentes,
    rankingMaisCapitulos,
    rankingTemAtividadeReal,
    rankingParaCatalogoInicial,
  } = useMemo(() => criarVisaoRankingEmAlta(ranking), [ranking]);

  const obrasFavoritasProtegidas = usuarioLogado ? obrasFavoritas : [];
  const obrasConcluidasProtegidas = usuarioLogado ? obrasConcluidas : [];

  const tituloCabecalho = carregandoRanking
    ? "ISTORIETAS"
    : rankingTemAtividadeReal
      ? "ISTORIETAS POPULARES"
      : "ISTORIETAS PUBLICADAS";

  function avisarLoginRanking() {
    router.push(criarLoginHrefEmAlta());
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
        <EmAltaHeader isDesktop={isDesktop} titulo={tituloCabecalho} />

        <EmAltaRankingContent
          ranking={ranking}
          rankingTemAtividadeReal={rankingTemAtividadeReal}
          rankingAutores={rankingAutores}
          rankingGeral={rankingGeral}
          rankingMaisLidas={rankingMaisLidas}
          rankingMaisCurtidas={rankingMaisCurtidas}
          rankingMaisComentadas={rankingMaisComentadas}
          rankingMaisSalvas={rankingMaisSalvas}
          rankingMaisRecentes={rankingMaisRecentes}
          rankingMaisCapitulos={rankingMaisCapitulos}
          rankingParaCatalogoInicial={rankingParaCatalogoInicial}
          obrasFavoritas={obrasFavoritasProtegidas}
          obrasConcluidas={obrasConcluidasProtegidas}
          onAlternarFavorito={alternarFavorito}
          onAlternarConcluido={alternarConcluido}
          isDesktop={isDesktop}
        />
      </section>
    </main>
  );
}
