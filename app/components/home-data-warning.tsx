import type { HistorietasLanguage } from "../../lib/i18n";

const TEXTOS = {
  "pt-BR": {
    aviso: "Não foi possível atualizar todos os dados. As informações disponíveis podem estar desatualizadas.",
    tentar: "Tentar novamente",
  },
  en: {
    aviso: "Some data could not be refreshed. Available information may be out of date.",
    tentar: "Try again",
  },
  es: {
    aviso: "No se pudieron actualizar todos los datos. La información disponible puede estar desactualizada.",
    tentar: "Intentar de nuevo",
  },
};

export default function HomeDataWarning({ language, onRetry }: {
  language: HistorietasLanguage;
  onRetry: () => void;
}) {
  const texto = TEXTOS[language];
  return (
    <div role="status" style={{ position: "relative", zIndex: 2, padding: "12px", color: "#fff", background: "#24364c", borderRadius: "12px", marginBottom: "12px" }}>
      <p style={{ margin: "0 0 8px" }}>{texto.aviso}</p>
      <button type="button" onClick={onRetry} style={{ color: "#fff", background: "#17283d", border: "1px solid #fff", borderRadius: "6px", padding: "8px 12px", cursor: "pointer" }}>
        {texto.tentar}
      </button>
    </div>
  );
}
