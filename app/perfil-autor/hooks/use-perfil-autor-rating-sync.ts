import { useEffect, type Dispatch, type SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import { carregarMetricasConteudos } from "../../../lib/metricas";
import { avaliacaoAutorVazia } from "../constants";
import type {
  AutorPerfil,
  AvaliacaoAutorPublica,
} from "../types";
import { idAutorSupabaseValido } from "../lib/profile-formatters";
import {
  obterAvaliacaoAutorLocal,
  salvarAvaliacaoAutorLocal,
} from "../lib/profile-local-author-utils";

export function usePerfilAutorRatingSync({
  perfilParaMostrar,
  autorPodeReceberAvaliacao,
  usuarioIdLogado,
  perfilPertenceAoUsuario,
  setAvaliacaoAutor,
}: {
  perfilParaMostrar: AutorPerfil | null;
  autorPodeReceberAvaliacao: boolean;
  usuarioIdLogado: string;
  perfilPertenceAoUsuario: boolean;
  setAvaliacaoAutor: Dispatch<SetStateAction<AvaliacaoAutorPublica>>;
}) {
  useEffect(() => {
    let cancelado = false;

    async function carregarAvaliacaoRealAutor() {
      if (!perfilParaMostrar || !autorPodeReceberAvaliacao) {
        setAvaliacaoAutor(avaliacaoAutorVazia);
        return;
      }

      const perfilAtualAutor = perfilParaMostrar;
      const notaLocal = perfilPertenceAoUsuario
        ? 0
        : obterAvaliacaoAutorLocal(
            perfilAtualAutor,
            usuarioIdLogado,
          );

      if (perfilPertenceAoUsuario && usuarioIdLogado.trim()) {
        salvarAvaliacaoAutorLocal(
          perfilAtualAutor,
          0,
          usuarioIdLogado,
        );
      }

      setAvaliacaoAutor({
        media: notaLocal > 0 ? notaLocal : 0,
        total: notaLocal > 0 ? 1 : 0,
        minhaNota: notaLocal,
        carregado: true,
        salvando: false,
      });

      const autorId = perfilAtualAutor.autorId.trim();

      if (!autorId || !idAutorSupabaseValido(autorId)) {
        return;
      }

      try {
        const { data: usuarioData } = await supabase.auth.getUser();
        const userId = usuarioData.user?.id || "";

        const contrato = await carregarMetricasConteudos({
          autorIds: [autorId],
        });
        const metrica = contrato.autores.get(autorId);

        if (!contrato.carregado || !metrica) {
          return;
        }

        const total = metrica.avaliacao.total;
        const media = metrica.avaliacao.media;
        const usuarioEhDonoDoPerfil = Boolean(
          userId &&
            userId.trim().toLowerCase() === autorId.toLowerCase(),
        );
        const minhaNota = usuarioEhDonoDoPerfil
          ? 0
          : metrica.avaliacao.minhaNota > 0
            ? metrica.avaliacao.minhaNota
            : notaLocal;

        if (cancelado) {
          return;
        }

        setAvaliacaoAutor((avaliacaoAtual) => {
          if (
            avaliacaoAtual.salvando ||
            avaliacaoAtual.minhaNota !== notaLocal
          ) {
            return {
              ...avaliacaoAtual,
              carregado: true,
            };
          }

          return {
            media,
            total,
            minhaNota,
            carregado: true,
            salvando: false,
          };
        });
      } catch {
        if (!cancelado) {
          setAvaliacaoAutor((avaliacaoAtual) => ({
            ...avaliacaoAtual,
            carregado: true,
            salvando: false,
          }));
        }
      }
    }

    const carregarAvaliacaoAutorTimer = window.setTimeout(() => {
      void carregarAvaliacaoRealAutor();
    }, 0);

    return () => {
      cancelado = true;
      window.clearTimeout(carregarAvaliacaoAutorTimer);
    };
  }, [
    perfilParaMostrar,
    autorPodeReceberAvaliacao,
    usuarioIdLogado,
    perfilPertenceAoUsuario,
    setAvaliacaoAutor,
  ]);
}
