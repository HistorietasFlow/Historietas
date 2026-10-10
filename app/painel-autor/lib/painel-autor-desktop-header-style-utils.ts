import type { CSSProperties } from "react";

export const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

export const desktopCommunityTopStyle: CSSProperties = {
  width: "100%",
  minHeight: "58px",
  marginBottom: "18px",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "24px",
  minWidth: 0,
  boxSizing: "border-box",
};

export const desktopCommunityTopTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "32px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  ...safeTextStyle,
};

export const desktopCommunityTopActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "10px",
  minWidth: 0,
};

export const desktopCommunitySearchShellStyle: CSSProperties = {
  position: "relative",
  width: "min(390px, 34vw)",
  minWidth: "230px",
  height: "42px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.045)",
  display: "flex",
  alignItems: "center",
  overflow: "hidden",
  boxSizing: "border-box",
};

export const desktopCommunitySearchIconStyle: CSSProperties = {
  position: "absolute",
  left: "13px",
  top: "50%",
  transform: "translateY(-50%)",
  color: "rgba(255,255,255,0.56)",
  pointerEvents: "none",
};

export const desktopCommunitySearchInputStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  height: "100%",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  outline: "none",
  padding: "0 14px 0 42px",
  fontFamily: "inherit",
  fontSize: "13px",
  fontWeight: 800,
  boxSizing: "border-box",
};

export const desktopCommunityFilterButtonStyle: CSSProperties = {
  minHeight: "42px",
  padding: "0 16px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "transparent",
  color: "#FFFFFF",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  fontFamily: "inherit",
  fontSize: "12px",
  fontWeight: 900,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
