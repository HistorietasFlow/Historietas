"use client";

import { useEffect } from "react";
import { supabase } from "../../../lib/supabase/client";
import type { ObraLocal } from "../lib/em-alta-models";
import { carregarColecoesRankingEmAlta } from "../lib/em-alta-ranking-collections-loader";
import { carregarInteracoesLocaisRankingEmAlta } from "../lib/em-alta-ranking-local-interactions";
import { carregarObrasSupabasePublicadas } from "../lib/em-alta-supabase-works-loader";

export function useEmAltaRankingLoader({
  usuarioLogadoId,
  setCarregandoRanking,
  setUsuarioLogado,
  setUsuarioLogadoId,
  setObrasLocais,
  setObrasFavoritas,
  setObrasConcluidas,
  setVisualizacoesRegistradas,
  setAvaliacoesLocaisRegistradas,
}: {
  usuarioLogadoId: string;
  setCarregandoRanking: (valor: boolean) => void;
  setUsuarioLogado: (valor: boolean) => void;
  setUsuarioLogadoId: (valor: string) => void;
  setObrasLocais: (valor: ObraLocal[]) => void;
  setObrasFavoritas: (valor: string[]) => void;
  setObrasConcluidas: (valor: string[]) => void;
  setVisualizacoesRegistradas: (valor: Record<string, number>) => void;
  setAvaliacoesLocaisRegistradas: (valor: Record<string, number>) => void;
}) {
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

        const {
          obrasFavoritasNormalizadas,
          obrasConcluidasNormalizadas,
        } = await carregarColecoesRankingEmAlta(userIdAtual);

        const {
          visualizacoesNormalizadas,
          avaliacoesLocaisNormalizadas,
        } = carregarInteracoesLocaisRankingEmAlta(userIdAtual);

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
    // Os setters recebidos são os setters estáveis dos estados da página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioLogadoId]);
}
