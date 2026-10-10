import type { CSSProperties } from "react";
import { safeTextStyle } from "./painel-autor-desktop-header-style-utils";

export const statsBoxStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "5px",
  marginTop: "0",
  alignItems: "stretch",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

export const statCardStyle: CSSProperties = {
  flex: "1 1 calc(25% - 5px)",
  borderRadius: "12px",
  background: "var(--historietas-painel-card-bg, rgba(4, 0, 10, 0.72))",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
  padding: "6px 4px",
  display: "grid",
  gap: "2px",
  alignContent: "center",
  justifyItems: "center",
  justifyContent: "center",
  textAlign: "center",
  minHeight: "43px",
  minWidth: 0,
  overflow: "hidden",
};

export const statNumberStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "15px",
  lineHeight: 1,
  fontWeight: 950,
  ...safeTextStyle,
};

export const statLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "7px",
  lineHeight: 1.15,
  fontWeight: 850,
  textAlign: "center",
  ...safeTextStyle,
};

export const studioControlsStyle: CSSProperties = {
  marginTop: "8px",
  display: "grid",
  gap: "5px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

export const studioClearButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.055)",
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 12px",
  boxShadow: "none",
  ...safeTextStyle,
};
