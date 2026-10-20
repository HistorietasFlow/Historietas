import type { CSSProperties } from "react";

export const safeTextStyle: CSSProperties = {
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
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

export const loadingPageStyle: CSSProperties = {
  position: "relative",
  zIndex: 2,
  width: "100%",
  minHeight: "100dvh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
};

export const loadingSpinnerStyle: CSSProperties = {
  width: "30px",
  height: "30px",
  borderRadius: "999px",
  border: "3px solid rgba(255,255,255,0.20)",
  borderTopColor: "#FFFFFF",
  boxSizing: "border-box",
  animation: "historietas-loading-spin 0.78s linear infinite",
  flex: "0 0 auto",
};

export const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background: "var(--historietas-notificacoes-bg-page, #000000)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

export const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(900px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "8px 0 calc(14px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  minWidth: 0,
};

export const notificacoesTopFilterBoxStyle: CSSProperties = {
  marginTop: "0",
  display: "grid",
  gap: "3px",
  padding: "0",
  borderRadius: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
  minWidth: 0,
  overflow: "visible",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

export const titleHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "nowrap",
  marginBottom: "3px",
  width: "100%",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

export const desktopTitleHeaderStyle: CSSProperties = {
  width: "100%",
  minHeight: "58px",
  marginBottom: "18px",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "24px",
  minWidth: 0,
  boxSizing: "border-box",
};

export const desktopNotificationsTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "32px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  ...safeTextStyle,
};

export const desktopNotificationsTopActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "10px",
  minWidth: 0,
};

export const desktopNotificationsSearchShellStyle: CSSProperties = {
  position: "relative",
  width: "min(390px, 34vw)",
  minWidth: "230px",
  height: "42px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.045)",
  display: "flex",
  alignItems: "center",
  overflow: "hidden",
  boxSizing: "border-box",
};

export const desktopNotificationsSearchIconStyle: CSSProperties = {
  position: "absolute",
  left: "13px",
  top: "50%",
  transform: "translateY(-50%)",
  color: "rgba(255,255,255,0.56)",
  pointerEvents: "none",
};

export const desktopNotificationsSearchInputStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  height: "100%",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  outline: "none",
  padding: "0 14px 0 42px",
  fontFamily: "inherit",
  fontSize: "13px",
  fontWeight: 800,
  boxSizing: "border-box",
};

export const desktopNotificationsFilterButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  minHeight: "42px",
  padding: "0 16px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "transparent",
  color: "#FFFFFF",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  fontFamily: "inherit",
  fontSize: "12px",
  fontWeight: 900,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export const mobileSearchToggleStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "34px",
  height: "34px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: "24px",
  lineHeight: 1,
  fontWeight: 950,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  padding: 0,
  boxShadow: "none",
  flex: "0 0 auto",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
};

export const notificacoesHeaderFilterButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "8px",
  minWidth: "max-content",
  maxWidth: "none",
  flex: "0 0 auto",
  fontSize: "16px",
  lineHeight: 1.15,
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  textAlign: "left",
  letterSpacing: "-0.04em",
  boxShadow: "none",
  outline: "none",
  whiteSpace: "nowrap",
  WebkitTapHighlightColor: "transparent",
  ...safeTextStyle,
};

export const notificacoesHeaderFilterIconStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1,
  fontWeight: 700,
  flex: "0 0 auto",
};

export const notificationsControlsStyle: CSSProperties = {
  position: "relative",
  marginTop: "12px",
  display: "grid",
  gap: "8px",
  padding: "0",
  background: "transparent",
  border: "none",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "visible",
  boxSizing: "border-box",
};

export const desktopNotificationsControlsStyle: CSSProperties = {
  ...notificationsControlsStyle,
  maxWidth: "760px",
  marginLeft: "auto",
  marginRight: "auto",
};

export const notificationSearchShellStyle: CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  maxWidth: "calc(100% - 104px)",
  height: "36px",
  marginLeft: "auto",
  marginRight: "-6px",
  borderRadius: "999px",
  border: "none",
  background: "#000000",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  overflow: "hidden",
  padding: "0 0 0 13px",
  boxSizing: "border-box",
  boxShadow: "none",
  transformOrigin: "right center",
};

export const notificationSearchInputStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  flex: "1 1 auto",
  width: "100%",
  minWidth: 0,
  height: "34px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "14px",
  fontWeight: 800,
  letterSpacing: "-0.025em",
  boxSizing: "border-box",
};

export const notificationClearButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "fit-content",
  justifySelf: "center",
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.06)",
  color: "rgba(244,244,245,0.88)",
  fontFamily: "inherit",
  fontSize: "12px",
  fontWeight: 900,
  padding: "0 13px",
  cursor: "pointer",
  boxShadow: "none",
};

export const notificationSortingBackdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  height: "100dvh",
  zIndex: 2147483646,
  background: "rgba(0,0,0,0.68)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  padding: 0,
  boxSizing: "border-box",
  overflow: "hidden",
  overscrollBehavior: "none",
  touchAction: "none",
};

export const notificationSortingSheetStyle: CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: 0,
  transform: "translateX(-50%)",
  zIndex: 2147483647,
  width: "min(820px, 100%)",
  maxHeight: "calc(100dvh - 116px)",
  display: "grid",
  gap: 0,
  padding: "8px 0 calc(18px + env(safe-area-inset-bottom))",
  borderRadius: "24px 24px 0 0",
  background: "var(--historietas-bg-start, var(--historietas-notificacoes-bg-page, #000000))",
  border: "none",
  borderBottom: "0",
  overflowY: "auto",
  overflowX: "hidden",
  overscrollBehavior: "none",
  boxShadow: "0 -18px 50px rgba(0,0,0,0.38)",
  boxSizing: "border-box",
  touchAction: "none",
};

export const desktopNotificationSortingSheetStyle: CSSProperties = {
  ...notificationSortingSheetStyle,
  left: "50%",
  right: "auto",
  bottom: "24px",
  width: "min(560px, calc(100vw - 24px))",
  maxWidth: "560px",
  maxHeight: "82vh",
  transform: "translateX(-50%)",
  borderRadius: "24px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  margin: 0,
  paddingBottom: "18px",
};

export const notificationSortingHandleStyle: CSSProperties = {
  display: "block",
  justifySelf: "center",
  width: "72px",
  height: "5px",
  borderRadius: "999px",
  background: "rgba(244,244,245,0.62)",
  margin: "0 auto 14px",
};

export const notificationSortingTitleStyle: CSSProperties = {
  display: "block",
  margin: "0 0 12px",
  padding: 0,
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1.1,
  fontWeight: 950,
  letterSpacing: "-0.04em",
  textAlign: "center",
  ...safeTextStyle,
};

export const notificationSortingOptionsListStyle: CSSProperties = {
  display: "grid",
  gap: 0,
};

export const notificationSortingSectionLabelStyle: CSSProperties = {
  margin: 0,
  display: "block",
  padding: "11px 30px 5px",
  borderTop: "none",
  color: "rgba(244,244,245,0.56)",
  fontSize: "11px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

export const notificationSortingOptionStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minHeight: "44px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 650,
  letterSpacing: "-0.035em",
  textAlign: "left",
  padding: "0 30px",
  cursor: "pointer",
  boxSizing: "border-box",
  ...safeTextStyle,
};

export const notificationSortingOptionActiveStyle: CSSProperties = {
  ...notificationSortingOptionStyle,
  fontWeight: 900,
};

export const notificationSortingOptionRadioStyle: CSSProperties = {
  flex: "0 0 auto",
  width: "23px",
  height: "23px",
  borderRadius: "999px",
  border: "2.5px solid rgba(161,161,170,0.72)",
  background: "transparent",
  color: "transparent",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  fontSize: "15px",
  lineHeight: 1,
  fontWeight: 900,
};

export const notificationSortingOptionRadioActiveStyle: CSSProperties = {
  ...notificationSortingOptionRadioStyle,
  border: "2px solid #FFFFFF",
  background: "#FFFFFF",
  color: "#111111",
};

export const notificationActionsSheetStyle: CSSProperties = {
  ...notificationSortingSheetStyle,
  maxHeight: "calc(100dvh - 116px)",
};

export const desktopNotificationActionsSheetStyle: CSSProperties = {
  ...desktopNotificationSortingSheetStyle,
  maxHeight: "82vh",
};

export const notificationActionsOptionStyle: CSSProperties = {
  ...notificationSortingOptionStyle,
  justifyContent: "flex-start",
  fontWeight: 900,
};

export const notificationActionsOptionLinkStyle: CSSProperties = {
  ...notificationActionsOptionStyle,
  textDecoration: "none",
};

export const notificationActionsOptionDisabledStyle: CSSProperties = {
  ...notificationActionsOptionStyle,
  opacity: 0.45,
  cursor: "not-allowed",
};

export const notificationActionsDangerOptionStyle: CSSProperties = {
  ...notificationActionsOptionStyle,
  color: "var(--historietas-notificacoes-danger-text, #FFFFFF)",
};

export const notificationActionsDangerOptionDisabledStyle: CSSProperties = {
  ...notificationActionsDangerOptionStyle,
  opacity: 0.45,
  cursor: "not-allowed",
};

export const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  padding: "34px 0 64px",
};
