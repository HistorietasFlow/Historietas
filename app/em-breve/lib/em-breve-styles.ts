import type { CSSProperties } from "react";
import type { ObraEmBreveCard } from "./em-breve-work-normalizers";

export const safeTextStyle: CSSProperties = {
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

export const buttonBaseStyle: CSSProperties = {
  boxSizing: "border-box",
  maxWidth: "100%",
  minWidth: 0,
  overflow: "hidden",
  textAlign: "center",
  fontFamily: "inherit",
  WebkitTapHighlightColor: "transparent",
  ...safeTextStyle,
};

export const mobileTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(520px, 72vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  opacity: 0,
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
  opacity: 0,
};

export const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background: "var(--historietas-em-breve-bg-page, #000000)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

export const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(900px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "18px 0 calc(24px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  minWidth: 0,
};





export const titleHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  flexWrap: "nowrap",
  marginTop: "4px",
  marginBottom: "18px",
  padding: 0,
  minWidth: 0,
  maxWidth: "100%",
  textAlign: "center",
  boxSizing: "border-box",
};

export const titleLinkStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "23px",
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "1px",
  width: "fit-content",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "visible",
  textAlign: "center",
  flex: "0 1 auto",
  ...safeTextStyle,
};


export const titleTextStyle: CSSProperties = {
  display: "inline-block",
  marginLeft: 0,
  paddingRight: "0.2em",
  paddingBottom: "0.04em",
  whiteSpace: "nowrap",
  overflow: "visible",
  fontSize: "23px",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  wordSpacing: "0.11em",
  textAlign: "center",
  background: "none",
  WebkitBackgroundClip: "initial",
  backgroundClip: "initial",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  textShadow: "none",
  ...safeTextStyle,
};

export const desktopTitleHeaderStyle: CSSProperties = {
  ...titleHeaderStyle,
  position: "relative",
  marginTop: "6px",
  marginBottom: "18px",
};

export const desktopNotificationButtonStyle: CSSProperties = {
  position: "absolute",
  top: "50%",
  right: 0,
  transform: "translateY(-50%)",
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "var(--historietas-surface-strong, var(--historietas-em-breve-bg-deep, #000000))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "14px",
  lineHeight: 1,
  fontWeight: 950,
  boxShadow: "none",
  zIndex: 2,
};

export const desktopNotificationBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "-7px",
  right: "-9px",
  minWidth: "18px",
  height: "18px",
  padding: "0 4px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "2px solid var(--historietas-bg-start, var(--historietas-em-breve-bg-page, #000000))",
  background:
    "var(--historietas-em-breve-notification-badge-bg, #FFFFFF)",
  color:
    "var(--historietas-em-breve-notification-badge-text, #FFFFFF)",
  fontSize: "9px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.38)",
  pointerEvents: "none",
};

export const desktopTitleLinkStyle: CSSProperties = {
  ...titleLinkStyle,
};


export const desktopTitleTextStyle: CSSProperties = {
  ...titleTextStyle,
};





















export const accessMessageStyle: CSSProperties = {
  margin: "0 auto 10px",
  color: "var(--historietas-accent, var(--historietas-em-breve-accent-soft, #FFFFFF))",
  fontSize: "12px",
  lineHeight: 1.4,
  fontWeight: 850,
  textAlign: "center",
  maxWidth: "100%",
  ...safeTextStyle,
};






export const relatedSectionStyle: CSSProperties = {
  marginTop: "10px",
  display: "grid",
  gap: "10px",
  minWidth: 0,
  maxWidth: "100%",
};




export const relatedGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "9px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

export const relatedCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(88px, 98px) minmax(0, 1fr)",
  gap: "14px",
  alignItems: "stretch",
  padding: "11px",
  borderRadius: "22px",
  background: "var(--historietas-em-breve-panel, rgba(5,5,5,0.92))",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
  boxShadow: "none",
};

export const relatedCoverLinkStyle: CSSProperties = {
  display: "block",
  textDecoration: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  minWidth: 0,
  maxWidth: "100%",
  height: "100%",
  boxSizing: "border-box",
};

export const relatedCoverStyle: CSSProperties = {
  minHeight: "122px",
  height: "100%",
  borderRadius: "16px",
  position: "relative",
  overflow: "hidden",
  backgroundImage: "linear-gradient(135deg, var(--historietas-em-breve-surface, #050505) 0%, var(--historietas-em-breve-bg-deep, #000000) 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  border: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxShadow: "none",
  boxSizing: "border-box",
};


export const relatedContentStyle: CSSProperties = {
  display: "grid",
  alignContent: "stretch",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

export const relatedTitleLinkStyle: CSSProperties = {
  color: "#FFFFFF",
  textDecoration: "none",
  minWidth: 0,
  maxWidth: "100%",
};

export const relatedTopLineStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  alignItems: "start",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
};

export const relatedTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "clamp(18px, 5.8vw, 21px)",
  lineHeight: 1.02,
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 500,
  letterSpacing: "-0.01em",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

export const relatedAuthorStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 450,
  lineHeight: 1.25,
  maxWidth: "100%",
  ...safeTextStyle,
};

export const relatedReleasePanelStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

export const relatedReleaseLabelStyle: CSSProperties = {
  color: "var(--historietas-accent, var(--historietas-em-breve-accent-soft, #FFFFFF))",
  fontSize: "8px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 450,
  lineHeight: 1.25,
  letterSpacing: "0.02em",
  ...safeTextStyle,
};

export const relatedReleaseTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 450,
  lineHeight: 1.35,
  ...safeTextStyle,
};

export const relatedBottomRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(74px, 84px)",
  alignItems: "center",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
};


export const relatedMetaBadgesStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "10px",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

export const relatedThemeBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "5px",
  width: "fit-content",
  maxWidth: "100%",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.055em",
  textTransform: "uppercase",
  boxSizing: "border-box",
  overflow: "hidden",
  ...safeTextStyle,
};

export const relatedThemeIconStyle: CSSProperties = {
  color: "var(--historietas-accent, var(--historietas-em-breve-accent-soft, #FFFFFF))",
  fontSize: "12px",
  lineHeight: 1,
  fontWeight: 950,
  flex: "0 0 auto",
};

export const relatedThemeTextStyle: CSSProperties = {
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

export const relatedFormatBadgeStyle: CSSProperties = {
  ...relatedThemeBadgeStyle,
  gap: 0,
  background: "transparent",
  color: "#FFFFFF",
};

export const relatedSaveButtonStyle: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  color: "#FFFFFF",
  borderRadius: "999px",
  minHeight: "34px",
  padding: "0 12px",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "none",
  ...buttonBaseStyle,
};

export const relatedSavedButtonStyle: CSSProperties = {
  ...relatedSaveButtonStyle,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.08)",
  color: "#FFFFFF",
};


export const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: "20px 0 34px",
};














export const desktopRelatedSectionStyle: CSSProperties = {
  ...relatedSectionStyle,
  marginTop: "18px",
};

export const desktopRelatedGridStyle: CSSProperties = {
  ...relatedGridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "12px",
};

export const desktopRelatedCardStyle: CSSProperties = {
  ...relatedCardStyle,
  gridTemplateColumns: "126px minmax(0, 1fr)",
  gap: "17px",
  padding: "14px",
  borderRadius: "24px",
  alignItems: "stretch",
  minHeight: "178px",
  background: "var(--historietas-em-breve-panel, rgba(5,5,5,0.92))",
  boxShadow: "none",
};

export const desktopRelatedCoverStyle: CSSProperties = {
  ...relatedCoverStyle,
  minHeight: "158px",
  borderRadius: "18px",
};

export const desktopRelatedContentStyle: CSSProperties = {
  ...relatedContentStyle,
  gap: "9px",
};

export const desktopRelatedTopLineStyle: CSSProperties = {
  ...relatedTopLineStyle,
  gap: "10px",
};

export const desktopRelatedReleasePanelStyle: CSSProperties = {
  ...relatedReleasePanelStyle,
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
};

export const desktopRelatedBottomRowStyle: CSSProperties = {
  ...relatedBottomRowStyle,
  gridTemplateColumns: "minmax(0, 1fr) 104px",
  gap: "10px",
};

export function criarCoverCardEmBreveStyle(
  obra: ObraEmBreveCard,
  desktopLayout: boolean
): CSSProperties {
  const baseStyle = desktopLayout ? desktopRelatedCoverStyle : relatedCoverStyle;

  if (!obra.capa) {
    return baseStyle;
  }

  return {
    ...baseStyle,
    backgroundImage: `url(${obra.capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}
