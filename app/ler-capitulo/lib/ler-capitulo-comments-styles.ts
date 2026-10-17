import type { CSSProperties } from "react";
import { safeTextStyle } from "./ler-capitulo-text-style";

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
  background: "rgba(3, 2, 8, 0.42)",
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
  gridTemplateRows: "auto auto minmax(0, 1fr) auto auto auto",
  gap: "7px",
  padding: "5px 12px calc(10px + env(safe-area-inset-bottom))",
  borderRadius: "28px 28px 0 0",
  background: "var(--historietas-reader-bg-page, #000000)",
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
  border: "1px solid rgba(255,255,255,0.12)",
  background: "var(--historietas-reader-menu, rgba(18, 9, 35, 0.98))",
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
  background: "rgba(255,255,255,0.12)",
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
  borderLeft: "1px solid rgba(255,255,255,0.08)",
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
  background: "rgba(255,255,255,0.22)",
};

const commentAvatarStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-reader-bg-deep, #000000)",
  border: "1px solid var(--historietas-reader-purple-border, rgba(255, 255, 255, 0.18))",
  color: "#FFFFFF",
  fontSize: "12.5px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  boxShadow: "none",
  flex: "0 0 auto",
  overflow: "hidden",
  boxSizing: "border-box",
};

export const commentAvatarLinkStyle: CSSProperties = {
  ...commentAvatarStyle,
  textDecoration: "none",
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

const commentAuthorStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 950,
};

export const commentAuthorLinkStyle: CSSProperties = {
  ...commentAuthorStyle,
  textDecoration: "none",
  cursor: "pointer",
  ...safeTextStyle,
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
  ...safeTextStyle,
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
  width: "fit-content",
  border: "none",
  background: "transparent",
  color: "var(--historietas-danger-button-text, var(--historietas-reader-danger-text, #FFFFFF))",
  fontSize: "10.5px",
  fontWeight: 900,
  fontFamily: "inherit",
  padding: "1px 0 0",
  cursor: "pointer",
};

export const commentReportButtonStyle: CSSProperties = {
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
  boxSizing: "border-box",
};

export const emptyCommentsStyle: CSSProperties = {
  margin: "10px 0 0",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 800,
  textAlign: "center",
};

export const commentsSheetErrorStyle: CSSProperties = {
  display: "block",
  padding: "8px 10px",
  borderRadius: "14px",
  background: "var(--historietas-danger-surface, var(--historietas-reader-danger-bg, rgba(239,68,68,0.12)))",
  border: "1px solid var(--historietas-reader-danger-border, rgba(248,113,113,0.24))",
  color: "var(--historietas-danger-button-text, var(--historietas-reader-danger-text, #FFFFFF))",
  fontSize: "11px",
  fontWeight: 850,
  lineHeight: 1.35,
  textAlign: "center",
  ...safeTextStyle,
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
  background: "var(--historietas-reader-bg-deep, #000000)",
  border: "1px solid var(--historietas-reader-purple-border, rgba(255, 255, 255, 0.18))",
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
  border: "1px solid rgba(255,255,255,0.08)",
  background: "var(--historietas-reader-bg-deep, #000000)",
  color: "#FFFFFF",
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
    "1px solid var(--historietas-bottom-nav-publish-border, var(--historietas-reader-highlight-border, rgba(255, 255, 255, 0.24)))",
  background:
    "var(--historietas-bottom-nav-publish-bg, var(--historietas-reader-publish-bg, #050505))",
  color: "#FFFFFF",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 950,
  fontFamily: "inherit",
  padding: 0,
};
