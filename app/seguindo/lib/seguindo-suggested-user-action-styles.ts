import type { CSSProperties } from "react";

export const suggestedUserFollowButtonStyle: CSSProperties = {
  minWidth: "76px",
  minHeight: "30px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  alignSelf: "center",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.14))",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  padding: "0 12px",
  fontFamily: "inherit",
  fontSize: "10px",
  fontWeight: 950,
  whiteSpace: "nowrap",
};

export const suggestedUserRequestPendingButtonStyle: CSSProperties = {
  ...suggestedUserFollowButtonStyle,
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.14))",
  background: "var(--historietas-seguindo-surface, #0A0A0A)",
  color: "var(--historietas-text-secondary, #A1A1AA)",
};

export const followRequestContentStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  minWidth: 0,
};

export const followRequestActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "6px",
  flex: "0 0 auto",
};

export const followRequestAcceptButtonStyle: CSSProperties = {
  ...suggestedUserFollowButtonStyle,
  minWidth: "68px",
  minHeight: "28px",
  padding: "0 10px",
};

export const followRequestDeclineButtonStyle: CSSProperties = {
  ...followRequestAcceptButtonStyle,
  border: "1px solid var(--historietas-seguindo-danger-border, rgba(239,68,68,0.18))",
  background: "var(--historietas-seguindo-danger-bg, rgba(239,68,68,0.075))",
  color: "var(--historietas-seguindo-danger-text, #FCA5A5)",
};
