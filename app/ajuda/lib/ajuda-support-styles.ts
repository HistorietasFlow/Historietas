import type {
  CSSProperties,
} from "react";

export const supportCardStyle: CSSProperties = {
  display: "grid",
  gap: "16px",
  padding: "clamp(15px, 3vw, 22px)",
  borderRadius: "20px",
  background: "color-mix(in srgb, var(--historietas-surface, #120C1E) 90%, transparent)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
};

export const supportSeparationNoticeStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "42px minmax(0, 1fr)",
  gap: "11px",
  padding: "13px",
  borderRadius: "15px",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent)",
  border: "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 28%, transparent)",
};

export const supportSeparationIconStyle: CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "13px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "color-mix(in srgb, var(--historietas-accent, #F97316) 20%, transparent)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

export const supportSeparationTextStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "4px",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  lineHeight: 1.45,
};

export const supportSuccessStyle: CSSProperties = {
  padding: "11px 13px",
  borderRadius: "12px",
  background: "rgba(34,197,94,0.12)",
  border: "1px solid rgba(34,197,94,0.28)",
  color: "#BBF7D0",
  fontSize: "13px",
  lineHeight: 1.4,
  fontWeight: 680,
};

export const supportErrorStyle: CSSProperties = {
  padding: "11px 13px",
  borderRadius: "12px",
  background: "rgba(239,68,68,0.12)",
  border: "1px solid rgba(239,68,68,0.28)",
  color: "#FCA5A5",
  fontSize: "13px",
  lineHeight: 1.4,
  fontWeight: 680,
};

export const supportLoginNoticeStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  padding: "11px 13px",
  borderRadius: "12px",
  background: "var(--ajuda-control)",
  color: "var(--ajuda-muted)",
  fontSize: "13px",
  lineHeight: 1.4,
};

export const supportLoginLinkStyle: CSSProperties = {
  flex: "0 0 auto",
  padding: "8px 11px",
  borderRadius: "10px",
  background: "var(--historietas-secondary, #7C3AED)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 820,
};

export const supportFormStyle: CSSProperties = {
  display: "grid",
  gap: "13px",
};

export const supportFormGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))",
  gap: "12px",
};

export const supportFieldStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "7px",
};

export const supportLabelStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  lineHeight: 1.2,
  fontWeight: 780,
};

export const supportInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "44px",
  boxSizing: "border-box",
  border: "1px solid var(--ajuda-border)",
  borderRadius: "12px",
  padding: "10px 12px",
  outline: "none",
  background: "var(--historietas-input-bg, #18181B)",
  color: "var(--historietas-input-text, #FFFFFF)",
  font: "inherit",
  fontSize: "13px",
  fontWeight: 620,
};

export const supportTextareaStyle: CSSProperties = {
  ...supportInputStyle,
  minHeight: "132px",
  resize: "vertical",
  lineHeight: 1.5,
};

export const supportCounterStyle: CSSProperties = {
  justifySelf: "end",
  color: "var(--ajuda-muted)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 650,
};

export const supportFormActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "14px",
  flexWrap: "wrap",
};

export const supportEnvironmentNoteStyle: CSSProperties = {
  flex: "1 1 320px",
  color: "var(--ajuda-muted)",
  fontSize: "11px",
  lineHeight: 1.45,
};

export const supportTicketsSectionStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  paddingTop: "15px",
  borderTop: "1px solid var(--ajuda-border)",
};

export const supportTicketsHeadingStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
};

export const supportTicketsListStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
};

export const supportTicketStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  padding: "12px",
  borderRadius: "14px",
  background: "var(--ajuda-control)",
  border: "1px solid var(--ajuda-border)",
};

export const supportTicketHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
};

export const supportTicketTitleStyle: CSSProperties = {
  minWidth: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  lineHeight: 1.25,
  fontWeight: 820,
};

export const supportTicketStatusStyle: CSSProperties = {
  flex: "0 0 auto",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 18%, transparent)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 800,
};

export const supportTicketDescriptionStyle: CSSProperties = {
  margin: 0,
  color: "var(--ajuda-muted)",
  fontSize: "12px",
  lineHeight: 1.48,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
};

export const supportAdminNoteStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  padding: "9px 10px",
  borderRadius: "10px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 12%, transparent)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  lineHeight: 1.42,
};

export const supportTicketDateStyle: CSSProperties = {
  color: "var(--ajuda-muted)",
  fontSize: "10px",
  lineHeight: 1.2,
};
