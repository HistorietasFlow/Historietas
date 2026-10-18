import type { CSSProperties } from "react";

export const authorCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "80px minmax(0, 1fr)",
  alignItems: "center",
  gap: "10px",
  padding: "10px 12px",
  borderRadius: "22px",
  background: "var(--historietas-seguindo-panel, rgba(4, 0, 10, 0.72))",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden"
};

export const desktopAuthorCardStyle: CSSProperties = {
  ...authorCardStyle,
  width: "100%",
  minHeight: "82px",
  gridTemplateColumns: "58px minmax(0, 1fr)",
  gap: "11px",
  padding: "11px",
  borderRadius: "20px",
  background: "var(--historietas-seguindo-panel, rgba(4, 0, 10, 0.72))",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
};

export const authorAvatarStyle: CSSProperties = {
  width: "80px",
  height: "80px",
  borderRadius: "24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-seguindo-bg-deep, #050505)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
  textShadow: "none",
  fontSize: "32px",
  fontWeight: 950,
  boxShadow: "none",
  flex: "0 0 auto"
};
