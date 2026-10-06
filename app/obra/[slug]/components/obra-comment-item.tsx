"use client";

import Link from "next/link";
import {
  formatarTempoRelativoComentarioObra,
  type ComentarioObraPublico,
} from "../lib/obra-comment-utils";
import { criarLinkPerfilAutor } from "../lib/obra-navigation-utils";
import {
  commentSheetActionsRowStyle,
  commentSheetAuthorLinkStyle,
  commentSheetAvatarLinkStyle,
  commentSheetContentStyle,
  commentSheetHeartIconStyle,
  commentSheetItemStyle,
  commentSheetLikeButtonStyle,
  commentSheetLikeCountStyle,
  commentSheetLikeWrapStyle,
  commentSheetRemoveButtonStyle,
  commentSheetReplyAvatarLinkStyle,
  commentSheetReplyButtonStyle,
  commentSheetReplyItemStyle,
  commentSheetTextStyle,
  commentSheetTimeStyle,
  commentSheetTopLineStyle,
} from "../lib/obra-style-utils";

type ObraCommentItemProps = {
  comentario: ComentarioObraPublico;
  comentarioRaizId: string;
  resposta?: boolean;
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
};

export default function ObraCommentItem({
  comentario,
  comentarioRaizId,
  resposta = false,
  usuarioIdLogado,
  comentarioRemovendoId,
  comentarioCurtindoId,
  agoraComentarios,
  onResponder,
  onRemover,
  onDenunciar,
  onCurtir,
}: ObraCommentItemProps) {
  const podeRemover = Boolean(
    usuarioIdLogado && comentario.userId === usuarioIdLogado,
  );
  const removendo = comentarioRemovendoId === comentario.id;
  const curtindo = comentarioCurtindoId === comentario.id;
  const usuarioCurtiu = Boolean(
    usuarioIdLogado && comentario.curtidas.includes(usuarioIdLogado),
  );
  const avatarStyle = comentario.avatar
    ? {
        ...(resposta
          ? commentSheetReplyAvatarLinkStyle
          : commentSheetAvatarLinkStyle),
        backgroundImage: `url(${comentario.avatar})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : resposta
      ? commentSheetReplyAvatarLinkStyle
      : commentSheetAvatarLinkStyle;

  return (
    <article
      style={resposta ? commentSheetReplyItemStyle : commentSheetItemStyle}
    >
      <Link
        href={criarLinkPerfilAutor(comentario.nome, comentario.userId)}
        aria-label={`Abrir perfil de ${comentario.nome}`}
        style={avatarStyle}
      >
        {!comentario.avatar
          ? comentario.nome.slice(0, 1).toUpperCase() || "U"
          : null}
      </Link>

      <div style={commentSheetContentStyle}>
        <div style={commentSheetTopLineStyle}>
          <Link
            href={criarLinkPerfilAutor(comentario.nome, comentario.userId)}
            data-historietas-i18n-ignore="true"
            style={commentSheetAuthorLinkStyle}
          >
            {comentario.nome}
          </Link>

          <span style={commentSheetTimeStyle}>
            {formatarTempoRelativoComentarioObra(
              comentario.criadoEm,
              agoraComentarios,
            )}
          </span>
        </div>

        <p data-historietas-i18n-ignore="true" style={commentSheetTextStyle}>{comentario.texto}</p>

        <div style={commentSheetActionsRowStyle}>
          <button
            type="button"
            onClick={() => onResponder(comentario, comentarioRaizId)}
            style={commentSheetReplyButtonStyle}
          >
            Responder
          </button>

          {podeRemover ? (
            <button
              type="button"
              onClick={() => void onRemover(comentario)}
              disabled={removendo}
              style={{
                ...commentSheetRemoveButtonStyle,
                opacity: removendo ? 0.58 : 1,
                cursor: removendo ? "not-allowed" : "pointer",
              }}
            >
              {removendo ? "Removendo..." : "Remover"}
            </button>
          ) : !comentario.local ? (
            <button
              type="button"
              onClick={() => onDenunciar(comentario)}
              style={commentSheetRemoveButtonStyle}
            >
              Denunciar
            </button>
          ) : null}
        </div>
      </div>

      <div style={commentSheetLikeWrapStyle}>
        <button
          type="button"
          aria-label={
            usuarioCurtiu
              ? "Remover curtida do comentário"
              : "Curtir comentário"
          }
          onClick={() => void onCurtir(comentario)}
          disabled={curtindo}
          style={{
            ...commentSheetLikeButtonStyle,
            opacity: curtindo ? 0.58 : 1,
            cursor: curtindo ? "not-allowed" : "pointer",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            style={commentSheetHeartIconStyle}
          >
            <path
              d="M20.7 5.3c-1.8-1.9-4.7-1.9-6.5 0L12 7.6 9.8 5.3c-1.8-1.9-4.7-1.9-6.5 0-1.8 1.9-1.8 5 0 6.9L12 21l8.7-8.8c1.8-1.9 1.8-5 0-6.9Z"
              fill={usuarioCurtiu ? "var(--historietas-obra-heart, #FFFFFF)" : "none"}
              stroke={
                usuarioCurtiu
                  ? "var(--historietas-obra-heart, #FFFFFF)"
                  : "var(--historietas-text-secondary, #D4D4D8)"
              }
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <span style={commentSheetLikeCountStyle}>
          {comentario.curtidas.length}
        </span>
      </div>
    </article>
  );
}
