import type { CSSProperties } from "react";

export const cardStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  gridTemplateColumns: "minmax(104px, 0.36fr) minmax(0, 1fr)",
  alignItems: "start",
  gap: "6px",
  padding: "6px",
  borderRadius: "22px",
  overflow: "hidden",
  background: "var(--historietas-seguindo-panel, rgba(4, 0, 10, 0.72))",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box"
};

export const desktopCardStyle: CSSProperties = {
  ...cardStyle,
  gridTemplateColumns: "104px minmax(0, 1fr)",
  gridTemplateRows: "none",
  alignItems: "stretch",
  gap: "11px",
  minHeight: "150px",
  width: "100%",
  padding: "7px",
  borderRadius: "20px",
  boxShadow: "none",
};

export const coverStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  height: "108px",
  minHeight: "108px",
  maxWidth: "100%",
  alignSelf: "start",
  boxSizing: "border-box",
  borderRadius: "16px",
  background: "var(--historietas-seguindo-bg-deep, #050505)",
  backgroundImage: "linear-gradient(135deg, var(--historietas-seguindo-surface, #0A0A0A) 0%, var(--historietas-seguindo-bg-deep, #050505) 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  overflow: "hidden",
  border: "none",
  borderBottom: "none",
  minWidth: 0,
  boxShadow: "none",
};

export const desktopCoverStyle: CSSProperties = {
  ...coverStyle,
  width: "104px",
  height: "100%",
  minHeight: "136px",
  maxHeight: "150px",
  alignSelf: "stretch",
  borderRadius: "15px",
  borderBottom: "none",
};
