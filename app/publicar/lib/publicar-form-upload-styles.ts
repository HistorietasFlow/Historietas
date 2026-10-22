import type { CSSProperties } from "react";
import { safeTextStyle } from "./publicar-layout-styles";

export const mainGridStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
  minWidth: 0,
  maxWidth: "100%",
};

export const formPanelStyle: CSSProperties = {
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

export const errorBoxStyle: CSSProperties = {
  display: "grid",
  gap: "5px",
  padding: "11px",
  borderRadius: "16px",
  background: "var(--historietas-publicar-danger-bg, rgba(239,68,68,0.075))",
  border: "1px solid var(--historietas-publicar-danger-border, rgba(239,68,68,0.18))",
  color: "var(--historietas-publicar-danger-text, #FCA5A5)",
  fontSize: "12px",
  fontWeight: 850,
  minWidth: 0,
  ...safeTextStyle,
};

export const fieldGroupStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
};

export const doubleFieldStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
  minWidth: 0,
  maxWidth: "100%",
};

export const labelRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  flexWrap: "wrap",
};

export const fileUploadLabelRowStyle: CSSProperties = {
  ...labelRowStyle,
  alignItems: "center",
};

export const fileOptionalBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "0",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

export const labelStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 950,
  letterSpacing: "-0.01em",
  ...safeTextStyle,
};

export const hiddenInputStyle: CSSProperties = {
  display: "none",
};

export const fileNameStyle: CSSProperties = {
  color: "var(--historietas-accent, var(--historietas-publicar-accent-soft, #FFFFFF))",
  fontSize: "11px",
  fontWeight: 850,
  ...safeTextStyle,
};

export const coverErrorStyle: CSSProperties = {
  color: "var(--historietas-publicar-danger-text, #FCA5A5)",
  fontSize: "11px",
  fontWeight: 850,
  ...safeTextStyle,
};

export const coverButtonsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "stretch",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
};

export const coverButtonStyle: CSSProperties = {
  flex: "1 1 94px",
  minHeight: "36px",
  maxWidth: "100%",
  padding: "0 12px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-publicar-surface, #050505)",
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxSizing: "border-box",
  whiteSpace: "normal",
  boxShadow: "none",
  ...safeTextStyle,
};

export const removeCoverButtonStyle: CSSProperties = {
  flex: "1 1 94px",
  minHeight: "34px",
  maxWidth: "100%",
  padding: "0 11px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.06)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxSizing: "border-box",
  whiteSpace: "normal",
  boxShadow: "none",
  ...safeTextStyle,
};

export const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "46px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "var(--historietas-publicar-bg-deep, #000000)",
  color: "#FFFFFF",
  padding: "0 14px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 700,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
  maxWidth: "100%",
  boxShadow: "none",
};

export const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "90px",
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "var(--historietas-publicar-bg-deep, #000000)",
  color: "#FFFFFF",
  padding: "14px",
  outline: "none",
  fontSize: "13px",
  fontWeight: 700,
  lineHeight: 1.58,
  resize: "vertical",
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
  maxWidth: "100%",
  boxShadow: "none",
  ...safeTextStyle,
};

export const hintStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  lineHeight: 1.45,
  fontWeight: 650,
  ...safeTextStyle,
};

export const buttonAreaStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(138px, 1fr))",
  gap: "9px",
  marginTop: "2px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

export const primaryButtonStyle: CSSProperties = {
  minHeight: "50px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-publicar-surface, #050505)",
  color: "#FFFFFF",
  fontSize: "14px",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "none",
  fontFamily: "inherit",
  textAlign: "center",
  padding: "0 14px",
  lineHeight: 1.15,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

export const disabledButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  boxShadow: "none",
  cursor: "not-allowed",
};

export const secondaryButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export const chapterImportBoxStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(56px, 64px) minmax(0, 1fr)",
  gap: "12px",
  alignItems: "stretch",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "0",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
  boxShadow: "none",
};

export const chapterImportIconBoxStyle: CSSProperties = {
  minHeight: "82px",
  borderRadius: "18px",
  background: "var(--historietas-publicar-bg-deep, #000000)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  boxShadow: "none",
};

export function criarCoverUploadIconBoxStyle(capaAtual: string): CSSProperties {
  if (!capaAtual) {
    return chapterImportIconBoxStyle;
  }

  return {
    ...chapterImportIconBoxStyle,
    background: "var(--historietas-publicar-bg-deep, #000000)",
    backgroundImage: `url(${capaAtual})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

export const chapterImportIconStyle: CSSProperties = {
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
  fontWeight: 950,
  lineHeight: 1,
  background: "transparent",
  boxShadow: "none",
};

export const chapterImportContentStyle: CSSProperties = {
  display: "grid",
  alignContent: "center",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
};

export const chapterImportTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "16px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  ...safeTextStyle,
};

export const chapterImportStatsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
};

export const inlineStatStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "6px 8px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 900,
  ...safeTextStyle,
};

export const miniCounterOkStyle: CSSProperties = {
  width: "fit-content",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "0",
  color: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 900,
  ...safeTextStyle,
};

export const miniCounterWarningStyle: CSSProperties = {
  ...miniCounterOkStyle,
  color: "#FFFFFF",
};

export const adultWarningsBoxStyle: CSSProperties = {
  display: "grid",
  gap: "11px",
  marginTop: "10px",
  padding: "14px",
  borderRadius: "16px",
  border: "1px solid rgba(255, 105, 130, 0.28)",
  background: "rgba(94, 20, 44, 0.12)",
};

export const adultWarningsHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
};

export const adultWarningsTitleStyle: CSSProperties = {
  color: "#FFD7DE",
  fontSize: "12px",
  fontWeight: 900,
};

export const adultWarningsCounterStyle: CSSProperties = {
  color: "#D7C8E9",
  fontSize: "10px",
  fontWeight: 800,
};

export const adultWarningsDescriptionStyle: CSSProperties = {
  margin: 0,
  color: "#C9BFD2",
  fontSize: "11px",
  lineHeight: 1.55,
};

export const adultWarningsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "8px",
};

export const adultWarningOptionStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "9px",
  padding: "10px 11px",
  borderRadius: "12px",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "rgba(255, 255, 255, 0.08)",
  background: "rgba(255, 255, 255, 0.025)",
  color: "#F2ECF8",
  fontSize: "11px",
  lineHeight: 1.4,
  cursor: "pointer",
};

export const adultWarningOptionSelectedStyle: CSSProperties = {
  borderColor: "rgba(255, 113, 143, 0.5)",
  background: "rgba(126, 35, 67, 0.2)",
};

export const adultWarningCheckboxStyle: CSSProperties = {
  width: "16px",
  height: "16px",
  marginTop: "1px",
  accentColor: "#FF6680",
  flex: "0 0 auto",
};

export const desktopMainGridSingleStyle: CSSProperties = {
  ...mainGridStyle,
  gridTemplateColumns: "minmax(0, 760px)",
  justifyContent: "center",
  alignItems: "start",
  gap: "28px",
  width: "100%",
};

export const desktopFormPanelStyle: CSSProperties = {
  ...formPanelStyle,
  gridTemplateColumns: "minmax(0, 1fr)",
  alignItems: "start",
  width: "100%",
  maxWidth: "760px",
  padding: 0,
  borderRadius: 0,
  gap: "16px",
  background: "transparent",
  border: "0",
  boxShadow: "none",
  overflow: "visible",
};

export const desktopHalfFieldStyle: CSSProperties = {
  ...fieldGroupStyle,
  gridColumn: "auto",
  minWidth: 0,
};

export const desktopFullWidthFieldStyle: CSSProperties = {
  ...fieldGroupStyle,
  gridColumn: "1 / -1",
  minWidth: 0,
};

export const desktopFullWidthErrorBoxStyle: CSSProperties = {
  ...errorBoxStyle,
  gridColumn: "1 / -1",
};

export const desktopDoubleFieldStyle: CSSProperties = {
  ...doubleFieldStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "16px",
};

export const desktopFullWidthDoubleFieldStyle: CSSProperties = {
  ...desktopDoubleFieldStyle,
  gridColumn: "1 / -1",
};

export const desktopCoverButtonsStyle: CSSProperties = {
  ...coverButtonsStyle,
  justifyContent: "flex-start",
  gap: "9px",
};

export const desktopCoverButtonStyle: CSSProperties = {
  ...coverButtonStyle,
  flex: "0 1 auto",
  width: "auto",
  minWidth: "138px",
  maxWidth: "220px",
  padding: "0 17px",
  whiteSpace: "normal",
};

export const desktopRemoveCoverButtonStyle: CSSProperties = {
  ...removeCoverButtonStyle,
  flex: "0 1 auto",
  width: "auto",
  minWidth: "112px",
  maxWidth: "180px",
  padding: "0 16px",
  whiteSpace: "normal",
};

export const desktopChapterImportBoxStyle: CSSProperties = {
  ...chapterImportBoxStyle,
  gridTemplateColumns: "108px minmax(0, 1fr)",
  gap: "16px",
  alignItems: "center",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "0",
  boxShadow: "none",
  overflow: "visible",
};

export const desktopCoverUploadIconBoxStyle: CSSProperties = {
  width: "108px",
  minWidth: "108px",
  minHeight: "144px",
  height: "144px",
  alignSelf: "center",
  borderRadius: "18px",
};

export const desktopFileUploadIconBoxStyle: CSSProperties = {
  width: "88px",
  minWidth: "88px",
  minHeight: "96px",
  height: "96px",
  alignSelf: "center",
  borderRadius: "18px",
};

export const desktopFullWidthArquivoObraBoxStyle: CSSProperties = {
  ...chapterImportBoxStyle,
  gridTemplateColumns: "88px minmax(0, 1fr)",
  gap: "16px",
  alignItems: "center",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "0",
  boxShadow: "none",
  overflow: "visible",
};

export const desktopChapterImportContentStyle: CSSProperties = {
  ...chapterImportContentStyle,
  alignContent: "center",
  gap: "9px",
};

export const desktopFullWidthArquivoObraContentStyle: CSSProperties = {
  ...chapterImportContentStyle,
  alignContent: "center",
  gap: "9px",
  gridTemplateColumns: "minmax(0, 1fr)",
  maxWidth: "100%",
};

export const desktopButtonAreaStyle: CSSProperties = {
  ...buttonAreaStyle,
  gridColumn: "1 / -1",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  justifyContent: "stretch",
  gap: "10px",
  marginTop: "4px",
};
