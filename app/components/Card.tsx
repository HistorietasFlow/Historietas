"use client";

import Link from "next/link";
import { useState } from "react";
import type { CSSProperties } from "react";
import type { Obra } from "../data/obras";

type CardProps = {
  obra?: Obra;
};

function normalizarTextoCard(texto: string) {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatarGeneroCard(genero: string) {
  const generoLimpo = genero.trim();
  const generoNormalizado = normalizarTextoCard(generoLimpo);

  if (generoNormalizado === "fantasia sombria") {
    return "Fantasia";
  }

  if (
    generoNormalizado === "sci-fi" ||
    generoNormalizado === "sci fi" ||
    generoNormalizado === "cyberpunk"
  ) {
    return "Ficção";
  }

  return generoLimpo || "Gênero não informado";
}

export default function Card({ obra }: CardProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (!obra) {
    return null;
  }

  const titulo = obra.titulo?.trim() || "Obra sem título";
  const autor = obra.autor?.trim() || "Autor não informado";
  const genero = formatarGeneroCard(obra.genero || "");
  const status = obra.status?.trim() || "Em andamento";
  const link = obra.link?.trim() || "/explorar";
  const classificacaoIndicativa =
    obra.classificacaoIndicativa?.trim() || "Não informada";

  const mostrarClassificacao = classificacaoIndicativa !== "Não informada";

  const statusVisual = criarStatusVisual(status);

  const cardStyle: CSSProperties = {
    position: "relative",
    display: "block",
    minWidth: 0,
    maxWidth: "260px",
    width: "100%",
    minHeight: "100%",
    textDecoration: "none",
    color: "#FFFFFF",
    borderRadius: "22px",
    overflow: "hidden",
    background:
      "linear-gradient(180deg, var(--historietas-surface, rgba(39,39,42,1)) 0%, var(--historietas-surface-strong, rgba(31,31,35,1)) 100%)",
    border: isHovered
      ? "1px solid var(--historietas-accent, #F97316)"
      : "1px solid var(--historietas-border-soft, #2D2D32)",
    boxShadow: "none",
    transform: "none",
    transition: "border-color 180ms ease, background 180ms ease",
  };

  const coverStyle: CSSProperties = {
    height: "300px",
    position: "relative",
    background:
      "radial-gradient(circle at top left, rgba(249,115,22,0.45), transparent 34%), radial-gradient(circle at bottom right, rgba(124,58,237,0.65), transparent 36%), linear-gradient(135deg, #18181B 0%, #0F0F0F 100%)",
    borderBottom: "1px solid #2D2D32",
    display: "flex",
    alignItems: "flex-end",
    padding: "18px",
    boxSizing: "border-box",
    minWidth: 0,
    overflow: "hidden",
  };

  const overlayStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(15,15,15,0.08) 0%, rgba(15,15,15,0.82) 100%)",
    opacity: isHovered ? 1 : 0,
    transition: "opacity 220ms ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    pointerEvents: "none",
  };

  const ctaStyle: CSSProperties = {
    borderRadius: "999px",
    padding: "12px 18px",
    background: "#F97316",
    color: "#FFFFFF",
    fontWeight: 800,
    fontSize: "14px",
    boxShadow: "none",
    textAlign: "center",
    maxWidth: "100%",
    ...safeTextStyle,
  };

  return (
    <Link
      href={link}
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      aria-label={`Abrir obra ${titulo}`}
    >
      <div style={coverStyle}>
        <div style={genreBadgeStyle}>{genero}</div>

        <div
          style={{
            ...statusBadgeStyle,
            background: statusVisual.background,
            color: statusVisual.color,
          }}
        >
          {status}
        </div>

        {mostrarClassificacao && (
          <div style={classificationBadgeStyle}>{classificacaoIndicativa}</div>
        )}

        <div style={coverTextBoxStyle}>
          <p style={coverKickerStyle}>Obra em destaque</p>

          <h3 style={coverTitleStyle}>{titulo}</h3>
        </div>

        <div style={overlayStyle}>
          <span style={ctaStyle}>Ler agora</span>
        </div>
      </div>

      <div style={contentStyle}>
        <p style={authorStyle}>Por {autor}</p>

        <div style={statsStyle}>
          <span style={safeTextStyle}>👁 {obra.views || 0}</span>
          <span style={safeTextStyle}>♥ {obra.likes || 0}</span>
          <span style={safeTextStyle}>💬 {obra.comentarios || 0}</span>

          {mostrarClassificacao && (
            <span style={safeTextStyle}>{classificacaoIndicativa}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function criarStatusVisual(status: string) {
  if (status === "Completo") {
    return {
      background: "rgba(34, 197, 94, 0.18)",
      color: "#86EFAC",
    };
  }

  if (status === "Pausado") {
    return {
      background: "rgba(250, 204, 21, 0.18)",
      color: "#FDE68A",
    };
  }

  return {
    background: "rgba(249, 115, 22, 0.18)",
    color: "#FDBA74",
  };
}

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const genreBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "14px",
  left: "14px",
  maxWidth: "calc(100% - 28px)",
  padding: "7px 10px",
  borderRadius: "999px",
  background: "var(--historietas-secondary, rgba(124, 58, 237, 0.95))",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.02em",
  zIndex: 2,
  ...safeTextStyle,
};

const statusBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "52px",
  left: "14px",
  maxWidth: "calc(100% - 28px)",
  padding: "7px 10px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  fontSize: "12px",
  fontWeight: 800,
  zIndex: 2,
  ...safeTextStyle,
};

const classificationBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "90px",
  left: "14px",
  maxWidth: "calc(100% - 28px)",
  padding: "7px 10px",
  borderRadius: "999px",
  background: "var(--historietas-secondary, rgba(124, 58, 237, 0.88))",
  border: "1px solid rgba(139, 92, 246, 0.42)",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 950,
  zIndex: 2,
  ...safeTextStyle,
};

const coverTextBoxStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  minWidth: 0,
  maxWidth: "100%",
};

const coverKickerStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "13px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  maxWidth: "100%",
  ...safeTextStyle,
};

const coverTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "28px",
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: "-0.06em",
  maxWidth: "100%",
  ...safeTextStyle,
};

const contentStyle: CSSProperties = {
  padding: "16px",
  minWidth: 0,
  overflow: "hidden",
};

const authorStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "var(--historietas-text-secondary, #B3B3B3)",
  fontSize: "14px",
  fontWeight: 600,
  maxWidth: "100%",
  ...safeTextStyle,
};

const statsStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "14px",
  color: "#A1A1AA",
  fontSize: "13px",
  fontWeight: 700,
  minWidth: 0,
};