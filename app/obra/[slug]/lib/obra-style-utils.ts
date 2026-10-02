import type { CSSProperties } from "react";

export const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

export const heroTitleOutlineStyle: CSSProperties = {
  textShadow:
    "-1px -1px 0 rgba(0,0,0,0.86), 1px -1px 0 rgba(0,0,0,0.86), -1px 1px 0 rgba(0,0,0,0.86), 1px 1px 0 rgba(0,0,0,0.86)",
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

// Teste: tipografia do card principal igual à usada no card principal da Home.
export const homeMainTitleTypographyStyle: CSSProperties = {
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 500,
  letterSpacing: "-0.01em",
};

export const homeMainMetaTypographyStyle: CSSProperties = {
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 450,
  lineHeight: 1.25,
};

export const homeMainStatsTypographyStyle: CSSProperties = {
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 850,
};

export const communityGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
};

export const ratingSummaryStyle: CSSProperties = {
  flex: "0 0 auto",
  width: "fit-content",
  maxWidth: "132px",
  display: "grid",
  justifyItems: "center",
  alignContent: "center",
  rowGap: "1px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
  boxSizing: "border-box",
  textAlign: "center",
};

export const ratingNumberStyle: CSSProperties = {
  color: "var(--historietas-obra-rating-strong, #FFFFFF)",
  fontSize: "28px",
  lineHeight: 1,
  fontWeight: 950,
  textShadow: "0 1px 0 rgba(0,0,0,0.28), 0 2px 10px rgba(0,0,0,0.22)",
  ...safeTextStyle,
};

export const ratingStarsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "1px",
  color: "var(--historietas-obra-rating, #FFFFFF)",
  fontSize: "12px",
  lineHeight: 1,
  letterSpacing: "-0.02em",
  marginTop: "-4px",
  marginBottom: "1px",
  textShadow: "0 1px 0 rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.2)",
  ...safeTextStyle,
};

export const ratingTopStarVisualStyle: CSSProperties = {
  position: "relative",
  width: "1em",
  height: "1em",
  display: "inline-block",
  lineHeight: 1,
  flex: "0 0 auto",
};

export const ratingTopStarBaseStyle: CSSProperties = {
  color: "var(--historietas-obra-rating-muted, rgba(251, 191, 36, 0.34))",
  position: "absolute",
  inset: 0,
  lineHeight: 1,
};

export const ratingTopStarFillStyle: CSSProperties = {
  color: "var(--historietas-obra-rating, #FFFFFF)",
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  whiteSpace: "nowrap",
  lineHeight: 1,
};

export const ratingTotalStyle: CSSProperties = {
  color: "rgba(255,255,255,0.95)",
  fontSize: "10px",
  lineHeight: 1.1,
  fontWeight: 900,
  textTransform: "uppercase",
  textAlign: "center",
  textShadow: "0 1px 0 rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.2)",
  ...safeTextStyle,
};

export const synopsisCardStyle: CSSProperties = {
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  minWidth: 0,
  boxSizing: "border-box",
};

export const synopsisTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  lineHeight: 1.62,
  fontWeight: 650,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
  textAlign: "left",
  ...safeTextStyle,
};

export const chaptersListStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

export const chapterCountBadgeStyle: CSSProperties = {
  width: "fit-content",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

export const chapterContentStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  minWidth: 0,
};

export const chaptersSectionStyle: CSSProperties = {
  marginTop: "14px",
  minWidth: 0,
};

export const synopsisSectionStyle: CSSProperties = {
  ...chaptersSectionStyle,
  animation: "historietas-synopsis-reveal 220ms ease-out",
};

export const sectionHeaderStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  alignItems: "center",
  justifyItems: "center",
  textAlign: "center",
  minWidth: 0,
  marginBottom: "9px",
};

export const chapterCardStyle: CSSProperties = {
  padding: "9px",
  borderRadius: "17px",
  background:
    "linear-gradient(135deg, var(--historietas-obra-surface, #050505) 0%, var(--historietas-obra-bg-deep, #000000) 100%)",
  border: "1px solid rgba(255,255,255,0.07)",
  display: "grid",
  gridTemplateColumns: "38px minmax(0, 1fr)",
  gap: "8px",
  alignItems: "center",
  minWidth: 0,
  overflow: "hidden",
  boxShadow: "none",
  color: "inherit",
  textDecoration: "none",
  cursor: "pointer",
};

export const chapterNumberStyle: CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "13px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "15px",
  fontWeight: 950,
  boxShadow: "none",
  ...safeTextStyle,
};

export const chapterTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "17px",
  lineHeight: 1.12,
  fontWeight: 950,
  letterSpacing: "-0.045em",
  ...safeTextStyle,
};

export const chapterMetaStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11.5px",
  lineHeight: 1.42,
  fontWeight: 650,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

export const heroStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  width: "100vw",
  marginLeft: "calc(50% - 50vw)",
  marginRight: "calc(50% - 50vw)",
  borderRadius: 0,
  border: "none",
  background: "transparent",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100vw",
  boxSizing: "border-box",
};

export const heroGlowStyle: CSSProperties = {
  display: "none",
};

export const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  minHeight: "min(460px, 68vh)",
  display: "block",
  padding: 0,
  overflow: "hidden",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  borderBottomLeftRadius: "28px",
  borderBottomRightRadius: "28px",
};

export const coverArtStyle: CSSProperties = {
  width: "100%",
  minHeight: "min(460px, 68vh)",
  height: "100%",
  borderRadius: "0 0 28px 28px",
  position: "relative",
  overflow: "hidden",
  backgroundImage: "linear-gradient(145deg, var(--historietas-obra-surface, #050505) 0%, var(--historietas-obra-bg-deep, #000000) 58%, var(--historietas-obra-bg-deeper, #000000) 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center top",
  border: "none",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

export const heroCoverLinkStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 1,
  display: "block",
  color: "inherit",
  textDecoration: "none",
  minWidth: 0,
  borderRadius: "0 0 28px 28px",
  overflow: "hidden",
};

export const heroOverlayContentStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: "0px",
  zIndex: 2,
  padding: "0 16px 4px",
  display: "grid",
  justifyItems: "center",
  gap: "8px",
  background: "transparent",
  minWidth: 0,
  boxSizing: "border-box",
  textAlign: "center",
};

export const coverTitleStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#FFFFFF",
  fontSize: "68px",
  lineHeight: 1,
  ...homeMainTitleTypographyStyle,
  ...heroTitleOutlineStyle,
  ...safeTextStyle,
};

export const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(36px, 9.6vw, 58px)",
  lineHeight: 0.94,
  ...homeMainTitleTypographyStyle,
  maxWidth: "100%",
  textAlign: "center",
  background: "none",
  WebkitBackgroundClip: "initial",
  backgroundClip: "initial",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  textShadow:
    "0 1px 0 rgba(0,0,0,0.34), 0 2px 12px rgba(0,0,0,0.34)",
  transform: "translateY(6px)",
  ...safeTextStyle,
};

export const descriptionStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  fontSize: "15.4px",
  ...homeMainMetaTypographyStyle,
  lineHeight: 1.35,
  maxWidth: "620px",
  textAlign: "center",
  display: "block",
  overflow: "visible",
  opacity: 1,
  textShadow:
    "0 1px 0 rgba(0,0,0,0.32), 0 2px 10px rgba(0,0,0,0.30)",
  transform: "translateY(6px)",
  ...safeTextStyle,
};

export const heroActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 50px",
  gap: "10px 12px",
  marginTop: "10px",
  minWidth: 0,
  width: "100%",
  maxWidth: "428px",
};

export const metricInlineContentStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
  minWidth: 0,
  whiteSpace: "nowrap",
};

export const metricEmojiIconStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  fontSize: "1em",
  lineHeight: 1,
};

export const metricWhiteNumberStyle: CSSProperties = {
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  lineHeight: 1,
};

export const heroBottomMetaBarStyle: CSSProperties = {
  position: "relative",
  zIndex: 3,
  width: "100%",
  maxWidth: "380px",
  marginTop: "6px",
  padding: 0,
  borderRadius: 0,
  border: "none",
  background: "transparent",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  minWidth: 0,
  boxSizing: "border-box",
  transform: "translateY(6px)",
};

export const heroBottomAuthorLinkStyle: CSSProperties = {
  minWidth: 0,
  color: "rgba(255,255,255,0.95)",
  textDecoration: "none",
  fontSize: "14.1px",
  ...homeMainMetaTypographyStyle,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  textShadow: "0 1px 0 rgba(0,0,0,0.28)",
  ...safeTextStyle,
};

export const heroBottomMetricsStyle: CSSProperties = {
  flex: "0 0 auto",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "11px",
  minWidth: 0,
};

export const heroBottomMetricStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "13.5px",
  lineHeight: 1.15,
  ...homeMainStatsTypographyStyle,
  whiteSpace: "nowrap",
  textShadow: "0 1px 0 rgba(0,0,0,0.28)",
  ...safeTextStyle,
};

export const primaryReadingButtonStyle: CSSProperties = {
  minHeight: "50px",
  gridColumn: "1 / -1",
  borderRadius: "999px",
  border: "1px solid #FFFFFF",
  background: "#FFFFFF",
  color: "#08080A",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 900,
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 22px",
  boxSizing: "border-box",
  boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
  ...safeTextStyle,
};

export const secondaryButtonStyle: CSSProperties = {
  minHeight: "50px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0, 0, 0, 0.54)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 22px",
  boxShadow: "none",
  boxSizing: "border-box",
  textShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
  ...safeTextStyle,
};

export const copyLinkButtonStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "999px",
  background: "var(--historietas-obra-bg-deep, #000000)",
  border: "1px solid rgba(255,255,255,0.28)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 8px",
  boxShadow: "none",
  boxSizing: "border-box",
  textShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
  ...safeTextStyle,
};

export const followedButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0, 0, 0, 0.54)",
  color: "#FFFFFF",
  boxShadow: "none",
};

export const obraAddButtonStyle: CSSProperties = {
  ...copyLinkButtonStyle,
  width: "50px",
  minHeight: "50px",
  height: "50px",
  padding: 0,
  borderRadius: "999px",
  background: "rgba(0, 0, 0, 0.54)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#FFFFFF",
  fontSize: "26px",
  lineHeight: 1,
  fontWeight: 900,
};

export const obraActionSheetOverlayStyle: CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  height: "100dvh",
  zIndex: 9998,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  background: "rgba(0,0,0,0.68)",
  padding: 0,
  boxSizing: "border-box",
  overscrollBehavior: "none",
  touchAction: "none",
};

export const obraActionSheetHandleStyle: CSSProperties = {
  width: "72px",
  height: "5px",
  borderRadius: "999px",
  background: "rgba(244,244,245,0.62)",
  justifySelf: "center",
  margin: "0 auto 14px",
};

export const obraMenuActionsStyle: CSSProperties = {
  display: "grid",
  gap: 0,
  borderRadius: 0,
  border: "none",
  borderTop: "none",
  background: "transparent",
  overflow: "hidden",
};

export const obraActionToastStyle: CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: "calc(92px + env(safe-area-inset-bottom))",
  transform: "translateX(-50%)",
  zIndex: 12000,
  width: "max-content",
  maxWidth: "calc(100vw - 32px)",
  minHeight: "38px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.14))",
  background: "var(--historietas-surface-strong, #0A0A0A)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  boxShadow: "0 14px 34px rgba(0,0,0,0.38)",
  padding: "9px 14px",
  fontSize: "11px",
  lineHeight: 1.3,
  fontWeight: 900,
  textAlign: "center",
  pointerEvents: "none",
};

export const obraActionsMenuStyle: CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: 0,
  transform: "translateX(-50%)",
  width: "min(820px, 100%)",
  maxHeight: "calc(100dvh - 116px)",
  overflowX: "hidden",
  overflowY: "auto",
  overscrollBehavior: "none",
  borderRadius: "24px 24px 0 0",
  background: "#000000",
  border: "none",
  boxShadow: "0 -18px 50px rgba(0,0,0,0.38)",
  padding: "8px 0 calc(12px + env(safe-area-inset-bottom))",
  display: "grid",
  gap: 0,
  boxSizing: "border-box",
  touchAction: "none",
  zIndex: 9999,
};

export const obraMenuHeaderStyle: CSSProperties = {
  display: "grid",
  justifyItems: "stretch",
  gap: "8px",
  minWidth: 0,
  padding: "0 30px 10px",
  boxSizing: "border-box",
  borderBottom: "none",
};

export const obraMenuTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1.1,
  fontWeight: 950,
  letterSpacing: "-0.04em",
  textAlign: "center",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  maxWidth: "100%",
  ...safeTextStyle,
};

export const obraMenuAuthorMetricsRowStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
};

export const obraMenuAuthorLinkStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  textDecoration: "none",
  textAlign: "center",
  fontSize: "12px",
  lineHeight: 1.15,
  fontWeight: 850,
  ...safeTextStyle,
};

export const obraMenuMetricsStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: "7px",
  color: "#FFFFFF",
  fontSize: "10.5px",
  lineHeight: 1.1,
  fontWeight: 900,
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

export const obraMenuMetricStyle: CSSProperties = {
  color: "#FFFFFF",
};

export const obraMenuTagsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "nowrap",
  justifyContent: "center",
  gap: 0,
  minWidth: 0,
  maxWidth: "100%",
  color: "#FFFFFF",
  overflowX: "auto",
  overflowY: "hidden",
  whiteSpace: "nowrap",
  scrollbarWidth: "none",
};
