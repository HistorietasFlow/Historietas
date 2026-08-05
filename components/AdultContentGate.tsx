"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import type { HistorietasLanguage } from "../lib/i18n";
import {
  confirmarAcessoConteudo18,
  traduzirAvisoConteudo18,
  type AvisoConteudo18,
} from "../lib/historietasAdultContent";

type AdultContentGateProps = {
  titulo: string;
  avisos: AvisoConteudo18[];
  language: HistorietasLanguage;
  onConfirmar: () => void;
  onVoltar: () => void;
};

const TEXTOS = {
  "pt-BR": {
    selo: "CONTEÚDO 18+",
    titulo: "Confirmação de idade",
    descricao:
      "Esta obra é destinada a pessoas com 18 anos ou mais. Confirme sua idade antes de continuar.",
    avisos: "Avisos de conteúdo",
    confirmacao: "Confirmo que tenho 18 anos ou mais.",
    continuar: "Tenho 18 anos — continuar",
    voltar: "Voltar",
    observacao:
      "A confirmação fica salva neste dispositivo por 30 dias. O Historietas não permite pornografia, imagens sexuais explícitas nem conteúdo sexual envolvendo menores.",
  },
  en: {
    selo: "18+ CONTENT",
    titulo: "Age confirmation",
    descricao:
      "This work is intended for people aged 18 or older. Confirm your age before continuing.",
    avisos: "Content warnings",
    confirmacao: "I confirm that I am 18 years old or older.",
    continuar: "I am 18 — continue",
    voltar: "Go back",
    observacao:
      "Confirmation is stored on this device for 30 days. Historietas does not allow pornography, sexually explicit images, or sexual content involving minors.",
  },
  es: {
    selo: "CONTENIDO 18+",
    titulo: "Confirmación de edad",
    descricao:
      "Esta obra está destinada a personas de 18 años o más. Confirma tu edad antes de continuar.",
    avisos: "Advertencias de contenido",
    confirmacao: "Confirmo que tengo 18 años o más.",
    continuar: "Tengo 18 años — continuar",
    voltar: "Volver",
    observacao:
      "La confirmación se guarda en este dispositivo durante 30 días. Historietas no permite pornografía, imágenes sexuales explícitas ni contenido sexual que involucre a menores.",
  },
} satisfies Record<HistorietasLanguage, Record<string, string>>;

export default function AdultContentGate({
  titulo,
  avisos,
  language,
  onConfirmar,
  onVoltar,
}: AdultContentGateProps) {
  const [confirmouIdade, setConfirmouIdade] = useState(false);
  const t = TEXTOS[language] || TEXTOS["pt-BR"];

  function confirmar() {
    if (!confirmouIdade) {
      return;
    }

    confirmarAcessoConteudo18();
    onConfirmar();
  }

  return (
    <main style={pageStyle} data-historietas-adult-content-gate="true">
      <section
        style={cardStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="historietas-adult-gate-title"
        aria-describedby="historietas-adult-gate-description"
      >
        <span style={badgeStyle}>{t.selo}</span>

        <div style={iconStyle} aria-hidden="true">
          18+
        </div>

        <h1 id="historietas-adult-gate-title" style={titleStyle}>
          {t.titulo}
        </h1>

        <p id="historietas-adult-gate-description" style={descriptionStyle}>
          {t.descricao}
        </p>

        <strong style={workTitleStyle}>{titulo}</strong>

        <div style={warningsStyle}>
          <div style={warningsHeaderStyle}>
            <span style={miniBadgeStyle}>18+</span>
            <span style={warningsTitleStyle}>{t.avisos}</span>
          </div>

          <div style={warningsChipsStyle}>
            {avisos.map((aviso) => (
              <span key={aviso} style={warningChipStyle}>
                {traduzirAvisoConteudo18(aviso, language)}
              </span>
            ))}
          </div>
        </div>

        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={confirmouIdade}
            onChange={(event) => setConfirmouIdade(event.target.checked)}
            style={checkboxStyle}
          />
          <span>{t.confirmacao}</span>
        </label>

        <button
          type="button"
          onClick={confirmar}
          disabled={!confirmouIdade}
          style={{
            ...continueButtonStyle,
            ...(!confirmouIdade ? disabledButtonStyle : {}),
          }}
        >
          {t.continuar}
        </button>

        <button type="button" onClick={onVoltar} style={backButtonStyle}>
          {t.voltar}
        </button>

        <p style={noteStyle}>{t.observacao}</p>
      </section>
    </main>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100dvh",
  display: "grid",
  placeItems: "center",
  padding: "28px 16px 112px",
  background:
    "radial-gradient(circle at 50% 8%, rgba(92, 41, 181, 0.18), transparent 32%), #05020a",
  color: "#fff",
};

const cardStyle: CSSProperties = {
  width: "min(100%, 500px)",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: 12,
  padding: "24px 20px 22px",
  border: "1px solid rgba(151, 118, 219, 0.2)",
  borderRadius: 24,
  background: "linear-gradient(180deg, rgba(14, 7, 25, 0.98), rgba(11, 5, 20, 0.98))",
  boxShadow: "0 24px 70px rgba(0, 0, 0, 0.42)",
};

const badgeStyle: CSSProperties = {
  alignSelf: "center",
  padding: "7px 14px",
  borderRadius: 999,
  border: "1px solid rgba(255, 120, 140, 0.3)",
  background: "rgba(123, 25, 45, 0.18)",
  color: "#ffd4de",
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: "0.08em",
};

const iconStyle: CSSProperties = {
  width: 64,
  height: 64,
  alignSelf: "center",
  display: "grid",
  placeItems: "center",
  borderRadius: "50%",
  border: "2px solid rgba(255, 103, 131, 0.85)",
  color: "#fff",
  fontSize: 22,
  fontWeight: 950,
  boxShadow: "0 0 22px rgba(255, 74, 107, 0.16)",
};

const titleStyle: CSSProperties = {
  margin: 0,
  textAlign: "center",
  fontSize: "clamp(24px, 6vw, 34px)",
  lineHeight: 1.08,
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  textAlign: "center",
  color: "#d7cde5",
  fontSize: 14,
  lineHeight: 1.55,
};

const workTitleStyle: CSSProperties = {
  textAlign: "center",
  color: "#fff",
  fontSize: 22,
  fontWeight: 800,
};

const warningsStyle: CSSProperties = {
  display: "grid",
  gap: 10,
  padding: "14px 15px",
  borderRadius: 18,
  background: "rgba(255, 255, 255, 0.035)",
  border: "1px solid rgba(255, 255, 255, 0.07)",
};

const warningsHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const miniBadgeStyle: CSSProperties = {
  padding: "4px 9px",
  borderRadius: 999,
  background: "rgba(123, 25, 45, 0.18)",
  border: "1px solid rgba(255, 120, 140, 0.24)",
  color: "#ffd4de",
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: "0.06em",
  flex: "0 0 auto",
};

const warningsTitleStyle: CSSProperties = {
  color: "#cfb7ff",
  fontSize: 12,
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const warningsChipsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const warningChipStyle: CSSProperties = {
  padding: "7px 10px",
  borderRadius: 999,
  background: "rgba(255, 255, 255, 0.045)",
  border: "1px solid rgba(255, 255, 255, 0.06)",
  color: "#f2ebfb",
  fontSize: 12,
  lineHeight: 1.35,
  fontWeight: 700,
};

const checkboxLabelStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "14px 15px",
  borderRadius: 16,
  border: "1px solid rgba(163, 111, 255, 0.18)",
  background: "rgba(116, 65, 204, 0.06)",
  cursor: "pointer",
  fontSize: 14,
  lineHeight: 1.45,
};

const checkboxStyle: CSSProperties = {
  width: 18,
  height: 18,
  marginTop: 0,
  accentColor: "#8d4cf5",
  flex: "0 0 auto",
};

const continueButtonStyle: CSSProperties = {
  minHeight: 48,
  border: 0,
  borderRadius: 14,
  background: "linear-gradient(135deg, #6f34d7, #9b5cff)",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const disabledButtonStyle: CSSProperties = {
  opacity: 0.45,
  cursor: "not-allowed",
};

const backButtonStyle: CSSProperties = {
  minHeight: 42,
  border: "1px solid rgba(255, 255, 255, 0.12)",
  borderRadius: 13,
  background: "transparent",
  color: "#e9e1f2",
  fontWeight: 800,
  cursor: "pointer",
};

const noteStyle: CSSProperties = {
  margin: "2px 0 0",
  color: "#9d91aa",
  fontSize: 11,
  lineHeight: 1.55,
  textAlign: "center",
};