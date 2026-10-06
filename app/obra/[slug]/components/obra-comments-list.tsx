"use client";

import type { ComentarioObraPublico } from "../lib/obra-comment-utils";
import LoadingSpinner from "../ObraLoadingSpinner";
import {
  commentsLoadMoreStyle,
  commentsLoadingStyle,
  commentsSheetListStyle,
  emptyCommentsStyle,
} from "../lib/obra-style-utils";
import ObraCommentThread from "./obra-comment-thread";

type ObraCommentsListProps = {
  comentariosCarregando: boolean;
  comentariosRaiz: ComentarioObraPublico[];
  respostasPorRaiz: Map<string, ComentarioObraPublico[]>;
  comentariosTemMais: boolean;
  comentariosCarregandoMais: boolean;
  respostasVisiveisPorComentario: Record<string, number>;
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
  onCarregarMais: () => void | Promise<void>;
};

export default function ObraCommentsList({
  comentariosCarregando,
  comentariosRaiz,
  respostasPorRaiz,
  comentariosTemMais,
  comentariosCarregandoMais,
  respostasVisiveisPorComentario,
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
  onCarregarMais,
}: ObraCommentsListProps) {
  return (
    <section style={commentsSheetListStyle}>
      {comentariosCarregando ? (
        <div style={commentsLoadingStyle}>
          <LoadingSpinner compacto label="Carregando comentários" />
        </div>
      ) : comentariosRaiz.length > 0 ? (
        <>
          {comentariosRaiz.map((comentario) => {
            const respostas = respostasPorRaiz.get(comentario.id) || [];

            return (
              <ObraCommentThread
                key={comentario.id}
                comentario={comentario}
                respostas={respostas}
                quantidadeVisivelAtual={
                  respostasVisiveisPorComentario[comentario.id] || 0
                }
                usuarioIdLogado={usuarioIdLogado}
                comentarioRemovendoId={comentarioRemovendoId}
                comentarioCurtindoId={comentarioCurtindoId}
                agoraComentarios={agoraComentarios}
                onResponder={onResponder}
                onRemover={onRemover}
                onDenunciar={onDenunciar}
                onCurtir={onCurtir}
                onMostrarRespostas={onMostrarRespostas}
                onMostrarMaisRespostas={onMostrarMaisRespostas}
                onOcultarRespostas={onOcultarRespostas}
              />
            );
          })}
          {comentariosTemMais ? (
            <button
              type="button"
              onClick={() => void onCarregarMais()}
              disabled={comentariosCarregandoMais}
              style={{
                ...commentsLoadMoreStyle,
                opacity: comentariosCarregandoMais ? 0.62 : 1,
                cursor: comentariosCarregandoMais
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {comentariosCarregandoMais
                ? "Carregando..."
                : "Carregar mais comentários"}
            </button>
          ) : null}
        </>
      ) : (
        <p style={emptyCommentsStyle}>Sem comentários ainda</p>
      )}
    </section>
  );
}
