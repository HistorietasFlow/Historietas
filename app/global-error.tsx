"use client";

import { useEffect, type CSSProperties } from "react";
import { useRouter } from "next/navigation";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const router = useRouter();

  useEffect(() => {
    console.error("Erro global na Historietas:", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body style={bodyStyle}>
        <main role="alert" aria-labelledby="global-error-title" style={cardStyle}>
          <div style={logoStyle} aria-label="Historietas">
            <span style={logoMarkStyle} aria-hidden="true">
              H
            </span>
            istorietas
          </div>
          <p style={eyebrowStyle}>Erro inesperado</p>
          <h1 id="global-error-title" style={titleStyle}>
            Não foi possível carregar a Historietas
          </h1>
          <p style={descriptionStyle}>
            Tente recarregar agora. Seus dados não serão apagados.
          </p>
          <div style={actionsStyle}>
            <button type="button" onClick={reset} style={primaryButtonStyle}>
              Tentar novamente
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              style={secondaryButtonStyle}
            >
              Voltar para Home
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}

const bodyStyle: CSSProperties = {
  minHeight: "100dvh",
  margin: 0,
  display: "grid",
  placeItems: "center",
  padding: "24px 16px",
  boxSizing: "border-box",
  background: "#000000",
  color: "#ffffff",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const cardStyle: CSSProperties = {
  width: "min(620px, 100%)",
  display: "grid",
  justifyItems: "center",
  gap: "16px",
  padding: "clamp(24px, 6vw, 42px)",
  boxSizing: "border-box",
  border: "1px solid rgba(255,255,255,.18)",
  borderRadius: "28px",
  background: "#050505",
  textAlign: "center",
};

const logoStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
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
  background: "#ffffff",
  color: "#000000",
  fontSize: "18px",
};

const eyebrowStyle: CSSProperties = {
  margin: "8px 0 0",
  color: "#a1a1aa",
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
  color: "#a1a1aa",
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
  padding: "12px 18px",
  borderRadius: "999px",
  font: "inherit",
  fontWeight: 850,
  cursor: "pointer",
};

const primaryButtonStyle: CSSProperties = {
  ...baseButtonStyle,
  border: "1px solid #ffffff",
  background: "#ffffff",
  color: "#000000",
};

const secondaryButtonStyle: CSSProperties = {
  ...baseButtonStyle,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.06)",
  color: "#ffffff",
};
