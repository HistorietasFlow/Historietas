import type { Dispatch, SetStateAction } from "react";
import { emitirFeedbackAcao } from "./community-action-feedback-toast";
import {
  finalizarAcaoComunidade,
  iniciarAcaoComunidade,
} from "./community-action-lock";
import { copiarTextoComFallback } from "./community-clipboard-copy";
import { obterLinkPublicacaoComunidade } from "./community-post-link";
import type { PostComunidade } from "./community-post-model";

type CompartilharPublicacaoParams = {
  post: PostComunidade;
  acoesComunidadeRef: { current: Set<string> };
  setPostCompartilhandoId: Dispatch<SetStateAction<string | null>>;
  setFeedbackAcao: Dispatch<SetStateAction<string>>;
  feedbackTimerRef: { current: number | null };
  setErro: Dispatch<SetStateAction<string>>;
};

export async function compartilharPublicacao({
  post,
  acoesComunidadeRef,
  setPostCompartilhandoId,
  setFeedbackAcao,
  feedbackTimerRef,
  setErro,
}: CompartilharPublicacaoParams) {
  const chaveAcao = `compartilhar-post:${post.id}`;

  if (!iniciarAcaoComunidade(acoesComunidadeRef, chaveAcao)) {
    return;
  }

  setPostCompartilhandoId(post.id);

  try {
    const linkPublicacao = obterLinkPublicacaoComunidade(post.id);
    const navegador = navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>;
    };
    const textoPublicacao =
      post.texto.trim().slice(0, 160) ||
      `Confira a publicação de ${post.autorNome} no HISTORIETAS.`;

    if (typeof navegador.share === "function") {
      try {
        await navegador.share({
          title: `${post.autorNome} na Comunidade HISTORIETAS`,
          text: textoPublicacao,
          url: linkPublicacao,
        });
        emitirFeedbackAcao(setFeedbackAcao, feedbackTimerRef, "Compartilhamento da publicação aberto.");
        return;
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }
      }
    }

    const linkCopiado = await copiarTextoComFallback(linkPublicacao);

    if (linkCopiado) {
      emitirFeedbackAcao(setFeedbackAcao, feedbackTimerRef, "Link da publicação copiado.");
      return;
    }

    setErro(
      "Não consegui compartilhar nem copiar o link da publicação neste navegador."
    );
  } finally {
    finalizarAcaoComunidade(acoesComunidadeRef, chaveAcao);
    setPostCompartilhandoId((postAtualId) =>
      postAtualId === post.id ? null : postAtualId
    );
  }
}
