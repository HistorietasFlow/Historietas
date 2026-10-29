import type { CSSProperties } from "react";

export const selectedSectionStyle: CSSProperties = {
  maxWidth: "980px",
  margin: "0 auto 10px",
};

export const selectedHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  minWidth: 0,
  marginBottom: "8px",
};

export const selectedTitleStyle: CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  letterSpacing: "-0.02em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  opacity: 1,
  filter: "none",
  textShadow: "none",
};

export const selectedListStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "5px",
};

export const selectedSlotStyle: CSSProperties = {
  position: "relative",
  minWidth: 0,
  aspectRatio: "0.62 / 1",
  borderRadius: "15px",
  overflow: "hidden",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.08)",
};

export const selectedNumberStyle: CSSProperties = {
  position: "absolute",
  top: "6px",
  left: "6px",
  zIndex: 3,
  width: "19px",
  height: "19px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  background: "rgba(0,0,0,0.76)",
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 950,
};

export const selectedRemoveButtonStyle: CSSProperties = {
  position: "absolute",
  top: "5px",
  right: "5px",
  zIndex: 4,
  width: "22px",
  height: "22px",
  border: "0",
  borderRadius: "999px",
  background: "rgba(0,0,0,0.72)",
  color: "#FFFFFF",
  fontSize: "16px",
  lineHeight: 1,
  cursor: "pointer",
};

export const selectedActionsStyle: CSSProperties = {
  position: "absolute",
  left: "5px",
  right: "5px",
  bottom: "5px",
  zIndex: 4,
  display: "flex",
  justifyContent: "space-between",
  gap: "4px",
};

export const selectedMoveButtonStyle: CSSProperties = {
  width: "24px",
  height: "22px",
  border: "0",
  borderRadius: "999px",
  background: "rgba(0,0,0,0.68)",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 950,
  cursor: "pointer",
};

export const emptySelectedSlotStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "rgba(255,255,255,0.28)",
  fontSize: "28px",
  fontWeight: 400,
};

export const footerActionsStyle: CSSProperties = {
  flex: "0 0 auto",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  margin: 0,
};

export const cancelButtonStyle: CSSProperties = {
  minHeight: "32px",
  padding: "0 10px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  background: "#0B0B0B",
  border: "1px solid #2A2A2A",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "10px",
  fontWeight: 900,
  whiteSpace: "nowrap",
};

export const saveButtonStyle: CSSProperties = {
  minHeight: "32px",
  padding: "0 10px",
  border: "1px solid #2A2A2A",
  borderRadius: "999px",
  background: "#0B0B0B",
  color: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 900,
  whiteSpace: "nowrap",
  cursor: "pointer",
};

export const saveButtonDisabledStyle: CSSProperties = {
  ...saveButtonStyle,
  opacity: 0.48,
  cursor: "not-allowed",
};
