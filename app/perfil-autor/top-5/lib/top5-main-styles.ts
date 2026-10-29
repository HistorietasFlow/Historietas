import type { CSSProperties } from "react";

export const pageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "12px 10px 48px",
  background:
    "radial-gradient(circle at top left, var(--historietas-top5-purple-page, rgba(124,58,237,0.12)), transparent 34%), #000000",
  color: "#FFFFFF",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

export const gridSectionStyle: CSSProperties = {
  maxWidth: "980px",
  margin: "0 auto",
};

export const worksGridStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  alignItems: "start",
  rowGap: "10px",
  columnGap: "10px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};

export const top5CardStyle: CSSProperties = {
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  padding: "0",
  border: "0",
  background: "transparent",
  color: "#FFFFFF",
  cursor: "pointer",
  textAlign: "left",
};

export const top5CardSelectedStyle: CSSProperties = {
  ...top5CardStyle,
};

export const selectedBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "7px",
  left: "7px",
  width: "28px",
  height: "28px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  background: "rgba(0,0,0,0.76)",
  color: "#FFFFFF",
  fontSize: "13px",
  fontWeight: 950,
  boxShadow: "0 8px 18px rgba(0,0,0,0.32)",
};
