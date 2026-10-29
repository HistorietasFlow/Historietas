import type { HistorietasLanguage } from "../../../lib/i18n";
import type { OrdenacaoExplorar } from "../lib/explorar-derived-utils";
import {
  criarExplorarModalOptionStyle,
  criarExplorarModalRadioStyle,
} from "../lib/explorar-layout-styles";
import { traduzirTextoExplorar } from "../lib/explorar-translations";

const opcoesOrdenacaoExplorar: Array<[OrdenacaoExplorar, string]> = [
  ["relevancia", "Relevância"],
  ["mais-curtidas", "Mais curtidas"],
  ["mais-recentes", "Mais recentes"],
];

type ExplorarOrderingOptionsProps = {
  ordenacao: OrdenacaoExplorar;
  language: HistorietasLanguage;
  onSelecionar: (ordenacao: OrdenacaoExplorar) => void;
};

export function ExplorarOrderingOptions({
  ordenacao,
  language,
  onSelecionar,
}: ExplorarOrderingOptionsProps) {
  return opcoesOrdenacaoExplorar.map(([valor, rotulo]) => (
    <button
      key={valor}
      type="button"
      onClick={() => onSelecionar(valor)}
      style={criarExplorarModalOptionStyle(ordenacao === valor)}
    >
      <span>{traduzirTextoExplorar(rotulo, language)}</span>
      <span style={criarExplorarModalRadioStyle(ordenacao === valor)}>
        {ordenacao === valor ? "✓" : ""}
      </span>
    </button>
  ));
}
