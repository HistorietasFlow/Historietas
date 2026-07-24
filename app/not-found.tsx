"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useHistorietasLanguage } from "../components/HistorietasLanguageProvider";
import { historietasThemeCss } from "../lib/historietasTheme";
import type { HistorietasLanguage } from "../lib/i18n";

type NotFoundTranslation = {
  homeAria: string;
  errorCode: string;
  title: string;
  description: string;
  backHome: string;
  exploreWorks: string;
};

const NOT_FOUND_TRANSLATIONS: Record<
  HistorietasLanguage,
  NotFoundTranslation
> = {
  "pt-BR": {
    homeAria: "Voltar para a Home",
    errorCode: "Erro 404",
    title: "Página não encontrada",
    description:
      "O endereço acessado não existe ou foi movido. Volte para a Home ou explore outras obras da Historietas.",
    backHome: "Voltar para Home",
    exploreWorks: "Explorar obras",
  },
  en: {
    homeAria: "Go back to Home",
    errorCode: "Error 404",
    title: "Page not found",
    description:
      "The address you accessed does not exist or has been moved. Go back to Home or explore other works on Historietas.",
    backHome: "Back to Home",
    exploreWorks: "Explore works",
  },
  es: {
    homeAria: "Volver al inicio",
    errorCode: "Error 404",
    title: "Página no encontrada",
    description:
      "La dirección a la que accediste no existe o fue trasladada. Vuelve al inicio o explora otras obras en Historietas.",
    backHome: "Volver al inicio",
    exploreWorks: "Explorar obras",
  },
};

export default function NotFound() {
  const { language } = useHistorietasLanguage();
  const texts = NOT_FOUND_TRANSLATIONS[language];

  return (
    <main style={pageStyle}>
      <style>{`${historietasThemeCss}${notFoundPageCss}`}</style>

      <div style={topWaterFadeStyle} aria-hidden="true" />

      <section style={containerStyle} aria-labelledby="not-found-title">
        <Link href="/" style={logoStyle} aria-label={texts.homeAria}>
          <span style={logoMarkStyle}>H</span>
          <span className="historietas-theme-logo-text" style={logoTextStyle}>
            istorietas
          </span>
        </Link>

        <section style={boxStyle}>
          <span style={codeStyle}>{texts.errorCode}</span>

          <h1
            id="not-found-title"
            className="historietas-theme-title"
            style={titleStyle}
          >
            {texts.title}
          </h1>

          <p style={textStyle}>{texts.description}</p>

          <div className="not-found-actions" style={actionsStyle}>
            <Link href="/" style={primaryButtonStyle}>
              {texts.backHome}
            </Link>

            <Link href="/explorar" style={secondaryButtonStyle}>
              {texts.exploreWorks}
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}

const notFoundPageCss = `
  html {
    --historietas-not-found-bg: var(--historietas-bg-start, #070212);
    --historietas-not-found-surface: linear-gradient(
      135deg,
      var(--historietas-surface, rgba(18, 12, 30, 0.90)) 0%,
      var(--historietas-surface-strong, rgba(12, 7, 23, 0.98)) 100%
    );
    --historietas-not-found-code: var(--historietas-accent, #FDBA74);
  }

  html[data-historietas-tema-visual="original"] body,
  html[data-historietas-tema-visual="original"] main {
    background: #070212 !important;
  }

  html[data-historietas-tema-visual="foco"] {
    --historietas-not-found-bg: #000000;
    --historietas-not-found-surface: #050505;
    --historietas-not-found-code: #FFFFFF;
  }

  html[data-historietas-tema-visual="foco"] body,
  html[data-historietas-tema-visual="foco"] main {
    background: #000000 !important;
    color: #FFFFFF !important;
  }

  html[data-historietas-tema-visual] main > div[aria-hidden="true"] {
    background: transparent !important;
    opacity: 0 !important;
  }

  html[data-historietas-tema-visual="foco"] .historietas-theme-logo-text,
  html[data-historietas-tema-visual="foco"] .historietas-theme-title {
    background: none !important;
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
    text-shadow: none !important;
  }

  @media (max-width: 520px) {
    .not-found-actions {
      grid-template-columns: minmax(0, 1fr) !important;
    }
  }
`;

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const pageStyle: CSSProperties = {
  position: "relative",
  minHeight: "100dvh",
  width: "100%",
  maxWidth: "100vw",
  overflowX: "hidden",
  boxSizing: "border-box",
  background: "var(--historietas-not-found-bg, #070212)",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontFamily: "Inter, Poppins, Manrope, Arial, Helvetica, sans-serif",
};

const topWaterFadeStyle: CSSProperties = {
  position: "absolute",
  inset: "0 0 auto",
  height: "min(620px, 68vh)",
  pointerEvents: "none",
  zIndex: 0,
  background: "transparent",
  opacity: 0,
};

const containerStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "min(920px, calc(100% - 28px))",
  minHeight: "100dvh",
  margin: "0 auto",
  padding: "18px 0 calc(96px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  gap: "18px",
  minWidth: 0,
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
  overflow: "visible",
  ...safeTextStyle,
};

const logoMarkStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "linear-gradient(135deg, var(--historietas-accent, #F97316) 0%, var(--historietas-secondary, #7C3AED) 100%)",
  color: "#FFFFFF",
  fontSize: "17px",
  fontWeight: 950,
  letterSpacing: "-0.04em",
  flex: "0 0 auto",
  boxShadow: "none",
};

const logoTextStyle: CSSProperties = {
  marginLeft: "-1px",
  background:
    "linear-gradient(135deg, var(--historietas-title-from, #F5F3FF) 0%, var(--historietas-title-mid, #C4B5FD) 42%, var(--historietas-title-to, #FDBA74) 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow:
    "var(--historietas-logo-shadow, 0 0 26px rgba(139, 92, 246, 0.24))",
  overflow: "visible",
  whiteSpace: "nowrap",
};

const boxStyle: CSSProperties = {
  width: "min(620px, 100%)",
  display: "grid",
  justifyItems: "center",
  gap: "12px",
  padding: "22px 16px",
  borderRadius: "26px",
  background: "var(--historietas-not-found-surface)",
  border:
    "1px solid var(--historietas-border-soft, rgba(255, 255, 255, 0.08))",
  boxShadow: "none",
  textAlign: "center",
  boxSizing: "border-box",
  overflow: "hidden",
  minWidth: 0,
};

const codeStyle: CSSProperties = {
  color: "var(--historietas-not-found-code, #FDBA74)",
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
  minWidth: 0,
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
  minWidth: 0,
  ...safeTextStyle,
};

const secondaryButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  background:
    "var(--historietas-secondary-surface, rgba(255, 255, 255, 0.08))",
  border:
    "1px solid var(--historietas-border-soft, rgba(255, 255, 255, 0.12))",
  color: "var(--historietas-secondary-button-text, #DDD6FE)",
};