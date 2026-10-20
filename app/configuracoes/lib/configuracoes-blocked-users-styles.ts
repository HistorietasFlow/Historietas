import type { CSSProperties } from "react";

export const blockedUsersPanelStyle: CSSProperties = {
  display: "grid",
  borderTop:
    "1px solid var(--configuracoes-border, rgba(255,255,255,0.065))",
};

export const blockedUserRowStyle: CSSProperties = {
  minHeight: 64,
  display: "grid",
  gridTemplateColumns: "38px minmax(0, 1fr) auto",
  alignItems: "center",
  gap: 10,
  padding: "10px 12px",
  borderBottom:
    "1px solid var(--configuracoes-border, rgba(255,255,255,0.055))",
};

export const blockedUserAvatarStyle: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: "50%",
  objectFit: "cover",
  background: "rgba(255,255,255,0.08)",
};

export const blockedUserAvatarFallbackStyle: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: "50%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  fontSize: 15,
  fontWeight: 900,
};

export const blockedUserTextStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: 3,
};

export const blockedUserNameStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: 14,
  lineHeight: 1.15,
  fontWeight: 800,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const blockedUserUsernameStyle: CSSProperties = {
  color:
    "var(--configuracoes-text-secondary, rgba(255,255,255,0.52))",
  fontSize: 12,
  lineHeight: 1.15,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const blockedUserButtonStyle: CSSProperties = {
  minHeight: 34,
  padding: "7px 10px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: 12,
  fontWeight: 850,
  cursor: "pointer",
};

export const blockedUserButtonDisabledStyle: CSSProperties = {
  ...blockedUserButtonStyle,
  opacity: 0.58,
  cursor: "wait",
};

export const blockedUsersEmptyStyle: CSSProperties = {
  margin: 0,
  padding: "16px 14px",
  color:
    "var(--configuracoes-text-secondary, rgba(255,255,255,0.58))",
  fontSize: 13,
  lineHeight: 1.4,
  textAlign: "center",
};

export const blockedUsersErrorStyle: CSSProperties = {
  display: "grid",
  gap: 10,
  padding: "14px",
  color: "var(--configuracoes-danger-text, #FCA5A5)",
  fontSize: 13,
  lineHeight: 1.35,
};

export const blockedUsersRetryButtonStyle: CSSProperties = {
  justifySelf: "start",
  minHeight: 34,
  padding: "7px 11px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.08)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: 12,
  fontWeight: 850,
  cursor: "pointer",
};
