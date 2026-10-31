import type { Dispatch, SetStateAction } from "react";
import type { HistorietasLanguage } from "../../../lib/i18n";
import { emitirFeedbackAcao } from "./community-action-feedback-toast";
import {
  finalizarAcaoComunidade,
  iniciarAcaoComunidade,
} from "./community-action-lock";
import { consultarUsuarioEhAdminComunidade } from "./community-admin-status-query";
import { removerReviewComunidadeDoDiario } from "./community-diary-review-remover";
import { removerPostSupabaseComunidade } from "./community-post-removal-delete";
import { consultarPostParaRemocaoComunidade } from "./community-post-removal-query";
import {
  removerPostDoEstadoComunidade,
  removerPostSalvoDoEstadoComunidade,
} from "./community-post-removal-state-updaters";
import { CHAVE_POSTS_SALVOS_COMUNIDADE } from "./community-storage-keys";
import { formatarErroSupabase } from "./community-supabase-error-formatter";
import { obterUsuarioAutenticadoComunidadeAtual } from "./community-supabase-current-user-loader";
import { traduzirTextoComunidade } from "./community-text-translator";
import type { PostComunidade } from "./community-post-model";
import type { UsuarioComunidade } from "./community-user";
import { salvarJsonUsuarioComunidade } from "./community-user-json-saver";

type SetState<T> = Dispatch<SetStateAction<T>>;

type RemoverPostComunidadeParams = {
  postId: string;
  acoesComunidadeRef: { current: Set<string> };
  setPostRemovendoId: SetState<string | null>;
  setErro: SetState<string>;
  exigirLogin: () => boolean;
  usuario: UsuarioComunidade | null;
  setUsuario: SetState<UsuarioComunidade | null>;
  setUsuarioEhAdmin: SetState<boolean>;
  setPostMenuAbertoId: SetState<string | null>;
  setPosts: SetState<PostComunidade[]>;
  language: HistorietasLanguage;
  reviewsDiarioSincronizadasRef: { current: Set<string> };
  postsSalvosIds: string[];
  setPostsSalvosIds: SetState<string[]>;
  setFeedbackAcao: SetState<string>;
  feedbackTimerRef: { current: number | null };
  carregarPostsComunidadeDaPagina: (
    mostrarCarregamento?: boolean,
    pagina?: number,
    obraFiltro?: string,
  ) => Promise<void>;
  obraRelacionadaFiltro: string;
};

export async function removerPostComunidade({
  postId,
  acoesComunidadeRef,
  setPostRemovendoId,
  setErro,
  exigirLogin,
  usuario,
  setUsuario,
  setUsuarioEhAdmin,
  setPostMenuAbertoId,
  setPosts,
  language,
  reviewsDiarioSincronizadasRef,
  postsSalvosIds,
  setPostsSalvosIds,
  setFeedbackAcao,
  feedbackTimerRef,
  carregarPostsComunidadeDaPagina,
  obraRelacionadaFiltro,
}: RemoverPostComunidadeParams) {
  const chaveAcao = `remover-post:${postId}`;

  if (!iniciarAcaoComunidade(acoesComunidadeRef, chaveAcao)) {
    return;
  }

  setPostRemovendoId(postId);
  setErro("");

  try {
    if (!exigirLogin() || !usuario) {
      return;
    }

    const usuarioAutenticado = await obterUsuarioAutenticadoComunidadeAtual();
    const usuarioAutenticadoId = usuarioAutenticado?.id?.trim() || "";
    const usuarioEstadoId = usuario.id.trim();

    if (
      !usuarioAutenticadoId ||
      usuarioAutenticadoId !== usuarioEstadoId
    ) {
      setUsuario(null);
      setUsuarioEhAdmin(false);
      setPostMenuAbertoId(null);
      setErro(
        "Sua conta mudou. Aguarde a Comunidade atualizar antes de tentar novamente."
      );
      return;
    }

    const usuarioAtualEhAdmin =
      await consultarUsuarioEhAdminComunidade();

    const resultadoConsultaPost =
      await consultarPostParaRemocaoComunidade(postId);

    if (!resultadoConsultaPost.sucesso) {
      setErro(
        formatarErroSupabase(
          "Erro ao conferir publicação",
          resultadoConsultaPost.erro
        )
      );
      return;
    }

    const postBanco = resultadoConsultaPost.postBanco;

    if (!postBanco) {
      setPosts((postsAtuais) =>
        removerPostDoEstadoComunidade(postsAtuais, postId)
      );
      setPostMenuAbertoId(null);
      setErro("Esta publicação já não existe.");
      return;
    }

    const autorPostId = postBanco.autor_id?.trim() || "";

    if (
      !usuarioAtualEhAdmin &&
      autorPostId !== usuarioAutenticadoId
    ) {
      setPostMenuAbertoId(null);
      setErro("Você só pode remover suas próprias publicações.");
      return;
    }

    if (
      !window.confirm(
        traduzirTextoComunidade("Remover esta publicação?", language)
      )
    ) {
      return;
    }

    const resultadoRemocaoPost = await removerPostSupabaseComunidade(
      postId,
      usuarioAutenticadoId,
      usuarioAtualEhAdmin
    );

    if (!resultadoRemocaoPost.sucesso) {
      setErro(
        formatarErroSupabase(
          "Erro ao remover publicação",
          resultadoRemocaoPost.erro
        )
      );
      return;
    }

    const postsRemovidos = resultadoRemocaoPost.postsRemovidos;

    if (!Array.isArray(postsRemovidos) || postsRemovidos.length === 0) {
      setErro(
        "A publicação não foi removida. A conta atual não possui permissão para essa ação."
      );
      await carregarPostsComunidadeDaPagina(false, 0, obraRelacionadaFiltro);
      return;
    }

    const postRemovido = postsRemovidos[0];

    if (postRemovido.tipo_publicacao === "Review") {
      await removerReviewComunidadeDoDiario({
        userId: postRemovido.autor_id || autorPostId,
        postId,
      });
      reviewsDiarioSincronizadasRef.current.delete(postId);
    }

    setUsuarioEhAdmin(usuarioAtualEhAdmin);
    setPosts((postsAtuais) =>
      removerPostDoEstadoComunidade(postsAtuais, postId)
    );

    const postsSalvosAtualizados = removerPostSalvoDoEstadoComunidade(
      postsSalvosIds,
      postId
    );

    setPostsSalvosIds(postsSalvosAtualizados);

    salvarJsonUsuarioComunidade(
      CHAVE_POSTS_SALVOS_COMUNIDADE,
      usuarioAutenticadoId,
      postsSalvosAtualizados
    );

    emitirFeedbackAcao(setFeedbackAcao, feedbackTimerRef, "Publicação removida.");
    await carregarPostsComunidadeDaPagina(false, 0, obraRelacionadaFiltro);
  } finally {
    finalizarAcaoComunidade(acoesComunidadeRef, chaveAcao);
    setPostRemovendoId((postAtualId) =>
      postAtualId === postId ? null : postAtualId
    );
  }
}
