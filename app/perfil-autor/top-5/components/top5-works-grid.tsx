import {
  selectedBadgeStyle,
  top5CardSelectedStyle,
  top5CardStyle,
  worksGridStyle,
} from "../lib/top5-main-styles";
import { criarCapaTop5Style } from "../lib/top5-cover-styles";
import { criarChaveObraTop5 } from "../lib/top5-work-identifiers";
import type { ObraTop5 } from "../lib/top5-types";

type Top5WorksGridProps = {
  obras: ObraTop5[];
  idsSelecionados: string[];
  onAlternar: (obra: ObraTop5) => void;
};

export function Top5WorksGrid({
  obras,
  idsSelecionados,
  onAlternar,
}: Top5WorksGridProps) {
  return (
    <div
      data-historietas-top5-works-grid="true"
      style={worksGridStyle}
    >
      {obras.map((obra) => {
        const chave = criarChaveObraTop5(obra);
        const posicaoSelecionada =
          idsSelecionados.indexOf(chave) + 1;
        const selecionada = posicaoSelecionada > 0;

        return (
          <button
            key={`obra-top-5-${chave}`}
            type="button"
            onClick={() => onAlternar(obra)}
            style={
              selecionada
                ? top5CardSelectedStyle
                : top5CardStyle
            }
            aria-label={
              selecionada
                ? `Remover ${obra.titulo} do TOP 5`
                : `Adicionar ${obra.titulo} ao TOP 5`
            }
          >
            <div style={criarCapaTop5Style(obra.capa)}>
              {selecionada && (
                <span style={selectedBadgeStyle}>
                  {posicaoSelecionada}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
