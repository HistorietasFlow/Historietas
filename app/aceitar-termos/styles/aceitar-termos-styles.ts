import type { CSSProperties } from "react";

export const aceitarTermosPageCss = `
  html, body { background: #000 !important; }
  html[data-historietas-tema-visual="foco"] body,
  html[data-historietas-tema-visual="foco"] main { background: #000 !important; color: #fff !important; }
`;

export const pageStyle: CSSProperties = {
  minHeight: "100dvh",
  background: "#000000",
  color: "#FFFFFF",
  padding: "24px 14px 48px",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

export const containerStyle: CSSProperties = {
  width: "min(680px, 100%)",
  margin: "0 auto",
};

export const backLinkStyle: CSSProperties = {
  display: "inline-flex",
  marginBottom: "18px",
  color: "#D4D4D8",
  textDecoration: "none",
  fontWeight: 800,
  fontSize: "14px",
};

export const cardStyle: CSSProperties = {
  display: "grid",
  gap: "18px",
  padding: "clamp(22px, 5vw, 38px)",
  border: "1px solid rgba(255,255,255,0.16)",
  borderRadius: "28px",
  background: "#050505",
  boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
};

export const markStyle: CSSProperties = {
  width: "48px",
  height: "48px",
  borderRadius: "15px",
  display: "grid",
  placeItems: "center",
  border: "1px solid rgba(255,255,255,0.25)",
  fontWeight: 950,
  fontSize: "24px",
};

export const titleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "clamp(28px, 7vw, 46px)",
  lineHeight: 1.05,
  letterSpacing: "-0.045em",
  fontWeight: 950,
};

export const descriptionStyle: CSSProperties = {
  margin: 0,
  color: "#D4D4D8",
  lineHeight: 1.65,
  fontSize: "15px",
};

export const linksStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
};

export const legalLinkStyle: CSSProperties = {
  color: "#FFFFFF",
  textDecoration: "underline",
  textUnderlineOffset: "4px",
  fontSize: "13px",
  fontWeight: 850,
};

export const checksStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
};

export const checkLabelStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "24px minmax(0, 1fr)",
  gap: "12px",
  alignItems: "start",
  padding: "15px",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: "18px",
  background: "#000000",
  color: "#F4F4F5",
  lineHeight: 1.5,
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
};

export const checkboxStyle: CSSProperties = {
  width: "20px",
  height: "20px",
  margin: "1px 0 0",
  accentColor: "#FFFFFF",
};

export const primaryButtonStyle: CSSProperties = {
  minHeight: "52px",
  border: "none",
  borderRadius: "999px",
  background: "#FFFFFF",
  color: "#000000",
  fontSize: "13px",
  fontWeight: 950,
  letterSpacing: "0.04em",
};

export const statusStyle: CSSProperties = {
  margin: 0,
  color: "#D4D4D8",
  fontWeight: 850,
};

export const successStyle: CSSProperties = {
  margin: 0,
  padding: "14px 16px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.18)",
  color: "#FFFFFF",
  background: "rgba(255,255,255,0.06)",
  fontWeight: 800,
};

export const errorStyle: CSSProperties = {
  margin: 0,
  padding: "14px 16px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.22)",
  color: "#FFFFFF",
  background: "rgba(255,255,255,0.07)",
  lineHeight: 1.5,
  fontWeight: 750,
};
