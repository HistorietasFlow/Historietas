import type { CSSProperties } from "react";
import type { TipoRanking } from "./em-alta-models";
import { obterTemaRanking } from "./em-alta-ranking-category-theme";
import { obterTemaPosicao } from "./em-alta-ranking-position-theme";

export const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

export const pageDecorationLayerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  pointerEvents: "none",
  zIndex: 0,
};

export const mobileTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(340px, 48vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  WebkitMaskImage: "none",
  maskImage: "none",
};

export const desktopTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(620px, 68vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  WebkitMaskImage: "none",
  maskImage: "none",
};

export const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  backgroundColor: "var(--historietas-em-alta-hex-070212, #000000)",
  background: "var(--historietas-em-alta-hex-070212, #000000)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

export const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(820px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "14px 0 116px",
  boxSizing: "border-box",
  minWidth: 0,
};

export const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: "18px 0 84px",
};

export const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "14px",
  minWidth: 0,
};

export const titleStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  margin: 0,
  fontSize: "clamp(30px, 8vw, 46px)",
  lineHeight: 1.04,
  fontWeight: 950,
  letterSpacing: "-0.074em",
  maxWidth: "100%",
  textAlign: "center",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, var(--historietas-em-alta-hex-f5f3ff, #F5F3FF)) 42%, var(--historietas-title-to, var(--historietas-em-alta-hex-fdba74, #FDBA74)) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "none",
  ...safeTextStyle,
};

export const titleHeaderStyle: CSSProperties = {
  ...topStyle,
  justifyContent: "center",
  marginTop: "4px",
  marginBottom: "18px",
  textAlign: "center",
};

export const desktopTitleHeaderStyle: CSSProperties = {
  ...titleHeaderStyle,
  position: "relative",
  marginTop: "6px",
  marginBottom: "22px",
};

export const headerTitleLinkStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "3px",
  width: "100%",
  maxWidth: "100%",
  margin: "0 auto",
  minWidth: 0,
  textAlign: "center",
};

export const desktopHeaderTitleLinkStyle: CSSProperties = {
  ...headerTitleLinkStyle,
  gap: "4px",
};

export const headerTitleMarkStyle: CSSProperties = {
  width: "clamp(36px, 8vw, 48px)",
  height: "clamp(36px, 8vw, 48px)",
  borderRadius: "clamp(12px, 2.6vw, 16px)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-em-alta-hex-04000a, #04000A)",
  color: "#FFFFFF",
  fontSize: "clamp(18px, 4.3vw, 24px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.04em",
  flex: "0 0 auto",
  border: "1px solid var(--historietas-em-alta-rgba-59-7-100-0-58, rgba(59, 7, 100, 0.58))",
  boxShadow: "none",
};

export const desktopHeaderTitleMarkStyle: CSSProperties = {
  ...headerTitleMarkStyle,
  width: "50px",
  height: "50px",
  borderRadius: "17px",
  fontSize: "25px",
};

export const headerTitleTextStyle: CSSProperties = {
  ...titleStyle,
  margin: 0,
  fontSize: "clamp(26px, 6.8vw, 40px)",
  maxWidth: "calc(100vw - 86px)",
  textAlign: "center",
  background: "none",
  WebkitBackgroundClip: "initial",
  backgroundClip: "initial",
  color: "#FFFFFF",
  textShadow: "none",
  textTransform: "uppercase",
  wordSpacing: "0.1em",
  whiteSpace: "nowrap",
};

export const desktopHeaderTitleTextStyle: CSSProperties = {
  ...headerTitleTextStyle,
  fontSize: "clamp(34px, 3.6vw, 44px)",
  maxWidth: "760px",
};

export const sectionStyle: CSSProperties = {
  marginTop: "32px",
  paddingBottom: "14px",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

export const desktopSectionStyle: CSSProperties = {
  ...sectionStyle,
  marginTop: "40px",
  paddingBottom: "18px",
};

export const sectionHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  justifyItems: "center",
  gap: "6px",
  marginBottom: "14px",
  maxWidth: "100%",
  minWidth: 0,
  textAlign: "center",
};

export const desktopSectionHeaderStyle: CSSProperties = {
  ...sectionHeaderStyle,
  padding: "8px 0 12px",
  borderRadius: 0,
};

export const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "clamp(24px, 4vw, 30px)",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  maxWidth: "100%",
  textAlign: "center",
  textShadow: "none",
  ...safeTextStyle,
};

export const sectionHeaderContentStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  minWidth: 0,
  textAlign: "center",
};

export const desktopSectionHeaderContentStyle: CSSProperties = {
  ...sectionHeaderContentStyle,
  justifyContent: "center",
  textAlign: "center",
};

export const sectionTextBlockStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  justifyItems: "center",
  textAlign: "center",
};

export const desktopSectionTextBlockStyle: CSSProperties = {
  ...sectionTextBlockStyle,
  maxWidth: "760px",
  textAlign: "center",
};

export function criarSectionHeaderTemaStyle(
  _tema: ReturnType<typeof obterTemaRanking>,
): CSSProperties {
  void _tema;

  return {
    ...sectionHeaderStyle,
    background: "transparent",
    border: "none",
    boxShadow: "none",
  };
}

export function criarDesktopSectionHeaderTemaStyle(
  _tema: ReturnType<typeof obterTemaRanking>,
): CSSProperties {
  void _tema;

  return {
    ...desktopSectionHeaderStyle,
    background: "transparent",
    border: "none",
    boxShadow: "none",
  };
}

export function criarSectionIconStyle(
  tema: ReturnType<typeof obterTemaRanking>,
): CSSProperties {
  return {
    width: "auto",
    height: "auto",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "none",
    color: tema.accent,
    fontSize: "28px",
    lineHeight: 1,
    flex: "0 0 auto",
    boxShadow: "none",
  };
}

export const cardTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "20px",
  lineHeight: 1.05,
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 500,
  letterSpacing: "-0.01em",
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

export const authorRankingCardTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "19px",
  lineHeight: 1.05,
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 500,
  letterSpacing: "-0.01em",
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

export function criarObraCardTitleRankingStyle(): CSSProperties {
  return {
    ...cardTitleStyle,
    color: "#FFFFFF",
  };
}

export function criarAutorCardTitleRankingStyle(): CSSProperties {
  return {
    ...authorRankingCardTitleStyle,
    color: "#FFFFFF",
  };
}

export const rankingHighlightBadgeInlineStyle: CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  marginTop: 0,
  padding: "0 12px",
  textAlign: "center",
};

export const highlightBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  minHeight: "34px",
  padding: "0 10px",
  marginTop: "4px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 900,
  lineHeight: 1.12,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "5px",
  boxSizing: "border-box",
  whiteSpace: "normal",
  overflow: "hidden",
  textOverflow: "ellipsis",
  ...safeTextStyle,
};

export const authorRankingTierBadgeStyle: CSSProperties = {
  position: "absolute",
  left: "6px",
  right: "6px",
  bottom: "6px",
  zIndex: 3,
  minHeight: "24px",
  padding: "0 7px",
  borderRadius: "999px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
  fontSize: "8px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "0.055em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  boxShadow: "0 6px 12px rgba(0,0,0,0.22)",
  ...safeTextStyle,
};

export function criarRankingTierInlineBadgeStyle(
  posicao: number,
): CSSProperties {
  const temaPosicao = obterTemaPosicao(posicao);

  return {
    ...highlightBadgeStyle,
    ...rankingHighlightBadgeInlineStyle,
    position: "static",
    minHeight: "34px",
    marginTop: 0,
    padding: "0 12px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    background: temaPosicao.badgeBackground,
    border: `1px solid ${temaPosicao.badgeBorder}`,
    color: "#FFFFFF",
    fontSize: "10px",
    fontWeight: 950,
    letterSpacing: "0.055em",
    lineHeight: 1,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    boxShadow: "none",
  };
}

export function criarAutorTierInlineBadgeStyle(
  posicao: number,
): CSSProperties {
  const temaPosicao = obterTemaPosicao(posicao);

  return {
    ...authorRankingTierBadgeStyle,
    position: "static",
    left: "auto",
    right: "auto",
    bottom: "auto",
    minHeight: "34px",
    padding: "0 16px",
    width: "fit-content",
    maxWidth: "100%",
    flex: "0 0 auto",
    background: temaPosicao.badgeBackground,
    border: `1px solid ${temaPosicao.badgeBorder}`,
    color: "#FFFFFF",
    boxSizing: "border-box",
  };
}

export function criarAutorPointsBadgeStyle(): CSSProperties {
  return {
    ...highlightBadgeStyle,
    marginTop: 0,
    minHeight: "34px",
    padding: "0 16px",
    color: "#FFFFFF",
    flex: "0 0 auto",
  };
}

export const carouselShellStyle: CSSProperties = {
  position: "relative",
  minWidth: 0,
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
};

export const desktopCarouselShellStyle: CSSProperties = {
  ...carouselShellStyle,
  width: "100%",
  maxWidth: "100%",
  marginLeft: 0,
  marginRight: 0,
  overflow: "visible",
  marginTop: "0",
};

export const carouselArrowButtonStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  zIndex: 8,
  width: "52px",
  height: "96px",
  padding: 0,
  borderRadius: 0,
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "none",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
  touchAction: "manipulation",
};

export const carouselArrowIconStyle: CSSProperties = {
  display: "block",
  width: "18px",
  height: "18px",
  borderTop: "4px solid #FFFFFF",
  borderRight: "4px solid #FFFFFF",
  filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.92))",
  pointerEvents: "none",
  boxSizing: "border-box",
};

export const carouselArrowLeftIconStyle: CSSProperties = {
  ...carouselArrowIconStyle,
  transform: "rotate(-135deg)",
};

export const carouselArrowRightIconStyle: CSSProperties = {
  ...carouselArrowIconStyle,
  transform: "rotate(45deg)",
};

export const carouselArrowLeftStyle: CSSProperties = {
  ...carouselArrowButtonStyle,
  left: "-10px",
};

export const carouselArrowRightStyle: CSSProperties = {
  ...carouselArrowButtonStyle,
  right: "-10px",
};

export const carouselStyle: CSSProperties = {
  display: "flex",
  alignItems: "stretch",
  gap: "16px",
  width: "calc(100% + 24px)",
  maxWidth: "calc(100% + 24px)",
  minWidth: 0,
  boxSizing: "border-box",
  overflowX: "auto",
  overflowY: "hidden",
  padding: "4px 12px 22px",
  margin: "0 -12px",
  scrollSnapType: "x mandatory",
  scrollPaddingLeft: "12px",
  scrollPaddingRight: "12px",
  scrollbarWidth: "none",
  overscrollBehaviorX: "contain",
};

export const desktopCarouselStyle: CSSProperties = {
  ...carouselStyle,
  gap: "22px",
  width: "calc(100% + 24px)",
  maxWidth: "calc(100% + 24px)",
  padding: "8px 12px 30px",
  margin: "0 -12px",
  scrollPaddingLeft: "12px",
  scrollPaddingRight: "12px",
};

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
