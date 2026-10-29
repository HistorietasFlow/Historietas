import type { HistorietasLanguage } from "../../../lib/i18n";
import { explorarCarregarMaisButtonStyle } from "../lib/explorar-layout-styles";
import { traduzirTextoExplorar } from "../lib/explorar-translations";

type ExplorarLoadMoreButtonProps = {
  carregando: boolean;
  language: HistorietasLanguage;
  onCarregarMais: () => void;
};

export function ExplorarLoadMoreButton({
  carregando,
  language,
  onCarregarMais,
}: ExplorarLoadMoreButtonProps) {
  return (
    <button
      type="button"
      onClick={onCarregarMais}
      disabled={carregando}
      style={explorarCarregarMaisButtonStyle}
    >
      {traduzirTextoExplorar(
        carregando
          ? "Carregando"
          : "Carregar mais",
        language,
      )}
    </button>
  );
}
