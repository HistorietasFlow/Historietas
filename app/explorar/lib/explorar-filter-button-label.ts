import type { HistorietasLanguage } from "../../../lib/i18n";
import { traduzirTextoExplorar } from "./explorar-translations";

export function criarTextoBotaoFiltrosAvancadosExplorar(
  totalFiltrosAvancadosAtivos: number,
  language: HistorietasLanguage,
) {
  return traduzirTextoExplorar(
    totalFiltrosAvancadosAtivos > 0
      ? `Explorar (${totalFiltrosAvancadosAtivos})`
      : "Explorar",
    language,
  );
}
