import type { CSSProperties } from "react";

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
  background: "var(--historietas-perfil-bg-page, #000000)",
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
  padding: "0 24px 12px",
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
};

export const workActionSheetAuthorStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 850,
  lineHeight: 1.2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  textAlign: "center",
  maxWidth: "100%",
};

export const workActionSheetMetaStyle: CSSProperties = {
  color: "rgba(255,255,255,0.72)",
  fontSize: "12px",
  fontWeight: 850,
  lineHeight: 1.2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  textAlign: "center",
  maxWidth: "100%",
};

export const workActionSheetMetricsStyle: CSSProperties = {
  ...workActionSheetMetaStyle,
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: "6px 10px",
  whiteSpace: "normal",
  overflow: "visible",
  textOverflow: "clip",
};


export const workActionSheetActionsStyle: CSSProperties = {
  display: "grid",
  gap: 0,
  borderRadius: 0,
  border: "none",
  borderTop: "none",
  background: "transparent",
  overflow: "hidden",
};

export function criarProfileSelectionDotStyle(ativo: boolean): CSSProperties {
  return {
    width: "23px",
    height: "23px",
    marginLeft: "auto",
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

export const workActionSheetItemStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minHeight: "44px",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "14px",
  border: "none",
  borderBottom: "none",
  borderRadius: 0,
  background: "transparent",
  color: "#FFFFFF",
  textDecoration: "none",
  padding: "0 30px",
  fontSize: "18px",
  fontWeight: 650,
  lineHeight: 1,
  letterSpacing: "-0.035em",
  fontFamily: "inherit",
  textAlign: "left",
  cursor: "pointer",
  boxSizing: "border-box",
  whiteSpace: "nowrap",
};

export const workActionSheetDangerItemStyle: CSSProperties = {
  ...workActionSheetItemStyle,
  color: "#FDA4AF",
};

export const workActionSheetItemActiveStyle: CSSProperties = {
  ...workActionSheetItemStyle,
  fontWeight: 900,
  background: "transparent",
  color: "#FFFFFF",
};


export const diarySummarySectionStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gap: "12px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

export const diarySummaryGridStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  alignItems: "start",
  rowGap: "6px",
  columnGap: "10px",
  minWidth: 0,
  maxWidth: "100%",
  padding: "2px 0 0",
  boxSizing: "border-box",
};

export const desktopDiarySummaryGridStyle: CSSProperties = {
  ...diarySummaryGridStyle,
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
  columnGap: "12px",
  rowGap: "18px",
  padding: "4px 0 0",
};

// Teste: tipografia dos cards de obras igual à do card principal da Home.
export const homeCardTitleTypographyStyle: CSSProperties = {
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 500,
  letterSpacing: "-0.01em",
};


export const homeCardStatsTypographyStyle: CSSProperties = {
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 850,
};

export const diarySummaryCardLinkStyle: CSSProperties = {
  display: "grid",
  gridTemplateRows: "auto auto",
  justifyItems: "center",
  alignContent: "start",
  gap: "6px",
  minWidth: 0,
  width: "100%",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  border: "none",
  background: "transparent",
  boxSizing: "border-box",
  WebkitTapHighlightColor: "transparent",
};

export const diarySummaryCoverStyle: CSSProperties = {
  width: "100%",
  aspectRatio: "3 / 4",
  borderRadius: "12px",
  overflow: "hidden",
  background:
    "linear-gradient(135deg, var(--historietas-perfil-surface, #050505) 0%, var(--historietas-perfil-bg-deep, #000000) 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  border: "none",
  boxShadow: "none",
  boxSizing: "border-box",
};

export const diarySummaryCardTitleStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  minHeight: "28px",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "10.5px",
  lineHeight: 1.3,
  ...homeCardTitleTypographyStyle,
  textAlign: "center",
  overflow: "hidden",
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflowWrap: "anywhere",
};

export const diaryVisualCardStyle: CSSProperties = {
  display: "grid",
  gap: 0,
  minWidth: 0,
  maxWidth: "100%",
  width: "100%",
  boxSizing: "border-box",
  overflow: "visible",
  position: "relative",
  border: "0",
  borderBottom: "0",
  outline: "none",
  boxShadow: "none",
  background: "transparent",
};

export const desktopDiaryVisualCardStyle: CSSProperties = {
  ...diaryVisualCardStyle,
};

export const diaryVisualCoverLinkStyle: CSSProperties = {
  display: "block",
  textDecoration: "none",
  textDecorationLine: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  minWidth: 0,
  maxWidth: "100%",
  border: "0",
  borderBottom: "0",
  outline: "none",
  boxShadow: "none",
  background: "transparent",
  width: "100%",
};


export const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};


export const profileLibrarySectionStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
  width: "100%",
  marginTop: "14px",
  minWidth: 0,
};

export const desktopProfileLibrarySectionStyle: CSSProperties = {
  ...profileLibrarySectionStyle,
  gap: "18px",
  marginTop: "18px",
};


export const profileLibraryTabsStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  overflowX: "auto",
  overflowY: "hidden",
  WebkitOverflowScrolling: "touch",
  scrollbarWidth: "none",
  padding: "0 2px 4px",
  minWidth: 0,
  maxWidth: "100%",
};

export const desktopProfileLibraryTabsStyle: CSSProperties = {
  ...profileLibraryTabsStyle,
  width: "100%",
  justifyContent: "center",
  alignItems: "center",
  flexWrap: "wrap",
  overflowX: "visible",
  padding: "0 0 4px",
};

export const profileLibraryTabStyle: CSSProperties = {
  flex: "0 0 auto",
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  background:
    "var(--historietas-bg-start, var(--historietas-perfil-bg-page, #000000))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10.5px",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  padding: "0 12px",
  boxSizing: "border-box",
  whiteSpace: "nowrap",
};

export const profileLibraryTabActiveStyle: CSSProperties = {
  ...profileLibraryTabStyle,
  background:
    "var(--historietas-bg-start, var(--historietas-perfil-bg-page, #000000))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  border: "1px solid rgba(255,255,255,0.14)",
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

export const perfilAutorThemeCss = `
  @keyframes historietas-perfil-heart-pop {
    0% { transform: scale(1); }
    45% { transform: scale(1.28); }
    100% { transform: scale(1); }
  }

  @media (prefers-reduced-motion: reduce) {
    [data-historietas-top-five-like="true"] svg {
      animation-duration: 1ms !important;
    }
  }

  html {
    --historietas-perfil-bg-page: #000000;
    --historietas-perfil-bg-deep: #000000;
    --historietas-perfil-surface: #050505;
    --historietas-perfil-surface-alt: #090909;
    --historietas-perfil-accent: #FFFFFF;
    --historietas-perfil-accent-strong: #FFFFFF;
    --historietas-perfil-accent-soft: #FFFFFF;
    --historietas-perfil-gold: #FFFFFF;
    --historietas-perfil-danger-soft: #FFFFFF;
    --historietas-perfil-danger: #FFFFFF;
    --historietas-perfil-rose-soft: #D4D4D8;
    --historietas-perfil-rose: #FFFFFF;
    --historietas-perfil-success-soft: #FFFFFF;
    --historietas-perfil-lavender-text: #FFFFFF;
    --historietas-perfil-purple-soft: #FFFFFF;
    --historietas-perfil-blue-soft: #D4D4D8;
    --historietas-perfil-lavender: #FFFFFF;
    --historietas-perfil-purple: #FFFFFF;
    --historietas-perfil-secondary: #A1A1AA;
    --historietas-perfil-accent-14: rgba(255,255,255,0.08);
    --historietas-perfil-rose-14: rgba(255,255,255,0.08);
    --historietas-perfil-success-14: rgba(255,255,255,0.08);
    --historietas-perfil-gold-14: rgba(255,255,255,0.08);
    --historietas-perfil-purple-soft-14: rgba(255,255,255,0.08);
    --historietas-perfil-blue-14: rgba(255,255,255,0.08);
    --historietas-perfil-secondary-18: rgba(255,255,255,0.08);
    --historietas-perfil-deep-72: rgba(0,0,0,0.72);
    --historietas-perfil-success-spaced-12: rgba(255,255,255,0.06);
    --historietas-perfil-success-spaced-22: rgba(255,255,255,0.10);
    --historietas-perfil-emerald-18: rgba(255,255,255,0.08);
    --historietas-perfil-emerald-38: rgba(255,255,255,0.18);
    --historietas-perfil-danger-dark-spaced-28: rgba(255,255,255,0.10);
    --historietas-perfil-danger-spaced-22: rgba(255,255,255,0.10);
    --historietas-perfil-purple-dark-58: rgba(255,255,255,0.14);
    --historietas-perfil-danger-42: rgba(255,255,255,0.24);
    --historietas-perfil-danger-dark-24: rgba(255,255,255,0.08);
    --historietas-perfil-danger-36: rgba(255,255,255,0.20);
    --historietas-perfil-danger-dark-34: rgba(255,255,255,0.12);
    --historietas-perfil-gold-spaced-34: rgba(255,255,255,0.18);
    --historietas-perfil-surface-fade-0: rgba(0,0,0,0);
    --historietas-perfil-surface-fade-58: rgba(0,0,0,0.58);
    --historietas-perfil-surface-fade-92: rgba(0,0,0,0.92);
    --historietas-perfil-success-10: rgba(255,255,255,0.06);
    --historietas-perfil-success-22: rgba(255,255,255,0.10);
    --historietas-perfil-rose-dark-14: rgba(255,255,255,0.08);
    --historietas-perfil-rose-28: rgba(255,255,255,0.14);
    --historietas-perfil-surface-purple-92: rgba(0,0,0,0.92);
    --historietas-perfil-surface-purple-94: rgba(5,5,5,0.94);
  }

  @keyframes historietas-loading-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .historietas-loading-spinner {
      animation-duration: 1.4s !important;
    }
  }


`;

export const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background:
    "var(--historietas-bg-start, var(--historietas-perfil-bg-page, #000000))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

export const loadingPageStyle: CSSProperties = {
  width: "100%",
  minHeight: "calc(100dvh - 32px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
};

export const loadingInlineStyle: CSSProperties = {
  width: "100%",
  minHeight: "72px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
};

export const loadingSpinnerStyle: CSSProperties = {
  width: "30px",
  height: "30px",
  borderRadius: "999px",
  border: "3px solid rgba(255,255,255,0.20)",
  borderTopColor: "#FFFFFF",
  boxSizing: "border-box",
  animation: "historietas-loading-spin 0.78s linear infinite",
  flex: "0 0 auto",
};

export const loadingSpinnerCompactStyle: CSSProperties = {
  ...loadingSpinnerStyle,
  width: "24px",
  height: "24px",
  borderWidth: "2.5px",
};

export const containerStyle: CSSProperties = {
  position: "relative",
  width: "min(900px, calc(100% - 28px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "16px 0 12px",
  boxSizing: "border-box",
  minWidth: 0,
};


export const logoStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  minWidth: 0,
  maxWidth: "min(100%, calc(100% - 96px))",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  ...safeTextStyle,
};

export const logoMarkButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  padding: 0,
  border: "none",
  background: "transparent",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  cursor: "pointer",
};

export const logoTextButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  padding: 0,
  border: "none",
  background: "transparent",
  display: "inline-flex",
  alignItems: "center",
  minWidth: 0,
  maxWidth: "100%",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  cursor: "copy",
};

export const logoMarkStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-perfil-bg-deep, #000000)",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: 0,
  flex: "0 0 auto",
  border: "1px solid var(--historietas-perfil-purple-dark-58, rgba(59, 7, 100, 0.58))",
  boxShadow: "none",
};

export const logoTextStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "min(58vw, 360px)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  background: "none",
  fontSize: "17px",
  lineHeight: 1,
  ...homeCardTitleTypographyStyle,
  textShadow: "none",
  ...safeTextStyle,
};

export const profileHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 36px",
  alignItems: "center",
  gap: "8px",
  marginBottom: "12px",
  minWidth: 0,
};

export const profileHeaderDesktopStyle: CSSProperties = {
  ...profileHeaderStyle,
  gridTemplateColumns: "minmax(0, 1fr) 36px",
};



export const profileHeaderLogoStyle: CSSProperties = {
  ...logoStyle,
};




export const profileMenuButtonStyle: CSSProperties = {
  width: "32px",
  height: "32px",
  borderRadius: "999px",
  border: "1px solid transparent",
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "23px",
  lineHeight: 1,
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  padding: 0,
};

export const profileMenuIconStyle: CSSProperties = {
  width: "22px",
  display: "grid",
  gap: "4px",
};

export const profileMenuIconLineStyle: CSSProperties = {
  display: "block",
  width: "100%",
  height: "2.5px",
  borderRadius: "999px",
  background: "currentColor",
};

export const menuOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  background: "rgba(0,0,0,0.62)",
  display: "flex",
  alignItems: "stretch",
  justifyContent: "flex-end",
  padding: 0,
  boxSizing: "border-box",
};

export const menuSheetStyle: CSSProperties = {
  width: "min(360px, calc(100vw - 72px))",
  height: "100dvh",
  maxHeight: "100dvh",
  borderRadius: 0,
  border: "0",
  background: "var(--historietas-perfil-bg-page, #000000)",
  padding: "22px 16px calc(132px + env(safe-area-inset-bottom, 0px))",
  display: "grid",
  alignContent: "start",
  gap: "18px",
  boxSizing: "border-box",
  overflowY: "auto",
  overscrollBehavior: "contain",
};

export const desktopMenuSheetStyle: CSSProperties = {
  ...menuSheetStyle,
  width: "360px",
  maxWidth: "calc(100vw - 80px)",
};


export const menuHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  padding: "2px 0 4px",
  minWidth: 0,
};

export const menuTitleBlockStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
  minWidth: 0,
};

export const menuTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "14px",
  fontWeight: 950,
  lineHeight: 1.2,
  ...safeTextStyle,
};

export const menuSubtitleStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 850,
  lineHeight: 1.25,
  ...safeTextStyle,
};

export const menuCloseButtonStyle: CSSProperties = {
  width: "40px",
  height: "40px",
  borderRadius: "999px",
  border: "0",
  background: "rgba(255,255,255,0.075)",
  color: "#FFFFFF",
  fontSize: "20px",
  lineHeight: 1,
  fontWeight: 900,
  fontFamily: "inherit",
  cursor: "pointer",
};

export const menuListStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
  paddingBottom: "24px",
};

export const menuSectionTitleStyle: CSSProperties = {
  marginTop: "8px",
  color: "rgba(255,255,255,0.52)",
  fontSize: "10px",
  lineHeight: 1.2,
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  ...safeTextStyle,
};

export const menuDividerStyle: CSSProperties = {
  height: "1px",
  background: "rgba(255,255,255,0.075)",
  margin: "8px 0 4px",
};

export const menuItemStyle: CSSProperties = {
  width: "100%",
  minHeight: "52px",
  borderRadius: "0",
  border: "0",
  background: "transparent",
  color: "#FFFFFF",
  textDecoration: "none",
  display: "grid",
  gridTemplateColumns: "32px minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "10px",
  padding: "0",
  boxSizing: "border-box",
  fontFamily: "inherit",
  cursor: "pointer",
  textAlign: "left",
};

export const menuDangerItemStyle: CSSProperties = {
  ...menuItemStyle,
  color: "var(--historietas-perfil-danger-soft, #FFFFFF)",
};

export const menuItemIconStyle: CSSProperties = {
  width: "32px",
  height: "32px",
  borderRadius: "10px",
  background: "transparent",
  color: "rgba(255,255,255,0.82)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "16px",
};

export const menuItemTextStyle: CSSProperties = {
  fontSize: "15px",
  fontWeight: 900,
  lineHeight: 1.2,
  color: "inherit",
  ...safeTextStyle,
};

export const menuChevronStyle: CSSProperties = {
  color: "rgba(255,255,255,0.52)",
  fontSize: "26px",
  lineHeight: 1,
  fontWeight: 700,
  textAlign: "right",
};

export const menuNotificationLabelStyle: CSSProperties = {
  minWidth: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "6px",
};

export const menuNotificationRightStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "6px",
  minWidth: 0,
};

export const menuNotificationBadgeStyle: CSSProperties = {
  display: "inline",
  color: "var(--historietas-perfil-danger, #FFFFFF)",
  fontSize: "12px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  pointerEvents: "none",
};




export const heroBoxStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  padding: "4px 2px 8px",
  borderRadius: "0",
  background: "transparent",
  border: "0",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
};

export const authorTopRowStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  gridTemplateColumns: "76px minmax(0, 1fr)",
  alignItems: "center",
  justifyItems: "stretch",
  gap: "14px",
  minHeight: "76px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
};

export const authorHeaderInfoStyle: CSSProperties = {
  display: "grid",
  gridTemplateRows: "auto auto",
  alignContent: "center",
  gap: "6px",
  minWidth: 0,
  width: "100%",
  maxWidth: "100%",
  overflow: "visible",
  boxSizing: "border-box",
};

export const authorTextBlockStyle: CSSProperties = {
  display: "grid",
  justifyItems: "start",
  gap: "2px",
  alignContent: "center",
  minWidth: 0,
  width: "100%",
  maxWidth: "100%",
  textAlign: "left",
};

export const avatarBaseStyle: CSSProperties = {
  position: "relative",
  left: "auto",
  top: "auto",
  transform: "none",
  width: "76px",
  maxWidth: "76px",
  height: "76px",
  borderRadius: "20px",
  border: "1px solid var(--historietas-perfil-purple-dark-58, rgba(59, 7, 100, 0.58))",
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-perfil-bg-deep, #000000)",
  color: "#FFFFFF",
  fontSize: "24px",
  fontWeight: 950,
  overflow: "hidden",
  fontFamily: "inherit",
  boxSizing: "border-box",
  boxShadow: "none",
};

export const avatarButtonStyle: CSSProperties = {
  ...avatarBaseStyle,
  cursor: "pointer",
};

export const avatarDisplayStyle: CSSProperties = {
  ...avatarBaseStyle,
  cursor: "default",
};

export const avatarImageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

export const hiddenInputStyle: CSSProperties = {
  display: "none",
};

export const profileEditorSheetContentStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
  minWidth: 0,
  maxWidth: "100%",
  paddingBottom: "24px",
  boxSizing: "border-box",
};

export const profileEditorAvatarBlockStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "10px",
  minWidth: 0,
  padding: "6px 0 2px",
};

export const profileEditorAvatarPreviewStyle: CSSProperties = {
  width: "88px",
  height: "88px",
  borderRadius: "24px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-perfil-bg-deep, #000000)",
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  boxSizing: "border-box",
  fontSize: "30px",
  lineHeight: 1,
  fontWeight: 950,
};

export const profileEditorSheetFieldStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  width: "100%",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

export const profileEditorSheetLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.2,
  fontWeight: 900,
  textAlign: "left",
  ...safeTextStyle,
};

export const profileEditorSheetInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "44px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-perfil-surface, #050505)",
  color: "#FFFFFF",
  padding: "0 14px",
  outline: "none",
  fontSize: "13px",
  lineHeight: 1.2,
  fontWeight: 850,
  fontFamily: "inherit",
  textAlign: "left",
  boxSizing: "border-box",
  minWidth: 0,
  maxWidth: "100%",
  ...safeTextStyle,
};

export const profileEditorSheetTextareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "112px",
  resize: "vertical",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-perfil-surface, #050505)",
  color: "#FFFFFF",
  padding: "12px 14px",
  outline: "none",
  fontSize: "13px",
  lineHeight: 1.45,
  fontWeight: 650,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
  maxWidth: "100%",
  ...safeTextStyle,
};

export const profileEditorSheetActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "8px",
  minWidth: 0,
  marginTop: "4px",
};

export const profileEditorCancelButtonStyle: CSSProperties = {
  minHeight: "44px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  color: "#FFFFFF",
  fontSize: "12px",
  lineHeight: 1,
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
};

export const profileEditorSaveButtonStyle: CSSProperties = {
  ...profileEditorCancelButtonStyle,
  border: "1px solid #FFFFFF",
  background: "#FFFFFF",
  color: "#111111",
};

export const avatarActionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "stretch",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

export const avatarSmallButtonStyle: CSSProperties = {
  flex: "1 1 118px",
  minHeight: "28px",
  maxWidth: "100%",
  padding: "0 9px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-perfil-surface, #050505)",
  color: "#FFFFFF",
  fontSize: "9px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

export const avatarRemoveButtonStyle: CSSProperties = {
  ...avatarSmallButtonStyle,
};

export const avatarErrorStyle: CSSProperties = {
  color: "var(--historietas-perfil-danger-soft, #FFFFFF)",
  fontSize: "10px",
  fontWeight: 800,
  ...safeTextStyle,
};


export const bioCounterStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "9px",
  fontWeight: 900,
  textAlign: "right",
  ...safeTextStyle,
};

export const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(20px, 5.2vw, 27px)",
  lineHeight: 1.18,
  ...homeCardTitleTypographyStyle,
  maxWidth: "100%",
  minWidth: 0,
  paddingRight: "6px",
  paddingBottom: 0,
  overflow: "visible",
  textAlign: "left",
  background: "none",
  WebkitBackgroundClip: "initial",
  backgroundClip: "initial",
  WebkitTextFillColor: "#FFFFFF",
  color: "#FFFFFF",
  whiteSpace: "nowrap",
  wordBreak: "normal",
  overflowWrap: "normal",
};

export const descriptionStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10.5px",
  lineHeight: 1.4,
  fontWeight: 650,
  width: "min(520px, 100%)",
  maxWidth: "520px",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  textAlign: "left",
  ...safeTextStyle,
};

export const profileNameRowStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
};


export const profileAddBioButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "fit-content",
  maxWidth: "100%",
  minHeight: "28px",
  padding: "0 11px",
  borderRadius: "999px",
  border: "none",
  background: "rgba(255,255,255,0.06)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "10px",
  lineHeight: 1.15,
  fontWeight: 900,
  fontFamily: "inherit",
  cursor: "pointer",
  textAlign: "left",
  ...safeTextStyle,
};

export const profileStatsStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "0",
  marginTop: 0,
  minWidth: 0,
  borderTop: "0",
  borderBottom: "0",
};

export const desktopProfileStatsStyle: CSSProperties = {
  ...profileStatsStyle,
  width: "100%",
  margin: 0,
};

export const profileStatItemStyle: CSSProperties = {
  minHeight: "39px",
  borderRadius: 0,
  background: "transparent",
  border: "0",
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  gap: "3px",
  padding: "4px 2px",
  boxSizing: "border-box",
  minWidth: 0,
};

export const profileStatLinkStyle: CSSProperties = {
  ...profileStatItemStyle,
  color: "inherit",
  textDecoration: "none",
  cursor: "pointer",
};

export const profileStatNumberStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "18.5px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

export const profileStatWorksNumberStyle: CSSProperties = {
  ...profileStatNumberStyle,
  position: "relative",
  top: "5px",
};

export const profileStatLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "8.8px",
  lineHeight: 1.1,
  fontWeight: 850,
  textTransform: "none",
  letterSpacing: "0",
  textAlign: "center",
  ...safeTextStyle,
};

export const profileStatStackedLabelStyle: CSSProperties = {
  ...profileStatLabelStyle,
  display: "grid",
  justifyItems: "center",
  gap: 0,
  whiteSpace: "nowrap",
};

export const profileStatWorksLabelStyle: CSSProperties = {
  ...profileStatStackedLabelStyle,
  position: "relative",
  top: "5px",
};

export const profileRatingStatItemStyle: CSSProperties = {
  ...profileStatItemStyle,
  gap: "3px",
};

export const profileRatingPrivateLockStyle: CSSProperties = {
  width: "25px",
  height: "29px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  position: "relative",
  top: "-2px",
  lineHeight: 1,
  flex: "0 0 auto",
};

export const profileRatingNumberStyle: CSSProperties = {
  ...profileStatNumberStyle,
  color: "var(--historietas-accent, var(--historietas-perfil-accent-soft, #FFFFFF))",
  position: "relative",
  top: "5px",
};

export const profileRatingStackedMetaStyle: CSSProperties = {
  display: "grid",
  gridTemplateRows: "10px 9.68px",
  alignItems: "center",
  justifyItems: "center",
  gap: 0,
  position: "relative",
  top: "5px",
  minWidth: 0,
  whiteSpace: "nowrap",
};

export const profileRatingMiniStarsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "1px",
  color: "var(--historietas-perfil-gold, #FBBF24)",
  fontSize: "10px",
  lineHeight: 1,
  letterSpacing: "-0.02em",
  position: "relative",
  top: "-1px",
  ...safeTextStyle,
};

export const profileRatingMiniStarVisualStyle: CSSProperties = {
  position: "relative",
  width: "1em",
  height: "1em",
  display: "inline-block",
  lineHeight: 1,
  flex: "0 0 auto",
};

export const profileRatingMiniStarBaseStyle: CSSProperties = {
  color: "var(--historietas-perfil-gold-spaced-34, rgba(251, 191, 36, 0.34))",
  position: "absolute",
  inset: 0,
  lineHeight: 1,
};

export const profileRatingMiniStarFillStyle: CSSProperties = {
  color: "var(--historietas-perfil-gold, #FBBF24)",
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  whiteSpace: "nowrap",
  lineHeight: 1,
};

export const profileRatingTotalStyle: CSSProperties = {
  ...profileStatLabelStyle,
  fontSize: "7.8px",
  lineHeight: 1.1,
  whiteSpace: "nowrap",
};

export const authorRatingBoxStyle: CSSProperties = {
  marginTop: "10px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  display: "grid",
  gap: "8px",
  minWidth: 0,
  boxSizing: "border-box",
};

export const desktopAuthorRatingBoxStyle: CSSProperties = {
  ...authorRatingBoxStyle,
  width: "min(420px, 100%)",
  margin: "12px auto 0",
};

export const authorRatingHeaderStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "3px",
  minWidth: 0,
  textAlign: "center",
};

export const authorRatingTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.075em",
  maxWidth: "100%",
  textAlign: "center",
  ...safeTextStyle,
};


export const authorRatingStarsRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
  background: "transparent",
  boxShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

export const authorRatingStarButtonStyle: CSSProperties = {
  minHeight: "auto",
  borderRadius: 0,
  border: "none",
  background: "transparent",
  color: "var(--historietas-perfil-gold-spaced-34, rgba(251, 191, 36, 0.34))",
  fontSize: "22px",
  fontWeight: 950,
  lineHeight: 1,
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
  padding: "0 2px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

export const authorRatingStarActiveStyle: CSSProperties = {
  ...authorRatingStarButtonStyle,
  border: "none",
  background: "transparent",
  color: "var(--historietas-perfil-gold, #FBBF24)",
  boxShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

export const authorRatingStarVisualStyle: CSSProperties = {
  position: "relative",
  width: "1em",
  height: "1em",
  display: "inline-block",
  lineHeight: 1,
};

export const authorRatingStarBaseStyle: CSSProperties = {
  color: "var(--historietas-perfil-gold-spaced-34, rgba(251, 191, 36, 0.34))",
  position: "absolute",
  inset: 0,
  lineHeight: 1,
};

export const authorRatingStarFillStyle: CSSProperties = {
  color: "var(--historietas-perfil-gold, #FBBF24)",
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  whiteSpace: "nowrap",
  lineHeight: 1,
};

export const profileActionsStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "7px",
  marginTop: "1px",
  minWidth: 0,
};

export const desktopProfileActionsStyle: CSSProperties = {
  ...profileActionsStyle,
  width: "min(640px, 100%)",
  margin: "4px auto 0",
  gap: "10px",
};

export const profileVisitorActionsStyle: CSSProperties = {
  ...profileActionsStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
};

export const desktopProfileVisitorActionsStyle: CSSProperties = {
  ...desktopProfileActionsStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
};

export const profileActionToastStyle: CSSProperties = {
  position: "fixed",
  left: "50%",
  bottom: "calc(92px + env(safe-area-inset-bottom))",
  transform: "translateX(-50%)",
  zIndex: 1400,
  width: "max-content",
  maxWidth: "calc(100vw - 32px)",
  minHeight: "38px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.14))",
  background: "var(--historietas-surface-strong, #120822)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  boxShadow: "0 14px 34px rgba(0,0,0,0.38)",
  padding: "9px 14px",
  fontSize: "11px",
  lineHeight: 1.3,
  fontWeight: 900,
  textAlign: "center",
  pointerEvents: "none",
};

export const profilePrimaryButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-perfil-surface, #050505)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "10px",
  lineHeight: 1.15,
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 8px",
  boxSizing: "border-box",
  minWidth: 0,
  whiteSpace: "normal",
  ...safeTextStyle,
};

export const profileSecondaryButtonStyle: CSSProperties = {
  ...profilePrimaryButtonStyle,
  border: profilePrimaryButtonStyle.border,
  background: profilePrimaryButtonStyle.background,
  color: profilePrimaryButtonStyle.color,
  boxShadow: "none",
};

export const profileActiveButtonStyle: CSSProperties = {
  ...profilePrimaryButtonStyle,
  border: profilePrimaryButtonStyle.border,
  background: profilePrimaryButtonStyle.background,
  color: profilePrimaryButtonStyle.color,
  boxShadow: "none",
};

export const authorHighlightsStyle: CSSProperties = {
  width: "100%",
  marginTop: "0",
  display: "grid",
  gap: "3px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
};

export const desktopAuthorHighlightsStyle: CSSProperties = {
  ...authorHighlightsStyle,
  marginTop: "0",
};

export const authorHighlightsHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

export const authorHighlightsTitleGroupStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "7px",
  minWidth: 0,
  flex: "1 1 auto",
};

export const authorHighlightsTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  lineHeight: 1.1,
  fontWeight: 950,
  letterSpacing: "-0.02em",
  ...safeTextStyle,
};

export const authorHighlightsHeaderActionsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "8px",
  flex: "0 0 auto",
};

export const authorHighlightsLikeButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "5px",
  minWidth: 0,
  height: "22px",
  padding: 0,
  border: "none",
  borderRadius: 0,
  background: "transparent",
  color: "var(--historietas-text-muted, rgba(255,255,255,0.76))",
  fontSize: "11px",
  lineHeight: 1,
  fontWeight: 850,
  cursor: "pointer",
  boxSizing: "border-box",
  WebkitTapHighlightColor: "transparent",
  ...safeTextStyle,
};

export const authorHighlightsLikeButtonActiveStyle: CSSProperties = {
  ...authorHighlightsLikeButtonStyle,
  color: "var(--historietas-perfil-danger, #FFFFFF)",
};

export const authorHighlightsLikeHeartIconStyle: CSSProperties = {
  width: "18px",
  height: "18px",
  display: "block",
  flex: "0 0 auto",
  transformOrigin: "center",
};

export const authorHighlightsLikeCountStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  lineHeight: 1,
  fontWeight: 850,
  ...safeTextStyle,
};

export const authorHighlightsTopFiveButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 2px",
  border: "none",
  borderRadius: 0,
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 900,
  textDecoration: "none",
  boxSizing: "border-box",
  flex: "0 0 auto",
};

export const authorHighlightsListStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, 70px)",
  alignItems: "start",
  justifyContent: "center",
  columnGap: "3px",
  rowGap: "0",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  overflow: "visible",
  padding: "0",
  margin: 0,
  scrollSnapType: "none",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  touchAction: "pan-y",
  overscrollBehaviorX: "none",
};

export const desktopAuthorHighlightsListStyle: CSSProperties = {
  ...authorHighlightsListStyle,
  gridTemplateColumns: "repeat(5, 70px)",
  justifyContent: "center",
  columnGap: "3px",
  rowGap: "0",
  width: "100%",
  maxWidth: "100%",
  padding: "0",
  margin: 0,
};

export const authorHighlightItemStyle: CSSProperties = {
  flex: "0 0 70px",
  width: "70px",
  minWidth: "70px",
  maxWidth: "70px",
  scrollSnapAlign: "none",
  display: "grid",
  justifyItems: "stretch",
  gap: "0",
  textDecoration: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  boxSizing: "border-box",
};

export const authorHighlightCoverStyle: CSSProperties = {
  width: "100%",
  aspectRatio: "70 / 99",
  minHeight: "0",
  borderRadius: "16px",
  position: "relative",
  overflow: "hidden",
  background: "var(--historietas-perfil-surface, #050505)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  border: "none",
  boxShadow: "none",
  boxSizing: "border-box",
};

export const profileTabsStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  alignItems: "end",
  gap: 0,
  margin: "4px 0 0",
  padding: 0,
  minWidth: 0,
  maxWidth: "100%",
  background: "none",
  backgroundColor: "transparent",
  backgroundImage: "none",
  border: "none",
  borderRadius: 0,
  boxShadow: "none",
  outline: "none",
  overflow: "visible",
};

export const profileTabStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  minHeight: "34px",
  border: "none",
  borderBottom: "2px solid transparent",
  borderRadius: 0,
  background: "none",
  backgroundColor: "transparent",
  backgroundImage: "none",
  boxShadow: "none",
  outline: "none",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "clamp(9px, 2.45vw, 10.5px)",
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  textAlign: "center",
  padding: "0 3px",
  boxSizing: "border-box",
  ...safeTextStyle,
  whiteSpace: "nowrap",
  wordBreak: "normal",
  overflowWrap: "normal",
};

export const profileTabActiveStyle: CSSProperties = {
  ...profileTabStyle,
  color: "var(--historietas-text-primary, #FFFFFF)",
  borderBottom: "2px solid currentColor",
};

export const profileAboutBoxStyle: CSSProperties = {
  marginTop: "10px",
  padding: "8px 2px",
  display: "grid",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  textAlign: "center",
};

export const profileAboutTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "16px",
  lineHeight: 1.15,
  fontWeight: 950,
  letterSpacing: "-0.035em",
  ...safeTextStyle,
};

export const profileAboutTextStyle: CSSProperties = {
  margin: 0,
  width: "100%",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.4,
  fontWeight: 650,
  textAlign: "center",
  ...safeTextStyle,
};

export const profileAboutTextRowStyle: CSSProperties = {
  width: "min(560px, 100%)",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  justifyItems: "center",
  alignItems: "start",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  position: "relative",
};

export const profileAboutEditButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "24px",
  height: "24px",
  borderRadius: "999px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "12px",
  lineHeight: 1,
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  position: "absolute",
  top: "-2px",
  right: 0,
};

export const profileAboutEditorStyle: CSSProperties = {
  width: "min(560px, 100%)",
  margin: "0 auto",
  display: "grid",
  gap: "5px",
  minWidth: 0,
};

export const profileAboutTextareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "104px",
  resize: "vertical",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-perfil-surface, #050505)",
  color: "#FFFFFF",
  padding: "10px 11px",
  outline: "none",
  fontSize: "11px",
  lineHeight: 1.45,
  fontWeight: 650,
  fontFamily: "inherit",
  boxSizing: "border-box",
  minWidth: 0,
  maxWidth: "100%",
  ...safeTextStyle,
};

export const profileAboutCounterStyle: CSSProperties = {
  color: "var(--historietas-accent, var(--historietas-perfil-accent-soft, #FFFFFF))",
  fontSize: "9px",
  fontWeight: 900,
  textAlign: "right",
  ...safeTextStyle,
};



export const profileAboutHeroStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  justifyItems: "center",
  minWidth: 0,
};


export const profileAboutContentGridStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  minWidth: 0,
};

export const profileAboutPanelStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
  padding: 0,
  border: "none",
  background: "transparent",
  boxShadow: "none",
  boxSizing: "border-box",
};

export const profileAboutPanelTitleStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "12px",
  lineHeight: 1.2,
  fontWeight: 950,
  textAlign: "left",
  ...safeTextStyle,
};

export const profileAboutChipsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  minWidth: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
};

export const profileAboutChipStyle: CSSProperties = {
  minHeight: "auto",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  borderRadius: 0,
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #E4E4E7)",
  fontSize: "10.5px",
  fontWeight: 900,
  ...safeTextStyle,
};

export const profileAboutMetricsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
};

export const profileAboutMetricCardStyle: CSSProperties = {
  minWidth: 0,
  minHeight: "42px",
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  gap: "3px",
  borderRadius: "12px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "rgba(255,255,255,0.04)",
  padding: "7px 4px",
  boxSizing: "border-box",
};

export const profileAboutMetricNumberStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  lineHeight: 1,
  fontWeight: 950,
  ...safeTextStyle,
};

export const profileAboutMetricLabelStyle: CSSProperties = {
  color: "var(--historietas-text-muted, #A1A1AA)",
  fontSize: "8px",
  lineHeight: 1.2,
  fontWeight: 850,
  textTransform: "lowercase",
  ...safeTextStyle,
};

export const profileAboutRowsStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
};

export const profileAboutRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  minHeight: "24px",
  padding: "0 2px",
  borderRadius: 0,
  background: "transparent",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10.5px",
  lineHeight: 1.2,
  fontWeight: 800,
  textAlign: "left",
  ...safeTextStyle,
};

export const profileAboutMemberSinceStyle: CSSProperties = {
  margin: "5px 0 0",
  color: "var(--historietas-text-muted, #A1A1AA)",
  fontSize: "10px",
  lineHeight: 1.25,
  fontWeight: 800,
  textAlign: "center",
  ...safeTextStyle,
};







export const authorCommunityBoxStyle: CSSProperties = {
  marginTop: "10px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  display: "grid",
  justifyItems: "center",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  textAlign: "center",
};

export const authorCommunityIntroStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  justifyItems: "center",
  gap: "5px",
  minWidth: 0,
};


export const authorCommunityTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "15px",
  lineHeight: 1.08,
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

export const diaryMainTitleStyle: CSSProperties = {
  ...authorCommunityTitleStyle,
  color: "#FFFFFF",
};

export const diaryTitleToolbarStyle: CSSProperties = {
  width: "100%",
  position: "relative",
  display: "grid",
  justifyItems: "center",
  alignItems: "center",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  textAlign: "center",
};

export const diaryMainReadingLinkStyle: CSSProperties = {
  position: "absolute",
  right: 0,
  top: "50%",
  transform: "translateY(-50%)",
  width: "22px",
  height: "22px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  boxSizing: "border-box",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 900,
  textDecoration: "none",
};


export const authorCommunityGridStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "5px",
  minWidth: 0,
};



export const authorCommunityCardStyle: CSSProperties = {
  minHeight: "48px",
  padding: "6px 4px",
  borderRadius: "16px",
  background: "var(--historietas-perfil-surface, #050505)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  display: "grid",
  justifyItems: "center",
  alignContent: "center",
  gap: "3px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  boxShadow: "none",
};

export const authorCommunityCardNumberStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "14px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

export const authorCommunityCardTitleStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "0.055em",
  textAlign: "center",
  ...safeTextStyle,
};

export const authorCommunityCardTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "7.5px",
  lineHeight: 1.1,
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.035em",
  textAlign: "center",
  ...safeTextStyle,
};

export const authorCommunityPreviewStyle: CSSProperties = {
  width: "100%",
  padding: "9px",
  borderRadius: "18px",
  background: "var(--historietas-perfil-surface, #050505)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "grid",
  gridTemplateColumns: "28px minmax(0, 1fr)",
  alignItems: "center",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  textAlign: "left",
};

export const authorCommunityPreviewIconStyle: CSSProperties = {
  width: "28px",
  height: "28px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "13px",
  lineHeight: 1,
  flexShrink: 0,
};

export const authorCommunityPreviewTextBlockStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  minWidth: 0,
};

export const authorCommunityPreviewTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  lineHeight: 1.15,
  fontWeight: 950,
  ...safeTextStyle,
};

export const authorCommunityPreviewTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9.2px",
  lineHeight: 1.28,
  fontWeight: 750,
  ...safeTextStyle,
};

export const authorCommunityPostsBlockStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

export const authorCommunityPostsTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  lineHeight: 1.1,
  fontWeight: 950,
  textAlign: "left",
  ...safeTextStyle,
};

export const authorCommunityPostsListStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  alignItems: "stretch",
};

export const authorCommunityPostWrapperStyle: CSSProperties = {
  position: "relative",
  minWidth: 0,
  maxWidth: "100%",
  height: "100%",
};

export const authorCommunityPostStyle: CSSProperties = {
  minHeight: "118px",
  height: "100%",
  padding: "10px",
  borderRadius: "17px",
  background: "var(--historietas-perfil-surface, #050505)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  display: "grid",
  gridTemplateRows: "auto minmax(0, 1fr) auto",
  alignContent: "stretch",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  textAlign: "left",
};

export const authorCommunityPostReportButtonStyle: CSSProperties = {
  position: "absolute",
  right: "9px",
  bottom: "8px",
  minHeight: "27px",
  border: "1px solid rgba(251,113,133,0.28)",
  borderRadius: "999px",
  padding: "5px 9px",
  background: "rgba(159,18,57,0.16)",
  color: "#FDA4AF",
  font: "inherit",
  fontSize: "8px",
  lineHeight: 1,
  fontWeight: 900,
  cursor: "pointer",
  zIndex: 2,
};

export const authorCommunityPostHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  minWidth: 0,
  paddingBottom: "6px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};

export const authorCommunityPostTypeStyle: CSSProperties = {
  color: "var(--historietas-accent, var(--historietas-perfil-accent-soft, #FFFFFF))",
  fontSize: "9px",
  lineHeight: 1,
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.055em",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const authorCommunityPostDateStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "8px",
  lineHeight: 1,
  fontWeight: 800,
  flexShrink: 0,
};

export const authorCommunityPostBodyStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  alignContent: "start",
  gap: "6px",
  paddingTop: "1px",
};

export const authorCommunityPostTextStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #F4F4F5)",
  fontSize: "10px",
  lineHeight: 1.38,
  fontWeight: 800,
  overflow: "hidden",
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  ...safeTextStyle,
};

export const authorCommunityPostPollInfoStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "8px",
  lineHeight: 1.1,
  fontWeight: 850,
  whiteSpace: "nowrap",
};

export const authorCommunityPostWorkStyle: CSSProperties = {
  marginTop: "auto",
  paddingTop: "6px",
  borderTop: "1px solid rgba(255,255,255,0.06)",
  display: "flex",
  alignItems: "center",
  gap: "5px",
  minWidth: 0,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "8px",
  lineHeight: 1.1,
  fontWeight: 900,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};




















export const profileWorksSectionStyle: CSSProperties = {
  marginTop: "10px",
  display: "grid",
  gap: "10px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};




export const profileWorksGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  columnGap: "10px",
  rowGap: "14px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

export const desktopProfileWorksGridStyle: CSSProperties = {
  ...profileWorksGridStyle,
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
  columnGap: "12px",
  rowGap: "18px",
};

export const profileWorkCardStyle: CSSProperties = {
  display: "grid",
  gap: 0,
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
  position: "relative",
  border: "0",
  borderBottom: "0",
  outline: "none",
  boxShadow: "none",
  background: "transparent",
};

export const profileWorkCoverLinkStyle: CSSProperties = {
  display: "block",
  textDecoration: "none",
  textDecorationLine: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  minWidth: 0,
  maxWidth: "100%",
  border: "0",
  borderBottom: "0",
  outline: "none",
  boxShadow: "none",
  background: "transparent",
};

export const profileWorkCoverStyle: CSSProperties = {
  width: "100%",
  aspectRatio: "3 / 4",
  minHeight: "180px",
  borderRadius: "18px",
  position: "relative",
  overflow: "hidden",
  background: "var(--historietas-perfil-surface, #050505)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  border: "0",
  outline: "none",
  boxSizing: "border-box",
  boxShadow: "none",
};

export const desktopProfileWorkCoverStyle: CSSProperties = {
  ...profileWorkCoverStyle,
  minHeight: "240px",
  borderRadius: "20px",
};

export const profileWorkCoverOverlayStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  padding: "28px 42px 9px 10px",
  display: "grid",
  gap: "4px",
  background:
    "linear-gradient(180deg, var(--historietas-perfil-surface-fade-0, rgba(8,5,13,0)) 0%, var(--historietas-perfil-surface-fade-58, rgba(8,5,13,0.58)) 44%, var(--historietas-perfil-surface-fade-92, rgba(8,5,13,0.92)) 100%)",
  boxSizing: "border-box",
  zIndex: 1,
  minWidth: 0,
};

export const profileWorkCoverTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  lineHeight: 1.06,
  ...homeCardTitleTypographyStyle,
  textShadow: "none",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

export const profileWorkCoverMetaStyle: CSSProperties = {
  color: "rgba(244,244,245,0.86)",
  fontSize: "9px",
  lineHeight: 1.18,
  ...homeCardStatsTypographyStyle,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  letterSpacing: "-0.01em",
  textShadow: "none",
  minWidth: 0,
};

export const diaryCardCoverOverlayStyle: CSSProperties = {
  ...profileWorkCoverOverlayStyle,
  padding: "28px 42px 9px 10px",
  justifyItems: "start",
  textAlign: "left",
};

export const diaryCardCoverTitleStyle: CSSProperties = {
  ...profileWorkCoverTitleStyle,
  width: "100%",
  textAlign: "left",
};

export const diaryCardCoverMetaStyle: CSSProperties = {
  ...profileWorkCoverMetaStyle,
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "10px",
  color: "#FFFFFF",
  textAlign: "left",
};

export const diaryCardHeartMetaStyle: CSSProperties = {
  color: "var(--historietas-perfil-danger, #FFFFFF)",
  fontWeight: 950,
};

export const diaryCardCommentMetaStyle: CSSProperties = {
  color: "rgba(255,255,255,0.92)",
  fontWeight: 950,
};










export const profileWorkMenuAnchorStyle: CSSProperties = {
  position: "absolute",
  right: "8px",
  bottom: "8px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "24px",
  height: "24px",
  zIndex: 8,
};

export const profileWorkDotsButtonStyle: CSSProperties = {
  width: "24px",
  height: "24px",
  border: "none",
  borderRadius: 0,
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "21px",
  lineHeight: 1,
  fontWeight: 950,
  fontFamily: "inherit",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  margin: 0,
  flexShrink: 0,
};





































export const desktopContainerStyle: CSSProperties = {
  ...containerStyle,
  width: "min(1180px, calc(100% - 48px))",
  padding: "24px 0 64px",
};

export const desktopHeroBoxStyle: CSSProperties = {
  ...heroBoxStyle,
  padding: "15px 20px",
  borderRadius: "24px",
};

export const desktopAuthorTopRowStyle: CSSProperties = {
  ...authorTopRowStyle,
  gridTemplateColumns: "132px minmax(0, 1fr)",
  gap: "22px",
  minHeight: "132px",
};

export const desktopAvatarBaseStyle: CSSProperties = {
  ...avatarBaseStyle,
  width: "132px",
  maxWidth: "132px",
  height: "132px",
  borderRadius: "32px",
  fontSize: "54px",
};

export const desktopAvatarButtonStyle: CSSProperties = {
  ...desktopAvatarBaseStyle,
  cursor: "pointer",
};

export const desktopAvatarDisplayStyle: CSSProperties = {
  ...desktopAvatarBaseStyle,
  cursor: "default",
};

export const desktopTitleStyle: CSSProperties = {
  ...titleStyle,
  fontSize: "clamp(31px, 3.4vw, 43px)",
  lineHeight: 1.18,
  paddingRight: "8px",
  paddingBottom: 0,
  overflow: "visible",
};

export const desktopDescriptionStyle: CSSProperties = {
  ...descriptionStyle,
  fontSize: "14px",
  lineHeight: 1.58,
  width: "min(520px, 100%)",
  maxWidth: "520px",
  display: "block",
  WebkitLineClamp: "unset",
  overflow: "visible",
};

export const desktopAvatarActionsStyle: CSSProperties = {
  ...avatarActionsStyle,
  maxWidth: "420px",
};

export const desktopAvatarSmallButtonStyle: CSSProperties = {
  ...avatarSmallButtonStyle,
  flex: "0 0 auto",
  minWidth: "150px",
  minHeight: "34px",
  fontSize: "11px",
};

export const desktopAvatarRemoveButtonStyle: CSSProperties = {
  ...desktopAvatarSmallButtonStyle,
};



export const desktopAuthorCommunityBoxStyle: CSSProperties = {
  ...authorCommunityBoxStyle,
  marginTop: "14px",
  gap: "9px",
};

export const desktopAuthorCommunityGridStyle: CSSProperties = {
  ...authorCommunityGridStyle,
  gap: "8px",
};

export const desktopAuthorCommunityPostsListStyle: CSSProperties = {
  ...authorCommunityPostsListStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "10px",
};

















export const diaryBoxStyle: CSSProperties = {
  width: "100%",
  marginTop: "8px",
  padding: "8px 0 138px",
  display: "grid",
  justifyItems: "stretch",
  alignItems: "stretch",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  textAlign: "center",
};


export const diarySectionStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

export const diaryCollapsibleHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: "9px",
  minWidth: 0,
  maxWidth: "100%",
  textAlign: "center",
};

export const diaryToggleButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "5px",
  minHeight: "auto",
  padding: 0,
  borderRadius: 0,
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  fontSize: "11px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "0.01em",
  cursor: "pointer",
  boxSizing: "border-box",
  ...safeTextStyle,
};

export const diaryToggleButtonIconStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "13px",
  lineHeight: 1,
  fontWeight: 950,
};

export const diarySectionTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  lineHeight: 1.15,
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

export const diaryEmptyStateStyle: CSSProperties = {
  width: "100%",
  margin: "0",
  padding: "2px 0",
  background: "transparent",
  border: "0",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  lineHeight: 1.45,
  fontWeight: 750,
  textAlign: "center",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  ...safeTextStyle,
};

export const diaryTimelineStyle: CSSProperties = {
  ...diarySectionStyle,
};

export const diaryTimelineListStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
};

export const diaryTimelineItemStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "7px",
  padding: "8px 9px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.035)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.07))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

export const diaryTimelineDotStyle: CSSProperties = {
  width: "7px",
  height: "7px",
  borderRadius: "999px",
  background: "var(--historietas-accent, var(--historietas-perfil-accent, #FFFFFF))",
};

export const diaryTimelineTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  lineHeight: 1.25,
  fontWeight: 750,
  textAlign: "left",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

export const diaryTimelineDateStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "8px",
  lineHeight: 1,
  fontWeight: 850,
  textAlign: "right",
  whiteSpace: "nowrap",
  ...safeTextStyle,
};

export const desktopDiaryBoxStyle: CSSProperties = {
  ...diaryBoxStyle,
  padding: "12px 12px 28px",
  gap: "10px",
};



export const emptyTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "12px",
  lineHeight: 1.55,
  fontWeight: 700,
  ...safeTextStyle,
};


export const privateProfileNoticeStyle: CSSProperties = {
  width: "100%",
  margin: "12px 0 0",
  padding: "13px 14px",
  borderRadius: "16px",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.1))",
  background:
    "var(--historietas-surface, var(--historietas-perfil-surface, #050505))",
  display: "flex",
  alignItems: "center",
  gap: "11px",
  boxSizing: "border-box",
  minWidth: 0,
  maxWidth: "100%",
  boxShadow: "0 10px 28px rgba(0,0,0,0.16)",
};

export const privateProfileLockStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "11px",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  fontSize: "15px",
  lineHeight: 1,
};

export const privateProfileNoticeTextBlockStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
  minWidth: 0,
};

export const privateProfileNoticeTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  lineHeight: 1.25,
  fontWeight: 900,
  ...safeTextStyle,
};

export const privateProfileNoticeTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10.5px",
  lineHeight: 1.45,
  fontWeight: 650,
  ...safeTextStyle,
};

export const emptyMiniBoxStyle: CSSProperties = {
  borderRadius: "20px",
  padding: "16px",
  background: "var(--historietas-surface, var(--historietas-perfil-surface, #050505))",
  border: "1px dashed var(--historietas-border-soft, rgba(255,255,255,0.14))",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "12px",
  lineHeight: 1.55,
  fontWeight: 750,
  textAlign: "center",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  ...safeTextStyle,
};
