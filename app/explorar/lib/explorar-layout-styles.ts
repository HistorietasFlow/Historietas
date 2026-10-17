import type { CSSProperties } from "react";

export function criarActiveCategoryStyle(): CSSProperties {
  return {
    ...activeCategoryStyle,
    border: "1px solid #FFFFFF",
    background: "#FFFFFF",
    color: "#000000",
    boxShadow: "none",
  };
}

export function criarSearchBoxStyle(): CSSProperties {
  return {
    ...searchBoxStyle,
    marginBottom: "-6px",
    padding: 0,
    borderRadius: 0,
    background: "transparent",
    border: "none",
    overflow: "visible",
    boxShadow: "none",
  };
}

export function criarDesktopSearchBoxStyle(): CSSProperties {
  return {
    ...criarSearchBoxStyle(),
    gridTemplateColumns: "1fr",
    alignItems: "stretch",
    gap: "5px",
    marginTop: "12px",
    padding: 0,
    borderRadius: 0,
    background: "transparent",
    border: "none",
    overflow: "visible",
    boxShadow: "none",
  };
}







export const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const mobileTopWaterFadeStyle: CSSProperties = {
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

const desktopTopWaterFadeStyle: CSSProperties = {
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

// Teste: mesma identidade tipográfica aplicada anteriormente na Home.
export const listaPageTitleTypographyStyle: CSSProperties = {
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 900,
  letterSpacing: "-0.035em",
};

export const listaWorkTitleTypographyStyle: CSSProperties = {
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 500,
  letterSpacing: "-0.01em",
};

export const listaAuthorMetaTypographyStyle: CSSProperties = {
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 450,
  lineHeight: 1.25,
};

export const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  background: "#000000",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

export function criarExplorarPageStyle(
  pageThemeStyle: CSSProperties
): CSSProperties {
  return {
    ...pageThemeStyle,
    color: "var(--historietas-text-primary, #FFFFFF)",
  };
}

export function criarExplorarTopWaterFadeStyle(
  desktop: boolean
): CSSProperties {
  return {
    ...(desktop ? desktopTopWaterFadeStyle : mobileTopWaterFadeStyle),
    background: "transparent",
    opacity: 0,
  };
}

export const containerStyle: CSSProperties = {
  position: "relative",
  width: "min(900px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "8px 0 calc(24px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  minWidth: 0,
};











export const titleHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "nowrap",
  marginBottom: "10px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

export const desktopTitleHeaderStyle: CSSProperties = {
  width: "100%",
  minHeight: "58px",
  margin: "0 0 18px",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "24px",
  minWidth: 0,
  boxSizing: "border-box",
  position: "relative",
  zIndex: 2,
};

export const desktopExplorarHeaderTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "32px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  ...safeTextStyle,
};

export const desktopExplorarHeaderActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "10px",
  minWidth: 0,
};

export const desktopExplorarHeaderSearchIconStyle: CSSProperties = {
  position: "absolute",
  left: "13px",
  top: "50%",
  transform: "translateY(-50%)",
  color: "rgba(255,255,255,0.56)",
  pointerEvents: "none",
};

export const desktopExplorarHeaderSearchInputStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  height: "100%",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  outline: "none",
  padding: "0 14px 0 42px",
  fontFamily: "inherit",
  fontSize: "13px",
  fontWeight: 800,
  boxSizing: "border-box",
};

export const mobileSearchToggleStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "34px",
  height: "34px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: "24px",
  lineHeight: 1,
  fontWeight: 950,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  padding: 0,
  boxShadow: "none",
  flex: "0 0 auto",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
};

export const explorarHeaderFilterButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "8px",
  minWidth: 0,
  maxWidth: "46%",
  flex: "0 1 auto",
  fontSize: "16px",
  lineHeight: 1.15,
  fontFamily: "inherit",
  ...listaPageTitleTypographyStyle,
  cursor: "pointer",
  textAlign: "left",
  boxShadow: "none",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
  ...safeTextStyle,
};

export const explorarCarregarMaisButtonStyle: CSSProperties = {
  minWidth: "180px",
  minHeight: "44px",
  margin: "24px auto 0",
  padding: "0 24px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "inherit",
  fontSize: "14px",
  fontWeight: 900,
  cursor: "pointer",
};

export const desktopExplorarHeaderFilterButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  minHeight: "42px",
  padding: "0 16px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "transparent",
  color: "#FFFFFF",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  fontFamily: "inherit",
  fontSize: "12px",
  fontWeight: 900,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export const explorarHeaderFilterIconStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1,
  fontWeight: 700,
  flex: "0 0 auto",
};












export const categoriesStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  overflowX: "auto",
  overflowY: "hidden",
  overscrollBehaviorX: "contain",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  padding: "3px 0 9px",
  margin: "0 0 3px",
  boxSizing: "border-box",
  WebkitOverflowScrolling: "touch",
};

export const categoryStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  flex: "0 0 auto",
  minHeight: "38px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.13)",
  background: "rgba(255,255,255,0.025)",
  color: "rgba(255,255,255,0.66)",
  padding: "0 16px",
  fontFamily: "inherit",
  fontSize: "14px",
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: "-0.025em",
  cursor: "pointer",
  whiteSpace: "nowrap",
  textAlign: "center",
  outline: "none",
  boxShadow: "none",
  WebkitTapHighlightColor: "transparent",
};

const activeCategoryStyle: CSSProperties = {
  ...categoryStyle,
  border: "1px solid #FFFFFF",
  background: "#FFFFFF",
  color: "#000000",
};

export const loginNoticeStyle: CSSProperties = {
  display: "block",
  margin: "-2px auto 0",
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "11.5px",
  fontWeight: 850,
  lineHeight: 1.35,
  textAlign: "center",
  ...safeTextStyle,
};

const searchBoxStyle: CSSProperties = {
  marginTop: "10px",
  display: "grid",
  gap: "5px",
  padding: "5px 6px",
  borderRadius: "18px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
  minWidth: 0,
  overflow: "hidden",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

export const explorarHeaderSearchShellStyle: CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  maxWidth: "calc(100% - 104px)",
  height: "36px",
  marginLeft: "auto",
  marginRight: "-6px",
  borderRadius: "999px",
  border: "none",
  background: "#000000",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  overflow: "hidden",
  padding: "0 0 0 13px",
  boxSizing: "border-box",
  boxShadow: "none",
  transformOrigin: "right center",
};

export const desktopExplorarHeaderSearchShellStyle: CSSProperties = {
  position: "relative",
  width: "min(390px, 34vw)",
  minWidth: "230px",
  height: "42px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.045)",
  display: "flex",
  alignItems: "center",
  overflow: "hidden",
  boxSizing: "border-box",
};

export const explorarHeaderSearchInputStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  flex: "1 1 auto",
  width: "100%",
  minWidth: 0,
  height: "34px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "14px",
  fontWeight: 800,
  letterSpacing: "-0.025em",
  boxSizing: "border-box",
};







export const explorarModalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  height: "100dvh",
  zIndex: 240,
  background: "rgba(0,0,0,0.68)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  padding: 0,
  boxSizing: "border-box",
  overflow: "hidden",
  overscrollBehavior: "none",
  touchAction: "none",
};

export const explorarModalSheetStyle: CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: 0,
  transform: "translateX(-50%)",
  zIndex: 241,
  width: "min(820px, 100%)",
  maxHeight: "calc(100dvh - 116px)",
  display: "grid",
  gap: "0",
  padding: "8px 0 calc(18px + env(safe-area-inset-bottom))",
  borderRadius: "24px 24px 0 0",
  background: "var(--historietas-bg-start, #000000)",
  border: "none",
  borderBottom: "0",
  overflowY: "auto",
  overflowX: "hidden",
  overscrollBehavior: "none",
  boxShadow: "0 -18px 50px rgba(0,0,0,0.38)",
  boxSizing: "border-box",
  touchAction: "none",
};

export const desktopExplorarModalSheetStyle: CSSProperties = {
  ...explorarModalSheetStyle,
  left: "50%",
  right: "auto",
  bottom: "24px",
  width: "min(560px, calc(100vw - 24px))",
  maxWidth: "560px",
  maxHeight: "82vh",
  transform: "translateX(-50%)",
  borderRadius: "24px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  margin: 0,
  paddingBottom: "18px",
};

export const explorarModalHandleStyle: CSSProperties = {
  display: "block",
  justifySelf: "center",
  width: "72px",
  height: "5px",
  borderRadius: "999px",
  background: "rgba(244,244,245,0.62)",
  margin: "0 auto 14px",
};

export const explorarModalTitleStyle: CSSProperties = {
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

export const explorarModalContentStyle: CSSProperties = {
  display: "grid",
  gap: 0,
};

export const explorarModalSectionLabelStyle: CSSProperties = {
  margin: 0,
  display: "block",
  padding: "11px 30px 5px",
  borderTop: "none",
  color: "rgba(244,244,245,0.56)",
  fontSize: "11px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

export function criarExplorarModalOptionStyle(ativo: boolean): CSSProperties {
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

export function criarExplorarModalRadioStyle(ativo: boolean): CSSProperties {
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

export const explorarModalClearDividerStyle: CSSProperties = {
  display: "none",
};

export const explorarModalClearButtonStyle: CSSProperties = {
  width: "calc(100% - 60px)",
  justifySelf: "center",
  minHeight: "46px",
  marginTop: "12px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "transparent",
  color: "#FFFFFF",
  fontSize: "15px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  ...safeTextStyle,
};

export const explorarAdultConfirmationStyle: CSSProperties = {
  display: "grid",
  gap: 12,
  margin: "8px 30px 4px",
  padding: "16px",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.035)",
};

export const explorarAdultConfirmationTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: 17,
  lineHeight: 1.2,
  fontWeight: 950,
  ...safeTextStyle,
};

export const explorarAdultConfirmationTextStyle: CSSProperties = {
  margin: 0,
  color: "rgba(244,244,245,0.72)",
  fontSize: 13,
  lineHeight: 1.55,
  ...safeTextStyle,
};

export const explorarAdultConfirmationCheckStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  color: "#FFFFFF",
  fontSize: 13,
  lineHeight: 1.45,
  cursor: "pointer",
  ...safeTextStyle,
};

export const explorarAdultConfirmationCheckboxStyle: CSSProperties = {
  width: 18,
  height: 18,
  margin: 0,
  flex: "0 0 auto",
  accentColor: "#FFFFFF",
};

export const explorarAdultConfirmationActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.35fr)",
  gap: 10,
};

export const explorarAdultConfirmationBackStyle: CSSProperties = {
  minHeight: 44,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "transparent",
  color: "#FFFFFF",
  fontFamily: "inherit",
  fontWeight: 850,
  cursor: "pointer",
};

export const explorarAdultConfirmationContinueStyle: CSSProperties = {
  minHeight: 44,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.92)",
  background: "#FFFFFF",
  color: "#111111",
  fontFamily: "inherit",
  fontWeight: 950,
  cursor: "pointer",
};

export const explorarAdultConfirmationDisabledStyle: CSSProperties = {
  opacity: 0.42,
  cursor: "not-allowed",
};


export const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 64px))",
  maxWidth: "100%",
  padding: "34px 0 64px",
};






export const desktopCategoriesStyle: CSSProperties = {
  ...categoriesStyle,
  gap: "10px",
  padding: "2px 0 13px",
  marginBottom: "5px",
};
