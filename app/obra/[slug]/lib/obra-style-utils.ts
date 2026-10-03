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

export const obraMenuTagStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "none",
  flex: "0 0 auto",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 800,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

export const obraMenuTagSeparatorStyle: CSSProperties = {
  display: "inline-block",
  margin: "0 4px",
  color: "rgba(255,255,255,0.34)",
};

export const obraMenuSectionLabelStyle: CSSProperties = {
  display: "block",
  padding: "11px 30px 5px",
  color: "rgba(244,244,245,0.56)",
  fontSize: "11px",
  lineHeight: 1,
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  ...safeTextStyle,
};

export const obraMenuItemButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minHeight: "44px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  border: "none",
  borderBottom: "none",
  borderRadius: 0,
  background: "transparent",
  color: "#FFFFFF",
  textDecoration: "none",
  padding: "0 30px",
  fontSize: "18px",
  fontWeight: 650,
  lineHeight: 1,
  letterSpacing: "-0.035em",
  fontFamily: "inherit",
  textAlign: "left",
  cursor: "pointer",
  boxSizing: "border-box",
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

export const obraMenuItemActiveStyle: CSSProperties = {
  ...obraMenuItemButtonStyle,
  fontWeight: 900,
  background: "transparent",
  color: "#FFFFFF",
};

export const obraMenuItemCopiedStyle: CSSProperties = {
  ...obraMenuItemButtonStyle,
  fontWeight: 900,
  background: "transparent",
  color: "#FFFFFF",
};

export const obraMenuItemDotStyle: CSSProperties = {
  width: "20px",
  height: "20px",
  borderRadius: "999px",
  border: "2.25px solid rgba(161,161,170,0.72)",
  background: "transparent",
  color: "transparent",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  boxSizing: "border-box",
  fontSize: "13px",
  lineHeight: 1,
  fontWeight: 900,
};

export const obraMenuItemDotActiveStyle: CSSProperties = {
  ...obraMenuItemDotStyle,
  border: "2px solid #FFFFFF",
  background: "#FFFFFF",
  color: "#111111",
};

export const synopsisToggleIconStyle: CSSProperties = {
  display: "inline-block",
  fontSize: "clamp(22px, 5.6vw, 28px)",
  lineHeight: 0.72,
  transformOrigin: "center",
  transition: "transform 220ms ease",
};

export const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "6px",
  marginTop: "8px",
  minWidth: 0,
};

export const commentsSheetOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 2147483647,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  pointerEvents: "none",
  isolation: "isolate",
};

export const commentsSheetBackdropStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 0,
  border: "none",
  background: "var(--historietas-obra-bg-shadow-42, rgba(3, 2, 8, 0.42))",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  pointerEvents: "auto",
  cursor: "pointer",
  padding: 0,
};

export const commentsSheetStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(720px, 100%)",
  maxHeight: "calc(100dvh - env(safe-area-inset-top) - 10px)",
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr) auto auto auto",
  gap: "7px",
  padding: "5px 12px calc(10px + env(safe-area-inset-bottom))",
  borderRadius: "28px 28px 0 0",
  background: "var(--historietas-obra-bg-deep, #000000)",
  border: "none",
  borderBottom: "none",
  boxShadow: "0 -24px 70px rgba(0,0,0,0.72)",
  pointerEvents: "auto",
  overflow: "hidden",
  boxSizing: "border-box",
  willChange: "height",
  transition: "height 220ms ease",
};

export const commentsSheetCompactStyle: CSSProperties = {
  height: "min(64dvh, 540px)",
};

export const commentsSheetExpandedStyle: CSSProperties = {
  height: "min(90dvh, 760px)",
};

export const desktopCommentsSheetStyle: CSSProperties = {
  ...commentsSheetStyle,
  width: "min(800px, calc(100% - 40px))",
  height: "min(76dvh, 720px)",
};

export const commentsSheetHandleWrapStyle: CSSProperties = {
  minHeight: "24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  touchAction: "none",
  cursor: "grab",
  willChange: "transform",
  outlineOffset: "3px",
};

export const commentsSheetHandleStyle: CSSProperties = {
  width: "44px",
  height: "5px",
  borderRadius: "999px",
  background: "var(--historietas-border-soft, rgba(255,255,255,0.34))",
};

export const commentsSheetHeaderStyle: CSSProperties = {
  minHeight: "32px",
  display: "grid",
  gridTemplateColumns: "40px minmax(0, 1fr) 40px",
  alignItems: "center",
  gap: "6px",
  minWidth: 0,
};

export const commentsSheetHeaderSpacerStyle: CSSProperties = {
  width: "40px",
  height: "1px",
};

export const commentsSheetTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "14.5px",
  fontWeight: 950,
  textAlign: "center",
  letterSpacing: "-0.02em",
};

export const commentsSortMenuWrapStyle: CSSProperties = {
  position: "relative",
  width: "40px",
  height: "34px",
  justifySelf: "end",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
};

export const commentsSortMenuTriggerStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "27px",
  lineHeight: 1,
  fontWeight: 500,
  fontFamily: "inherit",
  padding: "0 0 2px",
  cursor: "pointer",
};

export const commentsSortMenuStyle: CSSProperties = {
  position: "absolute",
  top: "calc(100% + 6px)",
  right: 0,
  zIndex: 12,
  width: "132px",
  maxWidth: "calc(100vw - 24px)",
  display: "grid",
  gap: 0,
  padding: "4px 8px",
  boxSizing: "border-box",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "var(--historietas-obra-menu-98, rgba(18, 9, 35, 0.98))",
  boxShadow: "0 16px 36px rgba(0,0,0,0.48)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
};

export const commentsSortMenuItemStyle: CSSProperties = {
  width: "100%",
  minHeight: "36px",
  border: "none",
  borderRadius: 0,
  background: "transparent",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  padding: "0 4px",
  textAlign: "center",
  fontSize: "11.5px",
  fontWeight: 850,
  fontFamily: "inherit",
  cursor: "pointer",
};

export const commentsSortMenuItemActiveStyle: CSSProperties = {
  ...commentsSortMenuItemStyle,
  color: "#FFFFFF",
};

export const commentsSortMenuDividerStyle: CSSProperties = {
  width: "100%",
  height: "1px",
  background: "rgba(255,255,255,0.12)",
};

export const commentsSheetListStyle: CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: "12px",
  minHeight: 0,
  overflowY: "auto",
  padding: "6px 2px 9px",
  WebkitOverflowScrolling: "touch",
};

export const commentsLoadMoreStyle: CSSProperties = {
  width: "fit-content",
  minHeight: "36px",
  justifySelf: "center",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.14))",
  borderRadius: "999px",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.06))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  padding: "7px 14px",
  fontSize: "11px",
  fontWeight: 900,
  fontFamily: "inherit",
};

export const commentSheetItemStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "34px minmax(0, 1fr) 28px",
  gap: "10px",
  alignItems: "start",
  minWidth: 0,
};

export const commentThreadStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

export const commentRepliesListStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
  marginLeft: "34px",
  paddingLeft: "10px",
  borderLeft: "1px solid rgba(255,255,255,0.08)",
  minWidth: 0,
};

export const commentSheetReplyItemStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "28px minmax(0, 1fr) 28px",
  gap: "8px",
  alignItems: "start",
  minWidth: 0,
};

export const commentRepliesToggleStyle: CSSProperties = {
  width: "fit-content",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  marginLeft: "44px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 900,
  fontFamily: "inherit",
  padding: "1px 0",
  cursor: "pointer",
};

export const commentRepliesControlsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  minWidth: 0,
};

export const commentRepliesHideButtonStyle: CSSProperties = {
  width: "fit-content",
  marginLeft: "44px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 900,
  fontFamily: "inherit",
  padding: "1px 0",
  cursor: "pointer",
};

export const commentRepliesLineStyle: CSSProperties = {
  width: "22px",
  height: "1px",
  background: "rgba(255,255,255,0.22)",
};

export const commentSheetAvatarLinkStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-obra-bg-deep, #000000)",
  color: "#FFFFFF",
  fontSize: "12.5px",
  fontWeight: 950,
  textDecoration: "none",
  border: "1px solid var(--historietas-obra-purple-58, rgba(59, 7, 100, 0.58))",
  overflow: "hidden",
  boxSizing: "border-box",
};

export const commentSheetReplyAvatarLinkStyle: CSSProperties = {
  ...commentSheetAvatarLinkStyle,
  width: "28px",
  height: "28px",
  borderRadius: "10px",
  fontSize: "10.5px",
};

export const commentSheetContentStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  gap: "3px",
  minWidth: 0,
};

export const commentSheetTopLineStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: "6px",
  minWidth: 0,
};

export const commentSheetAuthorLinkStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 950,
  textDecoration: "none",
  ...safeTextStyle,
};

export const commentSheetTimeStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10.5px",
  fontWeight: 750,
  whiteSpace: "nowrap",
};

export const commentSheetTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12.5px",
  lineHeight: 1.38,
  fontWeight: 750,
  whiteSpace: "pre-wrap",
  ...safeTextStyle,
};

export const commentSheetActionsRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};

export const commentSheetReplyButtonStyle: CSSProperties = {
  width: "fit-content",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10.5px",
  fontWeight: 900,
  fontFamily: "inherit",
  padding: "1px 0 0",
  cursor: "pointer",
};

export const commentSheetRemoveButtonStyle: CSSProperties = {
  width: "fit-content",
  border: "none",
  background: "transparent",
  color: "var(--historietas-danger-button-text, #FFFFFF)",
  fontSize: "10.5px",
  fontWeight: 900,
  fontFamily: "inherit",
  padding: "1px 0 0",
  cursor: "pointer",
};

export const commentSheetLikeWrapStyle: CSSProperties = {
  minWidth: "28px",
  display: "grid",
  justifyItems: "center",
  alignContent: "start",
  gap: "2px",
};

export const commentSheetLikeButtonStyle: CSSProperties = {
  width: "28px",
  height: "28px",
  border: "none",
  borderRadius: "999px",
  background: "transparent",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  cursor: "pointer",
};

export const commentSheetLikeCountStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 900,
  lineHeight: 1,
  minHeight: "10px",
  textAlign: "center",
};

export const commentSheetHeartIconStyle: CSSProperties = {
  width: "19px",
  height: "19px",
  display: "block",
};

export const commentsLoadingStyle: CSSProperties = {
  width: "100%",
  minHeight: "58px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
};

export const emptyCommentsStyle: CSSProperties = {
  margin: "10px 0 0",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 800,
  textAlign: "center",
};

export const commentsToolsStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  padding: "5px 0 0",
};

export const commentsQuickReactionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "6px",
  width: "100%",
  overflowX: "auto",
  padding: "0 1px",
  scrollbarWidth: "none",
  WebkitOverflowScrolling: "touch",
};

export const commentsQuickReactionButtonStyle: CSSProperties = {
  width: "30px",
  height: "28px",
  border: "none",
  borderRadius: "999px",
  background: "transparent",
  fontSize: "18px",
  lineHeight: 1,
  padding: 0,
  cursor: "pointer",
  flex: "0 0 auto",
};

export const commentsSheetFormStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "30px minmax(0, 1fr) 28px 38px",
  alignItems: "center",
  gap: "7px",
  padding: "7px 0 0",
  minWidth: 0,
};

export const commentsInputAvatarStyle: CSSProperties = {
  width: "30px",
  height: "30px",
  borderRadius: "11px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-obra-bg-deep, #000000)",
  border: "1px solid var(--historietas-obra-purple-58, rgba(59, 7, 100, 0.58))",
  color: "#FFFFFF",
  fontSize: "11.5px",
  fontWeight: 950,
  overflow: "hidden",
};

export const commentsInputBoxStyle: CSSProperties = {
  minWidth: 0,
  minHeight: "38px",
  display: "flex",
  alignItems: "center",
};

export const commentsSheetInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "38px",
  maxHeight: "82px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "var(--historietas-obra-bg-deep, #000000)",
  color: "#FFFFFF",
  padding: "9px 12px",
  outline: "none",
  fontSize: "12.5px",
  lineHeight: 1.32,
  fontWeight: 650,
  resize: "none",
  overflowY: "auto",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

export const commentsInputIconButtonStyle: CSSProperties = {
  width: "26px",
  height: "30px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "16px",
  fontWeight: 950,
  fontFamily: "inherit",
  padding: 0,
  cursor: "pointer",
};

export const commentsSheetSendStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-bottom-nav-publish-border, var(--historietas-obra-secondary-soft-34, rgba(167, 139, 250, 0.34)))",
  background: "var(--historietas-bottom-nav-publish-bg, var(--historietas-obra-purple-72, rgba(59, 7, 100, 0.72)))",
  color: "#FFFFFF",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 950,
  fontFamily: "inherit",
  padding: 0,
};

export const commentStatusStyle: CSSProperties = {
  display: "block",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10.5px",
  lineHeight: 1.35,
  fontWeight: 800,
  textAlign: "center",
  ...safeTextStyle,
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
  ...safeTextStyle,
};

export const accentSectionTitleStyle: CSSProperties = {
  ...sectionTitleStyle,
  color: "#FFFFFF",
  textTransform: "uppercase",
};

export const fileBoxStyle: CSSProperties = {
  marginTop: "12px",
  padding: "15px",
  borderRadius: "22px",
  background:
    "linear-gradient(135deg, var(--historietas-obra-surface, #050505) 0%, var(--historietas-obra-bg-deep, #000000) 58%, var(--historietas-obra-bg-deeper, #000000) 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "grid",
  gap: "11px",
  minWidth: 0,
  overflow: "hidden",
  boxShadow: "none",
};

export const fileInfoCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "74px minmax(0, 1fr)",
  gap: "12px",
  alignItems: "center",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

export const filePreviewLinkStyle: CSSProperties = {
  width: "74px",
  height: "74px",
  borderRadius: "18px",
  background: "rgba(0,0,0,0.24)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  flex: "0 0 auto",
};

export const fileImagePreviewStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

export const fileIconBoxStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  borderRadius: "18px",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #FFFFFF) 0%, var(--historietas-secondary, #A1A1AA) 100%)",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "none",
};

export const fileInfoTextStyle: CSSProperties = {
  display: "grid",
  alignContent: "center",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
};

export const fileMetaStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "11px",
  lineHeight: 1.35,
  fontWeight: 900,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

export const fileActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
};

export const filePrimaryButtonStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "999px",
  background: "var(--historietas-obra-bg-deep-72, rgba(4, 0, 10, 0.72))",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 10px",
  boxShadow: "none",
  cursor: "pointer",
  fontFamily: "inherit",
  WebkitAppearance: "none",
  appearance: "none",
  WebkitTapHighlightColor: "transparent",
  ...safeTextStyle,
};

export const fileSecondaryButtonStyle: CSSProperties = {
  ...filePrimaryButtonStyle,
  color: "#FFFFFF",
};

export const workRatingBoxStyle: CSSProperties = {
  marginTop: "10px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  display: "grid",
  gap: "8px",
  minWidth: 0,
  boxSizing: "border-box",
};

export const desktopWorkRatingBoxStyle: CSSProperties = {
  ...workRatingBoxStyle,
  marginTop: "12px",
};

export const workRatingHeaderStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "4px",
  minWidth: 0,
  textAlign: "center",
};

export const workRatingTitleStyle: CSSProperties = {
  margin: 0,
  width: "100%",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  fontSize: "clamp(22px, 6.5vw, 31px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.045em",
  textTransform: "uppercase",
  maxWidth: "100%",
  textAlign: "center",
  ...safeTextStyle,
};

export const workRatingStarsRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
};

export const workRatingStarButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-obra-rating-muted, rgba(251, 191, 36, 0.34))",
  fontSize: "22px",
  fontWeight: 950,
  lineHeight: 1,
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

export const workRatingStarActiveStyle: CSSProperties = {
  ...workRatingStarButtonStyle,
  border: "none",
  background: "transparent",
  color: "var(--historietas-obra-rating, #FFFFFF)",
  boxShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

export const workRatingStarVisualStyle: CSSProperties = {
  position: "relative",
  width: "1em",
  height: "1em",
  display: "inline-block",
  lineHeight: 1,
};

export const workRatingStarBaseStyle: CSSProperties = {
  color: "var(--historietas-obra-rating-muted, rgba(251, 191, 36, 0.34))",
  position: "absolute",
  inset: 0,
  lineHeight: 1,
};

