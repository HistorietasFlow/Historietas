import type { CSSProperties } from "react";
import { safeTextStyle } from "./painel-autor-desktop-header-style-utils";

export const sectionStyle: CSSProperties = {
  marginTop: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

export const worksGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  columnGap: "10px",
  rowGap: "14px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

export const workCardStyle: CSSProperties = {
  display: "grid",
  gap: 0,
  minWidth: 0,
  maxWidth: "100%",
  width: "100%",
  boxSizing: "border-box",
  overflow: "visible",
  position: "relative",
  border: "0",
  outline: "none",
  boxShadow: "none",
  background: "transparent",
  color: "#FFFFFF",
};

export const coverLinkStyle: CSSProperties = {
  display: "block",
  width: "100%",
  minWidth: 0,
  maxWidth: "100%",
  textDecoration: "none",
  textDecorationLine: "none",
  color: "#FFFFFF",
  border: "0",
  outline: "none",
  boxShadow: "none",
  background: "transparent",
  boxSizing: "border-box",
};

export const coverGlowStyle: CSSProperties = {
  display: "none",
};

export const workContentStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 2,
  display: "grid",
  gap: "4px",
  minWidth: 0,
  maxWidth: "100%",
  padding: "28px 42px 9px 10px",
  boxSizing: "border-box",
  color: "#FFFFFF",
};

export const statusRowStyle: CSSProperties = {
  position: "absolute",
  top: "8px",
  left: "8px",
  right: "8px",
  zIndex: 2,
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  alignItems: "center",
  minWidth: 0,
  pointerEvents: "none",
};

export const publishedStatusStyle: CSSProperties = {
  width: "fit-content",
  minHeight: "18px",
  maxWidth: "100%",
  padding: "0 6px",
  borderRadius: "999px",
  background: "var(--historietas-painel-status-bg, rgba(8,5,13,0.52))",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "#FFFFFF",
  fontSize: "8px",
  fontWeight: 950,
  lineHeight: 1,
  letterSpacing: "0.01em",
  textTransform: "none",
  textShadow: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  ...safeTextStyle,
};

export const draftStatusStyle: CSSProperties = {
  ...publishedStatusStyle,
  background: "var(--historietas-painel-status-bg, rgba(8,5,13,0.52))",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "#FFFFFF",
};
