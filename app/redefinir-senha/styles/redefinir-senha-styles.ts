import type { CSSProperties } from "react";

export const redefinirSenhaPageCss = `
  html,
  body {
    overflow-x: hidden !important;
    background: var(
      --historietas-page-background,
      #070212
    ) !important;
  }

  html[data-historietas-tema-visual="foco"]
    .historietas-theme-logo-text,
  html[data-historietas-tema-visual="foco"]
    .historietas-theme-title {
    background: none !important;
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
  }
`;

export const pageStyle: CSSProperties = {
  minHeight: "100dvh",
  background:
    "var(--historietas-page-background, #070212)",
  color: "#FFFFFF",
  fontFamily:
    "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
  padding: "0 14px 40px",
};

export const containerStyle: CSSProperties = {
  width: "min(720px, 100%)",
  margin: "0 auto",
};

export const headerStyle: CSSProperties = {
  minHeight: "74px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
};

export const logoStyle: CSSProperties = {
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "25px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  gap: "4px",
};

export const logoMarkStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#04000A",
  border: "1px solid rgba(124,58,237,0.45)",
  fontSize: "19px",
  fontWeight: 950,
};

export const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, #FFFFFF 0%, #DDD6FE 44%, #A78BFA 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

export const languageWrapperStyle: CSSProperties = {
  width: "108px",
};

export const languageSelectStyle: CSSProperties = {
  minHeight: "36px",
  height: "36px",
  padding: "0 8px",
  borderRadius: "12px",
  border: "1px solid rgba(124,58,237,0.45)",
  background: "#04000A",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 850,
  colorScheme: "dark",
};

export const cardStyle: CSSProperties = {
  marginTop: "clamp(28px, 8vh, 86px)",
  width: "min(460px, 100%)",
  marginLeft: "auto",
  marginRight: "auto",
  padding: "clamp(22px, 5vw, 34px)",
  borderRadius: "24px",
  border:
    "1px solid var(--historietas-border-soft, rgba(124,58,237,0.28))",
  background:
    "var(--historietas-surface, #08030F)",
  boxSizing: "border-box",
};

export const contentStyle: CSSProperties = {
  display: "grid",
  gap: "16px",
};

export const titleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  textAlign: "center",
  fontSize: "clamp(25px, 7vw, 38px)",
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: "-0.04em",
};

export const descriptionStyle: CSSProperties = {
  margin: 0,
  color:
    "var(--historietas-text-secondary, #D4D4D8)",
  textAlign: "center",
  fontSize: "13px",
  lineHeight: 1.55,
  fontWeight: 650,
};

export const statusStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  textAlign: "center",
  fontSize: "14px",
  fontWeight: 850,
};

export const formStyle: CSSProperties = {
  display: "grid",
  gap: "13px",
};

export const fieldStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
};

export const labelStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 900,
};

export const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "46px",
  padding: "0 14px",
  borderRadius: "999px",
  border:
    "1px solid var(--historietas-border-soft, rgba(124,58,237,0.45))",
  background:
    "var(--historietas-input-bg, #04000A)",
  color: "#FFFFFF",
  outline: "none",
  fontFamily: "inherit",
  fontSize: "13px",
  fontWeight: 750,
  boxSizing: "border-box",
};

export const primaryButtonStyle: CSSProperties = {
  minHeight: "46px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  background:
    "var(--historietas-active-surface, rgba(124,58,237,0.22))",
  color: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: "13px",
  fontWeight: 950,
};

export const primaryLinkStyle: CSSProperties = {
  minHeight: "46px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  background:
    "var(--historietas-active-surface, rgba(124,58,237,0.22))",
  color: "#FFFFFF",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "13px",
  fontWeight: 950,
};

export const errorStyle: CSSProperties = {
  color: "#FCA5A5",
  fontSize: "12px",
  lineHeight: 1.45,
  fontWeight: 850,
  textAlign: "center",
};
