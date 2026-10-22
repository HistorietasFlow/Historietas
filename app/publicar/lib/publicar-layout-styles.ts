import type { CSSProperties } from "react";

export const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

export const pageDecorationLayerStyle: CSSProperties = {
  display: "none",
};

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
  maxWidth: "100%",
  overflowX: "hidden",
  background: "var(--historietas-publicar-bg-page, #000000)",
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

export const topStyle: CSSProperties = {
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
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  textShadow: "none",
};

export const desktopHeaderTitleTextStyle: CSSProperties = {
  ...headerTitleTextStyle,
  fontSize: "29px",
  letterSpacing: "-0.035em",
};

export const progressBoxStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "grid",
  gap: "8px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "0",
  minWidth: 0,
  width: "min(450px, 100%)",
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  boxShadow: "none",
};

export const progressTopStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "wrap",
  minWidth: 0,
};

export const progressLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 900,
  ...safeTextStyle,
};

export const progressNumberStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  ...safeTextStyle,
};

export const progressTrackStyle: CSSProperties = {
  height: "7px",
  overflow: "hidden",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  maxWidth: "100%",
};

export const progressFillStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background:
    "linear-gradient(90deg, var(--historietas-accent, var(--historietas-publicar-accent, #FFFFFF)) 0%, var(--historietas-secondary, var(--historietas-publicar-secondary, #A1A1AA)) 100%)",
  transition: "width 0.2s ease",
};

export const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  maxWidth: "100%",
  padding: "30px 0 72px",
};

export const desktopProgressBoxStyle: CSSProperties = {
  ...progressBoxStyle,
  gridColumn: "1 / -1",
  width: "100%",
  padding: 0,
};
