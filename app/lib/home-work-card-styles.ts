import type { CSSProperties } from "react";
import {
  listaAuthorMetaTypographyStyle,
  listaWorkTitleTypographyStyle,
  safeTextStyle,
} from "./home-card-style-primitives";

export const publishedCardStyle: CSSProperties = {
  flex: "0 0 min(360px, 88vw)",
  width: "min(360px, 88vw)",
  scrollSnapAlign: "start",
  display: "grid",
  gridTemplateColumns: "minmax(88px, 98px) minmax(0, 1fr)",
  gap: "14px",
  alignItems: "stretch",
  padding: "11px",
  borderRadius: "22px",
  background: "transparent",
  border: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  minWidth: 0,
  maxWidth: "88vw",
  overflow: "hidden",
  boxShadow: "none",
  boxSizing: "border-box",
};

export const desktopPublishedCardStyle: CSSProperties = {
  ...publishedCardStyle,
  flex: "0 0 360px",
  width: "360px",
  maxWidth: "360px",
  gridTemplateColumns: "98px minmax(0, 1fr)",
  gap: "14px",
  padding: "11px",
  borderRadius: "22px",
  boxShadow: "none",
};

export const publishedCardCompactHeightStyle: CSSProperties = {
  ...publishedCardStyle,
  padding: "8px",
};

export const desktopPublishedCardCompactHeightStyle: CSSProperties = {
  ...desktopPublishedCardStyle,
  padding: "8px",
};

export const desktopCoverPlaceholderStyle: CSSProperties = {
  minHeight: "116px",
  borderRadius: "16px",
};

export const coverPlaceholderCompactHeightStyle: CSSProperties = {
  minHeight: "106px",
};

export const desktopCoverPlaceholderCompactHeightStyle: CSSProperties = {
  minHeight: "106px",
  borderRadius: "16px",
};


export const publishedInfoStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  display: "grid",
  alignContent: "center",
  gap: "7px",
};

export const cardTopRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "8px",
  minWidth: 0,
};

export const publishedTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "20px",
  lineHeight: 1.05,
  ...listaWorkTitleTypographyStyle,
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

export const desktopPublishedTitleStyle: CSSProperties = {
  ...publishedTitleStyle,
  fontSize: "20px",
  lineHeight: 1.05,
};

export const statusRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  maxWidth: "100%",
  minWidth: 0,
};


export const formatBadgeStyle: CSSProperties = {
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

export const classificationBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "10px",
  fontWeight: 950,
  whiteSpace: "normal",
  ...safeTextStyle,
};

export const authorLinkStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  margin: 0,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "12px",
  ...listaAuthorMetaTypographyStyle,
  textDecoration: "none",
  borderBottom: "0",
  whiteSpace: "normal",
  ...safeTextStyle,
};

export const latestChapterInfoStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  lineHeight: 1.2,
  fontWeight: 900,
  textDecoration: "none",
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

export const cardStatsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 800,
  maxWidth: "100%",
  minWidth: 0,
};

export const cardStatItemStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  minWidth: 0,
  whiteSpace: "nowrap",
  lineHeight: 1,
};

export const cardStatIconStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
  flex: "0 0 auto",
};

export const cardStatHeartIconStyle: CSSProperties = {
  ...cardStatIconStyle,
  color: "#E11D48",
};

export const cardStatValueStyle: CSSProperties = {
  display: "inline-block",
  lineHeight: 1,
  whiteSpace: "nowrap",
};

export const mobileCardActionRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginTop: "4px",
  maxWidth: "100%",
  minWidth: 0,
  overflow: "hidden",
  boxSizing: "border-box",
};

export const mobileCardGenreBadgeStyle: CSSProperties = {
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
};

export const progressCompactStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "8px",
  maxWidth: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

export const progressTrackStyle: CSSProperties = {
  width: "100%",
  height: "7px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  overflow: "hidden",
  boxSizing: "border-box",
};

export const progressBarStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(90deg, #FFFFFF 0%, #A1A1AA 100%)",
};

export const progressTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 850,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
};

export const readNowStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  minHeight: "34px",
  padding: "0 14px",
  marginTop: "4px",
  borderRadius: "999px",
  background: "#050505",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  lineHeight: 1.15,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

export const continueActionTextWrapStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  alignItems: "center",
  gap: "1px",
  lineHeight: 1.05,
  textAlign: "center",
  minWidth: 0,
  ...safeTextStyle,
};

export const continueActionMainTextStyle: CSSProperties = {
  display: "block",
  fontSize: "11px",
  lineHeight: 1.05,
  fontWeight: 950,
  ...safeTextStyle,
};

export const continueActionSubTextStyle: CSSProperties = {
  display: "block",
  fontSize: "10px",
  lineHeight: 1.05,
  fontWeight: 900,
  opacity: 0.96,
  ...safeTextStyle,
};

export const mobileCardPrimaryActionStyle: CSSProperties = {
  ...readNowStyle,
  flex: "1 1 auto",
  minWidth: 0,
  marginTop: 0,
  padding: "0 12px",
  textAlign: "center",
};

export const pageBackgroundActionButtonStyle: CSSProperties = {
  background: "var(--historietas-bg-start, #000000)",
};

export const mobileCardSecondaryActionStyle: CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  maxWidth: "100%",
  minHeight: "34px",
  padding: "0 12px",
  marginTop: 0,
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "13px",
  fontWeight: 950,
  lineHeight: 1.15,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  whiteSpace: "normal",
  ...safeTextStyle,
};

export const desktopCardActionRowStyle: CSSProperties = {
  ...mobileCardActionRowStyle,
  overflow: "visible",
};

export const desktopCardGenreBadgeStyle: CSSProperties = {
  ...mobileCardGenreBadgeStyle,
  flex: "0 1 42%",
  maxWidth: "42%",
  padding: "0 10px",
  textAlign: "center",
};

export const desktopCardPrimaryActionStyle: CSSProperties = {
  ...mobileCardPrimaryActionStyle,
  justifyContent: "center",
  textAlign: "center",
};

export const desktopCardSecondaryActionStyle: CSSProperties = {
  ...mobileCardSecondaryActionStyle,
  justifyContent: "center",
  textAlign: "center",
};

export const obraCardStyle: CSSProperties = {
  flex: "0 0 min(360px, 88vw)",
  width: "min(360px, 88vw)",
  scrollSnapAlign: "start",
  display: "grid",
  gridTemplateColumns: "minmax(88px, 98px) minmax(0, 1fr)",
  gap: "14px",
  alignItems: "stretch",
  padding: "11px",
  borderRadius: "22px",
  background: "transparent",
  border: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  minWidth: 0,
  maxWidth: "88vw",
  overflow: "hidden",
  boxShadow: "none",
  boxSizing: "border-box",
};

export const desktopObraCardStyle: CSSProperties = {
  ...obraCardStyle,
  flex: "0 0 360px",
  width: "360px",
  maxWidth: "360px",
  gridTemplateColumns: "98px minmax(0, 1fr)",
  gap: "14px",
  padding: "11px",
  borderRadius: "22px",
  boxShadow: "none",
};

export const obraCardSoonStyle: CSSProperties = {
  ...obraCardStyle,
  opacity: 0.9,
};

export const desktopObraCardSoonStyle: CSSProperties = {
  ...desktopObraCardStyle,
  opacity: 0.9,
};

export const obraInfoStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  display: "grid",
  alignContent: "center",
  gap: "7px",
};

export const obraTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "20px",
  lineHeight: 1.05,
  ...listaWorkTitleTypographyStyle,
  maxWidth: "100%",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  ...safeTextStyle,
};

export const desktopObraTitleStyle: CSSProperties = {
  ...obraTitleStyle,
  fontSize: "20px",
  lineHeight: 1.05,
};



export const authorStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "12px",
  ...listaAuthorMetaTypographyStyle,
  maxWidth: "100%",
  ...safeTextStyle,
};
