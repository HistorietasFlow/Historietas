import type { Dispatch, SetStateAction } from "react";
import type { AutorPerfil } from "../types";
import {
  execucaoCarregamentoPerfilAutorEstaAtual,
  type IdentidadeAutenticadaPerfilAutor,
} from "../lib/profile-auth-identity";
import { salvarCurtidaTopFiveLocal } from "../lib/profile-top-five-local-utils";
import {
  carregarCurtidasTopFivePerfil,
  salvarCurtidaTopFiveSupabase,
} from "../lib/profile-top-five-supabase-utils";

export function usePerfilAutorTopFiveLikeActions({
  identidadeAutenticadaPerfilRef,
  perfilParaMostrar,
  usuarioIdLogado,
  topFiveCurtidaSalvando,
  topFiveCurtidoPorMim,
  setMensagemAcao,
  setTopFiveCurtidaSalvando,
  setTopFiveCurtidoPorMim,
  setTopFiveCurtidasTotal,
}: {
  identidadeAutenticadaPerfilRef: {
    current: IdentidadeAutenticadaPerfilAutor;
  };
  perfilParaMostrar: AutorPerfil | null;
  usuarioIdLogado: string;
  topFiveCurtidaSalvando: boolean;
  topFiveCurtidoPorMim: boolean;
  setMensagemAcao: (mensagem: string) => void;
  setTopFiveCurtidaSalvando: Dispatch<SetStateAction<boolean>>;
  setTopFiveCurtidoPorMim: Dispatch<SetStateAction<boolean>>;
  setTopFiveCurtidasTotal: Dispatch<SetStateAction<number>>;
}) {
  async function alternarCurtidaTopFivePerfil() {
    const identidadeEsperada = identidadeAutenticadaPerfilRef.current;
    const usuarioIdEsperado = identidadeEsperada.usuarioId.trim();
    const perfilAutorId = perfilParaMostrar?.autorId?.trim() || "";
    const usuarioId = usuarioIdLogado.trim();

    function curtidaTopFiveAindaAtual() {
      return execucaoCarregamentoPerfilAutorEstaAtual({
        cancelada: false,
        identidadeEsperada,
        identidadeAtual: identidadeAutenticadaPerfilRef.current,
      });
    }

    if (!perfilAutorId) {
      return;
    }

    if (
      !curtidaTopFiveAindaAtual() ||
      usuarioIdEsperado !== usuarioId
    ) {
      return;
    }

    if (!usuarioId) {
      setMensagemAcao("Entre para curtir o TOP 5 deste perfil.");
      return;
    }

    if (topFiveCurtidaSalvando) {
      return;
    }

    const proximaCurtida = !topFiveCurtidoPorMim;

    setTopFiveCurtidaSalvando(true);
    setTopFiveCurtidoPorMim(proximaCurtida);
    setTopFiveCurtidasTotal((totalAtual) =>
      Math.max(0, totalAtual + (proximaCurtida ? 1 : -1)),
    );
    salvarCurtidaTopFiveLocal(
      perfilAutorId,
      usuarioIdEsperado,
      proximaCurtida,
    );

    const salvouRemoto = await salvarCurtidaTopFiveSupabase(
      perfilAutorId,
      usuarioIdEsperado,
      proximaCurtida,
      curtidaTopFiveAindaAtual,
    );

    if (!curtidaTopFiveAindaAtual()) {
      return;
    }

    if (salvouRemoto) {
      const estadoAtualizado = await carregarCurtidasTopFivePerfil(
        perfilAutorId,
        usuarioIdEsperado,
        curtidaTopFiveAindaAtual,
      );

      if (!curtidaTopFiveAindaAtual()) {
        return;
      }

      setTopFiveCurtidasTotal(estadoAtualizado.total);
      setTopFiveCurtidoPorMim(estadoAtualizado.curtiu);
    }

    if (!curtidaTopFiveAindaAtual()) {
      return;
    }

    setTopFiveCurtidaSalvando(false);
  }

  return { alternarCurtidaTopFivePerfil };
}
