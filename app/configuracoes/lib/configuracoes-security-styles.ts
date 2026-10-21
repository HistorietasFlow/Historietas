import type { CSSProperties } from "react";
import { safeTextStyle } from "./configuracoes-settings-primitives-styles";

export const pageStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background: "var(--configuracoes-page-bg, #050509)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily:
    "Inter, Poppins, Manrope, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

export const listCardTransparentStyle: CSSProperties = {
  overflow: "hidden",
  borderRadius: "20px",
  background: "transparent",
};

export const securityOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1200,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  boxSizing: "border-box",
  background: "rgba(0,0,0,0.74)",
  backdropFilter: "blur(8px)",
};

export const securityModalStyle: CSSProperties = {
  width: "min(440px, 100%)",
  maxHeight: "calc(100dvh - 40px)",
  overflowY: "auto",
  borderRadius: "22px",
  padding: "20px",
  boxSizing: "border-box",
  background:
    "var(--configuracoes-card-bg, linear-gradient(180deg, #18131F 0%, #0B090E 100%))",
  border: "1px solid var(--configuracoes-border, rgba(255,255,255,0.14))",
  boxShadow: "0 28px 90px rgba(0,0,0,0.62)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

export const securityModalHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "42px minmax(0, 1fr) 36px",
  alignItems: "start",
  gap: "11px",
};

export const securityModalIconStyle: CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "14px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--configuracoes-control-bg, rgba(255,255,255,0.09))",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

export const deleteModalIconStyle: CSSProperties = {
  ...securityModalIconStyle,
  background: "rgba(127,29,29,0.28)",
  color: "var(--configuracoes-danger-text, #FCA5A5)",
  border: "1px solid rgba(248,113,113,0.22)",
};

export const securityModalHeadingStyle: CSSProperties = {
  minWidth: 0,
};

export const securityModalTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "21px",
  lineHeight: 1.08,
  fontWeight: 900,
  letterSpacing: "-0.035em",
};

export const securityModalSubtitleStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "var(--configuracoes-text-secondary, rgba(255,255,255,0.58))",
  fontSize: "13px",
  lineHeight: 1.35,
  fontWeight: 560,
  ...safeTextStyle,
};

export const securityCloseButtonStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  border: "0",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--configuracoes-control-bg, rgba(255,255,255,0.08))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "inherit",
  fontSize: "25px",
  lineHeight: 1,
  cursor: "pointer",
};

export const securityCloseButtonDisabledStyle: CSSProperties = {
  ...securityCloseButtonStyle,
  cursor: "not-allowed",
  opacity: 0.45,
};

export const securityFormStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
  marginTop: "22px",
};

export const securityFieldStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
};

export const securityFieldLabelStyle: CSSProperties = {
  color: "var(--configuracoes-text-secondary, rgba(255,255,255,0.70))",
  fontSize: "12px",
  lineHeight: 1,
  fontWeight: 850,
  textTransform: "uppercase",
  letterSpacing: "0.035em",
};

export const securityPasswordInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "48px",
  boxSizing: "border-box",
  borderRadius: "13px",
  border: "1px solid var(--configuracoes-border, rgba(255,255,255,0.14))",
  outline: "none",
  padding: "10px 13px",
  background: "var(--configuracoes-control-bg, rgba(255,255,255,0.075))",
  color: "var(--historietas-input-text, #FFFFFF)",
  fontFamily: "inherit",
  fontSize: "16px",
  lineHeight: 1.2,
  fontWeight: 680,
};

export const securityHintStyle: CSSProperties = {
  margin: "-2px 0 0",
  color: "var(--configuracoes-text-secondary, rgba(255,255,255,0.50))",
  fontSize: "12px",
  lineHeight: 1.35,
  fontWeight: 570,
  ...safeTextStyle,
};

export const securityErrorStyle: CSSProperties = {
  padding: "11px 12px",
  borderRadius: "12px",
  border: "1px solid rgba(248,113,113,0.32)",
  background: "rgba(127,29,29,0.20)",
  color: "var(--configuracoes-danger-text, #FCA5A5)",
  fontSize: "13px",
  lineHeight: 1.35,
  fontWeight: 700,
  ...safeTextStyle,
};

export const securitySuccessStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "30px minmax(0, 1fr)",
  gap: "11px",
  alignItems: "start",
  marginTop: "22px",
  padding: "15px",
  borderRadius: "15px",
  border: "1px solid rgba(74,222,128,0.30)",
  background: "rgba(20,83,45,0.22)",
  color: "#BBF7D0",
};

export const securityFeedbackTextStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  color: "inherit",
  fontSize: "13px",
  lineHeight: 1.35,
  ...safeTextStyle,
};

export const deleteWarningStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
  marginTop: "20px",
  padding: "14px",
  borderRadius: "14px",
  border: "1px solid rgba(248,113,113,0.28)",
  background: "rgba(127,29,29,0.18)",
  color: "var(--configuracoes-danger-text, #FCA5A5)",
  fontSize: "13px",
  lineHeight: 1.4,
};

export const deleteWarningListStyle: CSSProperties = {
  margin: 0,
  paddingLeft: "20px",
  color: "var(--configuracoes-text-secondary, rgba(255,255,255,0.72))",
};

export const deletePublicLinkStyle: CSSProperties = {
  width: "fit-content",
  color: "var(--configuracoes-danger-text, #FCA5A5)",
  fontWeight: 780,
};

export const securityActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.25fr)",
  gap: "10px",
  marginTop: "4px",
};

export const securityButtonBaseStyle: CSSProperties = {
  minHeight: "46px",
  borderRadius: "13px",
  padding: "10px 14px",
  border: "0",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "9px",
  fontFamily: "inherit",
  fontSize: "14px",
  lineHeight: 1,
  fontWeight: 850,
  cursor: "pointer",
};

export const securitySecondaryButtonStyle: CSSProperties = {
  ...securityButtonBaseStyle,
  background: "var(--configuracoes-control-bg, rgba(255,255,255,0.09))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  border: "1px solid var(--configuracoes-border, rgba(255,255,255,0.12))",
};

export const securityPrimaryButtonStyle: CSSProperties = {
  ...securityButtonBaseStyle,
  background: "var(--historietas-accent, #F97316)",
  color: "#000000",
};

export const deleteDangerButtonStyle: CSSProperties = {
  ...securityButtonBaseStyle,
  background: "#DC2626",
  color: "#FFFFFF",
  boxShadow: "0 10px 28px rgba(220,38,38,0.24)",
};

export const deleteDangerButtonDisabledStyle: CSSProperties = {
  ...deleteDangerButtonStyle,
  cursor: "not-allowed",
  opacity: 0.62,
};

export const securitySecondaryButtonDisabledStyle: CSSProperties = {
  ...securitySecondaryButtonStyle,
  cursor: "not-allowed",
  opacity: 0.48,
};

export const securityPrimaryButtonDisabledStyle: CSSProperties = {
  ...securityPrimaryButtonStyle,
  cursor: "not-allowed",
  opacity: 0.64,
};

export const securityDoneButtonStyle: CSSProperties = {
  ...securityPrimaryButtonStyle,
  width: "100%",
  marginTop: "15px",
};

export const privacySelectStyle: CSSProperties = {
  width: "clamp(120px, 34vw, 128px)",
  minWidth: 0,
  maxWidth: "100%",
  minHeight: 38,
  padding: "7px 20px 7px 8px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "#FFFFFF",
  fontSize: 12,
  fontWeight: 800,
  outline: "none",
  transform: "translateX(22px)",
};
