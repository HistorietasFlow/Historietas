import type { CSSProperties } from "react";
import {
  safeTextStyle,
  listaPageTitleTypographyStyle,
  listaWorkTitleTypographyStyle,
  listaAuthorMetaTypographyStyle,
} from "./explorar-layout-styles";

export function criarPublishedCardTemaStyle(): CSSProperties {
  return {
    ...publishedCardStyle,
    background: "transparent",
    border: "none",
    boxShadow: "none",
  };
}

export function criarDesktopPublishedCardTemaStyle(): CSSProperties {
  return {
    ...desktopPublishedCardStyle,
    background: "transparent",
    border: "none",
    boxShadow: "none",
  };
}



export function criarPublishedCoverTemaStyle(): CSSProperties {
  return {
    ...publishedCoverStyle,
    backgroundImage: "linear-gradient(135deg, #050505 0%, #000000 100%)",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

export function criarDesktopPublishedCoverStyle(
  capa: string,
): CSSProperties {
  const baseStyle = criarDesktopPublishedCoverTemaStyle();

  if (!capa) {
    return baseStyle;
  }

  return {
    ...baseStyle,
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: "none",
    opacity: 1,
  };
}

function criarDesktopPublishedCoverTemaStyle(): CSSProperties {
  return {
    ...desktopPublishedCoverStyle,
    backgroundImage: "linear-gradient(135deg, #050505 0%, #000000 100%)",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

export function criarProgressTrackStyle(): CSSProperties {
  return progressTrackStyle;
}

export function criarProgressBarStyle(): CSSProperties {
  return progressBarStyle;
}

function criarReadStyle(): CSSProperties {
  return {
    ...readStyle,
    color: "#FFFFFF",
    background: "var(--historietas-bg-start, #000000)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "none",
  };
}

export function criarCardPrimaryActionStyle(
  isDesktop?: boolean
): CSSProperties {
  return {
    ...criarReadStyle(),
    ...(isDesktop ? desktopCardPrimaryActionStyle : cardPrimaryActionStyle),
  };
}

export const sectionStyle: CSSProperties = {
  marginTop: "24px",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

export const sectionHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "38px minmax(0, 1fr) 38px",
  alignItems: "center",
  gap: "6px",
  marginBottom: "14px",
  maxWidth: "100%",
  minWidth: 0,
  textAlign: "center",
};

export const sectionHeaderSpacerStyle: CSSProperties = {
  display: "block",
  width: "38px",
  height: "38px",
};

export const sectionMoreLinkStyle: CSSProperties = {
  width: "38px",
  height: "38px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  justifySelf: "end",
  border: 0,
  borderRadius: "999px",
  background: "transparent",
  color: "#FFFFFF",
  fontSize: "30px",
  lineHeight: 1,
  fontWeight: 500,
  textDecoration: "none",
  cursor: "pointer",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

export const desktopSectionMoreLinkStyle: CSSProperties = {
  ...sectionMoreLinkStyle,
  width: "42px",
  height: "42px",
  fontSize: "32px",
};

export const sectionMoreChevronStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "rgba(255,255,255,0.62)",
  fontSize: "34px",
  lineHeight: 0.8,
  fontWeight: 700,
  transform: "translateY(-1px)",
};

export const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #FFFFFF)",
  fontSize: "clamp(18px, 4.8vw, 23px)",
  lineHeight: 1.08,
  ...listaPageTitleTypographyStyle,
  maxWidth: "100%",
  textAlign: "center",
  ...safeTextStyle,
};

export const obrasExplorarCarouselStyle: CSSProperties = {
  display: "flex",
  gap: "14px",
  width: "calc(100% + 24px)",
  maxWidth: "calc(100% + 24px)",
  minWidth: 0,
  boxSizing: "border-box",
  overflowX: "auto",
  overflowY: "hidden",
  padding: "2px 12px 8px",
  margin: "0 -12px",
  scrollSnapType: "x mandatory",
  scrollPaddingLeft: "12px",
  scrollPaddingRight: "12px",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
};

export const desktopObrasExplorarCarouselStyle: CSSProperties = {
  ...obrasExplorarCarouselStyle,
  gap: "18px",
  width: "100vw",
  maxWidth: "100vw",
  marginLeft: "calc(50% - 50vw)",
  marginRight: "calc(50% - 50vw)",
  padding:
    "6px max(32px, calc((100vw - 1220px) / 2)) 20px",
  scrollPaddingLeft: "max(32px, calc((100vw - 1220px) / 2))",
  scrollPaddingRight: "max(32px, calc((100vw - 1220px) / 2))",
};

export const explorarObraCarouselItemStyle: CSSProperties = {
  flex: "0 0 min(350px, 90vw)",
  width: "min(350px, 90vw)",
  scrollSnapAlign: "start",
  minWidth: 0,
};

export const desktopExplorarObraCarouselItemStyle: CSSProperties = {
  ...explorarObraCarouselItemStyle,
  flex: "0 0 360px",
  width: "360px",
  maxWidth: "360px",
};

export const autoresExplorarCarouselStyle: CSSProperties = {
  ...obrasExplorarCarouselStyle,
  gap: "12px",
  padding: "2px 12px 8px",
};

export const desktopAutoresExplorarCarouselStyle: CSSProperties = {
  ...autoresExplorarCarouselStyle,
  gap: "16px",
  width: "100vw",
  maxWidth: "100vw",
  marginLeft: "calc(50% - 50vw)",
  marginRight: "calc(50% - 50vw)",
  padding:
    "6px max(32px, calc((100vw - 1220px) / 2)) 18px",
  scrollPaddingLeft: "max(32px, calc((100vw - 1220px) / 2))",
  scrollPaddingRight: "max(32px, calc((100vw - 1220px) / 2))",
};

export const explorarCarouselShellStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  minWidth: 0,
};

const explorarCarouselArrowBaseStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  zIndex: 5,
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
};

export const explorarCarouselArrowLeftStyle: CSSProperties = {
  ...explorarCarouselArrowBaseStyle,
  left: "-10px",
};

export const explorarCarouselArrowRightStyle: CSSProperties = {
  ...explorarCarouselArrowBaseStyle,
  right: "-10px",
};

const explorarCarouselArrowIconBaseStyle: CSSProperties = {
  display: "block",
  width: "18px",
  height: "18px",
  borderTop: "4px solid #FFFFFF",
  borderRight: "4px solid #FFFFFF",
  filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.92))",
  pointerEvents: "none",
  boxSizing: "border-box",
};

export const explorarCarouselArrowLeftIconStyle: CSSProperties = {
  ...explorarCarouselArrowIconBaseStyle,
  transform: "rotate(-135deg)",
};

export const explorarCarouselArrowRightIconStyle: CSSProperties = {
  ...explorarCarouselArrowIconBaseStyle,
  transform: "rotate(45deg)",
};

export const autoresExplorarGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "14px",
  minWidth: 0,
};

export const desktopAutoresExplorarGridStyle: CSSProperties = {
  ...autoresExplorarGridStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "16px",
};

export const autorExplorarCardStyle: CSSProperties = {
  position: "relative",
  flex: "0 0 min(318px, 84vw)",
  width: "min(318px, 84vw)",
  scrollSnapAlign: "start",
  padding: "12px",
  borderRadius: "24px",
  background: "transparent",
  border: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  display: "grid",
  gap: "10px",
  boxShadow: "none",
  boxSizing: "border-box",
  overflow: "hidden",
};

export const desktopAutorExplorarCardStyle: CSSProperties = {
  ...autorExplorarCardStyle,
  flex: "0 0 356px",
  width: "356px",
  maxWidth: "356px",
  padding: "14px",
  borderRadius: "26px",
};

export const autorExplorarGridCardStyle: CSSProperties = {
  ...autorExplorarCardStyle,
  flex: "none",
  width: "100%",
  maxWidth: "100%",
};

export const desktopAutorExplorarGridCardStyle: CSSProperties = {
  ...desktopAutorExplorarCardStyle,
  flex: "none",
  width: "100%",
  maxWidth: "100%",
};

export const autorExplorarCardGlowStyle: CSSProperties = {
  display: "none",
};

export const autorExplorarTopStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "grid",
  gridTemplateColumns: "68px minmax(0, 1fr)",
  gap: "11px",
  alignItems: "center",
  minWidth: 0,
};

export const autorExplorarAvatarShellStyle: CSSProperties = {
  width: "68px",
  height: "68px",
  borderRadius: "21px",
  padding: "3px",
  background: "rgba(255,255,255,0.08)",
  boxShadow: "none",
  overflow: "hidden",
  flex: "0 0 auto",
};

export const autorExplorarAvatarImageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "block",
  objectFit: "cover",
  borderRadius: "18px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
};

export const autorExplorarAvatarInitialsStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "18px",
  background: "#050505",
  color: "#FFFFFF",
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.06em",
};

export const autorExplorarIdentityStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  alignContent: "center",
  minWidth: 0,
};

export const autorExplorarNameStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "24px",
  lineHeight: 0.98,
  ...listaWorkTitleTypographyStyle,
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

export const autorExplorarBioStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12px",
  ...listaAuthorMetaTypographyStyle,
  lineHeight: 1.35,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

export const autorExplorarMetaRowStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
};

export const autorExplorarMetaBadgeStyle: CSSProperties = {
  width: "100%",
  minHeight: "32px",
  padding: "0 6px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #E4E4E7)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 900,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  ...safeTextStyle,
};

export const autorExplorarRatingStarStyle: CSSProperties = {
  color: "#FACC15",
  fontSize: "13px",
  lineHeight: 1,
  marginRight: "3px",
  textShadow: "0 0 8px rgba(250,204,21,0.22)",
  flex: "0 0 auto",
};

export const autorExplorarBottomStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "8px",
  minWidth: 0,
};

export const autorExplorarGenresStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
};

export const autorExplorarGenreBadgeStyle: CSSProperties = {
  width: "100%",
  minHeight: "30px",
  padding: "0 8px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 950,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  ...safeTextStyle,
};

export const autorExplorarProfileButtonStyle: CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  minHeight: "40px",
  padding: "0 12px",
  borderRadius: "999px",
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

export const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "14px",
  minWidth: 0,
};

const publishedCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(88px, 98px) minmax(0, 1fr)",
  gap: "14px",
  alignItems: "stretch",
  padding: "11px",
  borderRadius: "22px",
  background: "transparent",
  border: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
  boxShadow: "none",
};



const publishedCoverStyle: CSSProperties = {
  minHeight: "122px",
  borderRadius: "16px",
  position: "relative",
  overflow: "hidden",
  backgroundImage: "linear-gradient(135deg, #050505 0%, #000000 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  minWidth: 0,
  textDecoration: "none",
  display: "block",
  boxSizing: "border-box",
};





export const cardTopStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};


export const publishedTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "20px",
  lineHeight: 1.05,
  ...listaWorkTitleTypographyStyle,
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

export const statusRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "5px",
  minWidth: 0,
};




export const draftStatusStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#D4D4D8",
  fontSize: "9px",
  fontWeight: 880,
  whiteSpace: "normal",
  ...safeTextStyle,
};

export const formatBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #E4E4E7)",
  fontSize: "9px",
  fontWeight: 880,
  whiteSpace: "normal",
  ...safeTextStyle,
};

export const classificationBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "9px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};


export const authorLinkStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  margin: 0,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "12px",
  ...listaAuthorMetaTypographyStyle,
  textDecoration: "none",
  borderBottom: "0",
  whiteSpace: "normal",
  ...safeTextStyle,
};

export const publishedInfoStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
  display: "grid",
  alignContent: "center",
  gap: "8px",
};

export const desktopPublishedInfoStyle: CSSProperties = {
  ...publishedInfoStyle,
};

export const desktopPublishedSynopsisStyle: CSSProperties = {
  display: "none",
};

export const statsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 850,
  lineHeight: 1.2,
  minWidth: 0,
};

export const metricItemStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  whiteSpace: "nowrap",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  ...safeTextStyle,
};

export const metricIconStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "12px",
  lineHeight: 1,
};

export const heartMetricIconStyle: CSSProperties = {
  ...metricIconStyle,
  color: "#BE123C",
};

export const progressCompactStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  alignItems: "center",
  gap: "8px",
  minWidth: 0,
};

const progressTrackStyle: CSSProperties = {
  width: "100%",
  height: "7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  overflow: "hidden",
};

const progressBarStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(90deg, #FFFFFF 0%, #A1A1AA 100%)",
};

export const progressTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 850,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
};

const readStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  minHeight: "34px",
  marginTop: "2px",
  padding: "0 14px",
  borderRadius: "999px",
  background: "#050505",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  lineHeight: 1.15,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  boxShadow: "none",
  ...safeTextStyle,
};


export const cardActionRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginTop: "4px",
  maxWidth: "100%",
  minWidth: 0,
  overflow: "hidden",
  boxSizing: "border-box",
};

export const cardGenreBadgeStyle: CSSProperties = {
  flex: "0 1 42%",
  maxWidth: "42%",
  minHeight: "34px",
  padding: "0 10px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 900,
  lineHeight: 1.12,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  boxSizing: "border-box",
};

const cardPrimaryActionStyle: CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  marginTop: 0,
  padding: "0 12px",
};

export const desktopCardActionRowStyle: CSSProperties = {
  ...cardActionRowStyle,
  overflow: "visible",
};

export const desktopCardGenreBadgeStyle: CSSProperties = {
  ...cardGenreBadgeStyle,
  maxWidth: "46%",
};

const desktopCardPrimaryActionStyle: CSSProperties = {
  ...cardPrimaryActionStyle,
  justifyContent: "center",
  textAlign: "center",
};

export const desktopSectionStyle: CSSProperties = {
  ...sectionStyle,
  marginTop: "30px",
};

export const desktopSectionHeaderStyle: CSSProperties = {
  ...sectionHeaderStyle,
};

export const desktopSectionTitleStyle: CSSProperties = {
  ...sectionTitleStyle,
  fontSize: "24px",
};


export const desktopPublishedGridStyle: CSSProperties = {
  ...gridStyle,
  gridTemplateColumns: "repeat(auto-fit, 360px)",
  justifyContent: "space-between",
  alignItems: "start",
  gap: "18px",
};

const desktopPublishedCardStyle: CSSProperties = {
  ...publishedCardStyle,
  width: "360px",
  maxWidth: "360px",
  gridTemplateColumns: "98px minmax(0, 1fr)",
  gap: "14px",
  padding: "11px",
  borderRadius: "22px",
  alignItems: "stretch",
  minHeight: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
};


const desktopPublishedCoverStyle: CSSProperties = {
  ...publishedCoverStyle,
  minHeight: "116px",
  borderRadius: "16px",
};



export const desktopPublishedTitleStyle: CSSProperties = {
  ...publishedTitleStyle,
  fontSize: "20px",
  lineHeight: 1.05,
};
