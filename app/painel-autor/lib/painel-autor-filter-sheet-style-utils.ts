import type { CSSProperties } from "react";
import { safeTextStyle } from "./painel-autor-desktop-header-style-utils";

export const filterSheetOverlayStyle: CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  height: "100dvh",
  zIndex: 9998,
  background: "rgba(0,0,0,0.62)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  padding: 0,
  boxSizing: "border-box",
  overflow: "hidden",
  overscrollBehavior: "none",
  touchAction: "none",
};

export const filterSheetStyle: CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: 0,
  transform: "translateX(-50%)",
  zIndex: 9999,
  width: "min(820px, 100%)",
  maxHeight: "calc(100dvh - 116px)",
  display: "grid",
  gap: "0",
  padding: "8px 0 calc(18px + env(safe-area-inset-bottom))",
  borderRadius: "24px 24px 0 0",
  background: "var(--historietas-painel-bg, #000000)",
  border: "none",
  borderBottom: "0",
  overflowY: "auto",
  overflowX: "hidden",
  overscrollBehavior: "none",
  boxShadow: "0 -18px 50px rgba(0,0,0,0.38)",
  boxSizing: "border-box",
  WebkitOverflowScrolling: "touch",
  color: "#FFFFFF",
};

export const desktopFilterSheetStyle: CSSProperties = {
  ...filterSheetStyle,
  bottom: "24px",
  width: "min(560px, calc(100vw - 24px))",
  maxWidth: "560px",
  maxHeight: "82vh",
  borderRadius: "24px",
  margin: 0,
  paddingBottom: "18px",
};

export const filterSheetHandleStyle: CSSProperties = {
  display: "block",
  width: "72px",
  height: "5px",
  borderRadius: "999px",
  background: "rgba(244,244,245,0.62)",
  margin: "0 auto 14px",
};

export const filterSheetTitleStyle: CSSProperties = {
  display: "block",
  margin: "0 0 12px",
  padding: 0,
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1.1,
  fontWeight: 950,
  textAlign: "center",
  letterSpacing: "-0.04em",
  ...safeTextStyle,
};

export const filterSheetContentStyle: CSSProperties = {
  display: "grid",
  gap: 0,
};

export const filterSheetSectionLabelStyle: CSSProperties = {
  display: "block",
  margin: 0,
  padding: "11px 30px 5px",
  color: "rgba(244,244,245,0.56)",
  fontSize: "11px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

export function criarFilterSheetOptionStyle(ativo: boolean): CSSProperties {
  return {
    appearance: "none",
    WebkitAppearance: "none",
    width: "100%",
    minHeight: "44px",
    border: "none",
    background: "transparent",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    padding: "0 30px",
    boxSizing: "border-box",
    fontSize: "18px",
    lineHeight: 1,
    fontWeight: ativo ? 900 : 650,
    letterSpacing: "-0.035em",
    fontFamily: "inherit",
    cursor: "pointer",
    textAlign: "left",
    ...safeTextStyle,
  };
}

export function criarFilterSheetRadioStyle(ativo: boolean): CSSProperties {
  return {
    width: "23px",
    height: "23px",
    borderRadius: "999px",
    border: ativo
      ? "2px solid #FFFFFF"
      : "2.5px solid rgba(161,161,170,0.72)",
    background: ativo ? "#FFFFFF" : "transparent",
    color: ativo ? "#111111" : "transparent",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    flex: "0 0 auto",
    fontSize: "15px",
    lineHeight: 1,
    fontWeight: 900,
  };
}

export const filterSheetClearDividerStyle: CSSProperties = {
  display: "none",
};

export const filterSheetClearStyle: CSSProperties = {
  appearance: "none",
  width: "calc(100% - 60px)",
  justifySelf: "center",
  minHeight: "46px",
  margin: "12px 30px 14px",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "999px",
  background: "transparent",
  color: "#FFFFFF",
  fontSize: "15px",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  textAlign: "center",
  ...safeTextStyle,
};
