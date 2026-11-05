"use client";

import type { CSSProperties } from "react";
import { useHistorietasLanguage } from "../../../components/HistorietasLanguageProvider";
import { traduzirTextoExplorar } from "../lib/explorar-translations";

const noticeStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "8px",
  margin: "12px 0 4px",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 700,
  textAlign: "center",
};

const buttonStyle: CSSProperties = {
  minHeight: "36px",
  padding: "8px 14px",
  border: "1px solid rgba(255,255,255,0.7)",
  borderRadius: "999px",
  background: "transparent",
  color: "#FFFFFF",
  font: "inherit",
  fontWeight: 800,
  cursor: "pointer",
};

export function ExplorarCatalogErrorNotice({
  possuiDados,
  carregando,
  onTentarNovamente,
}: {
  possuiDados: boolean;
  carregando: boolean;
  onTentarNovamente: () => void;
}) {
  const { language } = useHistorietasLanguage();
  const mensagem = possuiDados
    ? "Não foi possível atualizar o catálogo agora. Exibindo os dados disponíveis."
    : "O catálogo está temporariamente indisponível.";

  return (
    <div role="alert" style={noticeStyle}>
      <span>{traduzirTextoExplorar(mensagem, language)}</span>
      <button
        type="button"
        style={buttonStyle}
        disabled={carregando}
        aria-busy={carregando}
        onClick={onTentarNovamente}
      >
        {traduzirTextoExplorar("Tentar novamente", language)}
      </button>
    </div>
  );
}
