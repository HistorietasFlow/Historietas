import type { HistorietasLanguage } from "../../../lib/i18n";
import {
  explorarModalClearButtonStyle,
  explorarModalClearDividerStyle,
} from "../lib/explorar-layout-styles";
import { traduzirTextoExplorar } from "../lib/explorar-translations";

type ExplorarClearFiltersActionProps = {
  language: HistorietasLanguage;
  onLimpar: () => void;
};

export function ExplorarClearFiltersAction({
  language,
  onLimpar,
}: ExplorarClearFiltersActionProps) {
  return (
    <>
      <span style={explorarModalClearDividerStyle} aria-hidden="true" />

      <button
        type="button"
        onClick={onLimpar}
        style={explorarModalClearButtonStyle}
      >
        {traduzirTextoExplorar("Limpar filtros", language)}
      </button>
    </>
  );
}
