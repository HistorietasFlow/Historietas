import type { CSSProperties } from "react";
import { safeTextStyle } from "./seguindo-surface-styles";

export const desktopSeguindoHeaderTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "32px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  ...safeTextStyle,
};

export const desktopSeguindoHeaderActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "10px",
  minWidth: 0,
};
