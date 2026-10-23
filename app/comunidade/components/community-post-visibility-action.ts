import type { Dispatch, SetStateAction } from "react";
import { emitirFeedbackAcao } from "./community-action-feedback-toast";
import {
  finalizarAcaoComunidade,
  iniciarAcaoComunidade,
} from "./community-action-lock";
import { registrarReviewComunidadeNoDiario } from "./community-diary-review-registrar";
import type { ObraRelacionadaSugestao } from "./community-related-work-suggestion";
import {
  atualizarVisibilidadePostNoEstadoComunidade,
} from "./community-post-metadata-state-updaters";
import type { PostComunidade } from "./community-post-model";
import type { VisibilidadePostComunidade } from "./community-post-visibility";
import { normalizarVisibilidadePostComunidade } from "./community-post-visibility-normalizer";
import { atualizarVisibilidadePostSupabaseComunidade } from "./community-post-visibility-update";
import { formatarErroSupabase } from "./community-supabase-error-formatter";
import type { UsuarioComunidade } from "./community-user";

type SetState<T> = Dispatch<SetStateAction<T>>;

type AtualizarVisibilidadePostComunidadeParams = {
  post: PostComunidade;
  novaVisibilidade: VisibilidadePostComunidade;
  acoesComunidadeRef: { current: Set<string> };
  setPostVisibilidadeAtualizandoId: SetState<string | null>;
  setErro: SetState<string>;
  exigirLogin: () => boolean;
  usuario: UsuarioComunidade | null;
  obrasRelacionadasSugestoes: ObraRelacionadaSugestao[];
  reviewsDiarioSincronizadasRef: { current: Set<string> };
  setPosts: SetState<PostComunidade[]>;
  setPostMenuAbertoId: SetState<string | null>;
  setFeedbackAcao: SetState<string>;
  feedbackTimerRef: { current: number | null };
};

export async function atualizarVisibilidadePostComunidade({
  post,
  novaVisibilidade,
  acoesComunidadeRef,
  setPostVisibilidadeAtualizandoId,
  setErro,
  exigirLogin,
  usuario,
  obrasRelacionadasSugestoes,
  reviewsDiarioSincronizadasRef,
  setPosts,
  setPostMenuAbertoId,
  setFeedbackAcao,
  feedbackTimerRef,
}: AtualizarVisibilidadePostComunidadeParams) {
  const chaveAcao = `visibilidade-post:${post.id}`;

  if (!iniciarAcaoComunidade(acoesComunidadeRef, chaveAcao)) {
    return;
  }

  setPostVisibilidadeAtualizandoId(post.id);
  setErro("");

  try {
    if (!exigirLogin() || !usuario) {
      return;
    }

    if (post.autorId.trim() !== usuario.id.trim()) {
      return;
    }

    const visibilidadeSegura = normalizarVisibilidadePostComunidade(
      novaVisibilidade,
    );

    if (post.visibilidade === visibilidadeSegura) {
      return;
    }

    const reviewPrecisaSerProtegidaAntes =
      post.tipoPublicacao === "Review" && visibilidadeSegura !== "publico";

    if (reviewPrecisaSerProtegidaAntes) {
      const reviewSincronizada = await registrarReviewComunidadeNoDiario({
        userId: usuario.id,
        texto: post.texto,
        obraRelacionada: post.obraRelacionada,
        postId: post.id,
        criadaEm: post.criadoEm,
        sugestoesObras: obrasRelacionadasSugestoes,
        visibilidade: visibilidadeSegura,
      });

      if (!reviewSincronizada) {
        setErro(
          "Não foi possível atualizar a privacidade da review no Diário.",
        );
        return;
      }
    }

    const resultadoAtualizacaoVisibilidade =
      await atualizarVisibilidadePostSupabaseComunidade(
        post.id,
        usuario.id,
        visibilidadeSegura
      );

    if (
      !resultadoAtualizacaoVisibilidade.sucesso ||
      !resultadoAtualizacaoVisibilidade.data
    ) {
      if (post.tipoPublicacao === "Review") {
        reviewsDiarioSincronizadasRef.current.delete(post.id);
      }

      setErro(
        !resultadoAtualizacaoVisibilidade.sucesso
          ? formatarErroSupabase(
              "Erro ao atualizar visibilidade",
              resultadoAtualizacaoVisibilidade.erro
            )
          : "Erro ao atualizar visibilidade: a publicação não foi retornada.",
      );
      return;
    }

    if (post.tipoPublicacao === "Review") {
      if (reviewPrecisaSerProtegidaAntes) {
        reviewsDiarioSincronizadasRef.current.add(post.id);
      } else {
        reviewsDiarioSincronizadasRef.current.delete(post.id);
      }
    }

    setPosts((postsAtuais) =>
      atualizarVisibilidadePostNoEstadoComunidade(
        postsAtuais,
        post.id,
        visibilidadeSegura,
      )
    );
    setPostMenuAbertoId(null);
    emitirFeedbackAcao(setFeedbackAcao, feedbackTimerRef, "Visibilidade da publicação atualizada.");
  } finally {
    finalizarAcaoComunidade(acoesComunidadeRef, chaveAcao);
    setPostVisibilidadeAtualizandoId((postAtualId) =>
      postAtualId === post.id ? null : postAtualId,
    );
  }
}
