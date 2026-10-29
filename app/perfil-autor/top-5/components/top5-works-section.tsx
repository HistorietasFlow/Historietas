import { Top5EmptyWorksMessage } from "./top5-empty-works-message";
import { Top5LoadingMessage } from "./top5-loading-message";
import { Top5WorksGrid } from "./top5-works-grid";
import { gridSectionStyle } from "../lib/top5-main-styles";
import type { ObraTop5 } from "../lib/top5-types";

type Top5WorksSectionProps = {
  carregando: boolean;
  obras: ObraTop5[];
  idsSelecionados: string[];
  onAlternar: (obra: ObraTop5) => void;
};

export function Top5WorksSection({
  carregando,
  obras,
  idsSelecionados,
  onAlternar,
}: Top5WorksSectionProps) {
  return (
    <section
      style={gridSectionStyle}
      aria-label="Lista de obras disponíveis"
    >
      {carregando && (
        <Top5LoadingMessage />
      )}

      {!carregando && (
        obras.length > 0 ? (
          <Top5WorksGrid
            obras={obras}
            idsSelecionados={idsSelecionados}
            onAlternar={onAlternar}
          />
        ) : (
          <Top5EmptyWorksMessage />
        )
      )}
    </section>
  );
}
