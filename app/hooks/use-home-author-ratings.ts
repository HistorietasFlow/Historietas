"use client";

import { useEffect, useState } from "react";
import { carregarMetricasConteudos } from "../../lib/metricas";
import { idObraSupabaseValido } from "../../lib/utils";

type AvaliacaoAutorHome = {
  media: number;
  total: number;
};

type AvaliacoesAutoresHome = Record<string, AvaliacaoAutorHome>;

type AutorHomeComId = {
  autorId: string;
};

export default function useHomeAuthorRatings(
  autores: ReadonlyArray<AutorHomeComId>,
) {
  const [avaliacoesAutoresHome, setAvaliacoesAutoresHome] =
    useState<AvaliacoesAutoresHome>({});

  useEffect(() => {
    const autorIds = Array.from(
      new Set(
        autores
          .map((autor) => autor.autorId.trim())
          .filter((autorId) => idObraSupabaseValido(autorId)),
      ),
    );
    let cancelado = false;

    async function carregarAvaliacoesAutoresHome() {
      if (autorIds.length === 0) {
        await Promise.resolve();

        if (!cancelado) {
          setAvaliacoesAutoresHome({});
        }

        return;
      }

      try {
        const contrato = await carregarMetricasConteudos({ autorIds });

        if (!contrato.carregado) {
          if (!cancelado) {
            setAvaliacoesAutoresHome({});
          }
          return;
        }

        const avaliacoesAtualizadas = autorIds.reduce<AvaliacoesAutoresHome>(
          (resultado, autorId) => {
            const avaliacao = contrato.autores.get(autorId)?.avaliacao;

            if (avaliacao && avaliacao.total > 0) {
              resultado[autorId] = {
                media: avaliacao.media,
                total: avaliacao.total,
              };
            }

            return resultado;
          },
          {},
        );

        if (!cancelado) {
          setAvaliacoesAutoresHome(avaliacoesAtualizadas);
        }
      } catch {
        if (!cancelado) {
          setAvaliacoesAutoresHome({});
        }
      }
    }

    void carregarAvaliacoesAutoresHome();

    return () => {
      cancelado = true;
    };
  }, [autores]);

  return avaliacoesAutoresHome;
}
