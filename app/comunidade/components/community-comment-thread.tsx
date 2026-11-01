import type { ComentarioComunidade } from "./community-comment";
import { CommunityCommentItem } from "./community-comment-item";
import {
  obterTextoBotaoOcultarRespostasComunidade,
  obterTextoBotaoVerMaisRespostasComunidade,
  obterTextoBotaoVerRespostasComunidade,
} from "./community-comment-replies-action-text";
import { CommunityCommentRepliesControlsContainer } from "./community-comment-replies-controls-container";
import { CommunityCommentRepliesHideButton } from "./community-comment-replies-hide-button";
import { CommunityCommentRepliesListContainer } from "./community-comment-replies-list-container";
import { CommunityCommentRepliesToggleButton } from "./community-comment-replies-toggle-button";
import {
  deveExibirBotaoVerRespostasComunidade,
  temRespostasOcultasComunidade,
  temRespostasVisiveisComunidade,
} from "./community-comment-replies-visibility";
import { CommunityCommentThreadContainer } from "./community-comment-thread-container";
import { obterRespostasComentarioComunidade } from "./community-comment-tree";
import type { VisibilidadeRespostasComunidade } from "../hooks/use-community-comment-sheet-replies-visibility";

type CommunityCommentThreadProps = {
  comentario: ComentarioComunidade;
  respostasPorRaiz: Map<string, ComentarioComunidade[]>;
  obterVisibilidadeRespostas: (
    respostas: ComentarioComunidade[],
    comentario: ComentarioComunidade,
  ) => VisibilidadeRespostasComunidade;
  onAbrirRespostas: (
    respostas: ComentarioComunidade[],
    comentario: ComentarioComunidade,
  ) => void;
  onCarregarMaisRespostas: (
    respostas: ComentarioComunidade[],
    comentario: ComentarioComunidade,
  ) => void;
  onOcultarRespostas: (comentario: ComentarioComunidade) => void;
  usuarioId: string;
  podeComentar: boolean;
  agoraComentarios: number;
  postId: string;
  comentarioCurtindoId: string | null;
  comentarioRemovendoId: string | null;
  comentarioDenunciandoId: string | null;
  onResponderComentario: (
    comentario: ComentarioComunidade,
    comentarioRaizId: string
  ) => void;
  onCurtirComentario: (
    postId: string,
    comentarioId: string
  ) => void | Promise<void>;
  onRemoverComentario: (
    postId: string,
    comentarioId: string
  ) => void | Promise<void>;
  onDenunciarComentario: (comentarioId: string) => void | Promise<void>;
};

export function CommunityCommentThread({
  comentario,
  respostasPorRaiz,
  obterVisibilidadeRespostas,
  onAbrirRespostas,
  onCarregarMaisRespostas,
  onOcultarRespostas,
  usuarioId,
  podeComentar,
  agoraComentarios,
  postId,
  comentarioCurtindoId,
  comentarioRemovendoId,
  comentarioDenunciandoId,
  onResponderComentario,
  onCurtirComentario,
  onRemoverComentario,
  onDenunciarComentario,
}: CommunityCommentThreadProps) {
  const respostas = obterRespostasComentarioComunidade(
    respostasPorRaiz,
    comentario.id
  );
  const {
    respostasVisiveis,
    respostasOcultas,
    respostasExpandidas,
  } = obterVisibilidadeRespostas(respostas, comentario);

  return (
    <CommunityCommentThreadContainer>
      <CommunityCommentItem
        key={comentario.id}
        comentario={comentario}
        comentarioRaizId={comentario.id}
        usuarioId={usuarioId}
        podeComentar={podeComentar}
        agoraComentarios={agoraComentarios}
        postId={postId}
        comentarioCurtindoId={comentarioCurtindoId}
        comentarioRemovendoId={comentarioRemovendoId}
        comentarioDenunciandoId={comentarioDenunciandoId}
        onResponderComentario={onResponderComentario}
        onCurtirComentario={onCurtirComentario}
        onRemoverComentario={onRemoverComentario}
        onDenunciarComentario={onDenunciarComentario}
      />

      {temRespostasVisiveisComunidade(respostasVisiveis) ? (
        <CommunityCommentRepliesListContainer>
          {respostasVisiveis.map((resposta) => (
            <CommunityCommentItem
              key={resposta.id}
              comentario={resposta}
              comentarioRaizId={comentario.id}
              resposta
              usuarioId={usuarioId}
              podeComentar={podeComentar}
              agoraComentarios={agoraComentarios}
              postId={postId}
              comentarioCurtindoId={comentarioCurtindoId}
              comentarioRemovendoId={comentarioRemovendoId}
              comentarioDenunciandoId={comentarioDenunciandoId}
              onResponderComentario={onResponderComentario}
              onCurtirComentario={onCurtirComentario}
              onRemoverComentario={onRemoverComentario}
              onDenunciarComentario={onDenunciarComentario}
            />
          ))}
        </CommunityCommentRepliesListContainer>
      ) : null}

      {deveExibirBotaoVerRespostasComunidade(
        respostas,
        respostasExpandidas
      ) ? (
        <CommunityCommentRepliesToggleButton
          type="button"
          onClick={() => onAbrirRespostas(respostas, comentario)}
        >
          {obterTextoBotaoVerRespostasComunidade(respostas.length)}
        </CommunityCommentRepliesToggleButton>
      ) : null}

      {respostasExpandidas ? (
        <CommunityCommentRepliesControlsContainer>
          {temRespostasOcultasComunidade(respostasOcultas) ? (
            <CommunityCommentRepliesToggleButton
              type="button"
              onClick={() => onCarregarMaisRespostas(respostas, comentario)}
            >
              {obterTextoBotaoVerMaisRespostasComunidade(respostasOcultas)}
            </CommunityCommentRepliesToggleButton>
          ) : null}

          <CommunityCommentRepliesHideButton
            type="button"
            onClick={() => onOcultarRespostas(comentario)}
          >
            {obterTextoBotaoOcultarRespostasComunidade()}
          </CommunityCommentRepliesHideButton>
        </CommunityCommentRepliesControlsContainer>
      ) : null}
    </CommunityCommentThreadContainer>
  );
}
