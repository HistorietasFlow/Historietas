import type { HistorietasLanguage } from "../../../lib/i18n";
import type { OrdenacaoExplorar } from "../lib/explorar-derived-utils";
import type { ModoConteudoExplorar } from "./explorar-section-components";
import {
  criarExplorarModalOptionStyle,
  criarExplorarModalRadioStyle,
} from "../lib/explorar-layout-styles";
import { traduzirTextoExplorar } from "../lib/explorar-translations";

const opcoesOrdenacaoExplorar: Array<[OrdenacaoExplorar, string]> = [
  ["relevancia", "Relevância"],
  ["mais-curtidas", "Mais curtidas"],
  ["mais-recentes", "Mais recentes"],
  ["mais-capitulos", "Mais capítulos"],
];

type ExplorarOrderingOptionsProps = {
  ordenacao: OrdenacaoExplorar;
  modoConteudo: ModoConteudoExplorar;
  language: HistorietasLanguage;
  onSelecionar: (ordenacao: OrdenacaoExplorar) => void;
};

export function ExplorarOrderingOptions({
  ordenacao,
  modoConteudo,
  language,
  onSelecionar,
}: ExplorarOrderingOptionsProps) {
  return opcoesOrdenacaoExplorar
    .filter(([valor]) => modoConteudo === "obras" || valor !== "mais-capitulos")
    .map(([valor, rotulo]) => (
      <button
        key={valor}
        type="button"
        onClick={() => onSelecionar(valor)}
        aria-pressed={ordenacao === valor}
        style={criarExplorarModalOptionStyle(ordenacao === valor)}
      >
        <span>{traduzirTextoExplorar(rotulo, language)}</span>
        <span style={criarExplorarModalRadioStyle(ordenacao === valor)}>
          {ordenacao === valor ? "✓" : ""}
        </span>
      </button>
    ));
}
