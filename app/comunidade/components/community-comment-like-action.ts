import type { Dispatch, SetStateAction } from "react";
import {
  finalizarAcaoComunidade,
  iniciarAcaoComunidade,
} from "./community-action-lock";
import { atualizarCurtidaComentarioComunidade } from "./community-like-state-updaters";
import { sincronizarCurtidaComentarioSupabaseComunidade } from "./community-comment-like-sync";
import type { PostComunidade } from "./community-post-model";
import { formatarErroSupabase } from "./community-supabase-error-formatter";
import { idSupabaseValidoComunidade } from "./community-supabase-id-validator";
import { criarNotificacaoComunidadeSupabase } from "./community-supabase-notification-creator";
import type { UsuarioComunidade } from "./community-user";
import { emitirFeedbackAcao } from "./community-action-feedback-toast";

type SetState<T> = Dispatch<SetStateAction<T>>;

type AlternarCurtidaComentarioComunidadeParams = {
  postId: string;
  comentarioId: string;
  acoesComunidadeRef: { current: Set<string> };
  setErro: SetState<string>;
  exigirLogin: () => boolean;
  usuario: UsuarioComunidade | null;
  posts: PostComunidade[];
  setPosts: SetState<PostComunidade[]>;
  setFeedbackAcao: SetState<string>;
  feedbackTimerRef: { current: number | null };
  carregarPostsComunidadeDaPagina: () => Promise<void>;
};

export async function alternarCurtidaComentarioComunidade({
  postId,
  comentarioId,
  acoesComunidadeRef,
  setErro,
  exigirLogin,
  usuario,
  posts,
  setPosts,
  setFeedbackAcao,
  feedbackTimerRef,
  carregarPostsComunidadeDaPagina,
}: AlternarCurtidaComentarioComunidadeParams) {
  const chaveAcao = `curtir-comentario:${comentarioId}`;

  if (!iniciarAcaoComunidade(acoesComunidadeRef, chaveAcao)) {
    return;
  }

  setErro("");

  try {
    if (!exigirLogin() || !usuario) {
      return;
    }

    const postAtual = posts.find((post) => post.id === postId);
    const comentarioAtual = postAtual?.comentarios.find(
      (comentario) => comentario.id === comentarioId
    );
    const jaCurtiu = Boolean(comentarioAtual?.curtidas.includes(usuario.id));

    const resultadoSincronizacaoCurtida =
      await sincronizarCurtidaComentarioSupabaseComunidade(
        comentarioId,
        usuario.id,
        jaCurtiu
      );

    if (!resultadoSincronizacaoCurtida.sucesso) {
      if (resultadoSincronizacaoCurtida.etapa === "remocao") {
        setErro(
          formatarErroSupabase(
            "Erro ao atualizar curtida do comentário",
            resultadoSincronizacaoCurtida.erro
          )
        );
      } else {
        setErro(
          formatarErroSupabase(
            "Erro ao curtir comentário",
            resultadoSincronizacaoCurtida.erro
          )
        );
      }

      return;
    }

    if (!jaCurtiu) {
      if (comentarioAtual?.autorId) {
        await criarNotificacaoComunidadeSupabase({
          destinatarioId: comentarioAtual.autorId,
          tipo: "comunidade-curtida-comentario",
          titulo: "Nova curtida no seu comentário",
          mensagem: `${usuario.nome} curtiu seu comentário na Comunidade.`,
          link: `/comunidade?post=${encodeURIComponent(postId)}`,
          notificacaoId: `comunidade-curtida-comentario:${comentarioId}:${usuario.id}`,
        }, idSupabaseValidoComunidade);
      }
    }

    setPosts((postsAtuais) =>
      atualizarCurtidaComentarioComunidade(
        postsAtuais,
        postId,
        comentarioId,
        usuario.id,
        jaCurtiu
      )
    );

    emitirFeedbackAcao(setFeedbackAcao, feedbackTimerRef,
      jaCurtiu ? "Curtida do comentário removida." : "Comentário curtido."
    );
    await carregarPostsComunidadeDaPagina();
  } finally {
    finalizarAcaoComunidade(acoesComunidadeRef, chaveAcao);
  }
}
