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
          <span style={warningsTitleStyle}>{t.avisos}</span>
          <ul style={warningsListStyle}>
            {avisos.map((aviso) => (
              <li key={aviso}>{traduzirAvisoConteudo18(aviso, language)}</li>
            ))}
          </ul>
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
  padding: "24px 16px",
  background:
    "radial-gradient(circle at 50% 8%, rgba(92, 41, 181, 0.22), transparent 34%), #05020a",
  color: "#fff",
};

const cardStyle: CSSProperties = {
  width: "min(100%, 520px)",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: 14,
  padding: "26px 22px",
  border: "1px solid rgba(176, 134, 255, 0.28)",
  borderRadius: 24,
  background: "rgba(14, 7, 25, 0.97)",
  boxShadow: "0 28px 80px rgba(0, 0, 0, 0.48)",
};

const badgeStyle: CSSProperties = {
  alignSelf: "center",
  padding: "6px 11px",
  borderRadius: 999,
  border: "1px solid rgba(255, 120, 140, 0.45)",
  background: "rgba(123, 25, 45, 0.24)",
  color: "#ffbdc8",
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: "0.08em",
};

const iconStyle: CSSProperties = {
  width: 72,
  height: 72,
  alignSelf: "center",
  display: "grid",
  placeItems: "center",
  borderRadius: "50%",
  border: "2px solid #ff667d",
  color: "#fff",
  fontSize: 23,
  fontWeight: 950,
  boxShadow: "0 0 32px rgba(255, 74, 107, 0.22)",
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
  lineHeight: 1.6,
};

const workTitleStyle: CSSProperties = {
  textAlign: "center",
  color: "#fff",
  fontSize: 16,
};

const warningsStyle: CSSProperties = {
  padding: "14px 16px",
  borderRadius: 16,
  background: "rgba(255, 255, 255, 0.045)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
};

const warningsTitleStyle: CSSProperties = {
  display: "block",
  marginBottom: 8,
  color: "#c8a8ff",
  fontSize: 12,
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const warningsListStyle: CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  color: "#f3edf9",
  fontSize: 13,
  lineHeight: 1.65,
};

const checkboxLabelStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  padding: "13px 14px",
  borderRadius: 14,
  border: "1px solid rgba(163, 111, 255, 0.25)",
  background: "rgba(116, 65, 204, 0.08)",
  cursor: "pointer",
  fontSize: 13,
  lineHeight: 1.45,
};

const checkboxStyle: CSSProperties = {
  width: 18,
  height: 18,
  marginTop: 1,
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
