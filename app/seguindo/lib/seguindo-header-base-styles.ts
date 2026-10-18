import type { CSSProperties } from "react";

export const seguindoHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "nowrap",
  marginBottom: "10px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

export const desktopSeguindoHeaderStyle: CSSProperties = {
  width: "100%",
  minHeight: "58px",
  margin: "0 0 18px",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "24px",
  minWidth: 0,
  boxSizing: "border-box",
  position: "relative",
  zIndex: 2,
};
