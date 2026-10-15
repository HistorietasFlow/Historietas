import type { CSSProperties } from "react";
import { safeTextStyle } from "./home-card-style-primitives";

export const pageDecorationLayerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  pointerEvents: "none",
  zIndex: 0,
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
  opacity: 0,
};

export const heroDecorationLayerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  pointerEvents: "none",
  zIndex: 0,
};

// Teste: identidade tipográfica trazida da página Lista.
// Mantém os tamanhos e o layout próprios da Home.
export const listaPageTitleTypographyStyle: CSSProperties = {
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 900,
  letterSpacing: "-0.035em",
};

export const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "clip",
  background:
    "var(--historietas-bg-start, #000000)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

export const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(820px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  boxSizing: "border-box",
  minWidth: 0,
};

export const navStyle: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 30,
  background: "#000000",
  borderBottom: "0",
  boxShadow: "none",
  maxWidth: "100vw",
  overflowX: "hidden",
};


export const desktopNavStyle: CSSProperties = {
  ...navStyle,
  background: "#111113",
  borderBottom: "0",
  boxShadow: "none",
  overflow: "visible",
};
export const mobileNavStyle: CSSProperties = {
  ...navStyle,
  background: "#000000",
  borderBottom: "0",
  boxShadow: "none",
  overflow: "visible",
};

export const navInnerStyle: CSSProperties = {
  width: "min(820px, calc(100% - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
  padding: "14px 0 12px",
  boxSizing: "border-box",
  minWidth: 0,
};

export const navTopRowStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "14px",
  flexWrap: "wrap",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

export const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1760px, calc(100% - 48px))",
};

export const desktopNavInnerStyle: CSSProperties = {
  width: "min(1760px, calc(100% - 48px))",
  maxWidth: "100%",
  minHeight: "70px",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr) minmax(176px, 360px) auto",
  alignItems: "center",
  gap: "clamp(12px, 1.45vw, 26px)",
  padding: "0",
  boxSizing: "border-box",
  minWidth: 0,
};

export const desktopLogoStyle: CSSProperties = {
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "25px",
  ...listaPageTitleTypographyStyle,
  display: "flex",
  alignItems: "center",
  gap: "4px",
  flex: "0 0 auto",
  minWidth: 0,
  ...safeTextStyle,
};

export const desktopLogoMarkStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#08080A",
  color: "#FFFFFF",
  fontSize: "20px",
  fontWeight: 950,
  letterSpacing: 0,
  flex: "0 0 auto",
  border: "1px solid rgba(255,255,255,0.18)",
  boxShadow: "none",
};

export const desktopLogoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background: "none",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  textShadow: "none",
};

export const logoStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "25px",
  ...listaPageTitleTypographyStyle,
  display: "flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "min(100%, calc(100% - 96px))",
  ...safeTextStyle,
};

export const logoMarkStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#000000",
  color: "#FFFFFF",
  fontSize: "19px",
  fontWeight: 950,
  letterSpacing: 0,
  flex: "0 0 auto",
  border: "1px solid rgba(255,255,255,0.22)",
  boxShadow: "none",
};

export const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "none",
};

export const navIconsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flex: "0 0 auto",
  maxWidth: "100%",
};

export const mobileHeaderSearchAreaStyle: CSSProperties = {
  position: "absolute",
  zIndex: 30,
  top: "50%",
  left: "158px",
  right: "36px",
  width: "auto",
  minWidth: 0,
  height: "34px",
  transform: "translateY(-50%)",
};

export const mobileHeaderSearchInputStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minWidth: 0,
  height: "34px",
  borderRadius: "999px",
  border: "none",
  background: "#000000",
  color: "#FFFFFF",
  padding: "0 10px",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "13px",
  fontWeight: 700,
  boxSizing: "border-box",
  boxShadow: "none",
};







export const mobileSearchToggleStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: 0,
  border: 0,
  background: "transparent",
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  fontSize: "15px",
  cursor: "pointer",
  flex: "0 0 auto",
  boxShadow: "none",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
  WebkitAppearance: "none",
  appearance: "none",
};

export const mobileSearchToggleActiveStyle: CSSProperties = {
  ...mobileSearchToggleStyle,
  border: 0,
  background: "transparent",
  color: "#FFFFFF",
  boxShadow: "none",
  outline: "none",
};


export const desktopMenuStyle: CSSProperties = {
  display: "flex",
  alignItems: "stretch",
  gap: "clamp(15px, 1.15vw, 24px)",
  minWidth: 0,
  maxWidth: "100%",
  height: "70px",
  overflowX: "auto",
  overflowY: "hidden",
  padding: 0,
  scrollbarWidth: "none",
};

export const desktopInlineSearchAreaStyle: CSSProperties = {
  position: "relative",
  zIndex: 30,
  width: "100%",
  minWidth: 0,
  maxWidth: "360px",
  height: "40px",
  display: "flex",
  alignItems: "center",
};







export const desktopLinkStyle: CSSProperties = {
  position: "relative",
  color: "#C5C5C8",
  textDecoration: "none",
  fontSize: "13.5px",
  fontWeight: 700,
  lineHeight: 1,
  whiteSpace: "nowrap",
  flex: "0 0 auto",
  height: "70px",
  padding: "0",
  display: "inline-flex",
  alignItems: "center",
  borderBottom: "2px solid transparent",
  background: "transparent",
  borderRadius: 0,
  transition: "color 160ms ease, border-color 160ms ease",
};

export const desktopActiveLinkStyle: CSSProperties = {
  ...desktopLinkStyle,
  color: "#FFFFFF",
  borderBottomColor: "#FFFFFF",
};

export const desktopInputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  height: "40px",
  borderRadius: "6px",
  border: "0",
  background: "#1B1B1E",
  color: "#FFFFFF",
  padding: "0 13px 0 40px",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "13.5px",
  fontWeight: 650,
  boxSizing: "border-box",
  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
};

export const desktopSearchIconStyle: CSSProperties = {
  position: "absolute",
  zIndex: 1,
  left: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  color: "#A5A5AA",
  pointerEvents: "none",
};

export const desktopHeaderActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "4px",
  flex: "0 0 auto",
};

export const desktopHeaderIconLinkStyle: CSSProperties = {
  position: "relative",
  width: "40px",
  height: "40px",
  borderRadius: "6px",
  border: 0,
  background: "transparent",
  color: "#D8D8DA",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  transition: "background 160ms ease, color 160ms ease",
};

export const desktopNotificationCountBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "2px",
  right: "1px",
  minWidth: "17px",
  height: "17px",
  padding: "0 4px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "2px solid #111113",
  background: "#EF4444",
  color: "#FFFFFF",
  fontSize: "9px",
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: "-0.03em",
  boxSizing: "border-box",
  pointerEvents: "none",
};

export const desktopProfileLinkStyle: CSSProperties = {
  width: "44px",
  height: "44px",
  marginLeft: "2px",
  borderRadius: "6px",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#FFFFFF",
  background: "transparent",
  transition: "background 160ms ease",
};

export const desktopProfileAvatarStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#08080A",
  color: "#FFFFFF",
  border: "1px solid rgba(255,255,255,0.22)",
  boxSizing: "border-box",
};
