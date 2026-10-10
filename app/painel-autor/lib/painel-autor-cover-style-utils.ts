import type { CSSProperties } from "react";

const coverStyle: CSSProperties = {
  width: "100%",
  aspectRatio: "3 / 4",
  minHeight: "208px",
  borderRadius: "18px",
  position: "relative",
  overflow: "hidden",
  background: "var(--historietas-painel-surface, #050505)",
  backgroundImage: "linear-gradient(135deg, var(--historietas-painel-surface, #050505) 0%, var(--historietas-painel-bg-deep, #000000) 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  border: "0",
  outline: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  boxShadow: "none",
};

export function criarPainelCoverStyle(capa: string): CSSProperties {
  if (!capa) {
    return {
      ...coverStyle,
      background: "#000000",
      backgroundImage: "linear-gradient(135deg, #050505 0%, #000000 100%)",
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }

  return {
    ...coverStyle,
    background: "#000000",
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

export function criarPainelCoverDesktopStyle(capa: string): CSSProperties {
  return {
    ...criarPainelCoverStyle(capa),
    minHeight: "240px",
    borderRadius: "20px",
  };
}
