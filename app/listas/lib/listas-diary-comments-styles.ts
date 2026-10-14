import type { CSSProperties } from "react";
import { rowTitleStyle } from "./listas-layout-styles";

export function criarAvatarPerfilDiarioListasStyle(avatar: string): CSSProperties {
  const avatarLimpo = avatar.trim();

  return avatarLimpo
    ? {
        ...listDiaryProfileAvatarStyle,
        backgroundImage: `url(${avatarLimpo})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "transparent",
      }
    : listDiaryProfileAvatarStyle;
}

export function criarAvatarComentarioDiarioListasStyle(
  estiloBase: CSSProperties,
  avatar: string,
): CSSProperties {
  const avatarLimpo = avatar.trim();

  return avatarLimpo
    ? {
        ...estiloBase,
        backgroundImage: `url(${avatarLimpo})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "transparent",
      }
    : estiloBase;
}

export const listDiaryProfileHeaderStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gap: "8px",
  minWidth: 0,
  boxSizing: "border-box",
};

export const listDiaryProfileHeaderTopStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "42px minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "9px",
  minWidth: 0,
  boxSizing: "border-box",
};

export const listDiaryProfileAvatarStyle: CSSProperties = {
  width: "42px",
  maxWidth: "42px",
  height: "42px",
  borderRadius: "11px",
  border: "none",
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-input-bg, #18181B)",
  color: "#FFFFFF",
  fontSize: "14px",
  lineHeight: 1,
  fontWeight: 950,
  overflow: "hidden",
  boxSizing: "border-box",
  flex: "0 0 auto",
};

export const listDiaryProfileTitleAreaStyle: CSSProperties = {
  display: "grid",
  alignContent: "center",
  justifyItems: "start",
  gap: "7px",
  minWidth: 0,
};

export const listDiaryProfileTitleStyle: CSSProperties = {
  ...rowTitleStyle,
  width: "100%",
  minWidth: 0,
  margin: 0,
  color: "#FFFFFF",
  fontSize: "clamp(15px, 3vw, 17px)",
  fontWeight: 500,
  letterSpacing: "-0.01em",
  lineHeight: 1.2,
  textAlign: "left",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  display: "block",
  WebkitLineClamp: "unset",
  WebkitBoxOrient: "initial",
};

export const listDiaryHeaderRatingBoxStyle: CSSProperties = {
  width: "min(420px, 100%)",
  margin: "0 auto",
  padding: 0,
  display: "grid",
  gap: "8px",
  minWidth: 0,
  boxSizing: "border-box",
};

export const listDiaryHeaderRatingStarsRowStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  alignItems: "center",
  gap: "6px",
  minWidth: 0,
  background: "transparent",
  boxShadow: "none",
};

export const listDiaryHeaderRatingStarButtonStyle: CSSProperties = {
  minHeight: "34px",
  borderRadius: "999px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-list-diary-rating-muted, rgba(249, 115, 22, 0.34))",
  fontSize: "22px",
  fontWeight: 950,
  lineHeight: 1,
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

export const listDiaryHeaderRatingStarActiveStyle: CSSProperties = {
  ...listDiaryHeaderRatingStarButtonStyle,
  color: "var(--historietas-list-diary-rating, #FFFFFF)",
};

export const listDiaryHeaderRatingStarVisualStyle: CSSProperties = {
  position: "relative",
  width: "1em",
  height: "1em",
  display: "inline-block",
  lineHeight: 1,
};

export const listDiaryHeaderRatingStarBaseStyle: CSSProperties = {
  color: "var(--historietas-list-diary-rating-muted, rgba(249, 115, 22, 0.34))",
  position: "absolute",
  inset: 0,
  lineHeight: 1,
};

export const listDiaryHeaderRatingStarFillStyle: CSSProperties = {
  color: "var(--historietas-list-diary-rating, #FFFFFF)",
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  whiteSpace: "nowrap",
  lineHeight: 1,
};

export const listDiaryRatingSummaryStyle: CSSProperties = {
  flex: "0 0 auto",
  width: "fit-content",
  maxWidth: "118px",
  minHeight: "39px",
  display: "grid",
  justifyItems: "center",
  alignContent: "center",
  gap: "3px",
  padding: "4px 2px",
  background: "transparent",
  border: "none",
  boxShadow: "none",
  boxSizing: "border-box",
  textAlign: "center",
};

export const listDiaryRatingNumberStyle: CSSProperties = {
  color: "var(--historietas-list-diary-rating, #FFFFFF)",
  fontSize: "18.5px",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
};

export const listDiaryRatingSummaryStarsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "1px",
  color: "var(--historietas-list-diary-rating, #FFFFFF)",
  fontSize: "10px",
  lineHeight: 1,
  letterSpacing: "-0.02em",
};

export const listDiaryRatingSummaryStarVisualStyle: CSSProperties = {
  position: "relative",
  width: "1em",
  height: "1em",
  display: "inline-block",
  lineHeight: 1,
  flex: "0 0 auto",
};

export const listDiaryRatingSummaryStarBaseStyle: CSSProperties = {
  color: "var(--historietas-list-diary-rating-muted, rgba(249, 115, 22, 0.34))",
  position: "absolute",
  inset: 0,
  lineHeight: 1,
};

export const listDiaryRatingSummaryStarFillStyle: CSSProperties = {
  color: "var(--historietas-list-diary-rating, #FFFFFF)",
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  whiteSpace: "nowrap",
  lineHeight: 1,
};

export const listDiaryRatingTotalStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "7.8px",
  lineHeight: 1.1,
  fontWeight: 850,
  textTransform: "none",
  letterSpacing: 0,
  textAlign: "center",
  whiteSpace: "nowrap",
};

export const listDiaryCardAnnotationCommentButtonStyle: CSSProperties = {
  minWidth: "44px",
  height: "34px",
  borderRadius: "999px",
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
  padding: "0 4px",
  fontFamily: "inherit",
  cursor: "pointer",
};

export const listDiaryCardAnnotationCommentIconStyle: CSSProperties = {
  width: "20px",
  height: "20px",
  display: "block",
  flex: "0 0 auto",
};

export const listDiaryCardAnnotationCommentCountStyle: CSSProperties = {
  minWidth: "12px",
  color: "rgba(255,255,255,0.92)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 900,
  textAlign: "center",
};

export const commentsSheetOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 2147483647,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  pointerEvents: "none",
  isolation: "isolate",
};

export const commentsSheetBackdropStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 0,
  border: "none",
  background:
    "color-mix(in srgb, var(--historietas-page-background, #000000) 66%, transparent)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  pointerEvents: "auto",
  cursor: "pointer",
  padding: 0,
};

export const commentsSheetStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(720px, 100%)",
  maxHeight: "calc(100dvh - env(safe-area-inset-top) - 10px)",
  display: "grid",
  gridTemplateRows: "auto auto minmax(0, 1fr) auto auto auto auto",
  gap: "7px",
  padding: "5px 12px calc(10px + env(safe-area-inset-bottom))",
  borderRadius: "28px 28px 0 0",
  background: "var(--historietas-page-background, #000000)",
  border: "none",
  borderBottom: "none",
  boxShadow: "0 -24px 70px rgba(0,0,0,0.72)",
  pointerEvents: "auto",
  overflow: "hidden",
  boxSizing: "border-box",
  willChange: "height",
  transition: "height 220ms ease",
};

export const commentsSheetCompactStyle: CSSProperties = {
  height: "min(64dvh, 540px)",
};

export const commentsSheetExpandedStyle: CSSProperties = {
  height: "min(90dvh, 760px)",
};

export const desktopCommentsSheetStyle: CSSProperties = {
  ...commentsSheetStyle,
  width: "min(800px, calc(100% - 40px))",
  height: "min(76dvh, 720px)",
};

export const commentsSheetHandleWrapStyle: CSSProperties = {
  minHeight: "24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  touchAction: "none",
  cursor: "grab",
  willChange: "transform",
  outline: "none",
};

export const commentsSheetHandleStyle: CSSProperties = {
  width: "44px",
  height: "5px",
  borderRadius: "999px",
  background: "var(--historietas-border-soft, rgba(255,255,255,0.34))",
};

export const commentsSheetHeaderStyle: CSSProperties = {
  minHeight: "32px",
  display: "grid",
  gridTemplateColumns: "40px minmax(0, 1fr) 40px",
  alignItems: "center",
  gap: "6px",
  minWidth: 0,
};

export const commentsSheetHeaderSpacerStyle: CSSProperties = {
  width: "40px",
  height: "1px",
};

export const commentsSheetTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "14.5px",
  fontWeight: 950,
  textAlign: "center",
  letterSpacing: "-0.02em",
};

export const commentsSortMenuWrapStyle: CSSProperties = {
  position: "relative",
  width: "40px",
  height: "34px",
  justifySelf: "end",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
};

export const commentsSortMenuTriggerStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "27px",
  lineHeight: 1,
  fontWeight: 500,
  fontFamily: "inherit",
  padding: "0 0 2px",
  cursor: "pointer",
};

export const commentsSortMenuStyle: CSSProperties = {
  position: "absolute",
  top: "calc(100% + 6px)",
  right: 0,
  zIndex: 12,
  width: "132px",
  maxWidth: "calc(100vw - 24px)",
  display: "grid",
  gap: 0,
  padding: "4px 8px",
  boxSizing: "border-box",
  borderRadius: "12px",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  background:
    "var(--historietas-surface-strong, rgba(18, 12, 30, 0.98))",
  boxShadow: "0 16px 36px rgba(0,0,0,0.48)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
};

export const commentsSortMenuItemStyle: CSSProperties = {
  width: "100%",
  minHeight: "36px",
  border: "none",
  borderRadius: 0,
  background: "transparent",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  padding: "0 4px",
  textAlign: "center",
  fontSize: "11.5px",
  fontWeight: 850,
  fontFamily: "inherit",
  cursor: "pointer",
};

export const commentsSortMenuItemActiveStyle: CSSProperties = {
  ...commentsSortMenuItemStyle,
  color: "#FFFFFF",
};

export const commentsSortMenuDividerStyle: CSSProperties = {
  width: "100%",
  height: "1px",
  background: "var(--historietas-border-soft, rgba(255,255,255,0.12))",
};

export const commentsSheetListStyle: CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: "12px",
  minHeight: 0,
  overflowY: "auto",
  padding: "6px 2px 9px",
  WebkitOverflowScrolling: "touch",
};

export const commentThreadStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

export const commentItemStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "34px minmax(0, 1fr) 28px",
  gap: "10px",
  alignItems: "start",
  minWidth: 0,
};

export const commentRepliesListStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
  marginLeft: "34px",
  paddingLeft: "10px",
  borderLeft:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  minWidth: 0,
};

export const commentReplyItemStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "28px minmax(0, 1fr) 28px",
  gap: "8px",
  alignItems: "start",
  minWidth: 0,
};

export const commentRepliesToggleStyle: CSSProperties = {
  width: "fit-content",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  marginLeft: "44px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 900,
  fontFamily: "inherit",
  padding: "1px 0",
  cursor: "pointer",
};

export const commentRepliesControlsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  minWidth: 0,
};

export const commentRepliesHideButtonStyle: CSSProperties = {
  width: "fit-content",
  marginLeft: "44px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 900,
  fontFamily: "inherit",
  padding: "1px 0",
  cursor: "pointer",
};

export const commentRepliesLineStyle: CSSProperties = {
  width: "22px",
  height: "1px",
  background: "var(--historietas-border-soft, rgba(255,255,255,0.22))",
};

export const commentAvatarLinkStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-page-background, #000000)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #FFFFFF) 30%, transparent)",
  color: "#FFFFFF",
  fontSize: "12.5px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  textDecoration: "none",
  boxShadow: "none",
  flex: "0 0 auto",
  overflow: "hidden",
  boxSizing: "border-box",
  cursor: "pointer",
};

export const commentReplyAvatarLinkStyle: CSSProperties = {
  ...commentAvatarLinkStyle,
  width: "28px",
  height: "28px",
  borderRadius: "10px",
  fontSize: "10.5px",
};

export const commentContentStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  gap: "3px",
  minWidth: 0,
};

export const commentTopLineStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: "6px",
  minWidth: 0,
};

export const commentAuthorLinkStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 950,
  textDecoration: "none",
  cursor: "pointer",
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const commentTimeStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10.5px",
  fontWeight: 750,
  whiteSpace: "nowrap",
};

export const commentTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12.5px",
  lineHeight: 1.38,
  fontWeight: 750,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
};

export const commentActionsRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};

export const commentReplyButtonStyle: CSSProperties = {
  width: "fit-content",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10.5px",
  fontWeight: 900,
  fontFamily: "inherit",
  padding: "1px 0 0",
  cursor: "pointer",
};

export const commentRemoveButtonStyle: CSSProperties = {
  ...commentReplyButtonStyle,
  color: "var(--historietas-danger-button-text, #FCA5A5)",
};

export const commentReportButtonStyle: CSSProperties = {
  ...commentReplyButtonStyle,
};

export const commentLikeWrapStyle: CSSProperties = {
  minWidth: "28px",
  display: "grid",
  justifyItems: "center",
  alignContent: "start",
  gap: "2px",
};

export const commentLikeButtonStyle: CSSProperties = {
  width: "28px",
  height: "28px",
  border: "none",
  borderRadius: "999px",
  background: "transparent",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  cursor: "pointer",
};

export const commentLikeCountStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 900,
  lineHeight: 1,
  minHeight: "10px",
  textAlign: "center",
};

export const commentHeartIconStyle: CSSProperties = {
  width: "19px",
  height: "19px",
  display: "block",
  flex: "0 0 auto",
  transformOrigin: "center",
};

export const commentsLoadingStyle: CSSProperties = {
  width: "100%",
  minHeight: "58px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  fontWeight: 850,
  boxSizing: "border-box",
};

export const emptyCommentsStyle: CSSProperties = {
  margin: "10px 0 0",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 800,
  textAlign: "center",
};

export const commentsSheetErrorStyle: CSSProperties = {
  display: "block",
  padding: "8px 10px",
  borderRadius: "14px",
  background: "rgba(239,68,68,0.12)",
  border: "1px solid rgba(248,113,113,0.24)",
  color: "#FCA5A5",
  fontSize: "11px",
  fontWeight: 850,
  lineHeight: 1.35,
  textAlign: "center",
};

export const commentsReplyingBannerStyle: CSSProperties = {
  minHeight: "30px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  padding: "5px 8px",
  borderRadius: "12px",
  background:
    "var(--historietas-secondary-surface, rgba(255,255,255,0.05))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10.5px",
  fontWeight: 800,
};

export const commentsReplyingCancelStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#FFFFFF",
  fontSize: "10.5px",
  fontWeight: 900,
  fontFamily: "inherit",
  padding: "2px 0",
  cursor: "pointer",
};

export const commentsToolsStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  padding: "5px 0 0",
};

export const commentsQuickReactionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "6px",
  width: "100%",
  overflowX: "auto",
  padding: "0 1px",
  scrollbarWidth: "none",
  WebkitOverflowScrolling: "touch",
};

export const commentsQuickReactionButtonStyle: CSSProperties = {
  width: "30px",
  height: "28px",
  border: "none",
  borderRadius: "999px",
  background: "transparent",
  fontSize: "18px",
  lineHeight: 1,
  padding: 0,
  cursor: "pointer",
  flex: "0 0 auto",
};

export const commentsSheetFormStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "30px minmax(0, 1fr) 28px 38px",
  alignItems: "center",
  gap: "7px",
  padding: "7px 0 0",
  minWidth: 0,
};

export const commentsInputAvatarStyle: CSSProperties = {
  width: "30px",
  height: "30px",
  borderRadius: "11px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-page-background, #000000)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #FFFFFF) 30%, transparent)",
  color: "#FFFFFF",
  fontSize: "11.5px",
  fontWeight: 950,
  overflow: "hidden",
};

export const commentsInputBoxStyle: CSSProperties = {
  minWidth: 0,
  minHeight: "38px",
  display: "flex",
  alignItems: "center",
};

export const commentsSheetInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "38px",
  maxHeight: "82px",
  borderRadius: "999px",
  border:
    "1px solid var(--historietas-border-soft, rgba(255,255,255,0.08))",
  background: "var(--historietas-page-background, #000000)",
  color: "var(--historietas-input-text, #FFFFFF)",
  padding: "9px 12px",
  outline: "none",
  fontSize: "12.5px",
  lineHeight: 1.32,
  fontWeight: 650,
  resize: "none",
  overflowY: "auto",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

export const commentsInputIconButtonStyle: CSSProperties = {
  width: "26px",
  height: "30px",
  border: "none",
  background: "transparent",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "16px",
  fontWeight: 950,
  fontFamily: "inherit",
  padding: 0,
  cursor: "pointer",
};

export const commentsSheetSendStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "999px",
  border:
    "1px solid var(--historietas-bottom-nav-publish-border, color-mix(in srgb, var(--historietas-accent, #FFFFFF) 38%, transparent))",
  background:
    "var(--historietas-bottom-nav-publish-bg, var(--historietas-accent, #FFFFFF))",
  color: "var(--historietas-list-comments-send-text, #FFFFFF)",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 950,
  fontFamily: "inherit",
  padding: 0,
};
