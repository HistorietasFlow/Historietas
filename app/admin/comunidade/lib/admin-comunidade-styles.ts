import type { CSSProperties } from "react";

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

export const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  background: "var(--historietas-admin-comunidade-bg-page, #000000)",
  color: "#FFFFFF",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

export const containerStyle: CSSProperties = {
  position: "relative",
  width: "min(900px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "10px 0 calc(24px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  minWidth: 0,
};

export const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1220px, calc(100% - 64px))",
  padding: "12px 0 42px",
};

export const titleHeaderStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  marginTop: 0,
  marginBottom: "12px",
  padding: 0,
  minWidth: 0,
  maxWidth: "100%",
  textAlign: "left",
  boxSizing: "border-box",
};

export const desktopTitleHeaderStyle: CSSProperties = {
  ...titleHeaderStyle,
  marginTop: 0,
  marginBottom: "16px",
};

export const titleHeaderActionsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "10px",
  flex: "0 0 auto",
};

export const desktopTechnicalSupportButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  padding: "7px 12px",
  background:
    "var(--historietas-surface-strong, var(--historietas-admin-comunidade-bg-deep, #000000))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 900,
  whiteSpace: "nowrap",
  boxShadow: "none",
  zIndex: 2,
};

export const mobileTechnicalSupportButtonStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background:
    "var(--historietas-surface-strong, var(--historietas-admin-comunidade-bg-deep, #000000))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
  lineHeight: 1,
  fontWeight: 950,
  boxShadow: "none",
  zIndex: 2,
};

export const desktopNotificationButtonStyle: CSSProperties = {
  position: "relative",
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "var(--historietas-surface-strong, var(--historietas-admin-comunidade-bg-deep, #000000))",
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
  border: "2px solid var(--historietas-bg-start, var(--historietas-admin-comunidade-bg-page, #000000))",
  background:
    "var(--historietas-admin-comunidade-notification-badge-bg, #FFFFFF)",
  color:
    "var(--historietas-admin-comunidade-notification-badge-text, #FFFFFF)",
  fontSize: "9px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.38)",
  pointerEvents: "none",
};


export const titleSearchButtonStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: 0,
  border: 0,
  background: "transparent",
  color: "#FFFFFF",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "15px",
  lineHeight: 1,
  fontWeight: 950,
  fontFamily: "inherit",
  padding: 0,
  cursor: "pointer",
  boxShadow: "none",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
  WebkitAppearance: "none",
  appearance: "none",
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

export const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
  gap: "6px",
  margin: "2px 0 0",
  minWidth: 0,
};

export const statCardStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  alignContent: "center",
  gap: "2px",
  minHeight: "54px",
  padding: "7px 3px",
  borderRadius: "15px",
  background: "rgba(255,255,255,0.045)",
  border: "none",
  textAlign: "center",
  minWidth: 0,
  overflow: "hidden",
  boxShadow: "none",
};

export const statNumberStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "20px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.05em",
  textAlign: "center",
  ...safeTextStyle,
};

export const statLabelStyle: CSSProperties = {
  color: "#D4D4D8",
  fontSize: "7.4px",
  lineHeight: 1.06,
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.035em",
  textAlign: "center",
  ...safeTextStyle,
};

export const toolsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "7px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  marginBottom: "12px",
  minWidth: 0,
  boxShadow: "none",
  overflow: "visible",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

export const adminSearchShellStyle: CSSProperties = {
  width: "100%",
  minHeight: "44px",
  borderRadius: "999px",
  border: "1px solid transparent",
  background: "var(--historietas-admin-comunidade-bg-deep, #000000)",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "0 15px",
  boxSizing: "border-box",
  boxShadow: "none",
  outline: "none",
};

export const adminSearchIconStyle: CSSProperties = {
  color: "rgba(255,255,255,0.72)",
  width: "22px",
  height: "22px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
  flex: "0 0 auto",
};

export const adminSearchInputStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minWidth: 0,
  height: "44px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "14px",
  fontWeight: 700,
  letterSpacing: 0,
  boxSizing: "border-box",
};


export const adminFilterLabelButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: "16px",
  lineHeight: 1.15,
  fontWeight: 950,
  letterSpacing: "-0.04em",
  textAlign: "left",
  padding: 0,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  ...safeTextStyle,
};

export const adminFilterActionIconStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1,
  fontWeight: 700,
  flex: "0 0 auto",
};

export const statusFilterWrapStyle: CSSProperties = {
  display: "grid",
  justifyItems: "stretch",
  gap: "7px",
  minWidth: 0,
};

export const filterButtonsStyle: CSSProperties = {
  width: "calc(100% + 24px)",
  maxWidth: "calc(100% + 24px)",
  marginLeft: "-12px",
  marginRight: "-12px",
  display: "flex",
  flexWrap: "nowrap",
  justifyContent: "flex-start",
  gap: "7px",
  minWidth: 0,
  overflowX: "auto",
  overflowY: "hidden",
  padding: "0 12px",
  boxSizing: "border-box",
  scrollSnapType: "x proximity",
  WebkitOverflowScrolling: "touch",
};

export const filterButtonStyle: CSSProperties = {
  flex: "0 0 auto",
  minHeight: "34px",
  padding: "0 13px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(255,255,255,0.06)",
  color: "#D4D4D8",
  fontSize: "10.5px",
  fontWeight: 880,
  cursor: "pointer",
  boxShadow: "none",
  scrollSnapAlign: "center",
};

export const activeFilterButtonStyle: CSSProperties = {
  ...filterButtonStyle,
  background: "var(--historietas-admin-comunidade-surface, #050505)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  boxShadow: "none",
};

export const feedbackWrapStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  marginBottom: "12px",
};

export const errorStyle: CSSProperties = {
  display: "block",
  padding: "10px 12px",
  borderRadius: "16px",
  background: "var(--historietas-admin-comunidade-danger-bg, rgba(255,255,255,0.06))",
  border: "1px solid var(--historietas-admin-comunidade-danger-border, rgba(255,255,255,0.18))",
  color: "var(--historietas-admin-comunidade-danger-text, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 850,
  ...safeTextStyle,
};

export const successStyle: CSSProperties = {
  display: "block",
  padding: "10px 12px",
  borderRadius: "16px",
  background: "var(--historietas-admin-comunidade-success-bg, rgba(255,255,255,0.06))",
  border: "1px solid var(--historietas-admin-comunidade-success-border, rgba(255,255,255,0.18))",
  color: "var(--historietas-admin-comunidade-success-text, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 850,
  ...safeTextStyle,
};

export const summaryStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "2px",
  padding: "4px 0 6px",
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "#D4D4D8",
  textAlign: "center",
  marginBottom: "6px",
  boxShadow: "none",
};

export const summaryTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "14px",
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

export const clearButtonStyle: CSSProperties = {
  minHeight: "34px",
  padding: "0 13px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "var(--historietas-admin-comunidade-panel, rgba(5,5,5,0.92))",
  color: "var(--historietas-admin-comunidade-purple-text, #FFFFFF)",
  fontSize: "10.5px",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "none",
};

export const listStyle: CSSProperties = {
  display: "grid",
  gap: 0,
  minWidth: 0,
};

export const reportCardStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  padding: "16px 0",
  borderRadius: 0,
  background: "transparent",
  border: "none",
  borderBottom: "1px solid rgba(255,255,255,0.62)",
  boxShadow: "none",
  minWidth: 0,
  overflow: "visible",
};

export const reportHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "start",
  gap: "10px",
  minWidth: 0,
};

export const reportTitleWrapStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  alignContent: "start",
  justifyItems: "start",
  minWidth: 0,
};

export const reportMetaLineStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  flexWrap: "wrap",
  minWidth: 0,
};

export const reportDotStyle: CSSProperties = {
  color: "var(--historietas-text-muted, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 950,
  lineHeight: 1,
};

export const targetBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "9px",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
};

export const postTargetBadgeStyle: CSSProperties = {
  color: "#FFFFFF",
};

export const commentTargetBadgeStyle: CSSProperties = {
  color: "#FFFFFF",
};

export const reportTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "15px",
  lineHeight: 1.24,
  fontWeight: 950,
  ...safeTextStyle,
};

export const reportDateStyle: CSSProperties = {
  color: "var(--historietas-text-muted, #A1A1AA)",
  fontSize: "10.5px",
  lineHeight: 1.2,
  fontWeight: 800,
};

export const statusInlineStyle: CSSProperties = {
  color: "var(--historietas-accent, var(--historietas-admin-comunidade-accent-soft, #FFFFFF))",
  fontSize: "10.5px",
  lineHeight: 1.2,
  fontWeight: 950,
  whiteSpace: "nowrap",
};

export const archivedInlineStyle: CSSProperties = {
  color: "var(--historietas-text-muted, #A1A1AA)",
  fontSize: "10.5px",
  lineHeight: 1.2,
  fontWeight: 900,
  whiteSpace: "nowrap",
};

export const reportHeaderRightStyle: CSSProperties = {
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "6px",
  minWidth: 0,
};

export const reportMenuWrapStyle: CSSProperties = {
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
};

export const reportMenuButtonStyle: CSSProperties = {
  width: "24px",
  height: "30px",
  borderRadius: 0,
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
  fontWeight: 950,
  letterSpacing: 0,
  lineHeight: 1,
  fontFamily: "inherit",
  cursor: "pointer",
  padding: 0,
  position: "relative",
  zIndex: 2,
  boxShadow: "none",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
};

export const adminFiltersSheetOverlayStyle: CSSProperties = {
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

export const adminFiltersSheetBackdropStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  padding: 0,
};

export const adminFiltersSheetStyle: CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: 0,
  transform: "translateX(-50%)",
  zIndex: 9999,
  width: "min(820px, 100%)",
  maxHeight: "calc(100dvh - 116px)",
  display: "grid",
  gap: "0",
  padding: "8px 0 calc(104px + env(safe-area-inset-bottom))",
  borderRadius: "24px 24px 0 0",
  background: "var(--historietas-admin-comunidade-bg-page, #000000)",
  border: "none",
  overflowY: "auto",
  overflowX: "hidden",
  overscrollBehavior: "none",
  boxShadow: "0 -18px 50px rgba(0,0,0,0.38)",
  boxSizing: "border-box",
  touchAction: "none",
};

export const adminFiltersSheetHandleStyle: CSSProperties = {
  justifySelf: "center",
  width: "72px",
  height: "5px",
  borderRadius: "999px",
  background: "rgba(244,244,245,0.62)",
  margin: "0 auto 14px",
};

export const adminFiltersSheetTitleStyle: CSSProperties = {
  display: "block",
  margin: "0 0 12px",
  padding: 0,
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1.1,
  fontWeight: 950,
  textAlign: "center",
  letterSpacing: "-0.04em",
  ...safeTextStyle,
};

export const adminFiltersSheetSectionLabelStyle: CSSProperties = {
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

export const adminFiltersSheetOptionStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minHeight: "44px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 650,
  letterSpacing: "-0.035em",
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  padding: "0 30px",
  textAlign: "left",
  boxSizing: "border-box",
  boxShadow: "none",
  ...safeTextStyle,
};

export const adminFiltersSheetOptionActiveStyle: CSSProperties = {
  ...adminFiltersSheetOptionStyle,
  fontWeight: 900,
  background: "transparent",
};

export const adminFiltersSheetRadioStyle: CSSProperties = {
  width: "23px",
  height: "23px",
  borderRadius: "999px",
  border: "2.5px solid rgba(161,161,170,0.72)",
  background: "transparent",
  color: "transparent",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  boxSizing: "border-box",
  fontSize: "15px",
  lineHeight: 1,
  fontWeight: 900,
};

export const adminFiltersSheetRadioActiveStyle: CSSProperties = {
  ...adminFiltersSheetRadioStyle,
  border: "2px solid #FFFFFF",
  background: "#FFFFFF",
  color: "#111111",
};

export const adminFiltersSheetClearButtonStyle: CSSProperties = {
  width: "calc(100% - 60px)",
  justifySelf: "center",
  minHeight: "46px",
  marginTop: "12px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "transparent",
  color: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: "15px",
  fontWeight: 950,
  cursor: "pointer",
  textAlign: "center",
  ...safeTextStyle,
};

export const reportMenuOverlayStyle: CSSProperties = {
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

export const reportMenuBackdropStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  padding: 0,
};

export const reportMenuStyle: CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: 0,
  transform: "translateX(-50%)",
  zIndex: 9999,
  width: "min(820px, 100%)",
  maxHeight: "calc(100dvh - 190px)",
  display: "grid",
  gap: "0",
  padding: "8px 0 calc(18px + env(safe-area-inset-bottom))",
  borderRadius: "24px 24px 0 0",
  background: "var(--historietas-admin-comunidade-bg-page, #000000)",
  border: "none",
  overflowY: "auto",
  overflowX: "hidden",
  overscrollBehavior: "none",
  boxShadow: "0 -18px 50px rgba(0,0,0,0.38)",
  boxSizing: "border-box",
  touchAction: "none",
};

export const reportMenuHandleStyle: CSSProperties = {
  justifySelf: "center",
  width: "72px",
  height: "5px",
  borderRadius: "999px",
  background: "rgba(244,244,245,0.62)",
  margin: "0 auto 14px",
};

export const reportMenuTitleStyle: CSSProperties = {
  display: "block",
  margin: "0 0 12px",
  padding: 0,
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1.1,
  fontWeight: 950,
  textAlign: "center",
  letterSpacing: "-0.04em",
  ...safeTextStyle,
};

export const reportMenuItemStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minHeight: "44px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 650,
  letterSpacing: "-0.035em",
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "16px",
  padding: "0 30px",
  textAlign: "left",
  boxSizing: "border-box",
  boxShadow: "none",
  ...safeTextStyle,
};

export const reportMenuItemLinkStyle: CSSProperties = {
  ...reportMenuItemStyle,
  textDecoration: "none",
};

export const reportMenuItemActiveStyle: CSSProperties = {
  ...reportMenuItemStyle,
  color: "rgba(244,244,245,0.58)",
  cursor: "default",
  fontWeight: 900,
};

export const reportMenuDangerItemStyle: CSSProperties = {
  ...reportMenuItemStyle,
  color: "var(--historietas-admin-comunidade-danger-menu, #FFFFFF)",
};

export const reportMenuDividerStyle: CSSProperties = {
  display: "none",
  height: 0,
  margin: 0,
  background: "transparent",
};

export const reportBodyStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: 0,
  minWidth: 0,
  paddingTop: "8px",
  borderTop: "none",
};

export const contentBoxStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
  padding: "13px 0",
  borderRadius: 0,
  background: "transparent",
  border: "none",
  borderBottom: "none",
  boxShadow: "none",
  minWidth: 0,
  alignContent: "start",
};

export const sectionHeaderLineStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  flexWrap: "wrap",
  minWidth: 0,
};

export const sectionHintStyle: CSSProperties = {
  color: "var(--historietas-text-muted, #A1A1AA)",
  fontSize: "9.8px",
  fontWeight: 850,
  ...safeTextStyle,
};

export const boxLabelStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "9.8px",
  fontWeight: 950,
  letterSpacing: "0.105em",
  textTransform: "uppercase",
};

export const adminObservationLabelStyle: CSSProperties = {
  ...boxLabelStyle,
  color: "var(--historietas-text-secondary, #D4D4D8)",
};

export const reportedTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13.2px",
  lineHeight: 1.48,
  fontWeight: 800,
  maxHeight: "118px",
  overflowY: "auto",
  paddingRight: "2px",
  ...safeTextStyle,
};

export const reportedTextCompactStyle: CSSProperties = {
  ...reportedTextStyle,
  maxHeight: "none",
  overflowY: "visible",
  color: "var(--historietas-text-secondary, #D4D4D8)",
};

export const metaGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
  gap: "4px 12px",
  minWidth: 0,
};

export const metaItemStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10.5px",
  lineHeight: 1.35,
  fontWeight: 750,
  ...safeTextStyle,
};

export const recurrenceMetaItemStyle: CSSProperties = {
  ...metaItemStyle,
  color: "var(--historietas-admin-comunidade-warning, #FFFFFF)",
  fontWeight: 900,
};

export const spoilerMetaItemStyle: CSSProperties = {
  ...metaItemStyle,
  color: "var(--historietas-admin-comunidade-accent-soft, #FFFFFF)",
};

export const reasonGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "4px 12px",
  minWidth: 0,
};

export const reasonItemStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10.5px",
  lineHeight: 1.35,
  fontWeight: 800,
  ...safeTextStyle,
};

export const detailTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12.5px",
  lineHeight: 1.45,
  fontWeight: 750,
  maxHeight: "92px",
  overflowY: "auto",
  paddingRight: "2px",
  ...safeTextStyle,
};

export const mutedTextStyle: CSSProperties = {
  ...detailTextStyle,
  color: "var(--historietas-text-muted, #A1A1AA)",
};

export const adminNoteStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
  gridColumn: "1 / -1",
  padding: "13px 0 0",
  borderTop: "none",
  background: "transparent",
  boxShadow: "none",
};

export const textareaStyle: CSSProperties = {
  width: "100%",
  border: "none",
  borderRadius: 0,
  outline: "none",
  background: "transparent",
  color: "var(--historietas-input-text, var(--historietas-text-primary, #FFFFFF))",
  padding: "8px 0 0",
  boxSizing: "border-box",
  fontSize: "12.5px",
  lineHeight: 1.4,
  fontWeight: 800,
  resize: "vertical",
  minHeight: "46px",
  cursor: "text",
  caretColor: "#FFFFFF",
  boxShadow: "none",
};

export const analysisMetaStyle: CSSProperties = {
  color: "var(--historietas-text-muted, #A1A1AA)",
  fontSize: "10.5px",
  fontWeight: 800,
  textAlign: "right",
  ...safeTextStyle,
};
