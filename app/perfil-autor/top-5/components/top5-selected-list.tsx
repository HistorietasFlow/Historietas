import {
  emptySelectedSlotStyle,
  selectedActionsStyle,
  selectedListStyle,
  selectedMoveButtonStyle,
  selectedNumberStyle,
  selectedRemoveButtonStyle,
  selectedSlotStyle,
} from "../lib/top5-selected-section-styles";
import { criarCapaSelecionadaTop5Style } from "../lib/top5-cover-styles";
import { criarChaveObraTop5 } from "../lib/top5-work-identifiers";
import { TOP_FIVE_MAXIMO } from "../lib/top5-selection-storage";
import type { ObraTop5 } from "../lib/top5-types";

type Top5SelectedListProps = {
  obrasSelecionadas: ObraTop5[];
  onRemover: (chave: string) => void;
  onMover: (chave: string, direcao: -1 | 1) => void;
};

export function Top5SelectedList({
  obrasSelecionadas,
  onRemover,
  onMover,
}: Top5SelectedListProps) {
  return (
    <div style={selectedListStyle}>
      {Array.from({ length: TOP_FIVE_MAXIMO }).map((_, index) => {
        const obra = obrasSelecionadas[index];
        const chave = obra ? criarChaveObraTop5(obra) : "";

        return (
          <div key={`slot-top-5-${index + 1}`} style={selectedSlotStyle}>
            <span style={selectedNumberStyle}>{index + 1}</span>

            {obra ? (
              <>
                <button
                  type="button"
                  onClick={() => onRemover(chave)}
                  style={selectedRemoveButtonStyle}
                  aria-label={`Remover ${obra.titulo} do TOP 5`}
                >
                  ×
                </button>
                <div style={criarCapaSelecionadaTop5Style(obra.capa)} />
                <div style={selectedActionsStyle}>
                  <button
                    type="button"
                    onClick={() => onMover(chave, -1)}
                    style={selectedMoveButtonStyle}
                    aria-label={`Subir ${obra.titulo}`}
                    disabled={index === 0}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => onMover(chave, 1)}
                    style={selectedMoveButtonStyle}
                    aria-label={`Descer ${obra.titulo}`}
                    disabled={index === obrasSelecionadas.length - 1}
                  >
                    ↓
                  </button>
                </div>
              </>
            ) : (
              <div style={emptySelectedSlotStyle}>+</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
