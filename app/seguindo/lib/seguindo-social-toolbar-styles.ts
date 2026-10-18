import type { CSSProperties } from "react";

export const socialToolbarStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  margin: "10px 0 18px",
  padding: "0 4px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

export const desktopSocialToolbarStyle: CSSProperties = {
  ...socialToolbarStyle,
  width: "min(980px, 100%)",
  margin: "0 auto 28px",
  padding: 0,
  gap: "14px",
};

export const socialTabsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  alignItems: "end",
  minWidth: 0,
  borderBottom: "1px solid rgba(255,255,255,0.10)",
};

export const socialTabStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  minHeight: "42px",
  border: "none",
  borderBottom: "2px solid transparent",
  background: "transparent",
  color: "rgba(212,212,216,0.68)",
  fontFamily: "inherit",
  fontSize: "13px",
  fontWeight: 950,
  cursor: "pointer",
  textAlign: "center",
  padding: "0 8px 9px",
  boxSizing: "border-box",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

export const socialTabActiveStyle: CSSProperties = {
  ...socialTabStyle,
  color: "#FFFFFF",
  borderBottom: "2px solid rgba(255,255,255,0.92)",
};

export const mobileThreeSocialTabStyle: CSSProperties = {
  fontSize: "11px",
  letterSpacing: "-0.25px",
  padding: "0 1px 9px",
  overflow: "visible",
  textOverflow: "clip",
};

export const socialTabCountStyle: CSSProperties = {
  display: "inline",
  marginLeft: "5px",
  color: "inherit",
  fontSize: "inherit",
  fontWeight: 950,
};

export const mobileThreeSocialTabCountStyle: CSSProperties = {
  ...socialTabCountStyle,
  marginLeft: "3px",
};
