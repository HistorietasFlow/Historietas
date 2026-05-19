"use client";

import Link from "next/link";
import { useState } from "react";
import type { CSSProperties } from "react";
import type { Obra } from "../data/obras";

type CardProps = {
  obra?: Obra;
};

export default function Card({ obra }: CardProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (!obra) {
    return null;
  }

  const titulo = obra.titulo?.trim() || "Obra sem título";
  const autor = obra.autor?.trim() || "Autor não informado";
  const genero = obra.genero?.trim() || "Gênero não informado";
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
      "linear-gradient(180deg, rgba(39,39,42,1) 0%, rgba(31,31,35,1) 100%)",
    border: isHovered ? "1px solid #7C3AED" : "1px solid #2D2D32",
    boxShadow: isHovered
      ? "0 22px 60px rgba(124, 58, 237, 0.28)"
      : "0 18px 45px rgba(0, 0, 0, 0.35)",
    transform: isHovered ? "translateY(-8px) scale(1.02)" : "translateY(0)",
    transition: "all 220ms ease",
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
    boxShadow: "0 14px 35px rgba(249, 115, 22, 0.35)",
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
          <p style={coverKickerStyle}>Historietas Original</p>

          <h3 style={coverTitleStyle}>{titulo}</h3>
        </div>

        <div style={overlayStyle}>
          <span style={ctaStyle}>Ler agora</span>
        </div>
      </div>

      <div style={contentStyle}>
        <p style={authorStyle}>por {autor}</p>

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
  background: "rgba(124, 58, 237, 0.95)",
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
  background: "rgba(124, 58, 237, 0.88)",
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
  color: "#A1A1AA",
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
  color: "#B3B3B3",
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
