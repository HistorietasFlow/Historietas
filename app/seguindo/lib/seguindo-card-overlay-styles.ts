import type { CSSProperties } from "react";
import { safeTextStyle } from "./seguindo-surface-styles";

export const overlayStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.26) 100%)",
};

export const genreStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "var(--historietas-seguindo-panel, rgba(4, 0, 10, 0.72))",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "9px",
  fontWeight: 900,
  ...safeTextStyle,
};


export const contentStyle: CSSProperties = {
  padding: 0,
  display: "grid",
  alignContent: "start",
  gap: "5px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box"
};

export const desktopContentStyle: CSSProperties = {
  ...contentStyle,
  minHeight: "136px",
  padding: "5px 9px 5px 0",
  gap: "6px",
  alignContent: "start",
};
