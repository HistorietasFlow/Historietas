"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase/client";
import { useHistorietasTheme } from "../../lib/historietasTheme";
import { useEmAltaAuthSession } from "./hooks/use-em-alta-auth-session";
import { useEmAltaDesktopMode } from "./hooks/use-em-alta-desktop-mode";
import type {
  ObraLocal,
} from "./lib/em-alta-models";
import {
  normalizarListaIdsEmAlta,
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
import {
  criarLoginHrefEmAlta,
} from "./lib/em-alta-route-utils";
import {
  normalizarAvaliacoesLocaisRanking,
  normalizarVisualizacoesRanking,
} from "./lib/em-alta-ranking-data-utils";
import {
  obterObrasConcluidasProtegidasEmAlta,
  obterObrasFavoritasProtegidasEmAlta,
  obterTituloCabecalhoEmAlta,
} from "./lib/em-alta-page-display-utils";
import {
  desktopContainerStyle,
  pageStyle,
  containerStyle,
} from "./lib/em-alta-ranking-visual-style-utils";
import { EmAltaRankingContent } from "./components/em-alta-ranking-content";
import { LoadingSpinner } from "./components/em-alta-loading-spinner";
import { EmAltaHeader } from "./components/em-alta-header";
import { EmAltaPageDecorations } from "./components/em-alta-page-decorations";
import { EmAltaPageShell } from "./components/em-alta-page-shell";
import { useEmAltaRankingDerivedData } from "./hooks/use-em-alta-ranking-derived-data";
import { useEmAltaRankingCollectionActions } from "./hooks/use-em-alta-ranking-collection-actions";

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

  const {
    ranking,
    rankingAutores,
    rankingGeral,
    rankingMaisLidas,
    rankingMaisCurtidas,
    rankingMaisComentadas,
    rankingMaisSalvas,
    rankingMaisRecentes,
    rankingMaisCapitulos,
    rankingTemAtividadeReal,
    rankingParaCatalogoInicial,
  } = useEmAltaRankingDerivedData({
    avaliacoesLocaisRegistradas,
    obrasLocais,
    visualizacoesRegistradas,
  });

  const obrasFavoritasProtegidas = obterObrasFavoritasProtegidasEmAlta(
    usuarioLogado,
    obrasFavoritas,
  );
  const obrasConcluidasProtegidas = obterObrasConcluidasProtegidasEmAlta(
    usuarioLogado,
    obrasConcluidas,
  );

  const tituloCabecalho = obterTituloCabecalhoEmAlta(
    carregandoRanking,
    rankingTemAtividadeReal,
  );

  function avisarLoginRanking() {
    router.push(criarLoginHrefEmAlta());
  }

  const { alternarFavorito, alternarConcluido } =
    useEmAltaRankingCollectionActions({
      ranking,
      obrasFavoritas,
      obrasConcluidas,
      usuarioLogadoId,
      usuarioTemSessaoAtiva,
      avisarLoginRanking,
      setObrasFavoritas,
      setObrasConcluidas,
    });

  if (carregandoRanking) {
    return (
      <EmAltaPageShell pageThemeStyle={pageThemeStyle} carregando>
        <LoadingSpinner label="Carregando Em Alta" />
      </EmAltaPageShell>
    );
  }

  return (
    <EmAltaPageShell pageThemeStyle={pageThemeStyle}>
      <EmAltaPageDecorations isDesktop={isDesktop} />

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
    </EmAltaPageShell>
  );
}
