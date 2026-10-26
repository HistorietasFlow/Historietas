import type { CSSProperties } from "react";

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

export const mobileTopWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(520px, 72vh)",
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

export const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background: "var(--historietas-adicionar-capitulo-bg-page, #000000)",
  color: "#FFFFFF",
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

export const titleHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  flexWrap: "nowrap",
  marginTop: "4px",
  marginBottom: "18px",
  minWidth: 0,
  padding: 0,
  textAlign: "center",
};

export const desktopTitleHeaderStyle: CSSProperties = {
  ...titleHeaderStyle,
  position: "relative",
  justifyContent: "center",
  minHeight: "48px",
  marginTop: "6px",
  marginBottom: "24px",
  paddingRight: 0,
  textAlign: "center",
};



export const headerTitleLinkStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "23px",
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "1px",
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
  margin: 0,
  paddingRight: "0.2em",
  paddingBottom: "0.04em",
  whiteSpace: "nowrap",
  overflow: "visible",
  fontSize: "23px",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  wordSpacing: "0.11em",
  textAlign: "center",
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
  marginTop: "18px",
  padding: "18px",
  borderRadius: "24px",
  background: "var(--historietas-adicionar-capitulo-danger-surface, rgba(127,29,29,0.18))",
  border: "1px solid var(--historietas-adicionar-capitulo-danger-border, rgba(239,68,68,0.26))",
  display: "grid",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
};

export const errorTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-danger-button-text, var(--historietas-adicionar-capitulo-danger-text, #FFFFFF))",
  fontSize: "24px",
  fontWeight: 950,
  letterSpacing: "-0.045em",
  ...safeTextStyle,
};

export const errorTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-danger-button-text, var(--historietas-adicionar-capitulo-danger-text-soft, #FFFFFF))",
  fontSize: "14px",
  lineHeight: 1.7,
  fontWeight: 750,
  ...safeTextStyle,
};

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

export const formHeaderStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  minWidth: 0,
  textAlign: "center",
  justifyItems: "center",
};

export const formMiniTitleStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

export const formTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "26px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.065em",
  textAlign: "center",
  ...safeTextStyle,
};

export const fieldGroupStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
};

export const labelStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 950,
  letterSpacing: "-0.01em",
  ...safeTextStyle,
};

export const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "46px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "var(--historietas-adicionar-capitulo-bg-deep, #000000)",
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
  minHeight: "78px",
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "var(--historietas-adicionar-capitulo-bg-deep, #000000)",
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

export const importBoxStyle: CSSProperties = {
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

export const importInfoStyle: CSSProperties = {
  display: "grid",
  alignContent: "center",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
};

export const importIconStyle: CSSProperties = {
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "13px",
  fontWeight: 950,
  lineHeight: 1,
  letterSpacing: "-0.04em",
  boxShadow: "none",
};

export const importIconBoxStyle: CSSProperties = {
  minHeight: "82px",
  borderRadius: "18px",
  background: "var(--historietas-adicionar-capitulo-bg-deep, #000000)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  boxShadow: "none",
};

export const importTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "15px",
  fontWeight: 950,
  letterSpacing: "-0.045em",
  ...safeTextStyle,
};

export const importSuccessStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "7px 9px",
  borderRadius: "999px",
  background: "var(--historietas-adicionar-capitulo-success-bg, rgba(34,197,94,0.12))",
  border: "1px solid var(--historietas-adicionar-capitulo-success-border, rgba(34,197,94,0.28))",
  color: "var(--historietas-adicionar-capitulo-success, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 900,
  ...safeTextStyle,
};

export const importErrorStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "7px 9px",
  borderRadius: "999px",
  background: "var(--historietas-danger-surface, var(--historietas-adicionar-capitulo-danger-bg, rgba(239,68,68,0.13)))",
  border: "1px solid var(--historietas-adicionar-capitulo-danger-border-strong, rgba(239,68,68,0.28))",
  color: "var(--historietas-danger-button-text, var(--historietas-adicionar-capitulo-danger-text, #FFFFFF))",
  fontSize: "11px",
  fontWeight: 900,
  ...safeTextStyle,
};

export const importButtonStyle: CSSProperties = {
  width: "fit-content",
  minHeight: "36px",
  maxWidth: "100%",
  padding: "0 12px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-adicionar-capitulo-surface, #050505)",
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  boxShadow: "none",
  minWidth: 0,
  boxSizing: "border-box",
  ...safeTextStyle,
};

export const hiddenFileInputStyle: CSSProperties = {
  display: "none",
};

export const buttonAreaStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "6px",
  marginTop: "2px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

export const primaryButtonStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-adicionar-capitulo-surface, #050505)",
  color: "#FFFFFF",
  fontSize: "11.5px",
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

export const disabledButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  boxShadow: "none",
  cursor: "not-allowed",
};

export const secondaryButtonStyle: CSSProperties = {
  minHeight: "42px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-adicionar-capitulo-surface, #050505)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "11.5px",
  fontWeight: 950,
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

export const cancelButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
};

export const desktopCancelButtonStyle: CSSProperties = {
  ...cancelButtonStyle,
  minHeight: "46px",
  fontSize: "13px",
};

export const previewPanelStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  padding: 0,
  background: "transparent",
  border: "none",
  borderRadius: 0,
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

export const previewHeaderStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  justifyItems: "center",
  textAlign: "center",
  minWidth: 0,
};

export const previewMiniTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  fontSize: "19px",
  lineHeight: 1.05,
  fontWeight: 950,
  letterSpacing: "-0.035em",
  textAlign: "center",
  textTransform: "uppercase",
  ...safeTextStyle,
};

export const previewChapterCardStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  padding: "11px",
  borderRadius: "22px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

export const previewChapterTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "19px",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.045em",
  textAlign: "center",
  ...safeTextStyle,
};

export const previewChapterTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.45,
  fontWeight: 650,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  textAlign: "left",
  ...safeTextStyle,
};

export const desktopPreviewChapterTextStyle: CSSProperties = {
  ...previewChapterTextStyle,
  minHeight: "132px",
  fontSize: "14px",
  lineHeight: 1.65,
};

export const desktopPreviewChapterTitleStyle: CSSProperties = {
  ...previewChapterTitleStyle,
  fontSize: "24px",
  lineHeight: 1.12,
};

export const previewTopRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "6px",
  justifyItems: "center",
  textAlign: "center",
  minWidth: 0,
  maxWidth: "100%",
};


export const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  maxWidth: "100%",
  padding: "30px 0 72px",
};

export const desktopMainGridSoloStyle: CSSProperties = {
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

export const desktopFormHeaderStyle: CSSProperties = {
  ...formHeaderStyle,
  gap: "5px",
  justifyItems: "center",
  textAlign: "center",
};

export const desktopFormTitleStyle: CSSProperties = {
  ...formTitleStyle,
  fontSize: "30px",
};

export const desktopImportBoxStyle: CSSProperties = {
  ...importBoxStyle,
  gridTemplateColumns: "88px minmax(0, 1fr)",
  alignItems: "center",
  padding: 0,
  gap: "16px",
  borderRadius: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
};

export const desktopImportButtonStyle: CSSProperties = {
  ...importButtonStyle,
  minHeight: "36px",
  fontSize: "11px",
  padding: "0 12px",
};

export const desktopTextareaStyle: CSSProperties = {
  ...textareaStyle,
  minHeight: "132px",
};

export const desktopButtonAreaStyle: CSSProperties = {
  ...buttonAreaStyle,
  gridColumn: "1 / -1",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  justifyContent: "stretch",
  gap: "10px",
  marginTop: "4px",
};

export const desktopPrimaryButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  minHeight: "46px",
  fontSize: "13px",
};

export const desktopDisabledButtonStyle: CSSProperties = {
  ...disabledButtonStyle,
  minHeight: "46px",
  fontSize: "13px",
};

export const desktopSecondaryButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
  minHeight: "46px",
  fontSize: "13px",
};

export const desktopPreviewPanelStyle: CSSProperties = {
  ...previewPanelStyle,
  position: "static",
  top: "auto",
  alignSelf: "stretch",
  width: "100%",
  maxWidth: "760px",
  margin: "0 auto",
};

export const desktopPreviewChapterCardStyle: CSSProperties = {
  ...previewChapterCardStyle,
  width: "100%",
  padding: "14px",
  borderRadius: "22px",
};
