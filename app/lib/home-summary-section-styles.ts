import type { CSSProperties } from "react";
import { safeTextStyle } from "./home-card-style-primitives";

export const summaryStripStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
  alignItems: "center",
  gap: "0",
  marginTop: "14px",
  padding: "0",
  borderRadius: "0",
  background: "transparent",
  border: "0",
  boxShadow: "none",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
  overflow: "visible",
};

export const desktopSummaryStripStyle: CSSProperties = {
  ...summaryStripStyle,
  gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
  gap: "0",
  padding: "0",
  borderRadius: "0",
};

export const summaryItemStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "42px",
  padding: "8px 10px",
  maxWidth: "100%",
  minWidth: 0,
  borderRadius: "0",
  background: "transparent",
  border: "0",
  textDecoration: "none",
  color: "#FFFFFF",
  boxSizing: "border-box",
};

export const summaryDividerLineStyle: CSSProperties = {
  width: "1px",
  height: "30px",
  alignSelf: "center",
  justifySelf: "center",
  background: "rgba(255,255,255,0.20)",
  borderRadius: "999px",
};

export const summaryNumberStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "17px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};


export const sectionStyle: CSSProperties = {
  marginTop: "24px",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

export const lastSectionStyle: CSSProperties = {
  marginTop: "24px",
  paddingBottom: "22px",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

export const desktopSectionStyle: CSSProperties = {
  ...sectionStyle,
  marginTop: "30px",
};

export const desktopLastSectionStyle: CSSProperties = {
  ...lastSectionStyle,
  marginTop: "30px",
  paddingBottom: "76px",
};
