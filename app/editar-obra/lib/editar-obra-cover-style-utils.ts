import type { CSSProperties } from "react";

export function criarMiniCoverStyle(
  capa: string,
  coverPlaceholderStyle: CSSProperties,
): CSSProperties {
  if (!capa) {
    return coverPlaceholderStyle;
  }

  return {
    ...coverPlaceholderStyle,
    border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
    background: "var(--historietas-editar-obra-cover-surface, #0B0714)",
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

export function criarPreviewCoverStyle(
  capa: string,
  previewCoverStyle: CSSProperties,
): CSSProperties {
  if (!capa) {
    return previewCoverStyle;
  }

  return {
    ...previewCoverStyle,
    background: "var(--historietas-editar-obra-bg-deep, #000000)",
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}
