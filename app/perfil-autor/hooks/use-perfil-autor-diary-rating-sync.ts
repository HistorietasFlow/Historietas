import { useEffect, type Dispatch, type SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import { avaliacaoDiarioVazia } from "../constants";
import type {
  AutorPerfil,
  AvaliacaoDiarioPublica,
} from "../types";
import { normalizarAvaliacaoDiarioPerfil } from "../lib/data-normalizers";
import { idAutorSupabaseValido } from "../lib/profile-formatters";

export function usePerfilAutorDiaryRatingSync({
  perfilParaMostrar,
  perfilUsuarioRemotoUserId,
  perfilUsaAvaliacaoDiario,
  podeEditarPerfil,
  usuarioIdLogado,
  setAvaliacaoDiario,
}: {
  perfilParaMostrar: AutorPerfil | null;
  perfilUsuarioRemotoUserId: string;
  perfilUsaAvaliacaoDiario: boolean;
  podeEditarPerfil: boolean;
  usuarioIdLogado: string;
  setAvaliacaoDiario: Dispatch<SetStateAction<AvaliacaoDiarioPublica>>;
}) {
  useEffect(() => {
    let cancelado = false;

    async function carregarAvaliacaoRealDiario() {
      if (!perfilParaMostrar || !perfilUsaAvaliacaoDiario) {
        setAvaliacaoDiario(avaliacaoDiarioVazia);
        return;
      }

      const diarioUserId = (
        perfilUsuarioRemotoUserId || perfilParaMostrar.autorId
      ).trim();

      if (!diarioUserId || !idAutorSupabaseValido(diarioUserId)) {
        setAvaliacaoDiario({
          ...avaliacaoDiarioVazia,
          carregado: true,
          visivel: podeEditarPerfil,
        });
        return;
      }

      setAvaliacaoDiario((avaliacaoAtual) => ({
        ...avaliacaoAtual,
        carregado: false,
        salvando: false,
      }));

      try {
        const { data, error } = await supabase.rpc(
          "carregar_avaliacao_diario",
          { p_diario_user_id: diarioUserId },
        );

        if (error) {
          throw error;
        }

        if (!cancelado) {
          setAvaliacaoDiario((avaliacaoAtual) =>
            normalizarAvaliacaoDiarioPerfil(data, avaliacaoAtual),
          );
        }
      } catch {
        if (!cancelado) {
          setAvaliacaoDiario({
            ...avaliacaoDiarioVazia,
            carregado: true,
            visivel: podeEditarPerfil,
          });
        }
      }
    }

    const carregarAvaliacaoDiarioTimer = window.setTimeout(() => {
      void carregarAvaliacaoRealDiario();
    }, 0);

    return () => {
      cancelado = true;
      window.clearTimeout(carregarAvaliacaoDiarioTimer);
    };
  }, [
    perfilParaMostrar,
    perfilUsuarioRemotoUserId,
    perfilUsaAvaliacaoDiario,
    podeEditarPerfil,
    usuarioIdLogado,
    setAvaliacaoDiario,
  ]);
}
