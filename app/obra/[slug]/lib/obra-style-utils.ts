import type { CSSProperties } from "react";

export const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

export const heroTitleOutlineStyle: CSSProperties = {
  textShadow:
    "-1px -1px 0 rgba(0,0,0,0.86), 1px -1px 0 rgba(0,0,0,0.86), -1px 1px 0 rgba(0,0,0,0.86), 1px 1px 0 rgba(0,0,0,0.86)",
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

// Teste: tipografia do card principal igual à usada no card principal da Home.
export const homeMainTitleTypographyStyle: CSSProperties = {
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 500,
  letterSpacing: "-0.01em",
};

export const homeMainMetaTypographyStyle: CSSProperties = {
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 450,
  lineHeight: 1.25,
};

export const homeMainStatsTypographyStyle: CSSProperties = {
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontWeight: 850,
};

export const communityGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "6px",
  minWidth: 0,
};

export const ratingSummaryStyle: CSSProperties = {
  flex: "0 0 auto",
  width: "fit-content",
  maxWidth: "132px",
  display: "grid",
  justifyItems: "center",
  alignContent: "center",
  rowGap: "1px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
  boxSizing: "border-box",
  textAlign: "center",
};

export const ratingNumberStyle: CSSProperties = {
  color: "var(--historietas-obra-rating-strong, #FFFFFF)",
  fontSize: "28px",
  lineHeight: 1,
  fontWeight: 950,
  textShadow: "0 1px 0 rgba(0,0,0,0.28), 0 2px 10px rgba(0,0,0,0.22)",
  ...safeTextStyle,
};

export const ratingStarsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "1px",
  color: "var(--historietas-obra-rating, #FFFFFF)",
  fontSize: "12px",
  lineHeight: 1,
  letterSpacing: "-0.02em",
  marginTop: "-4px",
  marginBottom: "1px",
  textShadow: "0 1px 0 rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.2)",
  ...safeTextStyle,
};

export const ratingTopStarVisualStyle: CSSProperties = {
  position: "relative",
  width: "1em",
  height: "1em",
  display: "inline-block",
  lineHeight: 1,
  flex: "0 0 auto",
};

export const ratingTopStarBaseStyle: CSSProperties = {
  color: "var(--historietas-obra-rating-muted, rgba(251, 191, 36, 0.34))",
  position: "absolute",
  inset: 0,
  lineHeight: 1,
};

export const ratingTopStarFillStyle: CSSProperties = {
  color: "var(--historietas-obra-rating, #FFFFFF)",
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  whiteSpace: "nowrap",
  lineHeight: 1,
};

export const ratingTotalStyle: CSSProperties = {
  color: "rgba(255,255,255,0.95)",
  fontSize: "10px",
  lineHeight: 1.1,
  fontWeight: 900,
  textTransform: "uppercase",
  textAlign: "center",
  textShadow: "0 1px 0 rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.2)",
  ...safeTextStyle,
};

export const synopsisCardStyle: CSSProperties = {
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  minWidth: 0,
  boxSizing: "border-box",
};

export const synopsisTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  lineHeight: 1.62,
  fontWeight: 650,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
  textAlign: "left",
  ...safeTextStyle,
};

export const chaptersListStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

export const chapterCountBadgeStyle: CSSProperties = {
  width: "fit-content",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 950,
  textAlign: "center",
  ...safeTextStyle,
};

export const chapterContentStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  minWidth: 0,
};

export const chaptersSectionStyle: CSSProperties = {
  marginTop: "14px",
  minWidth: 0,
};

export const synopsisSectionStyle: CSSProperties = {
  ...chaptersSectionStyle,
  animation: "historietas-synopsis-reveal 220ms ease-out",
};
