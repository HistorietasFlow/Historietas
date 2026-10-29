import type { CSSProperties } from "react";

export const searchSectionStyle: CSSProperties = {
  maxWidth: "980px",
  margin: "0 auto 10px",
  display: "grid",
  gap: "5px",
  minWidth: 0,
  boxSizing: "border-box",
};

export const searchShellStyle: CSSProperties = {
  width: "100%",
  minHeight: "48px",
  borderRadius: "18px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#000000",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "0 16px",
  boxSizing: "border-box",
  boxShadow: "none",
};

export const searchIconStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 700,
  flex: "0 0 auto",
};

export const searchInputStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minWidth: 0,
  height: "46px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "15px",
  fontWeight: 850,
  letterSpacing: "-0.035em",
  boxSizing: "border-box",
};

export const messageStyle: CSSProperties = {
  maxWidth: "980px",
  margin: "0 auto 10px",
  color: "var(--historietas-top5-message, #FDE68A)",
  fontSize: "12px",
  fontWeight: 800,
};

export const loadingStyle: CSSProperties = {
  margin: "18px 0 0",
  color: "rgba(255,255,255,0.72)",
  fontSize: "12px",
  fontWeight: 800,
  textAlign: "center",
};

export const noticeStyle: CSSProperties = {
  maxWidth: "980px",
  margin: "0 auto 12px",
  padding: "12px",
  borderRadius: "18px",
  background: "var(--historietas-top5-orange-soft, rgba(249,115,22,0.10))",
  border: "1px solid var(--historietas-top5-orange-border, rgba(249,115,22,0.20))",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

export const noticeTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
};

export const noticeTextStyle: CSSProperties = {
  color: "rgba(255,255,255,0.68)",
  fontSize: "12px",
  lineHeight: 1.35,
  fontWeight: 650,
};

export const loginButtonStyle: CSSProperties = {
  alignSelf: "flex-start",
  marginTop: "3px",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "#FFFFFF",
  color: "#0A0A0A",
  fontSize: "12px",
  fontWeight: 900,
  textDecoration: "none",
};
