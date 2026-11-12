"use client";

import { useId, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

type ChapterTextPreviewProps = {
  children: ReactNode;
  textStyle: CSSProperties;
  buttonStyle: CSSProperties;
  expandLabel?: string;
  collapseLabel?: string;
};

export function ChapterTextPreview({
  children,
  textStyle,
  buttonStyle,
  expandLabel = "Ler prévia completa",
  collapseLabel = "Recolher prévia",
}: ChapterTextPreviewProps) {
  const [expandida, setExpandida] = useState(false);
  const textoId = useId();

  return (
    <>
      <button
        type="button"
        aria-expanded={expandida}
        aria-controls={textoId}
        onClick={() => setExpandida((atual) => !atual)}
        style={buttonStyle}
      >
        {expandida ? collapseLabel : expandLabel}
      </button>
      <p
        id={textoId}
        style={expandida ? {
          ...textStyle,
          display: "block",
          WebkitLineClamp: "unset",
          whiteSpace: "pre-wrap",
          fontSize: "16px",
          lineHeight: 1.7,
        } : textStyle}
      >
        {children}
      </p>
    </>
  );
}
