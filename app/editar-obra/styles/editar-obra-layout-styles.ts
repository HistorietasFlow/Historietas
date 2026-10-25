import type { CSSProperties } from "react";
import { safeTextStyle } from "./editar-obra-shared-styles";

export const mobileTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(340px, 48vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  WebkitMaskImage: "none",
  maskImage: "none",
  opacity: 0,
};

export const desktopTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(620px, 68vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  WebkitMaskImage: "none",
  maskImage: "none",
  opacity: 0,
};

export const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  background: "var(--historietas-editar-obra-bg-page, #000000)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

export const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(900px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "14px 0 18px",
  boxSizing: "border-box",
  minWidth: 0,
};

const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "14px",
  minWidth: 0,
};

export const titleHeaderStyle: CSSProperties = {
  ...topStyle,
  justifyContent: "center",
  flexWrap: "nowrap",
  marginTop: 0,
  marginBottom: "14px",
  textAlign: "center",
};

export const desktopTitleHeaderStyle: CSSProperties = {
  ...titleHeaderStyle,
  position: "relative",
  justifyContent: "center",
  minHeight: "48px",
  marginBottom: "24px",
  paddingRight: 0,
  textAlign: "center",
};

export const headerTitleLinkStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "25px",
  fontWeight: 950,
  letterSpacing: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "visible",
  flex: "0 1 auto",
  ...safeTextStyle,
};

export const desktopHeaderTitleLinkStyle: CSSProperties = {
  ...headerTitleLinkStyle,
  width: "100%",
  justifyContent: "center",
  textAlign: "center",
  fontSize: "29px",
};

export const headerTitleTextStyle: CSSProperties = {
  display: "inline-block",
  marginLeft: "-1px",
  paddingRight: "0.2em",
  paddingBottom: "0.04em",
  whiteSpace: "nowrap",
  overflow: "visible",
  fontSize: "25px",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: 0,
  wordSpacing: "normal",
  background: "none",
  WebkitBackgroundClip: "initial",
  backgroundClip: "initial",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  textShadow: "none",
};

export const desktopHeaderTitleTextStyle: CSSProperties = {
  ...headerTitleTextStyle,
  fontSize: "29px",
  letterSpacing: "-0.035em",
};

export const errorBoxStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  marginTop: "12px",
  padding: "11px",
  borderRadius: "16px",
  background: "var(--historietas-editar-obra-danger-bg, rgba(239,68,68,0.075))",
  border: "1px solid var(--historietas-editar-obra-danger-border, rgba(239,68,68,0.18))",
  color: "var(--historietas-editar-obra-danger-text, #FFFFFF)",
  minWidth: 0,
  boxSizing: "border-box",
  overflow: "hidden",
};

export const errorTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-editar-obra-danger-text, #FFFFFF)",
  fontSize: "18px",
  fontWeight: 950,
  letterSpacing: "-0.045em",
  ...safeTextStyle,
};

export const errorTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-editar-obra-danger-text-soft, #FECACA)",
  fontSize: "12px",
  lineHeight: 1.55,
  fontWeight: 850,
  ...safeTextStyle,
};

export const mainGridStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
  minWidth: 0,
  maxWidth: "100%",
};

export const formStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
  background: "transparent",
  border: "0",
  borderRadius: 0,
  padding: 0,
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
};

export const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  maxWidth: "100%",
  padding: "30px 0 72px",
};

export const desktopMainGridStyle: CSSProperties = {
  ...mainGridStyle,
  gridTemplateColumns: "minmax(0, 760px)",
  justifyContent: "center",
  alignItems: "start",
  gap: "28px",
};

export const desktopFormStyle: CSSProperties = {
  ...formStyle,
  gridTemplateColumns: "minmax(0, 1fr)",
  alignItems: "start",
  width: "100%",
  maxWidth: "760px",
  padding: 0,
  borderRadius: 0,
  gap: "16px",
  overflow: "visible",
};
