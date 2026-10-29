import type { HistorietasLanguage } from "../../../lib/i18n";
import type { FiltroColecaoExplorar } from "../lib/explorar-derived-utils";
import { criarExplorarModalOptionStyle, criarExplorarModalRadioStyle } from "../lib/explorar-layout-styles";
import { traduzirTextoExplorar } from "../lib/explorar-translations";

const opcoesColecaoExplorar: Array<[FiltroColecaoExplorar, string]> = [["todos", "Todas"], ["lendo", "Lendo agora"], ["favoritas", "Na lista"], ["concluidas", "Concluídas"], ["sem-leitura", "Sem leitura"]];
type ExplorarCollectionFilterOptionsProps = { filtroColecao: FiltroColecaoExplorar; language: HistorietasLanguage; onSelecionar: (filtro: FiltroColecaoExplorar) => void };
export function ExplorarCollectionFilterOptions({ filtroColecao, language, onSelecionar }: ExplorarCollectionFilterOptionsProps) {
  return opcoesColecaoExplorar.map(([valor, rotulo]) => <button key={valor} type="button" onClick={() => onSelecionar(valor)} style={criarExplorarModalOptionStyle(filtroColecao === valor)}><span>{traduzirTextoExplorar(rotulo, language)}</span><span style={criarExplorarModalRadioStyle(filtroColecao === valor)}>{filtroColecao === valor ? "✓" : ""}</span></button>);
}
