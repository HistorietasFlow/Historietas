import type { CSSProperties } from "react";

export const coverStyle: CSSProperties = {
  minHeight: "122px",
  borderRadius: "16px",
  position: "relative",
  overflow: "hidden",
  backgroundImage: "linear-gradient(135deg, var(--historietas-em-alta-hex-08030f, #08030F) 0%, var(--historietas-em-alta-hex-04000a, #04000A) 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
  border: "none",
  outline: "none",
  boxShadow: "none",
  transform: "scaleX(1.125) scaleY(1.095)",
  transformOrigin: "center",
};

export const desktopCoverStyle: CSSProperties = {
  ...coverStyle,
  minHeight: "142px",
  borderRadius: "18px",
};

export function criarRankingCoverStyle(
  capa: string,
  isDesktop = false,
): CSSProperties {
  const baseStyle = isDesktop ? desktopCoverStyle : coverStyle;

  if (!capa) {
    return {
      ...baseStyle,
      backgroundColor: "var(--historietas-em-alta-hex-04000a, #04000A)",
      backgroundImage: "linear-gradient(135deg, var(--historietas-em-alta-hex-08030f, #08030F) 0%, var(--historietas-em-alta-hex-04000a, #04000A) 100%)",
      border: "none",
    };
  }

  return {
    ...baseStyle,
    backgroundColor: "var(--historietas-em-alta-hex-04000a, #04000A)",
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    border: "none",
  };
}

export function criarDecoracaoPaginaStyle(index: number): CSSProperties {
  const posicoes: CSSProperties[] = [
    {
      top: "32%",
      right: "-18px",
      fontSize: "72px",
      transform: "rotate(-14deg)",
    },
    { top: "64%", left: "-16px", fontSize: "58px", transform: "rotate(12deg)" },
  ];

  return {
    position: "absolute",
    color: "var(--historietas-em-alta-rgba-139-92-246-0-18, rgba(139, 92, 246, 0.18))",
    opacity: 0.035,
    lineHeight: 1,
    fontWeight: 950,
    filter: "none",
    userSelect: "none",
    ...posicoes[index % posicoes.length],
  };
}
