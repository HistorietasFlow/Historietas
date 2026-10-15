import type { CSSProperties } from "react";
import {
  listaAuthorMetaTypographyStyle,
  listaWorkTitleTypographyStyle,
  safeTextStyle,
} from "./home-card-style-primitives";
export const desktopHeroStyle: CSSProperties = {
  marginTop: "-4px",
  minHeight: 0,
  borderRadius: 0,
  border: "none",
  boxShadow: "none",
  background: "transparent",
  overflow: "visible",
};

export const desktopHeroShellStyle: CSSProperties = {
  position: "relative",
  zIndex: 2,
  width: "100%",
  display: "grid",
  gridTemplateColumns: "minmax(350px, 1.03fr) minmax(0, 0.97fr)",
  alignItems: "center",
  gap: "clamp(34px, 4.5vw, 82px)",
  minHeight: "clamp(440px, 40vw, 590px)",
  padding: "clamp(18px, 2vw, 32px) 0",
  boxSizing: "border-box",
};

export const desktopHeroPosterFrameStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  maxWidth: "650px",
  height: "clamp(400px, 35vw, 530px)",
  minHeight: "400px",
  justifySelf: "start",
  padding: "5px",
  borderRadius: "28px",
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.08)",
  background:
    "linear-gradient(145deg, #050505 0%, #0B0B0D 58%, #000000 100%)",
  boxShadow:
    "0 24px 64px rgba(0,0,0,0.26), inset 0 0 0 1px rgba(255,255,255,0.025)",
  boxSizing: "border-box",
};

export const desktopHeroPosterGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, rgba(4, 0, 10, 0.02) 0%, rgba(4, 0, 10, 0.54) 100%)",
  pointerEvents: "none",
};




export const desktopHeroPosterTitleStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  color: "#FFFFFF",
  fontSize: "28px",
  lineHeight: 1.06,
  ...listaWorkTitleTypographyStyle,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

export const desktopHeroPosterStatusStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "fit-content",
  maxWidth: "100%",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "13px",
  fontWeight: 900,
  ...safeTextStyle,
};


export const heroGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, rgba(4, 0, 10, 0.18) 0%, #000000 100%)",
};


export const mobileHeroImageGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "transparent",
};

export const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  minHeight: "min(460px, 68vh)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  gap: "15px",
  padding: "24px 16px 22px",
  boxSizing: "border-box",
  maxWidth: "100%",
  minWidth: 0,
};

export const desktopHeroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 3,
  width: "100%",
  maxWidth: "650px",
  minWidth: 0,
  justifySelf: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "center",
  gap: "15px",
  padding: "clamp(8px, 1vw, 18px) clamp(12px, 1.5vw, 28px)",
  textAlign: "left",
  boxSizing: "border-box",
};


export const desktopHeroMetaStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
  maxWidth: "100%",
  minWidth: 0,
  color: "#D2D2D5",
  fontSize: "13.5px",
  fontWeight: 650,
  lineHeight: 1.25,
};

export const desktopHeroKickerStyle: CSSProperties = {
  color: "#D7D7DA",
  fontSize: "12px",
  fontWeight: 800,
  lineHeight: 1,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  textShadow: "0 2px 12px rgba(0,0,0,0.70)",
};

export const desktopHeroAuthorStyle: CSSProperties = {
  color: "#FFFFFF",
  fontWeight: 750,
  textShadow: "0 2px 12px rgba(0,0,0,0.62)",
  ...safeTextStyle,
};

export const desktopHeroMetaDividerStyle: CSSProperties = {
  width: "4px",
  height: "4px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.50)",
  flex: "0 0 auto",
};

export const desktopHeroGenreStyle: CSSProperties = {
  color: "#D2D2D5",
  textShadow: "0 2px 12px rgba(0,0,0,0.62)",
  ...safeTextStyle,
};

export const desktopHeroClassificationStyle: CSSProperties = {
  minHeight: 0,
  padding: 0,
  borderRadius: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-start",
  background: "transparent",
  border: "none",
  color: "#D2D2D5",
  fontSize: "13.5px",
  fontWeight: 650,
  lineHeight: 1.25,
  boxSizing: "border-box",
  textShadow: "0 2px 12px rgba(0,0,0,0.62)",
  ...safeTextStyle,
};


export const heroPillStyle: CSSProperties = {
  maxWidth: "100%",
  minHeight: "34px",
  padding: "8px 14px",
  borderRadius: "999px",
  background: "#000000",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  fontSize: "12.5px",
  fontWeight: 950,
  boxShadow: "none",
  textShadow: "0 1px 0 rgba(0,0,0,0.28)",
  ...safeTextStyle,
};

export const heroTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(34px, 11vw, 72px)",
  lineHeight: 0.96,
  ...listaWorkTitleTypographyStyle,
  maxWidth: "100%",
  textShadow:
    "0 1px 0 rgba(0,0,0,0.34), 0 2px 12px rgba(0,0,0,0.34)",
  ...safeTextStyle,
};

export const desktopHeroTitleStyle: CSSProperties = {
  ...heroTitleStyle,
  width: "100%",
  maxWidth: "700px",
  margin: 0,
  fontSize: "clamp(46px, 5.2vw, 78px)",
  lineHeight: 0.98,
  textAlign: "left",
  color: "#FFFFFF",
  textShadow:
    "0 2px 0 rgba(0,0,0,0.40), 0 8px 28px rgba(0,0,0,0.62)",
};

export const heroDescriptionStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "15px",
  ...listaAuthorMetaTypographyStyle,
  lineHeight: 1.55,
  maxWidth: "100%",
  textShadow:
    "0 1px 0 rgba(0,0,0,0.32), 0 2px 10px rgba(0,0,0,0.30)",
  ...safeTextStyle,
};

export const desktopHeroDescriptionStyle: CSSProperties = {
  ...heroDescriptionStyle,
  width: "100%",
  maxWidth: "620px",
  minHeight: 0,
  margin: 0,
  color: "#D5D5D8",
  fontSize: "15.5px",
  lineHeight: 1.58,
  display: "-webkit-box",
  WebkitLineClamp: 4,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
  textAlign: "left",
  textShadow: "0 2px 14px rgba(0,0,0,0.74)",
};


export const heroButtonsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(138px, 1fr))",
  gap: "10px",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

export const mobileHeroButtonsStyle: CSSProperties = {
  ...heroButtonsStyle,
  position: "absolute",
  left: "16px",
  right: "16px",
  bottom: "58px",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  alignSelf: "auto",
  width: "auto",
};

export const desktopHeroButtonsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "10px",
  width: "auto",
  maxWidth: "100%",
  marginTop: "5px",
  boxSizing: "border-box",
  minWidth: 0,
};

export const desktopHeroInitialButtonsStyle: CSSProperties = {
  ...desktopHeroButtonsStyle,
  flexWrap: "wrap",
};

export const desktopPrimaryButtonStyle: CSSProperties = {
  minWidth: "164px",
  minHeight: "50px",
  padding: "0 22px",
  borderRadius: "10px",
  border: "1px solid #FFFFFF",
  background: "#FFFFFF",
  color: "#08080A",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "14px",
  fontWeight: 850,
  lineHeight: 1.1,
  textAlign: "center",
  boxSizing: "border-box",
  boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
  cursor: "pointer",
  ...safeTextStyle,
};

export const desktopSecondaryButtonStyle: CSSProperties = {
  ...desktopPrimaryButtonStyle,
  minWidth: "154px",
  background: "rgba(10,10,12,0.74)",
  color: "#FFFFFF",
  border: "1px solid rgba(255,255,255,0.34)",
  boxShadow: "none",
};

export const desktopHeroSaveButtonStyle: CSSProperties = {
  ...desktopSecondaryButtonStyle,
  minWidth: "140px",
  fontFamily: "inherit",
  appearance: "none",
  WebkitAppearance: "none",
};

export const desktopHeroLoginNoticeStyle: CSSProperties = {
  margin: "-2px 0 0",
  color: "#F4F4F5",
  fontSize: "12.5px",
  fontWeight: 700,
  lineHeight: 1.35,
  textShadow: "0 2px 12px rgba(0,0,0,0.72)",
  maxWidth: "100%",
  ...safeTextStyle,
};

export const mobileHeroInitialButtonsStyle: CSSProperties = {
  ...mobileHeroButtonsStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  justifyContent: "center",
  justifyItems: "stretch",
};

export const primaryButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "50px",
  padding: "0 22px",
  borderRadius: "999px",
  background: "#000000",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "15px",
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,0.08)",
  textAlign: "center",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  boxShadow: "none",
  ...safeTextStyle,
};

export const secondaryButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "50px",
  padding: "0 22px",
  borderRadius: "999px",
  background: "#000000",
  color: "#FFFFFF",
  textDecoration: "none",
  fontFamily: "inherit",
  fontSize: "15px",
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,0.08)",
  appearance: "none",
  cursor: "pointer",
  textAlign: "center",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  boxShadow: "none",
  ...safeTextStyle,
};

export const heroSaveButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  fontFamily: "inherit",
  appearance: "none",
  cursor: "pointer",
};

export const heroLoginNoticeStyle: CSSProperties = {
  margin: "2px 0 0",
  color: "#DDD6FE",
  fontSize: "13px",
  fontWeight: 800,
  lineHeight: 1.35,
  maxWidth: "100%",
  ...safeTextStyle,
};

export const desktopHeroFooterStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "flex-start",
  gap: "16px",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  marginTop: "3px",
};

export const desktopHeroStatsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "22px",
  color: "#E4E4E7",
  fontSize: "12.5px",
  fontWeight: 750,
  width: "auto",
  maxWidth: "100%",
  minWidth: 0,
  flexWrap: "wrap",
};

export const desktopHeroStatItemStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "6px",
  minWidth: 0,
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: 0,
  boxSizing: "border-box",
  whiteSpace: "nowrap",
  textShadow: "0 2px 12px rgba(0,0,0,0.76)",
  ...safeTextStyle,
};

export const desktopHeroStatIconStyle: CSSProperties = {
  lineHeight: 1,
  flexShrink: 0,
};


export const desktopHeroStatValueStyle: CSSProperties = {
  display: "inline-block",
  minWidth: 0,
  overflow: "visible",
  textOverflow: "clip",
  whiteSpace: "nowrap",
};

export const mobileHeroContentStyle: CSSProperties = {
  ...heroContentStyle,
  display: "block",
  minHeight: "min(460px, 68vh)",
  padding: "22px 16px 18px",
  position: "relative",
};

export const mobileHeroMetaStyle: CSSProperties = {
  position: "absolute",
  top: "22px",
  left: "16px",
  right: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "8px",
  flexWrap: "wrap",
  maxWidth: "calc(100% - 32px)",
  minWidth: 0,
};

export const mobileHeroPillStyle: CSSProperties = {
  ...heroPillStyle,
  padding: "8px 13px",
  background: "#000000",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  boxShadow: "none",
  textShadow: "0 1px 0 rgba(0,0,0,0.28)",
};

export const mobileHeroTextBlockStyle: CSSProperties = {
  position: "absolute",
  left: "16px",
  right: "16px",
  bottom: "120px",
  display: "grid",
  justifyItems: "center",
  gap: "4px",
  textAlign: "center",
  width: "auto",
  maxWidth: "none",
  minWidth: 0,
};

export const mobileHeroTitleStyle: CSSProperties = {
  ...heroTitleStyle,
  width: "100%",
  textAlign: "center",
  fontSize: "clamp(34px, 10.2vw, 60px)",
  lineHeight: 0.96,
  textShadow:
    "0 1px 0 rgba(0,0,0,0.34), 0 2px 12px rgba(0,0,0,0.34)",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

export const mobileHeroDescriptionStyle: CSSProperties = {
  ...heroDescriptionStyle,
  justifySelf: "center",
  textAlign: "center",
  color: "#FFFFFF",
  fontSize: "14px",
  lineHeight: 1.5,
  textShadow:
    "0 1px 0 rgba(0,0,0,0.32), 0 2px 10px rgba(0,0,0,0.30)",
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  width: "100%",
  maxWidth: "560px",
  overflow: "hidden",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
  hyphens: "auto",
};

export const mobileHeroFooterStyle: CSSProperties = {
  position: "absolute",
  left: "16px",
  right: "16px",
  bottom: "18px",
  display: "grid",
  gridTemplateColumns: "156px minmax(0, 1fr)",
  alignSelf: "auto",
  alignItems: "center",
  gap: "8px",
  width: "auto",
  maxWidth: "none",
  minWidth: 0,
};

export const mobileHeroStatsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  alignItems: "center",
  justifyContent: "stretch",
  columnGap: "5px",
  color: "#FFFFFF",
  fontSize: "11.5px",
  fontWeight: 900,
  textShadow: "0 2px 12px rgba(0,0,0,0.78)",
  width: "156px",
  maxWidth: "100%",
  minWidth: "156px",
  whiteSpace: "nowrap",
};

export const mobileHeroStatItemStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "3px",
  minWidth: 0,
  width: "100%",
  whiteSpace: "nowrap",
  textShadow: "0 1px 0 rgba(0,0,0,0.28)",
};

export const mobileHeroStatIconStyle: CSSProperties = {
  lineHeight: 1,
  flexShrink: 0,
};


export const mobileHeroStatValueStyle: CSSProperties = {
  display: "inline-block",
  minWidth: 0,
  overflow: "visible",
  textOverflow: "clip",
  whiteSpace: "nowrap",
};
