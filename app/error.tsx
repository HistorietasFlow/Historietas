"use client";

import Link from "next/link";
import { useEffect, type CSSProperties } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Erro inesperado na interface da Historietas:", error);
  }, [error]);

  return (
    <main style={pageStyle}>
      <section
        role="alert"
        aria-labelledby="error-page-title"
        style={cardStyle}
      >
        <Link href="/" aria-label="Voltar para a Home" style={logoStyle}>
          <span style={logoMarkStyle} aria-hidden="true">
            H
          </span>
          <span>istorietas</span>
        </Link>

        <p style={eyebrowStyle}>Algo deu errado</p>
        <h1 id="error-page-title" style={titleStyle}>
          Não foi possível abrir esta página
        </h1>
        <p style={descriptionStyle}>
          Tente novamente. Se o problema continuar, volte para a Home e retome
          a navegação em alguns instantes.
        </p>

        <div style={actionsStyle}>
          <button type="button" onClick={reset} style={primaryButtonStyle}>
            Tentar novamente
          </button>
          <Link href="/" style={secondaryButtonStyle}>
            Voltar para Home
          </Link>
        </div>
      </section>
    </main>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100dvh",
  display: "grid",
  placeItems: "center",
  padding: "24px 16px calc(104px + env(safe-area-inset-bottom))",
  boxSizing: "border-box",
  background: "var(--historietas-page-background, #000000)",
  color: "var(--historietas-text-primary, #ffffff)",
};

const cardStyle: CSSProperties = {
  width: "min(620px, 100%)",
  display: "grid",
  justifyItems: "center",
  gap: "16px",
  padding: "clamp(24px, 6vw, 42px)",
  boxSizing: "border-box",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,.18))",
  borderRadius: "28px",
  background: "var(--historietas-surface, #050505)",
  textAlign: "center",
};

const logoStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  color: "inherit",
  textDecoration: "none",
  fontSize: "25px",
  fontWeight: 950,
  letterSpacing: "-.055em",
};

const logoMarkStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  display: "grid",
  placeItems: "center",
  marginRight: "4px",
  borderRadius: "12px",
  background: "var(--historietas-accent, #ffffff)",
  color: "var(--historietas-page-background, #000000)",
  fontSize: "18px",
};

const eyebrowStyle: CSSProperties = {
  margin: "8px 0 0",
  color: "var(--historietas-secondary, #a1a1aa)",
  fontSize: "13px",
  fontWeight: 900,
  letterSpacing: ".14em",
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: 0,
  maxWidth: "520px",
  fontSize: "clamp(32px, 8vw, 54px)",
  lineHeight: 1.02,
  letterSpacing: "-.055em",
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  maxWidth: "480px",
  color: "var(--historietas-text-secondary, #a1a1aa)",
  fontSize: "15px",
  fontWeight: 650,
  lineHeight: 1.6,
};

const actionsStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "10px",
  marginTop: "8px",
};

const baseButtonStyle: CSSProperties = {
  minHeight: "52px",
  display: "grid",
  placeItems: "center",
  padding: "12px 18px",
  boxSizing: "border-box",
  borderRadius: "999px",
  font: "inherit",
  fontWeight: 850,
  cursor: "pointer",
  textDecoration: "none",
};

const primaryButtonStyle: CSSProperties = {
  ...baseButtonStyle,
  border: "1px solid var(--historietas-accent, #ffffff)",
  background: "var(--historietas-accent, #ffffff)",
  color: "var(--historietas-page-background, #000000)",
};

const secondaryButtonStyle: CSSProperties = {
  ...baseButtonStyle,
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,.18))",
  background: "var(--historietas-secondary-surface, rgba(255,255,255,.06))",
  color: "inherit",
};
