import type { CSSProperties } from "react";
import { safeTextStyle } from "./publicar-layout-styles";

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

export const previewCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(88px, 98px) minmax(0, 1fr)",
  alignItems: "stretch",
  gap: "14px",
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

export const emptyPreviewBoxStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "80px minmax(0, 1fr)",
  gap: "13px",
  alignItems: "center",
  padding: "13px",
  borderRadius: "21px",
  background: "rgba(4, 0, 10, 0.72)",
  border: "1px solid rgba(255,255,255,0.06)",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  boxShadow: "none",
};

export const emptyPreviewCoverStyle: CSSProperties = {
  minHeight: "104px",
  borderRadius: "18px",
  background: "var(--historietas-publicar-bg-deep, #000000)",
  backgroundImage: "linear-gradient(135deg, var(--historietas-publicar-surface, #050505) 0%, var(--historietas-publicar-bg-deep, #000000) 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "none",
};

export const emptyPreviewIconStyle: CSSProperties = {
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
  fontWeight: 950,
  lineHeight: 1,
  background: "transparent",
};

export const emptyPreviewContentStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  minWidth: 0,
};

export const emptyPreviewTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "16px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  ...safeTextStyle,
};

export const emptyPreviewTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "12px",
  lineHeight: 1.45,
  fontWeight: 700,
  ...safeTextStyle,
};

export const previewCoverStyle: CSSProperties = {
  width: "100%",
  minHeight: "116px",
  height: "100%",
  maxHeight: "none",
  maxWidth: "100%",
  alignSelf: "stretch",
  borderRadius: "16px",
  position: "relative",
  overflow: "hidden",
  background: "var(--historietas-publicar-bg-deep, #000000)",
  backgroundImage: "linear-gradient(135deg, var(--historietas-publicar-surface, #050505) 0%, var(--historietas-publicar-bg-deep, #000000) 100%)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  border: "1px solid rgba(255,255,255,0.08)",
  minWidth: 0,
  boxSizing: "border-box",
  flex: "0 0 auto",
  boxShadow: "none",
};

export function criarPreviewCoverStyle(capa: string): CSSProperties {
  if (!capa) {
    return previewCoverStyle;
  }

  return {
    ...previewCoverStyle,
    background: "var(--historietas-publicar-bg-deep, #000000)",
    backgroundImage: `url(${capa})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

export const previewCoverGlowStyle: CSSProperties = {
  display: "none",
};

export const previewContentStyle: CSSProperties = {
  display: "grid",
  alignContent: "center",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

export const previewBadgesStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  rowGap: "5px",
  minWidth: 0,
  maxWidth: "100%",
};

export const previewBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "10px",
  fontWeight: 900,
  whiteSpace: "normal",
  ...safeTextStyle,
};

export const previewRatingBadgeStyle: CSSProperties = {
  ...previewBadgeStyle,
  color: "#FFFFFF",
};

export const previewObraTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "20px",
  lineHeight: 1.05,
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 500,
  letterSpacing: "-0.01em",
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  textDecoration: "none",
  borderBottom: "none",
  ...safeTextStyle,
};

export const previewAuthorStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  margin: 0,
  color: "var(--historietas-text-secondary, var(--historietas-publicar-author-text, #D4D4D8))",
  fontSize: "12px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 450,
  lineHeight: 1.25,
  textDecoration: "none",
  borderBottom: "none",
  ...safeTextStyle,
};

export const previewImportedChapterStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  padding: "7px",
  borderRadius: "13px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxShadow: "none",
};

export const previewImportedMiniStyle: CSSProperties = {
  color: "var(--historietas-publicar-success, #86EFAC)",
  fontSize: "8px",
  fontWeight: 950,
  letterSpacing: "0.055em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

export const previewImportedTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "14px",
  lineHeight: 1.2,
  fontWeight: 950,
  ...safeTextStyle,
};

export const previewImportedTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.35,
  fontWeight: 750,
  ...safeTextStyle,
};

export const previewTopRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "8px",
  minWidth: 0,
  maxWidth: "100%",
};

export const previewStatsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 850,
  maxWidth: "100%",
  minWidth: 0,
};

export const previewStatItemStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  whiteSpace: "nowrap",
  lineHeight: 1,
};

export const previewStatIconStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
  flex: "0 0 auto",
};

export const previewStatHeartIconStyle: CSSProperties = {
  ...previewStatIconStyle,
  color: "var(--historietas-publicar-heart, #E11D48)",
};

export const previewStatValueStyle: CSSProperties = {
  display: "inline-block",
  lineHeight: 1,
  whiteSpace: "nowrap",
};

export const previewProgressCompactStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "8px",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

export const previewProgressTrackStyle: CSSProperties = {
  width: "100%",
  height: "7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  overflow: "hidden",
  boxSizing: "border-box",
};

export const previewProgressFillStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background:
    "linear-gradient(90deg, var(--historietas-accent, var(--historietas-publicar-accent, #FFFFFF)) 0%, var(--historietas-secondary, var(--historietas-publicar-secondary, #A1A1AA)) 100%)",
};

export const previewProgressTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 850,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
};

export const previewActionRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginTop: "2px",
  maxWidth: "100%",
  minWidth: 0,
  overflow: "hidden",
  boxSizing: "border-box",
};

export const previewGenreBadgeStyle: CSSProperties = {
  flex: "0 1 42%",
  maxWidth: "42%",
  minHeight: "34px",
  padding: "0 10px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 900,
  lineHeight: 1.12,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  boxSizing: "border-box",
  ...safeTextStyle,
};

export const previewActionBadgeStyle: CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  maxWidth: "100%",
  minHeight: "34px",
  padding: "0 12px",
  borderRadius: "999px",
  background: "var(--historietas-publicar-surface, #050505)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  lineHeight: 1.15,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  textAlign: "center",
  ...safeTextStyle,
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

export const desktopPreviewCardStyle: CSSProperties = {
  ...previewCardStyle,
  gridTemplateColumns: "132px minmax(0, 1fr)",
  gap: "18px",
  padding: "14px",
  borderRadius: "22px",
  width: "100%",
};

export const desktopEmptyPreviewBoxStyle: CSSProperties = {
  ...emptyPreviewBoxStyle,
  gridTemplateColumns: "118px minmax(0, 1fr)",
  gap: "18px",
  padding: "14px",
  borderRadius: "22px",
  width: "100%",
};
