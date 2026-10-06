"use client";

import type { OrdenacaoComentariosObra } from "../lib/obra-comment-utils";
import {
  commentsSheetHeaderSpacerStyle,
  commentsSheetHeaderStyle,
  commentsSheetTitleStyle,
  commentsSortMenuDividerStyle,
  commentsSortMenuItemActiveStyle,
  commentsSortMenuItemStyle,
  commentsSortMenuStyle,
  commentsSortMenuTriggerStyle,
  commentsSortMenuWrapStyle,
} from "../lib/obra-style-utils";

type ObraCommentsHeaderProps = {
  totalComentarios: number;
  ordenacao: OrdenacaoComentariosObra;
  menuAberto: boolean;
  onAlternarMenu: () => void;
  onSelecionarRelevantes: () => void;
  onSelecionarRecentes: () => void;
};

export default function ObraCommentsHeader({
  totalComentarios,
  ordenacao,
  menuAberto,
  onAlternarMenu,
  onSelecionarRelevantes,
  onSelecionarRecentes,
}: ObraCommentsHeaderProps) {
  return (
    <header style={commentsSheetHeaderStyle}>
      <span style={commentsSheetHeaderSpacerStyle} aria-hidden="true" />

      <strong style={commentsSheetTitleStyle}>
        {totalComentarios === 1
          ? "1 comentário"
          : `${totalComentarios} comentários`}
      </strong>

      <div style={commentsSortMenuWrapStyle}>
        <button
          type="button"
          onClick={onAlternarMenu}
          style={commentsSortMenuTriggerStyle}
          aria-label="Ordenar comentários"
          aria-haspopup="menu"
          aria-expanded={menuAberto}
        >
          +
        </button>

        {menuAberto ? (
          <div style={commentsSortMenuStyle} role="menu">
            <button
              type="button"
              onClick={onSelecionarRelevantes}
              style={
                ordenacao === "relevantes"
                  ? commentsSortMenuItemActiveStyle
                  : commentsSortMenuItemStyle
              }
              role="menuitemradio"
              aria-checked={ordenacao === "relevantes"}
            >
              Relevantes
            </button>

            <div style={commentsSortMenuDividerStyle} aria-hidden="true" />

            <button
              type="button"
              onClick={onSelecionarRecentes}
              style={
                ordenacao === "recentes"
                  ? commentsSortMenuItemActiveStyle
                  : commentsSortMenuItemStyle
              }
              role="menuitemradio"
              aria-checked={ordenacao === "recentes"}
            >
              Recentes
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
