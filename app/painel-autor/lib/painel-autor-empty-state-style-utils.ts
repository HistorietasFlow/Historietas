import type { CSSProperties } from "react";
import { safeTextStyle } from "./painel-autor-desktop-header-style-utils";

const themeGradient = "linear-gradient(90deg, var(--historietas-accent, #FFFFFF) 0%, var(--historietas-secondary, #A1A1AA) 100%)";

export const emptyMiniBoxStyle: CSSProperties = {
  marginTop: "18px",
  padding: "18px",
  borderRadius: "20px",
  background: "var(--historietas-painel-card-bg, rgba(4, 0, 10, 0.72))",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "14px",
  fontWeight: 800,
  lineHeight: 1.6,
  display: "grid",
  gap: "10px",
  minWidth: 0,
  boxShadow: "none",
};

export const emptyMiniTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "18px",
  lineHeight: 1.1,
  fontWeight: 950,
  letterSpacing: "-0.035em",
  ...safeTextStyle,
};

export const emptyMiniTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "13px",
  lineHeight: 1.5,
  fontWeight: 750,
  ...safeTextStyle,
};

export const emptyMiniButtonStyle: CSSProperties = {
  width: "fit-content",
  minHeight: "34px",
  padding: "0 14px",
  borderRadius: "999px",
  background: themeGradient,
  border: "0",
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
};
