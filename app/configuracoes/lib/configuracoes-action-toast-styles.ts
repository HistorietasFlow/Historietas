import type { CSSProperties } from "react";
import { safeTextStyle } from "./configuracoes-settings-primitives-styles";

export const actionToastBaseStyle: CSSProperties = {
  position: "fixed",
  right: "16px",
  bottom: "16px",
  zIndex: 1400,
  width: "min(390px, calc(100vw - 32px))",
  boxSizing: "border-box",
  display: "grid",
  gridTemplateColumns: "34px minmax(0, 1fr) 32px",
  alignItems: "start",
  gap: "10px",
  padding: "13px",
  borderRadius: "16px",
  boxShadow: "0 20px 60px rgba(0,0,0,0.52)",
  backdropFilter: "blur(14px)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

export const actionToastSuccessStyle: CSSProperties = {
  ...actionToastBaseStyle,
  background: "rgba(20,83,45,0.94)",
  border: "1px solid rgba(74,222,128,0.36)",
  color: "#DCFCE7",
};

export const actionToastWarningStyle: CSSProperties = {
  ...actionToastBaseStyle,
  background: "rgba(113,63,18,0.95)",
  border: "1px solid rgba(251,191,36,0.40)",
  color: "#FEF3C7",
};

export const actionToastErrorStyle: CSSProperties = {
  ...actionToastBaseStyle,
  background: "rgba(127,29,29,0.95)",
  border: "1px solid rgba(248,113,113,0.40)",
  color: "#FEE2E2",
};

export const actionToastIconStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.12)",
  color: "inherit",
};

export const actionToastTextBoxStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "4px",
  paddingTop: "1px",
};

export const actionToastTitleStyle: CSSProperties = {
  color: "inherit",
  fontSize: "13px",
  lineHeight: 1.1,
  fontWeight: 900,
};

export const actionToastMessageStyle: CSSProperties = {
  color: "inherit",
  fontSize: "12px",
  lineHeight: 1.4,
  fontWeight: 650,
  opacity: 0.94,
  ...safeTextStyle,
};

export const actionToastCloseStyle: CSSProperties = {
  width: "32px",
  height: "32px",
  border: 0,
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.10)",
  color: "inherit",
  fontFamily: "inherit",
  fontSize: "22px",
  lineHeight: 1,
  cursor: "pointer",
};
