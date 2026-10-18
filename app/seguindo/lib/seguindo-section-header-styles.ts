import type { CSSProperties } from "react";
import { safeTextStyle } from "./seguindo-surface-styles";

export const sectionStyle: CSSProperties = {
  marginTop: "18px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

export const desktopSectionStyle: CSSProperties = {
  ...sectionStyle,
  width: "min(980px, 100%)",
  margin: "24px auto 0",
};

export const sectionHeaderStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  gridTemplateColumns: "auto auto",
  alignItems: "center",
  justifyContent: "center",
  columnGap: "11px",
  marginBottom: "10px",
  padding: "4px 0",
  borderRadius: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
  textAlign: "center"
};

export const desktopSectionHeaderStyle: CSSProperties = {
  ...sectionHeaderStyle,
  width: "100%",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  justifyContent: "stretch",
  columnGap: "14px",
  margin: "0 auto 14px",
  padding: "2px 0",
  textAlign: "left",
};


export const sectionHeaderTextStyle: CSSProperties = {
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  minWidth: 0,
  maxWidth: "100%",
  textAlign: "center",
};

export const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-accent, #F97316)",
  fontSize: "clamp(24px, 6vw, 30px)",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  textAlign: "center",
  paddingBottom: "2px",
  maxWidth: "100%",
  textTransform: "none",
  ...safeTextStyle
};

export const sectionCounterStyle: CSSProperties = {
  position: "static",
  width: "42px",
  height: "42px",
  padding: 0,
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-seguindo-surface, #0A0A0A)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 950,
  boxShadow: "none",
  zIndex: 2,
};
