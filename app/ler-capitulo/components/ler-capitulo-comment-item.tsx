"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import type { ComentarioCapituloPublico } from "./ler-capitulo-comments-sheet";
import {
  commentActionsRowStyle,
  commentAuthorLinkStyle,
  commentAvatarLinkStyle,
  commentContentStyle,
  commentHeartIconStyle,
  commentItemStyle,
  commentLikeButtonStyle,
  commentLikeCountStyle,
  commentLikeWrapStyle,
  commentRemoveButtonStyle,
  commentReplyAvatarLinkStyle,
  commentReplyButtonStyle,
  commentReplyItemStyle,
  commentReportButtonStyle,
  commentTextStyle,
  commentTimeStyle,
  commentTopLineStyle,
} from "../lib/ler-capitulo-comments-styles";

type LerCapituloCommentItemProps = {
  comentario: ComentarioCapituloPublico;
  comentarioRaizId: string;
  resposta?: boolean;
  usuarioId: string;
  podeComentar: boolean;
  postId: string;
  agoraComentarios: number;
  comentarioCurtindoId: string | null;
  comentarioRemovendoId: string | null;
  comentarioDenunciandoId: string | null;
  onResponderComentario: (
    comentario: ComentarioCapituloPublico,
    comentarioRaizId: string,
  ) => void;
  onCurtirComentario: (
    postId: string,
    comentarioId: string,
  ) => void | Promise<void>;
  onRemoverComentario: (
    postId: string,
    comentarioId: string,
  ) => void | Promise<void>;
  onDenunciarComentario: (
    comentarioId: string,
  ) => void | Promise<void>;
};

function criarHrefPerfilUsuarioLeitor(userId: string, nome: string) {
  const params = new URLSearchParams();
  const userIdLimpo = userId.trim();
  const nomeLimpo = nome.trim() || "Usuário";

  if (userIdLimpo) {
    params.set("userId", userIdLimpo);
    params.set("autorId", userIdLimpo);
  }

  params.set("autor", nomeLimpo);

  return `/perfil-autor?${params.toString()}`;
}

export function criarAvatarComentarioBaseStyle(
  estiloBase: CSSProperties,
  avatar: string,
): CSSProperties {
  const avatarLimpo = avatar.trim();

  if (!avatarLimpo) {
    return estiloBase;
  }

  return {
    ...estiloBase,
    backgroundImage: `url(${avatarLimpo})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "transparent",
    WebkitTextFillColor: "transparent",
  };
}

function formatarTempoRelativoComentarioCapitulo(
  criadaEm: string,
  agora = Date.now(),
) {
  const dataComentario = new Date(criadaEm).getTime();

  if (Number.isNaN(dataComentario)) {
    return "agora";
  }

  const segundos = Math.max(0, Math.floor((agora - dataComentario) / 1000));

  if (segundos < 5) {
    return "agora";
  }

  if (segundos < 60) {
    return `há ${segundos} ${segundos === 1 ? "segundo" : "segundos"}`;
  }

  const minutos = Math.floor(segundos / 60);

  if (minutos < 60) {
    return `há ${minutos} ${minutos === 1 ? "minuto" : "minutos"}`;
  }

  const horas = Math.floor(minutos / 60);

  if (horas < 24) {
    return `há ${horas} ${horas === 1 ? "hora" : "horas"}`;
  }

  const dias = Math.floor(horas / 24);

  return `há ${dias} ${dias === 1 ? "dia" : "dias"}`;
}

export function LerCapituloCommentItem({
  comentario,
  comentarioRaizId,
  resposta = false,
  usuarioId,
  podeComentar,
  postId,
  agoraComentarios,
  comentarioCurtindoId,
  comentarioRemovendoId,
  comentarioDenunciandoId,
  onResponderComentario,
  onCurtirComentario,
  onRemoverComentario,
  onDenunciarComentario,
}: LerCapituloCommentItemProps) {
  const usuarioCurtiuComentario = Boolean(
    usuarioId && comentario.curtidas.includes(usuarioId),
  );
  const podeRemoverComentario = Boolean(
    usuarioId && comentario.userId === usuarioId,
  );
  const podeDenunciarComentario = Boolean(
    usuarioId && comentario.userId !== usuarioId,
  );
  const comentarioCurtindo = comentarioCurtindoId === comentario.id;
  const comentarioRemovendo = comentarioRemovendoId === comentario.id;
  const comentarioDenunciando = comentarioDenunciandoId === comentario.id;
  const avatarBaseStyle = resposta
    ? commentReplyAvatarLinkStyle
    : commentAvatarLinkStyle;

  return (
    <article style={resposta ? commentReplyItemStyle : commentItemStyle}>
      <Link
        href={criarHrefPerfilUsuarioLeitor(
          comentario.userId,
          comentario.nome,
        )}
        aria-label={`Abrir perfil de ${comentario.nome}`}
        style={criarAvatarComentarioBaseStyle(
          avatarBaseStyle,
          comentario.avatar,
        )}
      >
        {!comentario.avatar &&
          (comentario.nome.slice(0, 1).toUpperCase() || "U")}
      </Link>

      <div style={commentContentStyle}>
        <div style={commentTopLineStyle}>
          <Link
            href={criarHrefPerfilUsuarioLeitor(
              comentario.userId,
              comentario.nome,
            )}
            style={commentAuthorLinkStyle}
          >
            <span data-historietas-i18n-ignore="true">
              {comentario.nome}
            </span>
          </Link>

          <span style={commentTimeStyle}>
            {formatarTempoRelativoComentarioCapitulo(
              comentario.criadoEm,
              agoraComentarios,
            )}
          </span>
        </div>

        <p style={commentTextStyle}>
          <span data-historietas-i18n-ignore="true">
            {comentario.texto}
          </span>
        </p>

        <div style={commentActionsRowStyle}>
          <button
            type="button"
            onClick={() =>
              onResponderComentario(comentario, comentarioRaizId)
            }
            disabled={!podeComentar}
            style={{
              ...commentReplyButtonStyle,
              opacity: podeComentar ? 1 : 0.52,
              cursor: podeComentar ? "pointer" : "not-allowed",
            }}
          >
            Responder
          </button>

          {podeRemoverComentario ? (
            <button
              type="button"
              onClick={() => onRemoverComentario(postId, comentario.id)}
              disabled={comentarioRemovendo}
              style={{
                ...commentRemoveButtonStyle,
                opacity: comentarioRemovendo ? 0.58 : 1,
                cursor: comentarioRemovendo ? "not-allowed" : "pointer",
              }}
            >
              {comentarioRemovendo ? "Removendo..." : "Remover"}
            </button>
          ) : null}

          {podeDenunciarComentario ? (
            <button
              type="button"
              onClick={() => onDenunciarComentario(comentario.id)}
              disabled={comentarioDenunciando}
              style={{
                ...commentReportButtonStyle,
                opacity: comentarioDenunciando ? 0.58 : 1,
                cursor: comentarioDenunciando ? "not-allowed" : "pointer",
              }}
            >
              {comentarioDenunciando ? "Enviando..." : "Denunciar"}
            </button>
          ) : null}
        </div>
      </div>

      <div style={commentLikeWrapStyle}>
        <button
          type="button"
          data-historietas-reader-like="comment"
          aria-pressed={usuarioCurtiuComentario}
          aria-label={`${
            usuarioCurtiuComentario
              ? "Remover curtida do comentário"
              : "Curtir comentário"
          }. ${comentario.curtidas.length} ${
            comentario.curtidas.length === 1 ? "curtida" : "curtidas"
          }`}
          onClick={() => onCurtirComentario(postId, comentario.id)}
          disabled={!podeComentar || comentarioCurtindo}
          style={{
            ...commentLikeButtonStyle,
            opacity: podeComentar && !comentarioCurtindo ? 1 : 0.58,
            cursor:
              podeComentar && !comentarioCurtindo
                ? "pointer"
                : "not-allowed",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            style={{
              ...commentHeartIconStyle,
              animation: usuarioCurtiuComentario
                ? "historietas-reader-heart-pop 260ms ease-out"
                : "none",
            }}
          >
            <path
              d="M20.7 5.3c-1.8-1.9-4.7-1.9-6.5 0L12 7.6 9.8 5.3c-1.8-1.9-4.7-1.9-6.5 0-1.8 1.9-1.8 5 0 6.9L12 21l8.7-8.8c1.8-1.9 1.8-5 0-6.9Z"
              fill={
                usuarioCurtiuComentario
                  ? "var(--historietas-reader-heart, #FFFFFF)"
                  : "none"
              }
              stroke={
                usuarioCurtiuComentario
                  ? "var(--historietas-reader-heart, #FFFFFF)"
                  : "#FFFFFF"
              }
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <span style={commentLikeCountStyle}>
          {comentario.curtidas.length}
        </span>
      </div>
    </article>
  );
}
