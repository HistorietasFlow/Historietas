import type { CSSProperties } from "react";
import { safeTextStyle } from "./painel-autor-desktop-header-style-utils";

export const workTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "13px",
  lineHeight: 1.06,
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 500,
  letterSpacing: "-0.01em",
  textShadow: "none",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  minWidth: 0,
  maxWidth: "100%",
  ...safeTextStyle,
};

export const authorStyle: CSSProperties = {
  color: "rgba(255,255,255,0.76)",
  textDecoration: "none",
  fontSize: "12px",
  lineHeight: 1.2,
  fontWeight: 850,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  textAlign: "center",
  maxWidth: "100%",
  ...safeTextStyle,
};

export const workMetaLineStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "10px",
  color: "#FFFFFF",
  fontSize: "9px",
  lineHeight: 1.18,
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 850,
  letterSpacing: "-0.01em",
  textShadow: "none",
  overflow: "hidden",
  whiteSpace: "nowrap",
  minWidth: 0,
};

export const workCardHeartMetaStyle: CSSProperties = {
  color: "var(--historietas-painel-heart-meta, #FFFFFF)",
  fontWeight: 950,
};

export const workCardCommentMetaStyle: CSSProperties = {
  color: "#FFFFFF",
  fontWeight: 950,
};
