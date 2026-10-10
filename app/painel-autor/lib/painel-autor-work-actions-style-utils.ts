import type { CSSProperties } from "react";
import { safeTextStyle } from "./painel-autor-desktop-header-style-utils";

export const actionsGridStyle: CSSProperties = {
  display: "grid",
  gap: 0,
  borderRadius: 0,
  border: "none",
  background: "transparent",
  overflow: "hidden",
};

export const openButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minHeight: "44px",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "16px",
  border: "none",
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

export const readButtonStyle: CSSProperties = {
  ...openButtonStyle,
  fontWeight: 900,
};

export const editButtonStyle: CSSProperties = {
  ...openButtonStyle,
};

export const chapterButtonStyle: CSSProperties = {
  ...openButtonStyle,
};

export const fileButtonStyle: CSSProperties = {
  ...openButtonStyle,
};

export const shareButtonStyle: CSSProperties = {
  ...openButtonStyle,
};

export const deleteButtonStyle: CSSProperties = {
  ...openButtonStyle,
  color: "var(--historietas-danger-button-text, #FFFFFF)",
};

export const workCardDotsButtonStyle: CSSProperties = {
  position: "absolute",
  right: "8px",
  bottom: "8px",
  zIndex: 4,
  width: "24px",
  height: "24px",
  border: "none",
  borderRadius: 0,
  background: "transparent",
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1,
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  margin: 0,
  textShadow: "none",
};
