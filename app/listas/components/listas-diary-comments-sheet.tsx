import type {
  CSSProperties,
  FormEventHandler,
  KeyboardEventHandler,
  ReactNode,
  RefObject,
  TouchEventHandler,
} from "react";
import { createPortal } from "react-dom";

type ListasDiaryCommentsSheetStyles = {
  backdrop: CSSProperties;
  compact: CSSProperties;
  desktop: CSSProperties;
  empty: CSSProperties;
  error: CSSProperties;
  expanded: CSSProperties;
  form: CSSProperties;
  handle: CSSProperties;
  handleWrap: CSSProperties;
  header: CSSProperties;
  headerSpacer: CSSProperties;
  input: CSSProperties;
  inputBox: CSSProperties;
  inputIconButton: CSSProperties;
  list: CSSProperties;
  loading: CSSProperties;
  overlay: CSSProperties;
  panel: CSSProperties;
  quickReactionButton: CSSProperties;
  quickReactions: CSSProperties;
  replyingBanner: CSSProperties;
  replyingCancel: CSSProperties;
  send: CSSProperties;
  sortMenu: CSSProperties;
  sortMenuDivider: CSSProperties;
  sortMenuItem: CSSProperties;
  sortMenuItemActive: CSSProperties;
  sortMenuTrigger: CSSProperties;
  sortMenuWrap: CSSProperties;
  title: CSSProperties;
  tools: CSSProperties;
};

type ListasDiaryCommentsSheetProps = {
  ariaLabelTextarea: string;
  avatar: ReactNode;
  comentario: string;
  comentarioEmEnvio: boolean;
  comentarios: ReactNode;
  comentariosCarregando: boolean;
  comentariosErro: string;
  comentariosExpandido: boolean;
  comentariosTotal: number;
  comentariosTemRaiz: boolean;
  comentariosTemPermissao: boolean;
  isDesktop: boolean;
  menuOrdenacaoAberto: boolean;
  maxLength: number;
  onCancelReply: () => void;
  onChangeComentario: (texto: string) => void;
  onClose: () => void;
  onHandleKeyDown: KeyboardEventHandler<HTMLDivElement>;
  onHandleTouchCancel: TouchEventHandler<HTMLDivElement>;
  onHandleTouchEnd: TouchEventHandler<HTMLDivElement>;
  onHandleTouchMove: TouchEventHandler<HTMLDivElement>;
  onHandleTouchStart: TouchEventHandler<HTMLDivElement>;
  onInsertReaction: (texto: string) => void;
  onSelectOrdenacao: (ordenacao: "relevantes" | "recentes") => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onToggleExpand: () => void;
  onToggleOrdenacao: () => void;
  ordenacao: "relevantes" | "recentes";
  placeholderTextarea: string;
  quickReactions: string[];
  respondendoAutorNome: string;
  respondendoComentarioId: string;
  sheetRef: RefObject<HTMLElement | null>;
  styles: ListasDiaryCommentsSheetStyles;
  tituloObra: string;
};

export function ListasDiaryCommentsSheet({
  ariaLabelTextarea,
  avatar,
  comentario,
  comentarioEmEnvio,
  comentarios,
  comentariosCarregando,
  comentariosErro,
  comentariosExpandido,
  comentariosTemPermissao,
  comentariosTemRaiz,
  comentariosTotal,
  isDesktop,
  menuOrdenacaoAberto,
  maxLength,
  onCancelReply,
  onChangeComentario,
  onClose,
  onHandleKeyDown,
  onHandleTouchCancel,
  onHandleTouchEnd,
  onHandleTouchMove,
  onHandleTouchStart,
  onInsertReaction,
  onSelectOrdenacao,
  onSubmit,
  onToggleExpand,
  onToggleOrdenacao,
  ordenacao,
  placeholderTextarea,
  quickReactions,
  respondendoAutorNome,
  respondendoComentarioId,
  sheetRef,
  styles,
  tituloObra,
}: ListasDiaryCommentsSheetProps) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <section style={styles.overlay} aria-label="Comentários">
      <button
        type="button"
        aria-label="Fechar comentários"
        onClick={onClose}
        style={styles.backdrop}
      />

      <article
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Comentários de ${tituloObra}`}
        style={
          isDesktop
            ? styles.desktop
            : {
                ...styles.panel,
                ...(comentariosExpandido ? styles.expanded : styles.compact),
              }
        }
      >
        <div
          data-comments-sheet-handle="true"
          style={styles.handleWrap}
          onClick={onToggleExpand}
          onTouchStart={onHandleTouchStart}
          onTouchMove={onHandleTouchMove}
          onTouchEnd={onHandleTouchEnd}
          onTouchCancel={onHandleTouchCancel}
          role="button"
          tabIndex={0}
          aria-label={
            comentariosExpandido ? "Recolher comentários" : "Expandir comentários"
          }
          onKeyDown={onHandleKeyDown}
        >
          <div style={styles.handle} />
        </div>

        <header style={styles.header}>
          <span style={styles.headerSpacer} aria-hidden="true" />
          <strong style={styles.title}>
            {comentariosTotal === 1
              ? "1 comentário"
              : `${comentariosTotal} comentários`}
          </strong>

          <div style={styles.sortMenuWrap}>
            <button
              type="button"
              onClick={onToggleOrdenacao}
              style={styles.sortMenuTrigger}
              aria-label="Ordenar comentários"
              aria-haspopup="menu"
              aria-expanded={menuOrdenacaoAberto}
            >
              +
            </button>

            {menuOrdenacaoAberto ? (
              <div style={styles.sortMenu} role="menu">
                <button
                  type="button"
                  onClick={() => onSelectOrdenacao("relevantes")}
                  style={
                    ordenacao === "relevantes"
                      ? styles.sortMenuItemActive
                      : styles.sortMenuItem
                  }
                  role="menuitem"
                >
                  Relevantes
                </button>

                <div style={styles.sortMenuDivider} aria-hidden="true" />

                <button
                  type="button"
                  onClick={() => onSelectOrdenacao("recentes")}
                  style={
                    ordenacao === "recentes"
                      ? styles.sortMenuItemActive
                      : styles.sortMenuItem
                  }
                  role="menuitem"
                >
                  Recentes
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <section style={styles.list}>
          {comentariosTemRaiz ? (
            comentarios
          ) : comentariosCarregando ? (
            <div style={styles.loading}>Carregando comentários...</div>
          ) : (
            <p style={styles.empty}>Sem comentários ainda</p>
          )}
        </section>

        {comentariosErro ? (
          <span style={styles.error}>{comentariosErro}</span>
        ) : null}

        {respondendoComentarioId ? (
          <div style={styles.replyingBanner}>
            <span>Respondendo a {respondendoAutorNome || "usuário"}</span>
            <button
              type="button"
              onClick={onCancelReply}
              style={styles.replyingCancel}
            >
              Cancelar
            </button>
          </div>
        ) : null}

        <section style={styles.tools}>
          <div style={styles.quickReactions}>
            {quickReactions.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onInsertReaction(emoji)}
                disabled={!comentariosTemPermissao}
                style={styles.quickReactionButton}
                aria-label={`Adicionar ${emoji} ao comentário`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </section>

        <form onSubmit={onSubmit} style={styles.form}>
          {avatar}

          <div style={styles.inputBox}>
            <textarea
              aria-label={ariaLabelTextarea}
              value={comentario}
              onChange={(event) => onChangeComentario(event.target.value)}
              placeholder={placeholderTextarea}
              disabled={!comentariosTemPermissao || comentarioEmEnvio}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
              enterKeyHint="send"
              maxLength={maxLength}
              rows={1}
              style={styles.input}
            />
          </div>

          <button
            type="button"
            onClick={() => onInsertReaction("@")}
            disabled={!comentariosTemPermissao}
            style={styles.inputIconButton}
            aria-label="Adicionar menção"
          >
            @
          </button>

          <button
            type="submit"
            aria-label="Enviar comentário"
            disabled={
              !comentariosTemPermissao ||
              comentarioEmEnvio ||
              !comentario.trim()
            }
            style={{
              ...styles.send,
              opacity:
                comentariosTemPermissao &&
                !comentarioEmEnvio &&
                comentario.trim()
                  ? 1
                  : 0.58,
              cursor:
                comentariosTemPermissao &&
                !comentarioEmEnvio &&
                comentario.trim()
                  ? "pointer"
                  : "not-allowed",
            }}
          >
            {comentarioEmEnvio ? "…" : "↑"}
          </button>
        </form>
      </article>
    </section>,
    document.body,
  );
}

export type { ListasDiaryCommentsSheetStyles };
