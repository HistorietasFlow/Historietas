import type { Dispatch, SetStateAction } from "react";
import { emitirFeedbackAcao } from "./community-action-feedback-toast";
import {
  finalizarAcaoComunidade,
  iniciarAcaoComunidade,
} from "./community-action-lock";
import { inserirComentarioSupabaseComunidade } from "./community-comment-insert";
import { prepararInsercaoComentarioComunidade } from "./community-comment-insert-preparation";
import { adicionarComentarioPostComunidade } from "./community-comment-state-updaters";
import { mapearComentarioCriadoComunidade } from "./community-created-comment-mapper";
import type { PostComunidade } from "./community-post-model";
import { obterNomeSeguroUsuarioComunidade } from "./community-safe-user-name";
import { formatarErroSupabase } from "./community-supabase-error-formatter";
import { idSupabaseValidoComunidade } from "./community-supabase-id-validator";
import { criarNotificacaoComunidadeSupabase } from "./community-supabase-notification-creator";
import type { SupabaseComentarioRow } from "./community-supabase-comment-row";
import type { UsuarioComunidade } from "./community-user";

type SetState<T> = Dispatch<SetStateAction<T>>;

type ComentarPostComunidadeParams = {
  postId: string;
  textoRecebido: string;
  comentarioPaiId?: string;
  acoesComunidadeRef: { current: Set<string> };
  setErro: SetState<string>;
  exigirLogin: () => boolean;
  usuario: UsuarioComunidade | null;
  posts: PostComunidade[];
  setPosts: SetState<PostComunidade[]>;
  setFeedbackAcao: SetState<string>;
  feedbackTimerRef: { current: number | null };
};

export async function comentarPostComunidade({
  postId,
  textoRecebido,
  comentarioPaiId = "",
  acoesComunidadeRef,
  setErro,
  exigirLogin,
  usuario,
  posts,
  setPosts,
  setFeedbackAcao,
  feedbackTimerRef,
}: ComentarPostComunidadeParams) {
  const chaveAcao = `comentar-post:${postId}`;

  if (!iniciarAcaoComunidade(acoesComunidadeRef, chaveAcao)) {
    return false;
  }

  setErro("");

  try {
    if (!exigirLogin() || !usuario) {
      return false;
    }

    const textoComentario = textoRecebido.trim();

    if (textoComentario.length < 1) {
      setErro("Escreva um comentário antes de enviar.");
      return false;
    }

    const autorNomeSeguro = await obterNomeSeguroUsuarioComunidade(usuario);
    const resultadoPreparacaoComentario =
      prepararInsercaoComentarioComunidade({
        posts,
        postId,
        textoComentario,
        comentarioPaiId,
        usuarioId: usuario.id,
        autorNomeSeguro,
      });

    if (!resultadoPreparacaoComentario.valido) {
      setErro(resultadoPreparacaoComentario.erro);
      return false;
    }

    const { postAtual, comentarioPaiIdLimpo, dadosComentarioBanco } =
      resultadoPreparacaoComentario;

    const resultadoInsercaoComentario =
      await inserirComentarioSupabaseComunidade(dadosComentarioBanco);

    if (!resultadoInsercaoComentario.sucesso) {
      setErro(
        formatarErroSupabase(
          "Erro ao comentar",
          resultadoInsercaoComentario.erro
        )
      );
      return false;
    }

    const { data } = resultadoInsercaoComentario;

    if (!data) {
      setErro("Erro ao comentar: o Supabase não retornou o comentário criado.");
      return false;
    }

    const novoComentario = mapearComentarioCriadoComunidade({
      comentarioCriado: data as SupabaseComentarioRow,
      usuarioId: usuario.id,
      autorNomeSeguro,
      usuarioAvatar: usuario.avatar,
    });

    if (!comentarioPaiIdLimpo && postAtual?.autorId) {
      await criarNotificacaoComunidadeSupabase({
        destinatarioId: postAtual.autorId,
        tipo: "comunidade-comentario-post",
        titulo: "Novo comentário na Comunidade",
        mensagem: `${autorNomeSeguro} comentou na sua publicação.`,
        link: `/comunidade?post=${encodeURIComponent(postId)}`,
        notificacaoId: `comunidade-comentario-post:${postId}:${novoComentario.id}`,
      }, idSupabaseValidoComunidade);
    }

    setPosts((postsAtuais) =>
      adicionarComentarioPostComunidade(postsAtuais, postId, novoComentario)
    );

    emitirFeedbackAcao(setFeedbackAcao, feedbackTimerRef, "Comentário enviado.");
    return true;
  } finally {
    finalizarAcaoComunidade(acoesComunidadeRef, chaveAcao);
  }
}
