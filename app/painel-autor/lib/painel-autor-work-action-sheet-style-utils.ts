import type { CSSProperties } from "react";
import { safeTextStyle } from "./painel-autor-desktop-header-style-utils";

export const workActionSheetOverlayStyle: CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  height: "100dvh",
  zIndex: 9998,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  background: "rgba(0,0,0,0.68)",
  padding: 0,
  boxSizing: "border-box",
  overscrollBehavior: "none",
  touchAction: "none",
};

export const workActionSheetStyle: CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: 0,
  transform: "translateX(-50%)",
  width: "min(820px, 100%)",
  maxHeight: "calc(100dvh - 190px)",
  overflowX: "hidden",
  overflowY: "auto",
  overscrollBehavior: "contain",
  borderRadius: "24px 24px 0 0",
  background: "var(--historietas-painel-bg, #000000)",
  border: "none",
  borderBottom: "0",
  boxShadow: "0 -18px 50px rgba(0,0,0,0.38)",
  padding: "8px 0 calc(18px + env(safe-area-inset-bottom))",
  display: "grid",
  gap: 0,
  boxSizing: "border-box",
  touchAction: "none",
};

export const workActionSheetHandleStyle: CSSProperties = {
  width: "72px",
  height: "5px",
  borderRadius: "999px",
  background: "rgba(244,244,245,0.62)",
  justifySelf: "center",
  margin: "0 auto 12px",
};

export const workActionSheetHeaderStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "4px",
  minWidth: 0,
  padding: "0 24px 10px",
  boxSizing: "border-box",
  borderBottom: "none",
};

export const workActionSheetTextBlockStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "4px",
  minWidth: 0,
  width: "100%",
};

export const workActionSheetTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "21px",
  fontWeight: 950,
  lineHeight: 1.1,
  letterSpacing: "-0.04em",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  textAlign: "center",
  maxWidth: "100%",
  ...safeTextStyle,
};
