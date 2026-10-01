import type { CSSProperties, ReactNode } from "react";
import { safeTextStyle } from "./lib/obra-style-utils";

const statCardStyle: CSSProperties = {
  borderRadius: "14px",
  background: "var(--historietas-obra-bg-deep, #000000)",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: "7px 5px",
  display: "grid",
  gap: "3px",
  minWidth: 0,
  overflow: "hidden",
  boxShadow: "none",
  textAlign: "center",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const activeStatCardStyle: CSSProperties = {
  ...statCardStyle,
  background: "var(--historietas-obra-bg-deep, #000000)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "none",
  filter: "none",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const statButtonStyle: CSSProperties = {
  ...statCardStyle,
  cursor: "pointer",
  fontFamily: "inherit",
  color: "inherit",
};

const activeStatButtonStyle: CSSProperties = {
  ...activeStatCardStyle,
  cursor: "pointer",
  fontFamily: "inherit",
  color: "inherit",
};

const statNumberStyle: CSSProperties = {
  color: "#FFFFFF",
  fontSize: "clamp(16px, 4.6vw, 21px)",
  fontWeight: 950,
  lineHeight: 1,
  ...safeTextStyle,
};

const statNumberRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "5px",
  minWidth: 0,
};

const statHeartIconStyle: CSSProperties = {
  width: "18px",
  height: "18px",
  display: "block",
  flex: "0 0 auto",
  transformOrigin: "center",
};

const statLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "7.8px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.025em",
  lineHeight: 1.1,
  whiteSpace: "nowrap",
  ...safeTextStyle,
};


export default function MetricCard({
  numero,
  rotulo,
  ativo = false,
  mostrarCoracao = false,
  onClick,
  ariaLabel,
  ariaExpanded,
}: {
  numero: ReactNode;
  rotulo: string;
  ativo?: boolean;
  mostrarCoracao?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  ariaExpanded?: boolean;
}) {
  const cardStyle = ativo ? activeStatCardStyle : statCardStyle;
  const conteudoNumero = (
    <div style={statNumberRowStyle}>
      {mostrarCoracao ? (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          style={{
            ...statHeartIconStyle,
            animation: ativo
              ? "historietas-stat-heart-pop 260ms ease-out"
              : "none",
          }}
        >
          <path
            d="M20.7 5.3c-1.8-1.9-4.7-1.9-6.5 0L12 7.6 9.8 5.3c-1.8-1.9-4.7-1.9-6.5 0-1.8 1.9-1.8 5 0 6.9L12 21l8.7-8.8c1.8-1.9 1.8-5 0-6.9Z"
            fill={ativo ? "var(--historietas-obra-danger, #FFFFFF)" : "none"}
            stroke={ativo ? "var(--historietas-obra-danger, #FFFFFF)" : "#FFFFFF"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}

      <strong style={statNumberStyle}>{numero}</strong>
    </div>
  );

  if (!onClick) {
    return (
      <div style={cardStyle}>
        {conteudoNumero}
        <span style={statLabelStyle}>{rotulo}</span>
      </div>
    );
  }

  const numeroTexto = typeof numero === "string" || typeof numero === "number"
    ? String(numero)
    : "";

  return (
    <button
      type="button"
      onClick={onClick}
      style={ativo ? activeStatButtonStyle : statButtonStyle}
      aria-pressed={mostrarCoracao ? ativo : undefined}
      aria-expanded={ariaExpanded}
      aria-label={
        ariaLabel ||
        (mostrarCoracao
          ? `${ativo ? "Remover curtida" : "Curtir"}. ${numeroTexto} curtidas`
          : `Abrir ${rotulo}${numeroTexto ? `. Total: ${numeroTexto}` : ""}`)
      }
    >
      {conteudoNumero}
      <span style={statLabelStyle}>{rotulo}</span>
    </button>
  );
}

