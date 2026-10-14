import type { CSSProperties } from "react";

export const actionSheetOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9998,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  background: "rgba(0,0,0,0.68)",
  overscrollBehavior: "none",
};

export const actionSheetStyle: CSSProperties = {
  width: "min(820px, 100%)",
  maxHeight: "calc(100dvh - 72px)",
  overflowY: "auto",
  borderRadius: "24px 24px 0 0",
  background: "#000000",
  boxShadow: "0 -18px 50px rgba(0,0,0,0.42)",
  padding: "8px 0 calc(14px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
};

export const actionSheetHandleStyle: CSSProperties = {
  width: "68px",
  height: "5px",
  borderRadius: "999px",
  background: "rgba(244,244,245,0.58)",
  display: "block",
  margin: "0 auto 15px",
};

export const actionSheetHeaderStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "5px",
  padding: "0 28px 18px",
  textAlign: "center",
};

export const actionSheetTitleStyle: CSSProperties = {
  maxWidth: "100%",
  color: "#FFFFFF",
  fontSize: "20px",
  fontWeight: 850,
  lineHeight: 1.15,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const actionSheetMetaStyle: CSSProperties = {
  maxWidth: "100%",
  color: "rgba(255,255,255,0.52)",
  fontSize: "13px",
  fontWeight: 600,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const actionSheetDetailStyle: CSSProperties = {
  maxWidth: "100%",
  color: "rgba(255,255,255,0.72)",
  fontSize: "11px",
  fontWeight: 750,
  lineHeight: 1.3,
  textAlign: "center",
  overflowWrap: "anywhere",
};

export const actionSheetActionsStyle: CSSProperties = {
  display: "grid",
};

export const actionSheetButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "100%",
  minHeight: "54px",
  padding: "0 30px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "18px",
  fontSize: "18px",
  fontWeight: 650,
  fontFamily: "inherit",
  textAlign: "left",
  textDecoration: "none",
  cursor: "pointer",
};

export const actionSheetButtonDisabledStyle: CSSProperties = {
  opacity: 0.58,
  cursor: "default",
};

export const actionSheetButtonIconStyle: CSSProperties = {
  minWidth: "24px",
  color: "rgba(255,255,255,0.72)",
  fontSize: "22px",
  lineHeight: 1,
  textAlign: "center",
};

export const actionSheetSelectionDotStyle: CSSProperties = {
  width: "20px",
  height: "20px",
  borderRadius: "999px",
  border: "2.25px solid rgba(161,161,170,0.72)",
  background: "transparent",
  color: "transparent",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  boxSizing: "border-box",
  fontSize: "13px",
  lineHeight: 1,
  fontWeight: 900,
};

export const actionSheetSelectionDotActiveStyle: CSSProperties = {
  ...actionSheetSelectionDotStyle,
  border: "2px solid #FFFFFF",
  background: "#FFFFFF",
  color: "#111111",
};


export const rowSignalsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  flexWrap: "nowrap",
  gap: "5px",
  marginTop: "3px",
  minWidth: 0,
};

export const rowSignalStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: "18px",
  padding: "2px 7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.09)",
  color: "rgba(255,255,255,0.78)",
  fontSize: "9px",
  fontWeight: 850,
  lineHeight: 1,
};

export const rowRatingSignalStyle: CSSProperties = {
  ...rowSignalStyle,
  gap: "3px",
  position: "relative",
  top: 0,
  flex: "0 0 auto",
};

export const rowRatingSignalStarStyle: CSSProperties = {
  display: "inline-block",
  lineHeight: 1,
  transform: "translateY(-0.5px)",
};

export const rowSignalAnnotationToggleStyle: CSSProperties = {
  ...rowSignalStyle,
  cursor: "pointer",
  userSelect: "none",
  WebkitUserSelect: "none",
  WebkitTapHighlightColor: "transparent",
};

export const listDiaryActionSheetReportStyle: CSSProperties = {
  ...actionSheetButtonStyle,
  color: "var(--historietas-danger-button-text, #FCA5A5)",
};

export const listDiaryActionSheetEditorStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  padding: "4px 18px 14px",
  borderBottom: "0",
  boxSizing: "border-box",
};


























export const listDiaryAnnotationTextareaWrapStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  minWidth: 0,
  paddingTop: "13px",
};

export const listDiaryAnnotationTextareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "78px",
  resize: "vertical",
  padding: "8px 48px 8px 9px",
  borderRadius: "11px",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  background: "rgba(255,255,255,0.05)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "9px",
  lineHeight: 1.4,
  fontWeight: 700,
  outline: "none",
  boxSizing: "border-box",
};

export const listDiaryAnnotationEditorMetaStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "8px",
  minWidth: 0,
};

export const listDiaryAnnotationMetaActionsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-end",
  flexWrap: "wrap",
  gap: "5px",
  marginLeft: "auto",
};

export const listDiaryAnnotationSpoilerLabelStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  minHeight: "27px",
  color: "rgba(255,255,255,0.72)",
  fontSize: "8px",
  fontWeight: 850,
  lineHeight: 1,
  whiteSpace: "nowrap",
  cursor: "pointer",
};

export const listDiaryAnnotationSpoilerCheckboxStyle: CSSProperties = {
  width: "13px",
  height: "13px",
  margin: 0,
  accentColor:
    "var(--historietas-accent, var(--historietas-perfil-accent, #FFFFFF))",
  cursor: "pointer",
  flex: "0 0 auto",
};

export const listDiaryAnnotationCounterStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  right: "10px",
  zIndex: 1,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "7.5px",
  lineHeight: 1,
  fontWeight: 800,
  whiteSpace: "nowrap",
  pointerEvents: "none",
};

export const listDiaryAnnotationErrorStyle: CSSProperties = {
  color: "var(--historietas-perfil-rose-soft, #FDA4AF)",
  fontSize: "8px",
  lineHeight: 1.3,
  fontWeight: 800,
  overflowWrap: "anywhere",
};

export const listDiaryAnnotationSaveStyle: CSSProperties = {
  minHeight: "27px",
  padding: "5px 9px",
  borderRadius: "999px",
  border: "none",
  background:
    "var(--historietas-accent, var(--historietas-perfil-accent, #FFFFFF))",
  color: "#000000",
  fontSize: "7.8px",
  lineHeight: 1,
  fontWeight: 950,
  cursor: "pointer",
};

export const listDiaryAnnotationCancelStyle: CSSProperties = {
  ...listDiaryAnnotationSaveStyle,
  background: "rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #D4D4D8)",
};

export const listDiaryAnnotationRemoveStyle: CSSProperties = {
  ...listDiaryAnnotationSaveStyle,
  background:
    "var(--historietas-perfil-rose-dark-14, rgba(190,18,60,0.14))",
  color: "var(--historietas-perfil-rose-soft, #FDA4AF)",
};

export const listDiaryCardAnnotationStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
  boxSizing: "border-box",
};

export const listDiaryCardAnnotationHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  minWidth: 0,
};

export const listDiaryCardAnnotationTitleStyle: CSSProperties = {
  minWidth: 0,
  color: "rgba(255,255,255,0.82)",
  fontSize: "11px",
  fontWeight: 900,
  lineHeight: 1.25,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const listDiaryCardAnnotationHeaderActionsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "8px",
  flex: "0 0 auto",
  transform: "translateX(33px)",
};

export const listDiaryCardAnnotationLikeButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "5px",
  minHeight: "26px",
  padding: "0 2px",
  border: "none",
  borderRadius: "999px",
  background: "transparent",
  color: "#FFFFFF",
  fontFamily: "inherit",
  lineHeight: 1,
  flex: "0 0 auto",
};

export const listDiaryCardAnnotationLikeIconStyle: CSSProperties = {
  width: "18px",
  height: "18px",
  display: "block",
  flex: "0 0 auto",
  transformOrigin: "center",
};

export const listDiaryCardAnnotationLikeCountStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 850,
  lineHeight: 1,
};

export const listDiaryCardAnnotationTextStyle: CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.88)",
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: 1.5,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
};

export const listDiaryCardSpoilerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "8px",
  minWidth: 0,
  padding: "8px 10px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.05)",
};

export const listDiaryCardSpoilerTextStyle: CSSProperties = {
  color: "rgba(255,255,255,0.64)",
  fontSize: "10px",
  fontWeight: 750,
  lineHeight: 1.35,
};

export const listDiaryCardSpoilerButtonStyle: CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  width: "fit-content",
  minHeight: "26px",
  padding: "4px 8px",
  border: "none",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  fontSize: "9px",
  fontWeight: 900,
  lineHeight: 1,
  cursor: "pointer",
};

export const listDiaryCardAnnotationTitleGroupStyle: CSSProperties = {
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  gap: "7px",
};
