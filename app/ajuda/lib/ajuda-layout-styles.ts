import type {
  CSSProperties,
} from "react";

export const pageStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background: "var(--historietas-page-background, #070212)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily:
    "Inter, Poppins, Manrope, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

export const containerStyle: CSSProperties = {
  width: "min(920px, calc(100% - 32px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "16px 0 124px",
  boxSizing: "border-box",
};

export const headerStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "42px minmax(0, 1fr)",
  alignItems: "center",
  gap: "11px",
  marginBottom: "17px",
};

export const backButtonStyle: CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 8%, transparent)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
};

export const headerTextStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "2px",
};

export const eyebrowStyle: CSSProperties = {
  color: "var(--historietas-secondary, #7C3AED)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: "0.16em",
};

export const pageTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "clamp(21px, 5vw, 27px)",
  lineHeight: 1.08,
  fontWeight: 900,
  letterSpacing: "-0.04em",
};

export const heroStyle: CSSProperties = {
  borderRadius: "24px",
  padding: "clamp(18px, 4vw, 28px)",
  display: "grid",
  gridTemplateColumns: "50px minmax(0, 1fr)",
  gap: "13px",
  background:
    "linear-gradient(145deg, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 26%, var(--historietas-surface-strong, #120C1E)) 0%, color-mix(in srgb, var(--historietas-accent, #F97316) 10%, var(--historietas-surface-strong, #120C1E)) 100%)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
  marginBottom: "26px",
};

export const heroIconStyle: CSSProperties = {
  width: "50px",
  height: "50px",
  borderRadius: "16px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.10)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

export const heroTextStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  alignContent: "center",
  gap: "6px",
};

export const heroTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "clamp(24px, 6vw, 38px)",
  lineHeight: 1.02,
  fontWeight: 900,
  letterSpacing: "-0.055em",
};

export const heroDescriptionStyle: CSSProperties = {
  margin: 0,
  maxWidth: "660px",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "14px",
  lineHeight: 1.5,
  fontWeight: 560,
};

export const searchBoxStyle: CSSProperties = {
  gridColumn: "1 / -1",
  minHeight: "52px",
  marginTop: "8px",
  borderRadius: "16px",
  padding: "0 12px 0 15px",
  display: "grid",
  gridTemplateColumns: "24px minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "10px",
  background: "var(--historietas-input-bg, #18181B)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
};

export const searchInputStyle: CSSProperties = {
  width: "100%",
  minHeight: "50px",
  border: 0,
  outline: "none",
  background: "transparent",
  color: "var(--historietas-input-text, #FFFFFF)",
  font: "inherit",
  fontSize: "15px",
  fontWeight: 650,
};

export const sectionStyle: CSSProperties = {
  marginBottom: "27px",
};

export const sectionHeadingStyle: CSSProperties = {
  display: "flex",
  alignItems: "end",
  justifyContent: "space-between",
  gap: "14px",
  marginBottom: "12px",
};

export const sectionKickerStyle: CSSProperties = {
  display: "block",
  marginBottom: "4px",
  color: "var(--historietas-secondary, #7C3AED)",
  fontSize: "10px",
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: "0.14em",
};

export const sectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "clamp(18px, 4.5vw, 22px)",
  lineHeight: 1.1,
  fontWeight: 870,
  letterSpacing: "-0.035em",
};

export const resultsCountStyle: CSSProperties = {
  flex: "0 0 auto",
  padding: "7px 10px",
  borderRadius: "999px",
  background: "color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 7%, transparent)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.09))",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1,
  fontWeight: 760,
};

export const categoriesGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(210px, 100%), 1fr))",
  gap: "10px",
};

export const faqListStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
};

export const emptyStateStyle: CSSProperties = {
  minHeight: "240px",
  borderRadius: "19px",
  padding: "28px 18px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  background: "color-mix(in srgb, var(--historietas-surface, #120C1E) 88%, transparent)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
};

export const emptyIconStyle: CSSProperties = {
  width: "52px",
  height: "52px",
  marginBottom: "13px",
  borderRadius: "16px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 8%, transparent)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

export const emptyTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "17px",
  lineHeight: 1.15,
  fontWeight: 850,
};

export const emptyDescriptionStyle: CSSProperties = {
  maxWidth: "520px",
  margin: "8px 0 16px",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "13px",
  lineHeight: 1.5,
  fontWeight: 540,
};

export const shortcutsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))",
  gap: "10px",
};


export const noticeStyle: CSSProperties = {
  borderRadius: "18px",
  padding: "15px",
  display: "grid",
  gridTemplateColumns: "42px minmax(0, 1fr)",
  alignItems: "start",
  gap: "12px",
  background: "color-mix(in srgb, var(--historietas-secondary, #7C3AED) 12%, var(--historietas-surface, #120C1E))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.10))",
};

export const noticeIconStyle: CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "13px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "color-mix(in srgb, var(--historietas-text-primary, #FFFFFF) 8%, transparent)",
  color: "var(--historietas-text-primary, #FFFFFF)",
};

export const noticeTextStyle: CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: "5px",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  lineHeight: 1.45,
};
