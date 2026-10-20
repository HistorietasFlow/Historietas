import type { CSSProperties } from "react";
import { safeTextStyle } from "./configuracoes-settings-primitives-styles";

export const containerStyle: CSSProperties = {
  width: "min(760px, calc(100% - 32px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "16px 0 120px",
  boxSizing: "border-box",
  minWidth: 0,
};

export const headerStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "40px minmax(0, 1fr)",
  alignItems: "center",
  gap: "10px",
  marginBottom: "16px",
};

export const backButtonStyle: CSSProperties = {
  width: "40px",
  height: "40px",
  border: "0",
  borderRadius: "999px",
  background: "var(--configuracoes-control-bg, rgba(255,255,255,0.08))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

export const pageTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "clamp(20px, 5.2vw, 25px)",
  lineHeight: 1.08,
  fontWeight: 900,
  letterSpacing: "-0.04em",
  textAlign: "left",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

export const searchBoxStyle: CSSProperties = {
  minHeight: "48px",
  borderRadius: "15px",
  background: "var(--configuracoes-control-bg, rgba(255,255,255,0.11))",
  border: "1px solid var(--configuracoes-border, rgba(255,255,255,0.05))",
  color: "var(--configuracoes-text-secondary, rgba(255,255,255,0.55))",
  display: "grid",
  gridTemplateColumns: "23px minmax(0, 1fr)",
  alignItems: "center",
  gap: "10px",
  padding: "0 15px",
  marginBottom: "18px",
};

export const searchInputStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  minHeight: "46px",
  border: "0",
  outline: "none",
  background: "transparent",
  color: "var(--historietas-input-text, #FFFFFF)",
  fontSize: "16px",
  fontWeight: 650,
  fontFamily: "inherit",
  minWidth: 0,
};

export const profileCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "52px minmax(0, 1fr)",
  alignItems: "center",
  gap: "12px",
  padding: "14px",
  borderRadius: "20px",
  background: "var(--configuracoes-card-bg, rgba(255,255,255,0.09))",
  border: "1px solid var(--configuracoes-border, rgba(255,255,255,0.06))",
  marginBottom: "18px",
};

export const avatarStyle: CSSProperties = {
  width: "52px",
  height: "52px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#FFFFFF",
  background:
    "linear-gradient(135deg, rgba(148,163,184,0.90), rgba(75,85,99,0.95))",
  fontSize: "21px",
  fontWeight: 760,
  letterSpacing: "-0.035em",
  flex: "0 0 auto",
};

export const profileTextStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  minWidth: 0,
};

export const profileNameStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "17px",
  lineHeight: 1.08,
  fontWeight: 780,
  letterSpacing: "-0.025em",
  ...safeTextStyle,
};

export const profileUsernameStyle: CSSProperties = {
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
  fontSize: "13px",
  lineHeight: 1.15,
  fontWeight: 760,
  ...safeTextStyle,
};

export const profileEmailStyle: CSSProperties = {
  color: "var(--configuracoes-text-secondary, rgba(255,255,255,0.52))",
  fontSize: "13px",
  lineHeight: 1.18,
  fontWeight: 520,
  ...safeTextStyle,
};
