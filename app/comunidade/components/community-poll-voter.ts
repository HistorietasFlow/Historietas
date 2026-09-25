import type { Dispatch, SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import { emitirFeedbackAcao } from "./community-action-feedback-toast";
import { salvarVotosEnquetesLocais } from "./community-local-poll-votes-saver";
import type { ResultadoVotosEnquete } from "./community-poll-votes-result";
import { formatarErroSupabase } from "./community-supabase-error-formatter";
import { carregarVotosEnquetesSupabase } from "./community-supabase-poll-votes-loader";
import type { UsuarioComunidade } from "./community-user";
import { salvarJsonUsuarioComunidade } from "./community-user-json-saver";

type VotarEnqueteParams = {
  postId: string;
  opcao: string;
  votandoEnqueteId: string | null;
  votosEnquetes: Record<string, string>;
  exigirLogin: () => boolean;
  usuario: UsuarioComunidade | null;
  setVotandoEnqueteId: Dispatch<SetStateAction<string | null>>;
  setErro: Dispatch<SetStateAction<string>>;
  setFeedbackAcao: Dispatch<SetStateAction<string>>;
  feedbackTimerRef: { current: number | null };
  setResultadosEnquetes: Dispatch<SetStateAction<ResultadoVotosEnquete>>;
  setVotosEnquetes: Dispatch<SetStateAction<Record<string, string>>>;
};

export async function votarEnquete({
  postId,
  opcao,
  votandoEnqueteId,
  votosEnquetes,
  exigirLogin,
  usuario,
  setVotandoEnqueteId,
  setErro,
  setFeedbackAcao,
  feedbackTimerRef,
  setResultadosEnquetes,
  setVotosEnquetes,
}: VotarEnqueteParams) {
  if (votandoEnqueteId === postId) {
    return;
  }

  if (votosEnquetes[postId]) {
    emitirFeedbackAcao(setFeedbackAcao, feedbackTimerRef, "Você já votou nesta enquete.");
    return;
  }

  if (!exigirLogin() || !usuario) {
    return;
  }

  setVotandoEnqueteId(postId);
  setErro("");

  try {
    const { error } = await supabase.from("comunidade_enquete_votos").insert({
      post_id: postId,
      user_id: usuario.id,
      opcao,
    });

    if (error) {
      const codigoErro = (error as { code?: string }).code;

      if (codigoErro === "23505") {
        emitirFeedbackAcao(setFeedbackAcao, feedbackTimerRef, "Você já votou nesta enquete.");

        const votosReais = await carregarVotosEnquetesSupabase(
          [postId],
          usuario.id
        );

        if (votosReais) {
          setResultadosEnquetes((resultadosAtuais) => ({
            ...resultadosAtuais,
            ...votosReais.resultados,
          }));

          setVotosEnquetes((votosAtuais) => {
            const votosAtualizados = {
              ...votosAtuais,
              ...votosReais.meusVotos,
            };

            salvarVotosEnquetesLocais(
              salvarJsonUsuarioComunidade,
              votosAtualizados,
              usuario.id
            );

            return votosAtualizados;
          });
        }

        return;
      }

      setErro(formatarErroSupabase("Erro ao votar na enquete", error));
      return;
    }

    setVotosEnquetes((votosAtuais) => {
      const votosAtualizados = {
        ...votosAtuais,
        [postId]: opcao,
      };

      salvarVotosEnquetesLocais(
        salvarJsonUsuarioComunidade,
        votosAtualizados,
        usuario.id
      );

      return votosAtualizados;
    });

    const votosReais = await carregarVotosEnquetesSupabase(
      [postId],
      usuario.id
    );

    if (votosReais) {
      setResultadosEnquetes((resultadosAtuais) => ({
        ...resultadosAtuais,
        ...votosReais.resultados,
      }));

      setVotosEnquetes((votosAtuais) => {
        const votosAtualizados = {
          ...votosAtuais,
          ...votosReais.meusVotos,
        };

        salvarVotosEnquetesLocais(
          salvarJsonUsuarioComunidade,
          votosAtualizados,
          usuario.id
        );

        return votosAtualizados;
      });
    } else {
      setResultadosEnquetes((resultadosAtuais) => ({
        ...resultadosAtuais,
        [postId]: {
          ...(resultadosAtuais[postId] || {}),
          [opcao]: (resultadosAtuais[postId]?.[opcao] || 0) + 1,
        },
      }));
    }

    emitirFeedbackAcao(setFeedbackAcao, feedbackTimerRef, "Voto registrado.");
  } finally {
    setVotandoEnqueteId((postAtualId) =>
      postAtualId === postId ? null : postAtualId
    );
  }
}
