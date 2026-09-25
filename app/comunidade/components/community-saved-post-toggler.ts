import type { Dispatch, SetStateAction } from "react";
import { emitirFeedbackAcao } from "./community-action-feedback-toast";
import {
  finalizarAcaoComunidade,
  iniciarAcaoComunidade,
} from "./community-action-lock";
import { CHAVE_POSTS_SALVOS_COMUNIDADE } from "./community-storage-keys";
import { carregarPostsSalvosSupabaseComunidade } from "./community-supabase-saved-posts-loader";
import { salvarPostSalvoSupabaseComunidade } from "./community-supabase-saved-post-saver";
import type { UsuarioComunidade } from "./community-user";
import { salvarJsonUsuarioComunidade } from "./community-user-json-saver";

type AlternarPostSalvoParams = {
  postId: string;
  acoesComunidadeRef: { current: Set<string> };
  setErro: Dispatch<SetStateAction<string>>;
  exigirLogin: () => boolean;
  usuario: UsuarioComunidade | null;
  setPostSalvandoId: Dispatch<SetStateAction<string | null>>;
  postsSalvosIds: string[];
  setPostsSalvosIds: Dispatch<SetStateAction<string[]>>;
  setFeedbackAcao: Dispatch<SetStateAction<string>>;
  feedbackTimerRef: { current: number | null };
};

export async function alternarPostSalvo({
  postId,
  acoesComunidadeRef,
  setErro,
  exigirLogin,
  usuario,
  setPostSalvandoId,
  postsSalvosIds,
  setPostsSalvosIds,
  setFeedbackAcao,
  feedbackTimerRef,
}: AlternarPostSalvoParams) {
  const chaveAcao = `salvar-post:${postId}`;

  if (!iniciarAcaoComunidade(acoesComunidadeRef, chaveAcao)) {
    return;
  }

  setErro("");

  try {
    if (!exigirLogin() || !usuario) {
      return;
    }

    setPostSalvandoId(postId);

    const postJaSalvo = postsSalvosIds.includes(postId);
    const postsSalvosAtualizados = postJaSalvo
      ? postsSalvosIds.filter((postSalvoId) => postSalvoId !== postId)
      : [...postsSalvosIds, postId];

    setPostsSalvosIds(postsSalvosAtualizados);
    salvarJsonUsuarioComunidade(
      CHAVE_POSTS_SALVOS_COMUNIDADE,
      usuario.id,
      postsSalvosAtualizados
    );

    const salvouNoSupabase = await salvarPostSalvoSupabaseComunidade(
      usuario.id,
      postId,
      !postJaSalvo
    );

    if (salvouNoSupabase) {
      const postsSalvosReais = await carregarPostsSalvosSupabaseComunidade(
        usuario.id
      );

      if (postsSalvosReais) {
        setPostsSalvosIds(postsSalvosReais);
        salvarJsonUsuarioComunidade(
          CHAVE_POSTS_SALVOS_COMUNIDADE,
          usuario.id,
          postsSalvosReais
        );
      }
    }

    emitirFeedbackAcao(setFeedbackAcao, feedbackTimerRef,
      postJaSalvo
        ? "Publicação removida dos salvos."
        : salvouNoSupabase
          ? "Publicação salva."
          : "Publicação salva neste navegador."
    );
  } finally {
    finalizarAcaoComunidade(acoesComunidadeRef, chaveAcao);
    setPostSalvandoId((postAtualId) =>
      postAtualId === postId ? null : postAtualId
    );
  }
}
