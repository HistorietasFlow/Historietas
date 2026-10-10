import type { CSSProperties } from "react";
import { safeTextStyle } from "./painel-autor-desktop-header-style-utils";

export const sheetStatsRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  padding: "8px 22px 14px",
};

export const sheetStatInlineStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
  minWidth: 0,
  color: "#FFFFFF",
};

export const sheetStatIconStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "14px",
  lineHeight: 1,
  fontWeight: 900,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  ...safeTextStyle,
};

export const sheetStatHeartIconStyle: CSSProperties = {
  ...sheetStatIconStyle,
  color: "var(--historietas-painel-heart-icon, #F43F5E)",
};

export const sheetStatValueStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "14px",
  lineHeight: 1,
  fontWeight: 950,
  ...safeTextStyle,
};
