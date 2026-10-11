import type { Dispatch, SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import type { AutorPerfil, AvaliacaoAutorPublica } from "../types";
import {
  execucaoCarregamentoPerfilAutorEstaAtual,
  type IdentidadeAutenticadaPerfilAutor,
} from "../lib/profile-auth-identity";
import {
  calcularProximaAvaliacaoAutor,
  idAutorSupabaseValido,
} from "../lib/profile-formatters";
import { salvarAvaliacaoAutorLocal } from "../lib/profile-local-author-utils";

export function usePerfilAutorRatingActions({
  identidadeAutenticadaPerfilRef,
  perfilParaMostrar,
  autorPodeReceberAvaliacao,
  perfilPertenceAoUsuario,
  usuarioIdLogado,
  avaliacaoAutor,
  avisarLoginNecessario,
  setAvaliacaoAutor,
  setMensagemAcao,
}: {
  identidadeAutenticadaPerfilRef: {
    current: IdentidadeAutenticadaPerfilAutor;
  };
  perfilParaMostrar: AutorPerfil | null;
  autorPodeReceberAvaliacao: boolean;
  perfilPertenceAoUsuario: boolean;
  usuarioIdLogado: string;
  avaliacaoAutor: AvaliacaoAutorPublica;
  avisarLoginNecessario: (mensagem: string) => void;
  setAvaliacaoAutor: Dispatch<SetStateAction<AvaliacaoAutorPublica>>;
  setMensagemAcao: (mensagem: string) => void;
}) {
  async function avaliarAutor(nota: number) {
    const identidadeEsperada = identidadeAutenticadaPerfilRef.current;
    const usuarioIdEsperado = identidadeEsperada.usuarioId.trim();

    function avaliacaoAutorAindaAtual() {
      return execucaoCarregamentoPerfilAutorEstaAtual({
        cancelada: false,
        identidadeEsperada,
        identidadeAtual: identidadeAutenticadaPerfilRef.current,
      });
    }

    if (!perfilParaMostrar || !autorPodeReceberAvaliacao || nota < 0 || nota > 5) {
      return;
    }

    if (perfilPertenceAoUsuario) {
      return;
    }

    if (
      !avaliacaoAutorAindaAtual() ||
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

    if (!avaliacaoAutorAindaAtual()) {
      return;
    }

    if (userId !== usuarioIdEsperado) {
      return;
    }

    if (!userId) {
      avisarLoginNecessario("Entre na sua conta para avaliar este autor.");
      return;
    }

    const autorId = perfilParaMostrar.autorId.trim();

    if (
      autorId &&
      userId.trim().toLowerCase() === autorId.toLowerCase()
    ) {
      return;
    }

    const notaNormalizada = nota <= 0 ? 0 : Math.round(nota * 2) / 2;
    const proximaAvaliacao = calcularProximaAvaliacaoAutor(
      avaliacaoAutor,
      notaNormalizada,
    );

    setAvaliacaoAutor(proximaAvaliacao);
    setMensagemAcao("");
    salvarAvaliacaoAutorLocal(
      perfilParaMostrar,
      notaNormalizada,
      usuarioIdEsperado,
    );

    if (!autorId || !idAutorSupabaseValido(autorId)) {
      setAvaliacaoAutor((avaliacaoAtual) => ({
        ...avaliacaoAtual,
        salvando: false,
      }));
      return;
    }

    try {
      if (!avaliacaoAutorAindaAtual()) {
        return;
      }

      const resposta =
        notaNormalizada > 0
          ? await supabase.from("autor_avaliacoes").upsert(
              {
                autor_id: autorId,
                user_id: usuarioIdEsperado,
                nota: notaNormalizada,
                atualizado_em: new Date().toISOString(),
              },
              { onConflict: "autor_id,user_id" },
            )
          : await supabase
              .from("autor_avaliacoes")
              .delete()
              .eq("autor_id", autorId)
              .eq("user_id", usuarioIdEsperado);

      if (!avaliacaoAutorAindaAtual()) {
        return;
      }

      if (resposta.error) {
        throw resposta.error;
      }

      setAvaliacaoAutor((avaliacaoAtual) => ({
        ...avaliacaoAtual,
        salvando: false,
      }));
      setMensagemAcao("");
    } catch {
      if (!avaliacaoAutorAindaAtual()) {
        return;
      }

      setAvaliacaoAutor((avaliacaoAtual) => ({
        ...avaliacaoAtual,
        carregado: true,
        salvando: false,
      }));
      setMensagemAcao("");
    }
  }

  return { avaliarAutor };
}
