import type { Dispatch, SetStateAction } from "react";
import {
  finalizarAcaoComunidade,
  iniciarAcaoComunidade,
} from "./community-action-lock";
import { atualizarCurtidaPostComunidade } from "./community-like-state-updaters";
import { votarEnquete } from "./community-poll-voter";
import type { ResultadoVotosEnquete } from "./community-poll-votes-result";
import type { PostComunidade } from "./community-post-model";
import { compartilharPublicacao } from "./community-post-sharer";
import { sincronizarCurtidaPostSupabaseComunidade } from "./community-post-like-sync";
import { alternarPostSalvo } from "./community-saved-post-toggler";
import { alternarSpoilerRevelado } from "./community-spoiler-revealed-toggler";
import { formatarErroSupabase } from "./community-supabase-error-formatter";
import { idSupabaseValidoComunidade } from "./community-supabase-id-validator";
import { criarNotificacaoComunidadeSupabase } from "./community-supabase-notification-creator";
import type { UsuarioComunidade } from "./community-user";

type UseComunidadePostEngagementActionsParams = {
  acoesComunidadeRef: { current: Set<string> };
  setPostCurtindoId: Dispatch<SetStateAction<string | null>>;
  setErro: Dispatch<SetStateAction<string>>;
  exigirLogin: () => boolean;
  usuario: UsuarioComunidade | null;
  posts: PostComunidade[];
  setPosts: Dispatch<SetStateAction<PostComunidade[]>>;
  setPostSalvandoId: Dispatch<SetStateAction<string | null>>;
  postsSalvosIds: string[];
  setPostsSalvosIds: Dispatch<SetStateAction<string[]>>;
  setFeedbackAcao: Dispatch<SetStateAction<string>>;
  feedbackTimerRef: { current: number | null };
  setPostCompartilhandoId: Dispatch<SetStateAction<string | null>>;
  votandoEnqueteId: string | null;
  votosEnquetes: Record<string, string>;
  setVotandoEnqueteId: Dispatch<SetStateAction<string | null>>;
  setResultadosEnquetes: Dispatch<SetStateAction<ResultadoVotosEnquete>>;
  setVotosEnquetes: Dispatch<SetStateAction<Record<string, string>>>;
  setSpoilersReveladosIds: Dispatch<SetStateAction<string[]>>;
};

export function useComunidadePostEngagementActions({
  acoesComunidadeRef,
  setPostCurtindoId,
  setErro,
  exigirLogin,
  usuario,
  posts,
  setPosts,
  setPostSalvandoId,
  postsSalvosIds,
  setPostsSalvosIds,
  setFeedbackAcao,
  feedbackTimerRef,
  setPostCompartilhandoId,
  votandoEnqueteId,
  votosEnquetes,
  setVotandoEnqueteId,
  setResultadosEnquetes,
  setVotosEnquetes,
  setSpoilersReveladosIds,
}: UseComunidadePostEngagementActionsParams) {
  async function alternarCurtida(postId: string) {
    const chaveAcao = `curtir-post:${postId}`;

    if (!iniciarAcaoComunidade(acoesComunidadeRef, chaveAcao)) {
      return;
    }

    setPostCurtindoId(postId);
    setErro("");

    try {
      if (!exigirLogin() || !usuario) {
        return;
      }

      const postAtual = posts.find((post) => post.id === postId);
      const jaCurtiu = Boolean(postAtual?.curtidas.includes(usuario.id));

      const resultadoSincronizacaoCurtida =
        await sincronizarCurtidaPostSupabaseComunidade(
          postId,
          usuario.id,
          jaCurtiu
        );

      if (!resultadoSincronizacaoCurtida.sucesso) {
        if (resultadoSincronizacaoCurtida.etapa === "remocao") {
          setErro(
            formatarErroSupabase(
              "Erro ao atualizar curtida",
              resultadoSincronizacaoCurtida.erro
            )
          );
        } else {
          setErro(
            formatarErroSupabase(
              "Erro ao curtir",
              resultadoSincronizacaoCurtida.erro
            )
          );
        }

        return;
      }

      if (!jaCurtiu) {
        if (postAtual?.autorId) {
          await criarNotificacaoComunidadeSupabase({
            destinatarioId: postAtual.autorId,
            tipo: "comunidade-curtida-post",
            titulo: "Nova curtida na Comunidade",
            mensagem: `${usuario.nome} curtiu sua publicação.`,
            link: `/comunidade?post=${encodeURIComponent(postId)}`,
            notificacaoId: `comunidade-curtida-post:${postId}:${usuario.id}`,
          }, idSupabaseValidoComunidade);
        }
      }

      setPosts((postsAtuais) => {
        return atualizarCurtidaPostComunidade(
          postsAtuais,
          postId,
          usuario.id,
          jaCurtiu
        );
      });
    } finally {
      finalizarAcaoComunidade(acoesComunidadeRef, chaveAcao);
      setPostCurtindoId((postAtualId) =>
        postAtualId === postId ? null : postAtualId
      );
    }
  }

  function salvarPostComunidade(postId: string) {
    alternarPostSalvo({
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
    });
  }

  function compartilharPostComunidade(post: PostComunidade) {
    compartilharPublicacao({
      post,
      acoesComunidadeRef,
      setPostCompartilhandoId,
      setFeedbackAcao,
      feedbackTimerRef,
      setErro,
    });
  }

  function votarEnquetePostComunidade(postId: string, opcao: string) {
    return votarEnquete({
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
    });
  }

  function alternarSpoilerPostComunidade(postId: string) {
    alternarSpoilerRevelado({
      postId,
      setSpoilersReveladosIds,
    });
  }

  return {
    alternarCurtida,
    salvarPostComunidade,
    compartilharPostComunidade,
    votarEnquetePostComunidade,
    alternarSpoilerPostComunidade,
  };
}
