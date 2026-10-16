import type { CSSProperties } from "react";
import type { TipoRanking } from "./em-alta-models";
import { obterTemaPosicao } from "./em-alta-ranking-position-theme";

export const cardStyle: CSSProperties = {
  position: "relative",
  flex: "0 0 min(360px, 88vw)",
  width: "min(360px, 88vw)",
  scrollSnapAlign: "start",
  scrollSnapStop: "always",
  display: "grid",
  gridTemplateColumns: "minmax(88px, 98px) minmax(0, 1fr)",
  gap: "14px",
  alignItems: "stretch",
  padding: "11px",
  borderRadius: "22px",
  background: "var(--historietas-em-alta-rgba-4-0-10-0-72, rgba(4, 0, 10, 0.72))",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  minWidth: 0,
  maxWidth: "88vw",
  overflow: "hidden",
  boxShadow: "none",
  boxSizing: "border-box",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
  touchAction: "manipulation",
  userSelect: "none",
};

export const desktopCardStyle: CSSProperties = {
  ...cardStyle,
  flex: "0 0 calc((100% - 44px) / 3)",
  width: "calc((100% - 44px) / 3)",
  maxWidth: "none",
  minWidth: 0,
  gridTemplateColumns: "112px minmax(0, 1fr)",
  gap: "15px",
  padding: "13px",
  borderRadius: "24px",
  boxShadow: "none",
};

export const cardSoonStyle: CSSProperties = {
  ...cardStyle,
  opacity: 0.9,
};

export const desktopCardSoonStyle: CSSProperties = {
  ...desktopCardStyle,
  opacity: 0.9,
};

export function criarCardRankingStyle(
  posicao: number,
  disponivel: boolean,
  _tipo: TipoRanking,
  isDesktop = false,
): CSSProperties {
  const temaPosicao = obterTemaPosicao(posicao);

  return {
    ...(disponivel
      ? isDesktop
        ? desktopCardStyle
        : cardStyle
      : isDesktop
        ? desktopCardSoonStyle
        : cardSoonStyle),
    background: temaPosicao.cardBackground,
    backgroundColor: temaPosicao.cardBackground,
    border: `1px solid ${temaPosicao.border}`,
    outline: "none",
    boxShadow: temaPosicao.shadow,
  };
}

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

export function criarAutorAvatarRankingStyle(
  avatar: string,
  posicao: number,
  isDesktop: boolean,
): CSSProperties {
  const temaPosicao = obterTemaPosicao(posicao);
  const baseStyle = isDesktop ? desktopCoverStyle : coverStyle;

  return {
    ...baseStyle,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: temaPosicao.deep,
    backgroundImage: avatar
      ? `linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.24)), url(${avatar})`
      : temaPosicao.coverBackground,
    backgroundSize: "cover",
    backgroundPosition: "center",
    border: "none",
    outline: "none",
    boxShadow: "none",
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
