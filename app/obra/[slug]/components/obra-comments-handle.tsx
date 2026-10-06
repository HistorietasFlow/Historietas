"use client";

import type { TouchEvent } from "react";
import {
  commentsSheetHandleStyle,
  commentsSheetHandleWrapStyle,
} from "../lib/obra-style-utils";

type ObraCommentsHandleProps = {
  expandido: boolean;
  onAlternarExpansao: () => void;
  onTouchStart: (event: TouchEvent<HTMLDivElement>) => void;
  onTouchMove: (event: TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: (event: TouchEvent<HTMLDivElement>) => void;
  onTouchCancel: (event: TouchEvent<HTMLDivElement>) => void;
};

export default function ObraCommentsHandle({
  expandido,
  onAlternarExpansao,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onTouchCancel,
}: ObraCommentsHandleProps) {
  return (
    <div
      data-comments-sheet-handle="true"
      data-dialog-initial-focus="true"
      style={commentsSheetHandleWrapStyle}
      onClick={onAlternarExpansao}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
      role="button"
      tabIndex={0}
      aria-label={
        expandido ? "Recolher comentários" : "Expandir comentários"
      }
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onAlternarExpansao();
        }
      }}
    >
      <div style={commentsSheetHandleStyle} />
    </div>
  );
}
