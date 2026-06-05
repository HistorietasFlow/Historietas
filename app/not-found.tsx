import Link from "next/link";
import type { CSSProperties } from "react";
import { historietasThemeCss } from "../lib/historietasTheme";

export default function NotFound() {
  return (
    <main style={pageStyle}>
      <style>{historietasThemeCss}</style>

      <div style={topWaterFadeStyle} aria-hidden="true" />

      <section style={containerStyle}>
        <Link href="/" style={logoStyle} aria-label="Voltar para a Home">
          <span style={logoMarkStyle}>H</span>
          <span className="historietas-theme-logo-text" style={logoTextStyle}>
            istorietas
          </span>
        </Link>

        <section style={boxStyle}>
          <span style={codeStyle}>404</span>

          <h1 className="historietas-theme-title" style={titleStyle}>
            Página não encontrada
          </h1>

          <p style={textStyle}>
            O endereço acessado não existe ou foi movido. Volte para a Home ou
            explore outras obras da Historietas.
          </p>

          <div style={actionsStyle}>
            <Link href="/" style={primaryButtonStyle}>
              Voltar para Home
            </Link>

            <Link href="/explorar" style={secondaryButtonStyle}>
              Explorar obras
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "clip",
  boxSizing: "border-box",
  background:
    "radial-gradient(circle at 12% 0%, var(--historietas-glow-secondary, color-mix(in srgb, var(--historietas-secondary, #7C3AED) 30%, transparent)), transparent 28%), radial-gradient(circle at 88% 14%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 14%, transparent)), transparent 22%), radial-gradient(circle at 50% 100%, var(--historietas-glow-primary, color-mix(in srgb, var(--historietas-accent, #F97316) 10%, transparent)), transparent 30%), linear-gradient(180deg, var(--historietas-bg-start, #0B0614) 0%, var(--historietas-bg-mid, #12081F) 38%, var(--historietas-bg-end, #17101B) 100%)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const topWaterFadeStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "min(620px, 68vh)",
  pointerEvents: "none",
  zIndex: 0,
  background:
    "linear-gradient(180deg, var(--historietas-bg-start, rgba(10,6,18,0.98)) 0%, var(--historietas-bg-mid, rgba(14,7,25,0.96)) 34%, transparent 100%), radial-gradient(ellipse 62% 86% at 19% 52%, var(--historietas-glow-primary, rgba(124,58,237,0.32)) 0%, transparent 76%), radial-gradient(ellipse 38% 62% at 91% 54%, var(--historietas-glow-secondary, rgba(249,115,22,0.10)) 0%, transparent 76%)",
  WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 78%, transparent 100%)",
  maskImage: "linear-gradient(180deg, #000 0%, #000 78%, transparent 100%)",
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(920px, calc(100% - 28px))",
  minHeight: "100vh",
  margin: "0 auto",
  padding: "18px 0 calc(96px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  gap: "18px",
};

const logoStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  textDecoration: "none",
  fontSize: "24px",
  fontWeight: 950,
  letterSpacing: "-0.055em",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
  minWidth: 0,
  maxWidth: "100%",
  ...safeTextStyle,
};

const logoMarkStyle: CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "13px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "19px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  flex: "0 0 auto",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #F5F3FF) 0%, var(--historietas-title-mid, #C4B5FD) 42%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "var(--historietas-logo-shadow, 0 0 26px rgba(139,92,246,0.24))",
};

const boxStyle: CSSProperties = {
  width: "min(620px, 100%)",
  display: "grid",
  justifyItems: "center",
  gap: "12px",
  padding: "22px 16px",
  borderRadius: "26px",
  background:
    "linear-gradient(135deg, var(--historietas-surface, rgba(18,12,30,0.90)) 0%, var(--historietas-surface-strong, rgba(12,7,23,0.98)) 100%)",
  border:
    "1px solid color-mix(in srgb, var(--historietas-accent, #F97316) 18%, var(--historietas-border-soft, rgba(255,255,255,0.08)))",
  boxShadow: "none",
  textAlign: "center",
  boxSizing: "border-box",
  overflow: "hidden",
};

const codeStyle: CSSProperties = {
  color: "var(--historietas-accent, #FDBA74)",
  fontSize: "13px",
  fontWeight: 950,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  ...safeTextStyle,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(34px, 8vw, 56px)",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.06em",
  textAlign: "center",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #FFFFFF) 0%, var(--historietas-title-mid, #F5F3FF) 46%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  ...safeTextStyle,
};

const textStyle: CSSProperties = {
  margin: 0,
  maxWidth: "480px",
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "14px",
  lineHeight: 1.65,
  fontWeight: 700,
  textAlign: "center",
  ...safeTextStyle,
};

const actionsStyle: CSSProperties = {
  width: "min(420px, 100%)",
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "10px",
  marginTop: "4px",
  boxSizing: "border-box",
};

const primaryButtonStyle: CSSProperties = {
  minHeight: "46px",
  borderRadius: "999px",
  background: "var(--historietas-accent, #F97316)",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 12px",
  boxShadow: "none",
  boxSizing: "border-box",
  ...safeTextStyle,
};

const secondaryButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  background: "var(--historietas-secondary-surface, rgba(255,255,255,0.08))",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
};