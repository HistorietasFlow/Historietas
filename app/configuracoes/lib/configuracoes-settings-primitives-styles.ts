import type { CSSProperties } from "react";

export const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

export const sectionStyle: CSSProperties = {
  marginTop: "18px",
  minWidth: 0,
};

export const sectionTitleStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "var(--configuracoes-text-secondary, rgba(255,255,255,0.52))",
  fontSize: "13px",
  lineHeight: 1.15,
  fontWeight: 760,
  letterSpacing: "-0.01em",
  ...safeTextStyle,
};

export const listCardStyle: CSSProperties = {
  overflow: "hidden",
  borderRadius: "18px",
  background: "var(--configuracoes-card-bg, rgba(255,255,255,0.09))",
  border: "1px solid var(--configuracoes-border, rgba(255,255,255,0.045))",
};

export const rowBaseStyle: CSSProperties = {
  width: "100%",
  minHeight: "58px",
  display: "grid",
  gridTemplateColumns: "34px minmax(0, 1fr) auto 22px",
  alignItems: "center",
  gap: "9px",
  padding: "8px 12px",
  boxSizing: "border-box",
  border: "0",
  borderBottom: "1px solid var(--configuracoes-border, rgba(255,255,255,0.065))",
  background: "transparent",
  color: "inherit",
  fontFamily: "inherit",
  textAlign: "left",
  textDecoration: "none",
  cursor: "pointer",
};

export const rowButtonStyle: CSSProperties = {
  ...rowBaseStyle,
};

export const rowLinkStyle: CSSProperties = {
  ...rowBaseStyle,
};

export const rowStaticStyle: CSSProperties = {
  ...rowBaseStyle,
  cursor: "default",
};

export const rowIconStyle: CSSProperties = {
  width: "32px",
  height: "32px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--configuracoes-text-secondary, rgba(255,255,255,0.78))",
  flex: "0 0 auto",
};

export const rowTextBoxStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  minWidth: 0,
};

export const rowTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "16px",
  lineHeight: 1.1,
  fontWeight: 760,
  letterSpacing: "-0.02em",
  ...safeTextStyle,
};

export const rowTitleDangerStyle: CSSProperties = {
  ...rowTitleStyle,
  color: "var(--configuracoes-danger-text, #FCA5A5)",
};

export const rowSubtitleStyle: CSSProperties = {
  color: "var(--configuracoes-text-secondary, rgba(255,255,255,0.52))",
  fontSize: "12px",
  lineHeight: 1.22,
  fontWeight: 520,
  ...safeTextStyle,
};

export const rowRightStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-end",
  minWidth: 0,
};

export const rowValueStyle: CSSProperties = {
  color: "var(--configuracoes-text-secondary, rgba(255,255,255,0.56))",
  fontSize: "13px",
  lineHeight: 1,
  fontWeight: 650,
  whiteSpace: "nowrap",
};

export const rowValueDangerStyle: CSSProperties = {
  ...rowValueStyle,
  color: "var(--configuracoes-danger-text, #FCA5A5)",
};

export const rowChevronStyle: CSSProperties = {
  width: "22px",
  height: "22px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--configuracoes-text-secondary, rgba(255,255,255,0.46))",
};

export const inputRowStyle: CSSProperties = {
  width: "100%",
  minHeight: "76px",
  display: "grid",
  gridTemplateColumns: "40px minmax(0, 1fr)",
  alignItems: "center",
  gap: "10px",
  padding: "12px 14px",
  boxSizing: "border-box",
  borderBottom: "1px solid var(--configuracoes-border, rgba(255,255,255,0.065))",
};

export const inputTextBoxStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
};

export const inputLabelStyle: CSSProperties = {
  color: "var(--configuracoes-text-secondary, rgba(255,255,255,0.60))",
  fontSize: "12px",
  lineHeight: 1,
  fontWeight: 880,
  textTransform: "uppercase",
  letterSpacing: "0.03em",
};

export const inputStyle: CSSProperties = {
  width: "100%",
  border: "0",
  outline: "none",
  background: "transparent",
  color: "var(--historietas-input-text, #FFFFFF)",
  fontSize: "17px",
  lineHeight: 1.2,
  fontWeight: 760,
  fontFamily: "inherit",
  padding: 0,
  minWidth: 0,
};

export const inputHelperStyle: CSSProperties = {
  color: "var(--configuracoes-text-secondary, rgba(255,255,255,0.46))",
  fontSize: "12px",
  lineHeight: 1.25,
  fontWeight: 620,
  ...safeTextStyle,
};

export const inputErrorStyle: CSSProperties = {
  ...inputHelperStyle,
  color: "var(--configuracoes-danger-text, #FCA5A5)",
};
