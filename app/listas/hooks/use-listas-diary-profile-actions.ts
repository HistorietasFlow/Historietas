"use client";

import type { Dispatch, SetStateAction } from "react";
import { normalizarAvaliacaoDiarioListas, calcularProximaAvaliacaoDiarioListas, type AvaliacaoDiarioListasEstado } from "../lib/listas-diary-rating-utils";
import { salvarAvaliacaoDiarioListasPersistida } from "../lib/listas-diary-rating-persistence";
import { criarLoginHrefListas } from "../lib/listas-storage-utils";
import { idUsuarioValido, obterMensagemErroListas } from "../lib/listas-value-utils";

type Props = {
  avaliacaoDiario: AvaliacaoDiarioListasEstado;
  carregarAvaliacaoDiarioListas: (id: string) => Promise<AvaliacaoDiarioListasEstado>;
  fecharComentariosDiario: () => void;
  perfil: { userId: string } | null;
  perfilEhProprio: boolean;
  router: { push: (href: string) => void };
  setAlvoDenunciaDiario: Dispatch<SetStateAction<{ tipo: "diario_anotacao" | "comentario_diario"; id: string; titulo: string } | null>>;
  setAvaliacaoDiario: Dispatch<SetStateAction<AvaliacaoDiarioListasEstado>>;
  setMensagemAcao: (mensagem: string) => void;
  usuarioAtualId: string;
};

export function useListasDiaryProfileActions({ avaliacaoDiario, carregarAvaliacaoDiarioListas, fecharComentariosDiario, perfil, perfilEhProprio, router, setAlvoDenunciaDiario, setAvaliacaoDiario, setMensagemAcao, usuarioAtualId }: Props) {
  async function salvarAvaliacaoDiarioPerfil(novaNota: number) {
    const perfilUserId = perfil?.userId.trim() || "";
    if (!perfilUserId || avaliacaoDiario.salvando || perfilEhProprio) return;
    if (!usuarioAtualId) { router.push(criarLoginHrefListas()); return; }
    if (!avaliacaoDiario.visivel || !avaliacaoDiario.podeAvaliar) return;
    const nota = novaNota <= 0 ? 0 : Math.max(0.5, Math.min(5, Math.round(novaNota * 2) / 2));
    const avaliacaoAnterior = avaliacaoDiario;
    const avaliacaoOtimista = calcularProximaAvaliacaoDiarioListas(avaliacaoDiario, nota);
    setAvaliacaoDiario(avaliacaoOtimista);
    setMensagemAcao("");
    try {
      const data = await salvarAvaliacaoDiarioListasPersistida(perfilUserId, nota);
      if (data && typeof data === "object") setAvaliacaoDiario((atual) => normalizarAvaliacaoDiarioListas(data, atual));
      else setAvaliacaoDiario(await carregarAvaliacaoDiarioListas(perfilUserId));
    } catch (error) {
      setAvaliacaoDiario({ ...avaliacaoAnterior, salvando: false, erro: obterMensagemErroListas(error, "Não foi possível salvar a Avaliação do Diário.") });
    }
  }
  function abrirDenunciaDiario(tipo: "diario_anotacao" | "comentario_diario", id: string, titulo: string, autorId: string) {
    const alvoId = id.trim(); const autorIdLimpo = autorId.trim();
    if (!alvoId || !idUsuarioValido(alvoId)) { setMensagemAcao("Não foi possível identificar este conteúdo."); return; }
    if (autorIdLimpo && usuarioAtualId.trim() && autorIdLimpo === usuarioAtualId.trim()) { setMensagemAcao("Você não pode denunciar seu próprio conteúdo."); return; }
    if (tipo === "comentario_diario") fecharComentariosDiario();
    setAlvoDenunciaDiario({ tipo, id: alvoId, titulo: titulo.trim() || "Conteúdo do Diário" });
  }
  return { salvarAvaliacaoDiarioPerfil, abrirDenunciaDiario };
}
