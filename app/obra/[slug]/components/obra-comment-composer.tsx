"use client";

import type { FormEvent, RefObject } from "react";
import LoadingSpinner from "../ObraLoadingSpinner";
import {
  commentStatusStyle,
  commentsInputAvatarStyle,
  commentsInputBoxStyle,
  commentsInputIconButtonStyle,
  commentsQuickReactionButtonStyle,
  commentsQuickReactionsStyle,
  commentsSheetFormStyle,
  commentsSheetInputStyle,
  commentsSheetSendStyle,
  commentsToolsStyle,
} from "../lib/obra-style-utils";

type ObraCommentComposerProps = {
  comentarioTexto: string;
  comentarioStatus: string;
  comentarioEnviando: boolean;
  usuarioIdLogado: string;
  avatarUsuario: string;
  nomeUsuario: string;
  comentarioInputRef: RefObject<HTMLTextAreaElement | null>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onAlterarTexto: (valor: string) => void;
  onInserirNoComentario: (valor: string) => void;
};

export default function ObraCommentComposer({
  comentarioTexto,
  comentarioStatus,
  comentarioEnviando,
  usuarioIdLogado,
  avatarUsuario,
  nomeUsuario,
  comentarioInputRef,
  onSubmit,
  onAlterarTexto,
  onInserirNoComentario,
}: ObraCommentComposerProps) {
  const textoCompositor = usuarioIdLogado
    ? "Adicionar comentário..."
    : "Entre para comentar.";
  const avatarStyle = avatarUsuario
    ? {
        ...commentsInputAvatarStyle,
        backgroundImage: `url(${avatarUsuario})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : commentsInputAvatarStyle;

  return (
    <>
      <section style={commentsToolsStyle}>
        <div style={commentsQuickReactionsStyle}>
          {["💜", "🔥", "😂", "😮", "😭", "👏"].map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onInserirNoComentario(emoji)}
              style={commentsQuickReactionButtonStyle}
              aria-label={`Adicionar ${emoji} ao comentário`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </section>

      <form onSubmit={onSubmit} style={commentsSheetFormStyle}>
        <div style={avatarStyle}>
          {!avatarUsuario
            ? usuarioIdLogado
              ? nomeUsuario.slice(0, 1).toUpperCase() || "V"
              : "H"
            : null}
        </div>

        <div style={commentsInputBoxStyle}>
          <textarea
            aria-label={textoCompositor}
            ref={comentarioInputRef}
            value={comentarioTexto}
            onChange={(event) => onAlterarTexto(event.target.value)}
            style={commentsSheetInputStyle}
            placeholder={textoCompositor}
            maxLength={600}
            rows={1}
            disabled={comentarioEnviando}
          />
        </div>

        <button
          type="button"
          onClick={() => onInserirNoComentario("@")}
          disabled={comentarioEnviando}
          style={commentsInputIconButtonStyle}
          aria-label="Adicionar menção"
        >
          @
        </button>

        <button
          type="submit"
          aria-label="Enviar comentário"
          disabled={comentarioEnviando}
          style={{
            ...commentsSheetSendStyle,
            opacity: comentarioEnviando ? 0.58 : 1,
            cursor: comentarioEnviando ? "not-allowed" : "pointer",
          }}
        >
          {comentarioEnviando ? (
            <LoadingSpinner compacto label="Enviando comentário" />
          ) : (
            "↑"
          )}
        </button>
      </form>

      {comentarioStatus ? (
        <span style={commentStatusStyle}>{comentarioStatus}</span>
      ) : null}
    </>
  );
}
