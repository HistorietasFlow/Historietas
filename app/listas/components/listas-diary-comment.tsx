import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

type ListasDiaryComment = {
  autorAvatar: string;
  autorNome: string;
  criadoEm: string;
  curtidas: string[];
  id: string;
  texto: string;
};

type ListasDiaryCommentStyles = {
  actionsRow: CSSProperties;
  authorLink: CSSProperties;
  content: CSSProperties;
  heartIcon: CSSProperties;
  item: CSSProperties;
  likeButton: CSSProperties;
  likeCount: CSSProperties;
  likeWrap: CSSProperties;
  removeButton: CSSProperties;
  replyButton: CSSProperties;
  replyItem: CSSProperties;
  reportButton: CSSProperties;
  text: CSSProperties;
  time: CSSProperties;
  topLine: CSSProperties;
};

type ListasDiaryCommentProps = {
  avatarStyle: CSSProperties;
  avatarContent: ReactNode;
  comentario: ListasDiaryComment;
  comentarioEhProprio: boolean;
  comentarioCurtiu: boolean;
  carregandoCurtida: boolean;
  formatarData: (data: string) => string;
  hrefPerfil: string;
  onLike: () => void;
  onRemove: () => void;
  onReply: () => void;
  onReport: () => void;
  removendoComentario: boolean;
  resposta?: boolean;
  podeResponder: boolean;
  styles: ListasDiaryCommentStyles;
};

export function ListasDiaryComment({
  avatarStyle,
  avatarContent,
  carregandoCurtida,
  comentario,
  comentarioCurtiu,
  comentarioEhProprio,
  formatarData,
  hrefPerfil,
  onLike,
  onRemove,
  onReply,
  onReport,
  podeResponder,
  removendoComentario,
  resposta = false,
  styles,
}: ListasDiaryCommentProps) {
  return (
    <article style={resposta ? styles.replyItem : styles.item}>
      <Link
        href={hrefPerfil}
        aria-label={`Abrir perfil de ${comentario.autorNome}`}
        style={avatarStyle}
      >
        {avatarContent}
      </Link>

      <div style={styles.content}>
        <div style={styles.topLine}>
          <Link href={hrefPerfil} style={styles.authorLink}>
            <span data-historietas-i18n-ignore="true">
              {comentario.autorNome}
            </span>
          </Link>
          <span style={styles.time}>{formatarData(comentario.criadoEm)}</span>
        </div>

        <p data-historietas-user-content="true" style={styles.text}>
          {comentario.texto}
        </p>

        <div style={styles.actionsRow}>
          <button
            type="button"
            onClick={onReply}
            disabled={!podeResponder}
            style={{
              ...styles.replyButton,
              opacity: podeResponder ? 1 : 0.52,
              cursor: podeResponder ? "pointer" : "not-allowed",
            }}
          >
            Responder
          </button>

          {comentarioEhProprio ? (
            <button
              type="button"
              onClick={onRemove}
              disabled={removendoComentario}
              style={{
                ...styles.removeButton,
                opacity: removendoComentario ? 0.58 : 1,
                cursor: removendoComentario ? "not-allowed" : "pointer",
              }}
            >
              {removendoComentario ? "Removendo..." : "Remover"}
            </button>
          ) : (
            <button
              type="button"
              onClick={onReport}
              style={styles.reportButton}
            >
              Denunciar
            </button>
          )}
        </div>
      </div>

      <div style={styles.likeWrap}>
        <button
          type="button"
          aria-pressed={comentarioCurtiu}
          aria-label={`${
            comentarioCurtiu
              ? "Remover curtida do comentário"
              : "Curtir comentário"
          }. ${comentario.curtidas.length} ${
            comentario.curtidas.length === 1 ? "curtida" : "curtidas"
          }`}
          onClick={onLike}
          disabled={carregandoCurtida}
          style={{
            ...styles.likeButton,
            opacity: carregandoCurtida ? 0.58 : 1,
            cursor: carregandoCurtida ? "not-allowed" : "pointer",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            style={{
              ...styles.heartIcon,
              animation: comentarioCurtiu
                ? "historietas-list-heart-pop 260ms ease-out"
                : "none",
            }}
          >
            <path
              d="M20.7 5.3c-1.8-1.9-4.7-1.9-6.5 0L12 7.6 9.8 5.3c-1.8-1.9-4.7-1.9-6.5 0-1.8 1.9-1.8 5 0 6.9L12 21l8.7-8.8c1.8-1.9 1.8-5 0-6.9Z"
              fill={comentarioCurtiu ? "#EF4444" : "none"}
              stroke={comentarioCurtiu ? "#EF4444" : "#FFFFFF"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span style={styles.likeCount}>{comentario.curtidas.length}</span>
      </div>
    </article>
  );
}

export type { ListasDiaryCommentStyles };
