"use client";

import { useId, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

type ChapterTextPreviewProps = {
  children: ReactNode;
  textStyle: CSSProperties;
  buttonStyle: CSSProperties;
};

export function ChapterTextPreview({ children, textStyle, buttonStyle }: ChapterTextPreviewProps) {
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
        {expandida ? "Recolher prévia" : "Ler prévia completa"}
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
