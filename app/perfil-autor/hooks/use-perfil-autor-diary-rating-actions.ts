import type { Dispatch, SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import type { AutorPerfil, AvaliacaoDiarioPublica, PerfilUsuarioRemoto } from "../types";
import { execucaoCarregamentoPerfilAutorEstaAtual, type IdentidadeAutenticadaPerfilAutor } from "../lib/profile-auth-identity";
import { calcularProximaAvaliacaoAutor, idAutorSupabaseValido } from "../lib/profile-formatters";
import { normalizarAvaliacaoDiarioPerfil } from "../lib/data-normalizers";

export function usePerfilAutorDiaryRatingActions({
  identidadeAutenticadaPerfilRef,
  perfilParaMostrar,
  perfilUsaAvaliacaoDiario,
  perfilUsuarioRemotoAtivo,
  perfilPertenceAoUsuario,
  usuarioIdLogado,
  avaliacaoDiario,
  avisarLoginNecessario,
  setAvaliacaoDiario,
  setMensagemAcao,
}: {
  identidadeAutenticadaPerfilRef: { current: IdentidadeAutenticadaPerfilAutor };
  perfilParaMostrar: AutorPerfil | null;
  perfilUsaAvaliacaoDiario: boolean;
  perfilUsuarioRemotoAtivo: PerfilUsuarioRemoto | null;
  perfilPertenceAoUsuario: boolean;
  usuarioIdLogado: string;
  avaliacaoDiario: AvaliacaoDiarioPublica;
  avisarLoginNecessario: (mensagem: string) => void;
  setAvaliacaoDiario: Dispatch<SetStateAction<AvaliacaoDiarioPublica>>;
  setMensagemAcao: (mensagem: string) => void;
}) {
  async function avaliarDiarioPerfil(nota: number) {
    const identidadeEsperada = identidadeAutenticadaPerfilRef.current;
    const usuarioIdEsperado = identidadeEsperada.usuarioId.trim();

    function avaliacaoDiarioAindaAtual() {
      return execucaoCarregamentoPerfilAutorEstaAtual({
        cancelada: false,
        identidadeEsperada,
        identidadeAtual: identidadeAutenticadaPerfilRef.current,
      });
    }

    if (
      !perfilParaMostrar ||
      !perfilUsaAvaliacaoDiario ||
      nota < 0 ||
      nota > 5 ||
      avaliacaoDiario.salvando
    ) {
      return;
    }

    if (perfilPertenceAoUsuario) {
      return;
    }

    if (
      !avaliacaoDiarioAindaAtual() ||
      usuarioIdEsperado !== usuarioIdLogado.trim()
    ) {
      return;
    }

    let userId = "";

    try {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id || "";
    } catch {
      userId = "";
    }

    if (!avaliacaoDiarioAindaAtual()) {
      return;
    }

    if (userId !== usuarioIdEsperado) {
      return;
    }

    if (!userId) {
      avisarLoginNecessario("Entre na sua conta para avaliar este Diário.");
      return;
    }

    if (!avaliacaoDiario.visivel || !avaliacaoDiario.podeAvaliar) {
      setMensagemAcao("Este Diário não está disponível para avaliação.");
      return;
    }

    const diarioUserId = (
      perfilUsuarioRemotoAtivo?.userId || perfilParaMostrar.autorId
    ).trim();

    if (!diarioUserId || !idAutorSupabaseValido(diarioUserId)) {
      setMensagemAcao("Este Diário não está disponível para avaliação.");
      return;
    }

    if (userId.trim().toLowerCase() === diarioUserId.toLowerCase()) {
      return;
    }

    const notaNormalizada =
      nota <= 0 ? 0 : Math.max(0.5, Math.min(5, Math.round(nota * 2) / 2));
    const avaliacaoAnterior = avaliacaoDiario;
    const avaliacaoOtimista = calcularProximaAvaliacaoAutor(
      avaliacaoDiario,
      notaNormalizada,
    );

    setAvaliacaoDiario((avaliacaoAtual) => ({
      ...avaliacaoAtual,
      ...avaliacaoOtimista,
      salvando: true,
    }));
    setMensagemAcao("");

    try {
      const nomeRpc =
        notaNormalizada > 0
          ? "salvar_avaliacao_diario"
          : "remover_avaliacao_diario";
      const parametros =
        notaNormalizada > 0
          ? {
              p_diario_user_id: diarioUserId,
              p_nota: notaNormalizada,
            }
          : { p_diario_user_id: diarioUserId };

      if (!avaliacaoDiarioAindaAtual()) {
        return;
      }

      const { data, error } = await supabase.rpc(nomeRpc, parametros);

      if (!avaliacaoDiarioAindaAtual()) {
        return;
      }

      if (error) {
        throw error;
      }

      setAvaliacaoDiario((avaliacaoAtual) =>
        normalizarAvaliacaoDiarioPerfil(data, avaliacaoAtual),
      );
      setMensagemAcao("");
    } catch {
      if (!avaliacaoDiarioAindaAtual()) {
        return;
      }

      setAvaliacaoDiario({
        ...avaliacaoAnterior,
        carregado: true,
        salvando: false,
      });
      setMensagemAcao("Este Diário não está disponível para avaliação.");
    }
  }

  return { avaliarDiarioPerfil };
}
