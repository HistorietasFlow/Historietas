import type { CSSProperties } from "react";

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
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
  minHeight: "100dvh",
  height: "auto",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  overflowY: "auto",
  boxSizing: "border-box",
  background: "var(--historietas-login-bg-page, #000000)",
  color: "#FFFFFF",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

export const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(1120px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "clamp(8px, 1.6vw, 16px) 0 8px",
  boxSizing: "border-box",
  minWidth: 0,
};

export const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  marginBottom: "10px",
  minWidth: 0,
};

export const languageSelectShellStyle: CSSProperties = {
  position: "relative",
  width: "108px",
  minWidth: 0,
  justifySelf: "end",
};

export const languageSelectWrapperStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
};

export const languageSelectStyle: CSSProperties = {
  minHeight: "36px",
  height: "36px",
  padding: "0 8px",
  borderRadius: "12px",
  border:
    "1px solid var(--historietas-login-purple-border, rgba(255,255,255,0.18))",
  background: "var(--historietas-login-bg-deep, #000000)",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 850,
  colorScheme: "dark",
};

export const logoStyle: CSSProperties = {
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "25px",
  fontWeight: 950,
  letterSpacing: 0,
  display: "flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "visible",
  ...safeTextStyle,
};

export const logoMarkStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-login-bg-deep, #000000)",
  color: "#FFFFFF",
  fontSize: "19px",
  fontWeight: 950,
  letterSpacing: 0,
  flex: "0 0 auto",
  border: "1px solid var(--historietas-login-purple-border, rgba(255,255,255,0.18))",
  boxShadow: "none",
};

export const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, #FFFFFF 0%, var(--historietas-login-logo-mid, #D4D4D8) 44%, var(--historietas-login-logo-end, #FFFFFF) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "none",
};

export const heroStyle: CSSProperties = {
  position: "relative",
  overflow: "visible",
  borderRadius: 0,
  border: "none",
  background: "transparent",
  boxShadow: "none",
  minWidth: 0,
};

export const heroGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "transparent",
  pointerEvents: "none",
};

export const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  padding: "clamp(12px, 2.4vw, 26px) clamp(18px, 3.4vw, 38px) clamp(4px, 1vw, 10px)",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  justifyItems: "center",
  alignItems: "center",
  gap: "clamp(14px, 2.8vw, 26px)",
  transform: "translateY(clamp(16px, 2.4vh, 26px))",
  minWidth: 0,
};

export const introStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "10px",
  width: "100%",
  maxWidth: "760px",
  textAlign: "center",
  minWidth: 0,
};

export const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(27px, 6.6vw, 64px)",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  width: "100%",
  maxWidth: "760px",
  textAlign: "center",
  background: "none",
  WebkitBackgroundClip: "initial",
  backgroundClip: "initial",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  padding: "0 0.16em 4px",
  marginLeft: "auto",
  marginRight: "auto",
  overflow: "visible",
  overflowWrap: "normal",
  wordBreak: "normal",
  whiteSpace: "normal",
};

export const descriptionStyle: CSSProperties = {
  margin: 0,
  color: "#D4D4D8",
  fontSize: "clamp(12.5px, 2vw, 15px)",
  lineHeight: 1.54,
  fontWeight: 650,
  maxWidth: "620px",
  textAlign: "center",
  ...safeTextStyle,
};

export const formPanelStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  width: "100%",
  maxWidth: "440px",
  justifySelf: "center",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
  boxSizing: "border-box",
  minWidth: 0,
};

export const tabsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "6px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  minWidth: 0,
};

export const tabStyle: CSSProperties = {
  minHeight: "36px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-login-purple-border-soft, rgba(255,255,255,0.18))",
  background: "var(--historietas-login-bg-deep, #000000)",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxShadow: "none",
  ...safeTextStyle,
};

export const tabActiveStyle: CSSProperties = {
  ...tabStyle,
  background: "var(--historietas-login-surface, #050505)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  boxShadow: "none",
};

export const formStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
  minWidth: 0,
};

export const fieldStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  minWidth: 0,
};

export const labelStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 950,
  ...safeTextStyle,
};

export const inputStyle: CSSProperties = {
  width: "100%",
  height: "48px",
  minHeight: "48px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-login-purple-border, rgba(255,255,255,0.18))",
  background: "var(--historietas-login-bg-deep, #000000)",
  color: "#FFFFFF",
  padding: "0 13px",
  outline: "none",
  fontSize: "15px",
  fontWeight: 750,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
};

export const consentGroupStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
};

export const consentLabelStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "22px minmax(0, 1fr)",
  alignItems: "start",
  gap: "10px",
  padding: "12px 13px",
  borderRadius: "15px",
  border:
    "1px solid var(--historietas-login-purple-border-soft, rgba(255,255,255,0.18))",
  background: "var(--historietas-login-bg-deep, #000000)",
  color: "#E4E4E7",
  fontSize: "12px",
  fontWeight: 700,
  lineHeight: 1.5,
  cursor: "pointer",
  minWidth: 0,
};

export const checkboxStyle: CSSProperties = {
  width: "18px",
  height: "18px",
  margin: "1px 0 0",
  accentColor: "#FFFFFF",
};

export const legalLinkStyle: CSSProperties = {
  color: "#FFFFFF",
  fontWeight: 900,
  textUnderlineOffset: "3px",
};

export const primaryButtonStyle: CSSProperties = {
  width: "100%",
  height: "44px",
  minHeight: "44px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-login-surface, #050505)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 14px",
  boxShadow: "none",
  ...safeTextStyle,
};

export const secondaryButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  background: "transparent",
  border:
    "1px solid var(--historietas-login-purple-border-soft, rgba(255,255,255,0.18))",
  cursor: "pointer",
};

export const textButtonStyle: CSSProperties = {
  width: "fit-content",
  justifySelf: "end",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  padding: "2px 4px",
  fontFamily: "inherit",
  fontSize: "11px",
  fontWeight: 850,
  textDecoration: "none",
  cursor: "pointer",
  ...safeTextStyle,
};

export const errorStyle: CSSProperties = {
  display: "block",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "var(--historietas-login-danger, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};

export const successStyle: CSSProperties = {
  display: "block",
  padding: "9px 12px",
  borderRadius: "14px",
  background: "var(--historietas-login-success-bg, rgba(255,255,255,0.06))",
  border: "1px solid var(--historietas-login-success-border, rgba(255,255,255,0.18))",
  color: "var(--historietas-login-success, #FFFFFF)",
  fontSize: "12px",
  lineHeight: 1.45,
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};

export const helperTextStyle: CSSProperties = {
  margin: 0,
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "#D4D4D8",
  fontSize: "11px",
  lineHeight: 1.45,
  fontWeight: 700,
  textAlign: "center",
  ...safeTextStyle,
};
