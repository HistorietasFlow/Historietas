import type { Dispatch, SetStateAction } from "react";
import { emitirFeedbackAcao } from "./community-action-feedback-toast";
import { atualizarFixacaoPostNoEstadoComunidade } from "./community-post-metadata-state-updaters";
import type { PostComunidade } from "./community-post-model";
import { atualizarFixacaoPostSupabaseComunidade } from "./community-post-pinning-update";
import { formatarErroSupabase } from "./community-supabase-error-formatter";

type SetState<T> = Dispatch<SetStateAction<T>>;

type AlternarFixadoPostComunidadeParams = {
  post: PostComunidade;
  usuarioEhAdmin: boolean;
  postFixandoId: string | null;
  setPostFixandoId: SetState<string | null>;
  setErro: SetState<string>;
  setPosts: SetState<PostComunidade[]>;
  setFeedbackAcao: SetState<string>;
  feedbackTimerRef: { current: number | null };
};

export async function alternarFixadoPostComunidade({
  post,
  usuarioEhAdmin,
  postFixandoId,
  setPostFixandoId,
  setErro,
  setPosts,
  setFeedbackAcao,
  feedbackTimerRef,
}: AlternarFixadoPostComunidadeParams) {
  if (!usuarioEhAdmin) {
    setErro("Apenas administradores podem fixar publicações.");
    return;
  }

  if (postFixandoId === post.id) {
    return;
  }

  setPostFixandoId(post.id);
  setErro("");

  try {
    const novoEstadoFixado = !post.fixado;

    const resultadoAtualizacaoFixacao =
      await atualizarFixacaoPostSupabaseComunidade(
        post.id,
        novoEstadoFixado
      );

    if (!resultadoAtualizacaoFixacao.sucesso) {
      setErro(
        formatarErroSupabase(
          "Erro ao atualizar fixado",
          resultadoAtualizacaoFixacao.erro
        )
      );
      return;
    }

    const dadosFixado = resultadoAtualizacaoFixacao.data as {
      fixado?: boolean | null;
      fixado_em?: string | null;
      fixado_por?: string | null;
    } | null;

    setPosts((postsAtuais) =>
      atualizarFixacaoPostNoEstadoComunidade(
        postsAtuais,
        post.id,
        dadosFixado
      )
    );

    emitirFeedbackAcao(setFeedbackAcao, feedbackTimerRef,
      novoEstadoFixado
        ? "Publicação fixada no topo."
        : "Publicação desafixada."
    );
  } finally {
    setPostFixandoId((postAtualId) =>
      postAtualId === post.id ? null : postAtualId
    );
  }
}
