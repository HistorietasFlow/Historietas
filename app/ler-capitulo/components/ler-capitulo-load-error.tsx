"use client";

import type { CSSProperties } from "react";

type Props = {
  onTentarNovamente: () => void;
};

const estadoErroStyle: CSSProperties = {
  width: "min(100%, 560px)",
  margin: "18px auto 0",
  padding: "16px",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: "14px",
  background: "rgba(17,17,21,0.94)",
  color: "#FFFFFF",
  textAlign: "center",
  boxSizing: "border-box",
};

const mensagemStyle: CSSProperties = {
  margin: 0,
  fontSize: "12px",
  fontWeight: 800,
  lineHeight: 1.5,
};

const botaoStyle: CSSProperties = {
  marginTop: "12px",
  minHeight: "40px",
  padding: "0 16px",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.08)",
  color: "#FFFFFF",
  fontFamily: "inherit",
  fontSize: "12px",
  fontWeight: 900,
  cursor: "pointer",
};

export default function LerCapituloLoadError({
  onTentarNovamente,
}: Props) {
  return (
    <section style={estadoErroStyle} role="alert">
      <p style={mensagemStyle}>
        Não foi possível carregar o capítulo agora. Verifique sua conexão e tente novamente.
      </p>
      <button type="button" style={botaoStyle} onClick={onTentarNovamente}>
        Tentar novamente
      </button>
    </section>
  );
}
