import { Top5SelectedHeader } from "./top5-selected-header";
import { Top5SelectedList } from "./top5-selected-list";
import { selectedSectionStyle } from "../lib/top5-selected-section-styles";
import type { ObraTop5 } from "../lib/top5-types";

type Top5SelectedSectionProps = {
  salvando: boolean;
  salvarDesabilitado: boolean;
  obrasSelecionadas: ObraTop5[];
  onSalvar: () => void;
  onRemover: (chave: string) => void;
  onMover: (chave: string, direcao: -1 | 1) => void;
};

export function Top5SelectedSection({
  salvando,
  salvarDesabilitado,
  obrasSelecionadas,
  onSalvar,
  onRemover,
  onMover,
}: Top5SelectedSectionProps) {
  return (
    <section
      style={selectedSectionStyle}
      aria-label="Obras escolhidas para o TOP 5"
    >
      <Top5SelectedHeader
        salvando={salvando}
        salvarDesabilitado={salvarDesabilitado}
        onSalvar={onSalvar}
      />

      <Top5SelectedList
        obrasSelecionadas={obrasSelecionadas}
        onRemover={onRemover}
        onMover={onMover}
      />
    </section>
  );
}
