"use client";

import type { ComentarioObraPublico } from "../lib/obra-comment-utils";
import {
  commentRepliesControlsStyle,
  commentRepliesHideButtonStyle,
  commentRepliesLineStyle,
  commentRepliesListStyle,
  commentRepliesToggleStyle,
  commentThreadStyle,
} from "../lib/obra-style-utils";
import ObraCommentItem from "./obra-comment-item";

type ObraCommentThreadProps = {
  comentario: ComentarioObraPublico;
  respostas: ComentarioObraPublico[];
  quantidadeVisivelAtual: number;
  usuarioIdLogado: string;
  comentarioRemovendoId: string;
  comentarioCurtindoId: string;
  agoraComentarios: number;
  onResponder: (
    comentario: ComentarioObraPublico,
    comentarioRaizId: string,
  ) => void;
  onRemover: (comentario: ComentarioObraPublico) => void | Promise<void>;
  onDenunciar: (comentario: ComentarioObraPublico) => void;
  onCurtir: (comentario: ComentarioObraPublico) => void | Promise<void>;
  onMostrarRespostas: (comentarioId: string, totalRespostas: number) => void;
  onMostrarMaisRespostas: (
    comentarioId: string,
    totalRespostas: number,
  ) => void;
  onOcultarRespostas: (comentarioId: string) => void;
};

export default function ObraCommentThread({
  comentario,
  respostas,
  quantidadeVisivelAtual,
  usuarioIdLogado,
  comentarioRemovendoId,
  comentarioCurtindoId,
  agoraComentarios,
  onResponder,
  onRemover,
  onDenunciar,
  onCurtir,
  onMostrarRespostas,
  onMostrarMaisRespostas,
  onOcultarRespostas,
}: ObraCommentThreadProps) {
  const quantidadeVisivel = Math.min(
    respostas.length,
    quantidadeVisivelAtual || 0,
  );
  const respostasVisiveis = respostas.slice(0, quantidadeVisivel);
  const respostasOcultas = Math.max(
    0,
    respostas.length - quantidadeVisivel,
  );
  const respostasExpandidas = quantidadeVisivel > 0;

  return (
    <section style={commentThreadStyle}>
      <ObraCommentItem
        comentario={comentario}
        comentarioRaizId={comentario.id}
        usuarioIdLogado={usuarioIdLogado}
        comentarioRemovendoId={comentarioRemovendoId}
        comentarioCurtindoId={comentarioCurtindoId}
        agoraComentarios={agoraComentarios}
        onResponder={onResponder}
        onRemover={onRemover}
        onDenunciar={onDenunciar}
        onCurtir={onCurtir}
      />

      {respostasVisiveis.length > 0 ? (
        <div style={commentRepliesListStyle}>
          {respostasVisiveis.map((resposta) => (
            <ObraCommentItem
              key={resposta.id}
              comentario={resposta}
              comentarioRaizId={comentario.id}
              resposta
              usuarioIdLogado={usuarioIdLogado}
              comentarioRemovendoId={comentarioRemovendoId}
              comentarioCurtindoId={comentarioCurtindoId}
              agoraComentarios={agoraComentarios}
              onResponder={onResponder}
              onRemover={onRemover}
              onDenunciar={onDenunciar}
              onCurtir={onCurtir}
            />
          ))}
        </div>
      ) : null}

      {respostas.length > 0 && !respostasExpandidas ? (
        <button
          type="button"
          onClick={() => onMostrarRespostas(comentario.id, respostas.length)}
          style={commentRepliesToggleStyle}
        >
          <span style={commentRepliesLineStyle} />
          {`Ver ${respostas.length} ${
            respostas.length === 1 ? "resposta" : "respostas"
          }`}
        </button>
      ) : null}

      {respostasExpandidas ? (
        <div style={commentRepliesControlsStyle}>
          {respostasOcultas > 0 ? (
            <button
              type="button"
              onClick={() =>
                onMostrarMaisRespostas(comentario.id, respostas.length)
              }
              style={commentRepliesToggleStyle}
            >
              <span style={commentRepliesLineStyle} />
              {`Ver mais ${respostasOcultas} ${
                respostasOcultas === 1 ? "resposta" : "respostas"
              }`}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => onOcultarRespostas(comentario.id)}
            style={commentRepliesHideButtonStyle}
          >
            Ocultar respostas
          </button>
        </div>
      ) : null}
    </section>
  );
}
