import type { Dispatch, SetStateAction } from "react";
import type { HistorietasLanguage } from "../../../lib/i18n";
import { emitirFeedbackAcao } from "./community-action-feedback-toast";
import {
  finalizarAcaoComunidade,
  iniciarAcaoComunidade,
} from "./community-action-lock";
import { prepararRemocaoComentarioComunidade } from "./community-comment-removal-preparation";
import { consultarComentarioParaRemocaoComunidade } from "./community-comment-removal-query";
import { removerComentarioSupabaseComunidade } from "./community-comment-removal-delete";
import {
  removerComentarioPostComunidade,
  removerComentariosPostComunidade,
} from "./community-comment-state-updaters";
import { obterIdsComentarioComRespostasComunidade } from "./community-comment-response-ids";
import type { PostComunidade } from "./community-post-model";
import { formatarErroSupabase } from "./community-supabase-error-formatter";
import { obterUsuarioAutenticadoComunidadeAtual } from "./community-supabase-current-user-loader";
import { traduzirTextoComunidade } from "./community-text-translator";
import type { UsuarioComunidade } from "./community-user";

type SetState<T> = Dispatch<SetStateAction<T>>;

type RemoverComentarioComunidadeParams = {
  postId: string;
  comentarioId: string;
  acoesComunidadeRef: { current: Set<string> };
  setErro: SetState<string>;
  exigirLogin: () => boolean;
  usuario: UsuarioComunidade | null;
  setUsuario: SetState<UsuarioComunidade | null>;
  setUsuarioEhAdmin: SetState<boolean>;
  setPostMenuAbertoId: SetState<string | null>;
  posts: PostComunidade[];
  setPosts: SetState<PostComunidade[]>;
  language: HistorietasLanguage;
  setFeedbackAcao: SetState<string>;
  feedbackTimerRef: { current: number | null };
  carregarPostsComunidadeDaPagina: (
    mostrarCarregamento?: boolean,
    pagina?: number,
    obraFiltro?: string,
  ) => Promise<void>;
  obraRelacionadaFiltro: string;
};

export async function removerComentarioComunidade({
  postId,
  comentarioId,
  acoesComunidadeRef,
  setErro,
  exigirLogin,
  usuario,
  setUsuario,
  setUsuarioEhAdmin,
  setPostMenuAbertoId,
  posts,
  setPosts,
  language,
  setFeedbackAcao,
  feedbackTimerRef,
  carregarPostsComunidadeDaPagina,
  obraRelacionadaFiltro,
}: RemoverComentarioComunidadeParams) {
  const chaveAcao = `remover-comentario:${comentarioId}`;

  if (!iniciarAcaoComunidade(acoesComunidadeRef, chaveAcao)) {
    return;
  }

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

    const resultadoPreparacaoRemocaoComentario =
      prepararRemocaoComentarioComunidade(
        posts,
        postId,
        comentarioId,
        usuarioAutenticadoId
      );

    if (!resultadoPreparacaoRemocaoComentario.valido) {
      setErro(resultadoPreparacaoRemocaoComentario.erro);
      return;
    }

    const { comentariosDoPost } = resultadoPreparacaoRemocaoComentario;

    const resultadoConsultaComentario =
      await consultarComentarioParaRemocaoComunidade(comentarioId);

    if (!resultadoConsultaComentario.sucesso) {
      setErro(
        formatarErroSupabase(
          "Erro ao conferir comentário",
          resultadoConsultaComentario.erro
        )
      );
      return;
    }

    const { comentarioBanco } = resultadoConsultaComentario;

    if (!comentarioBanco) {
      setPosts((postsAtuais) =>
        removerComentarioPostComunidade(postsAtuais, postId, comentarioId)
      );
      setErro("Este comentário já não existe.");
      return;
    }

    if (comentarioBanco.autor_id !== usuarioAutenticadoId) {
      setErro("Você só pode remover seus próprios comentários.");
      return;
    }

    if (
      !window.confirm(
        traduzirTextoComunidade("Remover este comentário?", language)
      )
    ) {
      return;
    }

    const idsParaRemover = obterIdsComentarioComRespostasComunidade(
      comentariosDoPost,
      comentarioId
    );

    const resultadoRemocaoComentario =
      await removerComentarioSupabaseComunidade(
        comentarioId,
        usuarioAutenticadoId
      );

    if (!resultadoRemocaoComentario.sucesso) {
      setErro(
        formatarErroSupabase(
          "Erro ao remover comentário",
          resultadoRemocaoComentario.erro
        )
      );
      return;
    }

    const { comentariosRemovidos } = resultadoRemocaoComentario;

    if (!Array.isArray(comentariosRemovidos) || comentariosRemovidos.length === 0) {
      setErro(
        "O comentário não foi removido. A conta atual não possui permissão para essa ação."
      );
      await carregarPostsComunidadeDaPagina(false, 0, obraRelacionadaFiltro);
      return;
    }

    setPosts((postsAtuais) =>
      removerComentariosPostComunidade(postsAtuais, postId, idsParaRemover)
    );

    emitirFeedbackAcao(setFeedbackAcao, feedbackTimerRef, "Comentário removido.");
  } finally {
    finalizarAcaoComunidade(acoesComunidadeRef, chaveAcao);
  }
}
