import type { HistorietasLanguage } from "../../../lib/i18n";
import { OPCOES_FORMATO_OBRA } from "../../publicar/lib/publicar-static-options";
import {
  criarExplorarModalOptionStyle,
  criarExplorarModalRadioStyle,
  explorarModalSectionLabelStyle,
} from "../lib/explorar-layout-styles";
import { traduzirFormatoExplorar, traduzirTextoExplorar } from "../lib/explorar-translations";

export function ExplorarFormatFilterOptions({
  filtroFormato,
  language,
  onSelecionar,
}: {
  filtroFormato: string;
  language: HistorietasLanguage;
  onSelecionar: (formato: string) => void;
}) {
  const titulo = traduzirTextoExplorar("Formato da obra", language);

  return (
    <div role="group" aria-label={titulo}>
      <p style={explorarModalSectionLabelStyle}>{titulo}</p>
      {["todos", ...OPCOES_FORMATO_OBRA].map((formato) => (
        <button
          key={formato}
          type="button"
          aria-pressed={filtroFormato === formato}
          onClick={() => onSelecionar(formato)}
          style={criarExplorarModalOptionStyle(filtroFormato === formato)}
        >
          <span>{formato === "todos"
            ? traduzirTextoExplorar("Todos os formatos", language)
            : traduzirFormatoExplorar(formato, language)}</span>
          <span aria-hidden="true" style={criarExplorarModalRadioStyle(filtroFormato === formato)}>
            {filtroFormato === formato ? "✓" : ""}
          </span>
        </button>
      ))}
    </div>
  );
}
