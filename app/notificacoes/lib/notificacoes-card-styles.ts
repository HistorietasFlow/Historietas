import type { CSSProperties } from "react";
import { safeTextStyle } from "./notificacoes-shell-styles";

export const listStyle: CSSProperties = {
  marginTop: "9px",
  display: "grid",
  gap: 0,
  minWidth: 0,
  maxWidth: "100%",
};

export const cardStyle: CSSProperties = {
  position: "relative",
  borderRadius: 0,
  padding: "8px 0",
  background: "transparent",
  border: "0",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "visible",
  boxSizing: "border-box",
};

export const readCardStyle: CSSProperties = {
  ...cardStyle,
  background: "transparent",
  border: "0",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  opacity: 0.78,
  boxShadow: "none",
};

export const communityCardStyle: CSSProperties = {
  ...cardStyle,
  background: "transparent",
  border: "0",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "none",
};

export const readCommunityCardStyle: CSSProperties = {
  ...communityCardStyle,
  background: "transparent",
  border: "0",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  opacity: 0.78,
  boxShadow: "none",
};

export const cardHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "38px minmax(0, 1fr)",
  alignItems: "start",
  gap: "6px",
  minWidth: 0,
  maxWidth: "100%",
};

export const notificationIconStyle: CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-notificacoes-surface, #050505)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
  fontSize: "18px",
  fontWeight: 950,
  lineHeight: 1,
  textDecoration: "none",
  boxShadow: "none",
  flex: "0 0 auto",
  transform: "translateY(-2px)",
};

export const unreadNotificationIconStyle: CSSProperties = {
  ...notificationIconStyle,
  background: "var(--historietas-notificacoes-danger-surface, rgba(127,29,29,0.24))",
  border: "1px solid var(--historietas-notificacoes-danger-strong, rgba(248,113,113,0.36))",
  color: "#FFFFFF",
  boxShadow: "none",
};

export const readNotificationIconStyle: CSSProperties = {
  ...notificationIconStyle,
  background: "var(--historietas-notificacoes-success-bg, rgba(34,197,94,0.12))",
  border: "1px solid var(--historietas-notificacoes-success-border, rgba(34,197,94,0.18))",
  color: "#FFFFFF",
  boxShadow: "none",
};

export const communityNotificationIconStyle: CSSProperties = {
  ...notificationIconStyle,
  background: "var(--historietas-notificacoes-surface, #050505)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
};

export const cardHeaderTextStyle: CSSProperties = {
  display: "grid",
  gap: "1px",
  paddingTop: "0",
  minWidth: 0,
  maxWidth: "100%",
  textAlign: "left",
  justifyItems: "stretch",
};

export const notificationTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "16px",
  lineHeight: 1.02,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  ...safeTextStyle,
};

export const notificationTitleRowStyle: CSSProperties = {
  position: "relative",
  display: "block",
  paddingRight: "28px",
  minWidth: 0,
  maxWidth: "100%",
};

export const cardMenuWrapperStyle: CSSProperties = {
  position: "absolute",
  top: "-3px",
  right: 0,
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "flex-end",
  minWidth: 0,
  zIndex: 20,
};

export const cardMenuButtonStyle: CSSProperties = {
  width: "22px",
  height: "22px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "none",
  color: "#FFFFFF",
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "none",
  WebkitTapHighlightColor: "transparent",
};

export const communityDateTextStyle: CSSProperties = {
  display: "block",
  width: "100%",
  margin: "0",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9.5px",
  lineHeight: 1.12,
  fontWeight: 850,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  textAlign: "left",
  justifySelf: "stretch",
  ...safeTextStyle,
};

export const notificationMessageStyle: CSSProperties = {
  width: "100%",
  margin: "1px 0 0",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.28,
  fontWeight: 700,
  textAlign: "left",
  justifySelf: "stretch",
  ...safeTextStyle,
};

export const metaGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 0,
  marginTop: "3px",
  minWidth: 0,
  maxWidth: "100%",
};

export const communityMetaGridStyle: CSSProperties = {
  ...metaGridStyle,
  gridTemplateColumns: "1fr",
};

export const metaBoxStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
  borderRadius: 0,
  padding: "4px 0",
  background: "transparent",
  border: "0",
  borderTop: "0",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
};

export const metaLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "9px",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  ...safeTextStyle,
};

export const notificationAuthorInlineLinkStyle: CSSProperties = {
  ...metaLabelStyle,
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
};

export const metaValueStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 900,
  ...safeTextStyle,
};

export const communityCommentBoxStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  borderRadius: 0,
  padding: "4px 0 0",
  background: "transparent",
  border: "0",
  borderTop: "0",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
  textAlign: "left",
};

export const communityUpdateBoxStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  padding: "4px 0 0",
  background: "transparent",
  border: "0",
  borderTop: "0",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  boxSizing: "border-box",
  textAlign: "left",
};

export const communityInlineStatusStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "6px",
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 900,
  lineHeight: 1.2,
  textAlign: "left",
  whiteSpace: "nowrap",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

export const communityInlineStatusDotStyle: CSSProperties = {
  color: "rgba(255,255,255,0.62)",
  fontSize: "10px",
  lineHeight: 1,
  flex: "0 0 auto",
};

export const communityCommentTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.3,
  fontWeight: 720,
  textAlign: "left",
  ...safeTextStyle,
};

export const followerRequestActionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
  marginTop: "8px",
  minWidth: 0,
};

export const followerRequestAcceptButtonStyle: CSSProperties = {
  minHeight: "36px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.18)",
  background: "var(--historietas-accent, #A1A1AA)",
  color: "#000000",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
  padding: "0 12px",
  boxSizing: "border-box",
};

export const followerRequestRejectButtonStyle: CSSProperties = {
  ...followerRequestAcceptButtonStyle,
  background: "transparent",
  color: "var(--historietas-notificacoes-danger-text, #FFFFFF)",
};

export const followerRequestAcceptButtonDisabledStyle: CSSProperties = {
  ...followerRequestAcceptButtonStyle,
  opacity: 0.5,
  cursor: "not-allowed",
};

export const followerRequestRejectButtonDisabledStyle: CSSProperties = {
  ...followerRequestRejectButtonStyle,
  opacity: 0.5,
  cursor: "not-allowed",
};

export const desktopListStyle: CSSProperties = {
  ...listStyle,
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  columnGap: "16px",
  rowGap: "16px",
  alignItems: "start",
};

export const desktopCardStyle: CSSProperties = {
  ...cardStyle,
  minHeight: "100%",
  padding: "16px",
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.025)",
  boxShadow: "none",
};

export const desktopReadCardStyle: CSSProperties = {
  ...readCardStyle,
  minHeight: "100%",
  padding: "16px",
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.06)",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(255,255,255,0.018)",
  boxShadow: "none",
};

export const desktopCommunityCardStyle: CSSProperties = {
  ...communityCardStyle,
  minHeight: "100%",
  padding: "16px",
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.08)",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.025)",
  boxShadow: "none",
};

export const desktopReadCommunityCardStyle: CSSProperties = {
  ...readCommunityCardStyle,
  minHeight: "100%",
  padding: "16px",
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.06)",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(255,255,255,0.018)",
  boxShadow: "none",
};

export const desktopMetaGridStyle: CSSProperties = {
  ...metaGridStyle,
  gridTemplateColumns: "1fr",
  gap: 0,
};

export const desktopCommunityMetaGridStyle: CSSProperties = {
  ...communityMetaGridStyle,
  gridTemplateColumns: "1fr",
  gap: 0,
};
