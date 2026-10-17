import type { CSSProperties } from "react";
import { safeTextStyle } from "./ler-capitulo-text-style";

const pageStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  minHeight: "100vh",
  maxWidth: "100vw",
  overflowX: "hidden",
  background: "var(--historietas-reader-bg-page, #000000)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  boxSizing: "border-box",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

export const focusPageStyle: CSSProperties = {
  ...pageStyle,
  background: "#000000",
  color: "#FFFFFF",
};

export const fixedReadingProgressOuterStyle: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 50,
  height: "4px",
  background: "rgba(255,255,255,0.06)",
};

export const fixedReadingProgressInnerStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "var(--historietas-reader-progress, #FFFFFF)",
  transition: "width 0.16s ease",
};

export const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(900px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "18px 0 calc(28px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  minWidth: 0,
};

export const topStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "nowrap",
  marginBottom: "14px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

export const headerActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "8px",
  flex: "0 0 auto",
  minWidth: 0,
};

export const desktopHeaderActionsStyle: CSSProperties = {
  ...headerActionsStyle,
  gap: "10px",
};




export const logoStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "25px",
  fontWeight: 950,
  letterSpacing: 0,
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
  background: "var(--historietas-reader-bg-deep, #000000)",
  color: "#FFFFFF",
  fontSize: "19px",
  fontWeight: 950,
  letterSpacing: 0,
  flex: "0 0 auto",
  border: "1px solid var(--historietas-reader-purple-border, rgba(255, 255, 255, 0.18))",
  boxShadow: "none",
};

export const logoViewsIconStyle: CSSProperties = {
  width: "21px",
  height: "21px",
  display: "block",
  color: "#FFFFFF",
};

export const logoViewsCountStyle: CSSProperties = {
  marginLeft: "-1px",
  color: "#FFFFFF",
  fontSize: "20px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.02em",
  textShadow: "none",
};






const settingsButtonStyle: CSSProperties = {
  minHeight: "38px",
  padding: "0 13px",
  borderRadius: "999px",
  background: "var(--historietas-reader-surface, #050505)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  flex: "1 1 112px",
  maxWidth: "100%",
  boxSizing: "border-box",
  textAlign: "center",
  whiteSpace: "normal",
  boxShadow: "none",
  textShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
  ...safeTextStyle,
};

const topSingleSettingsButtonStyle: CSSProperties = {
  ...settingsButtonStyle,
  flex: "0 0 auto",
  minWidth: "88px",
  maxWidth: "116px",
  minHeight: "34px",
  padding: "0 11px",
  fontSize: "11px",
};

export const focusTopSingleSettingsButtonStyle: CSSProperties = {
  ...topSingleSettingsButtonStyle,
};

const chapterHeaderStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: 0,
  padding: "10px 0 4px",
  borderRadius: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
};

export const focusChapterHeaderStyle: CSSProperties = {
  ...chapterHeaderStyle,
};

const titleStyle: CSSProperties = {
  margin: 0,
  width: "100%",
  maxWidth: "100%",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontSize: "clamp(26px, 7.4vw, 38px)",
  lineHeight: 0.96,
  fontWeight: 500,
  letterSpacing: "-0.01em",
  textAlign: "center",
  background: "none",
  WebkitBackgroundClip: "initial",
  backgroundClip: "initial",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  textShadow:
    "0 1px 0 rgba(0,0,0,0.34), 0 2px 12px rgba(0,0,0,0.34)",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
  ...safeTextStyle,
};

const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  fontSize: "clamp(34px, 4vw, 52px)",
  lineHeight: 1.04,
  width: "100%",
  maxWidth: "680px",
};

export function criarEstiloTituloCapitulo(
  titulo: string,
  isDesktop: boolean
): CSSProperties {
  const totalCaracteres = titulo.trim().length;
  const estiloBase = isDesktop ? desktopTitleStyle : titleStyle;

  if (totalCaracteres <= 15) {
    return {
      ...estiloBase,
      fontSize: isDesktop
        ? "clamp(34px, 4vw, 52px)"
        : "clamp(26px, 7.4vw, 38px)",
    };
  }

  if (totalCaracteres <= 35) {
    return {
      ...estiloBase,
      fontSize: isDesktop
        ? "clamp(30px, 3.4vw, 44px)"
        : "clamp(23px, 6.4vw, 33px)",
      lineHeight: isDesktop ? 1.06 : 1.02,
    };
  }

  return {
    ...estiloBase,
    fontSize: isDesktop
      ? "clamp(26px, 3vw, 38px)"
      : "clamp(20px, 5.5vw, 28px)",
    lineHeight: isDesktop ? 1.08 : 1.06,
  };
}











const settingsPanelStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  marginTop: "10px",
  padding: "10px",
  borderRadius: "20px",
  background: "var(--historietas-reader-panel, rgba(4, 0, 10, 0.72))",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

export const focusSettingsPanelStyle: CSSProperties = {
  ...settingsPanelStyle,
  background: "rgba(9,9,11,0.78)",
  border: "1px solid rgba(255,255,255,0.07)",
};

export const settingsInfoStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
  margin: "0 2px 2px",
  minWidth: 0,
  textAlign: "center",
};

export const settingsInfoPrimaryStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "11px",
  lineHeight: 1.35,
  fontWeight: 900,
  ...safeTextStyle,
};

export const settingsInfoSecondaryStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  lineHeight: 1.35,
  fontWeight: 800,
  ...safeTextStyle,
};

export const chapterSelectStyle: CSSProperties = {
  width: "100%",
  minHeight: "40px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "var(--historietas-reader-bg-deep, #000000)",
  color: "#FFFFFF",
  padding: "0 11px",
  outline: "none",
  fontSize: "12px",
  fontWeight: 850,
  fontFamily: "inherit",
  boxSizing: "border-box",
  textAlign: "center",
};

const fontScaleBoxStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  boxShadow: "none",
};

export const focusFontScaleBoxStyle: CSSProperties = {
  ...fontScaleBoxStyle,
  background: "transparent",
  border: "none",
  boxShadow: "none",
};

export const fontScaleHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  minWidth: 0,
};

export const fontScaleLabelStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #E4E4E7)",
  fontSize: "11px",
  fontWeight: 950,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

export const fontScaleValueStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 950,
  boxShadow: "none",
  ...safeTextStyle,
};

export const fontScaleGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "5px",
  minWidth: 0,
};

export const desktopFontScaleGridStyle: CSSProperties = {
  ...fontScaleGridStyle,
  gridTemplateColumns: "repeat(10, minmax(0, 1fr))",
};

const fontScaleButtonStyle: CSSProperties = {
  minHeight: "30px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-reader-surface, #050505)",
  color: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxShadow: "none",
};

export const focusFontScaleButtonStyle: CSSProperties = {
  ...fontScaleButtonStyle,
};

export const fontScaleButtonActiveStyle: CSSProperties = {
  ...fontScaleButtonStyle,
  border: "1px solid rgba(255,255,255,0.18)",
  boxShadow: "none",
  textShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

export const settingsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
};

const settingsActionStyle: CSSProperties = {
  minHeight: "36px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-reader-surface, #050505)",
  color: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 8px",
  lineHeight: 1.05,
  boxShadow: "none",
  ...safeTextStyle,
};

export const settingsActionActiveStyle: CSSProperties = {
  ...settingsActionStyle,
  border: "1px solid rgba(255,255,255,0.18)",
};

export const focusMutedSettingsActionStyle: CSSProperties = {
  ...settingsActionStyle,
};

const textCardStyle: CSSProperties = {
  marginTop: "10px",
  padding: "14px 12px",
  borderRadius: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
};

export const focusTextCardStyle: CSSProperties = {
  ...textCardStyle,
  background: "transparent",
  border: "none",
};

export const chapterTextStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "17px",
  lineHeight: 1.9,
  fontWeight: 550,
  whiteSpace: "pre-wrap",
  overflowWrap: "break-word",
  wordBreak: "break-word",
  textAlign: "left",
};

const readerActionsStyle: CSSProperties = {
  marginTop: "10px",
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

const actionButtonStyle: CSSProperties = {
  minHeight: "38px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-reader-surface, #050505)",
  color: "#FFFFFF",
  fontSize: "10.5px",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "none",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 8px",
  lineHeight: 1.05,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

export const chapterLikeButtonLayoutStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "5px",
};

export const chapterHeartIconStyle: CSSProperties = {
  width: "18px",
  height: "18px",
  display: "block",
  flex: "0 0 auto",
  transformOrigin: "center",
};

export const chapterLikeCountStyle: CSSProperties = {
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  lineHeight: 1,
};

export const focusReaderActionsStyle: CSSProperties = {
  ...readerActionsStyle,
};

export const focusActionButtonStyle: CSSProperties = {
  ...actionButtonStyle,
};

export const focusActiveActionButtonStyle: CSSProperties = {
  ...focusActionButtonStyle,
  border: "1px solid rgba(255,255,255,0.18)",
};

export const focusActiveSaveButtonStyle: CSSProperties = {
  ...focusActionButtonStyle,
  border: "1px solid rgba(255,255,255,0.18)",
};

export const focusActiveCommentButtonStyle: CSSProperties = {
  ...focusActionButtonStyle,
  border: "1px solid rgba(255,255,255,0.18)",
};

export const commentStatusStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-reader-success, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 850,
  ...safeTextStyle,
};

const chapterNavigationStyle: CSSProperties = {
  marginTop: "10px",
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
};

const chapterNavButtonStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-reader-surface, #050505)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 8px",
  lineHeight: 1.05,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  boxShadow: "none",
  ...safeTextStyle,
};

export const focusChapterNavigationStyle: CSSProperties = {
  ...chapterNavigationStyle,
};

export const focusChapterNavButtonStyle: CSSProperties = {
  ...chapterNavButtonStyle,
};

export const focusChapterNavButtonPrimaryStyle: CSSProperties = {
  ...focusChapterNavButtonStyle,
  border: "1px solid rgba(255,255,255,0.18)",
};

export const focusReturnToWorkButtonStyle: CSSProperties = {
  ...focusChapterNavButtonStyle,
  boxShadow: "none",
  textShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

export const focusChapterNavDisabledStyle: CSSProperties = {
  ...focusChapterNavButtonStyle,
  color: "#52525B",
  background: "rgba(255,255,255,0.018)",
};



export const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(980px, calc(100% - 64px))",
  padding: "22px 0 34px",
};

export const desktopTopStyle: CSSProperties = {
  ...topStyle,
  flexWrap: "nowrap",
  marginBottom: "14px",
};


const desktopSettingsButtonStyle: CSSProperties = {
  ...settingsButtonStyle,
  flex: "0 0 auto",
  minWidth: "126px",
  minHeight: "40px",
};

export const desktopFocusSettingsButtonStyle: CSSProperties = {
  ...desktopSettingsButtonStyle,
};

const desktopChapterHeaderStyle: CSSProperties = {
  ...chapterHeaderStyle,
  padding: "16px 0 6px",
};

export const desktopFocusChapterHeaderStyle: CSSProperties = {
  ...desktopChapterHeaderStyle,
};

const desktopSettingsPanelStyle: CSSProperties = {
  ...settingsPanelStyle,
  padding: "12px",
  borderRadius: "22px",
  gap: "9px",
};

export const desktopFocusSettingsPanelStyle: CSSProperties = {
  ...desktopSettingsPanelStyle,
  background: "rgba(9,9,11,0.78)",
  border: "1px solid rgba(255,255,255,0.07)",
};

export const desktopChapterSelectStyle: CSSProperties = {
  ...chapterSelectStyle,
  minHeight: "42px",
};

export const desktopSettingsGridStyle: CSSProperties = {
  ...settingsGridStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
};

const desktopTextCardStyle: CSSProperties = {
  ...textCardStyle,
  marginTop: "12px",
  padding: "24px 28px",
  borderRadius: 0,
};

export const desktopFocusTextCardStyle: CSSProperties = {
  ...desktopTextCardStyle,
  background: "transparent",
  border: "none",
};

export const desktopChapterTextStyle: CSSProperties = {
  ...chapterTextStyle,
  fontSize: "19px",
  lineHeight: 1.94,
};

const desktopReaderActionsStyle: CSSProperties = {
  ...readerActionsStyle,
  marginTop: "12px",
  gap: "8px",
};

export const desktopFocusReaderActionsStyle: CSSProperties = {
  ...desktopReaderActionsStyle,
};

const desktopChapterNavigationStyle: CSSProperties = {
  ...chapterNavigationStyle,
  marginTop: "12px",
  gap: "8px",
};

export const desktopFocusChapterNavigationStyle: CSSProperties = {
  ...desktopChapterNavigationStyle,
};
