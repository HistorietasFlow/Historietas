"use client";

import type {
  KeyboardEventHandler,
  ReactNode,
  RefObject,
} from "react";
import { createPortal } from "react-dom";
import {
  commentsSheetBackdropStyle,
  commentsSheetCompactStyle,
  commentsSheetExpandedStyle,
  commentsSheetOverlayStyle,
  commentsSheetStyle,
  desktopCommentsSheetStyle,
} from "../lib/obra-style-utils";

type ObraCommentsSheetProps = {
  titulo: string;
  sheetRef: RefObject<HTMLElement | null>;
  isDesktop: boolean;
  expandido: boolean;
  onFechar: () => void;
  onKeyDown: KeyboardEventHandler<HTMLElement>;
  children: ReactNode;
};

export default function ObraCommentsSheet({
  titulo,
  sheetRef,
  isDesktop,
  expandido,
  onFechar,
  onKeyDown,
  children,
}: ObraCommentsSheetProps) {
  return createPortal(
    <section
      data-historietas-obra-comments-root="true"
      style={commentsSheetOverlayStyle}
      aria-label={`Comentários de ${titulo}`}
    >
      <button
        type="button"
        aria-label="Fechar comentários"
        onClick={onFechar}
        style={commentsSheetBackdropStyle}
      />

      <article
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Comentários de ${titulo}`}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        style={
          isDesktop
            ? desktopCommentsSheetStyle
            : {
                ...commentsSheetStyle,
                ...(expandido
                  ? commentsSheetExpandedStyle
                  : commentsSheetCompactStyle),
              }
        }
      >
        {children}
      </article>
    </section>,
    document.body,
  );
}
