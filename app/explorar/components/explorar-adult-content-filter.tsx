import type { HistorietasLanguage } from "../../../lib/i18n";
import {
  criarExplorarModalOptionStyle,
  criarExplorarModalRadioStyle,
  explorarAdultConfirmationActionsStyle,
  explorarAdultConfirmationBackStyle,
  explorarAdultConfirmationCheckboxStyle,
  explorarAdultConfirmationCheckStyle,
  explorarAdultConfirmationContinueStyle,
  explorarAdultConfirmationDisabledStyle,
  explorarAdultConfirmationStyle,
  explorarAdultConfirmationTextStyle,
  explorarAdultConfirmationTitleStyle,
  explorarModalSectionLabelStyle,
} from "../lib/explorar-layout-styles";
import { traduzirTextoExplorar } from "../lib/explorar-translations";

type ExplorarAdultContentFilterProps = {
  filtroClassificacao: string;
  mostrarConfirmacao: boolean;
  confirmouIdade: boolean;
  acessoTemporariamenteBloqueado: boolean;
  language: HistorietasLanguage;
  onSelecionarClassificacao: (filtro: string) => void;
  onConfirmouIdadeChange: (confirmou: boolean) => void;
  onVoltar: () => void;
  onConfirmar: () => void;
};

export function ExplorarAdultContentFilter({
  filtroClassificacao,
  mostrarConfirmacao,
  confirmouIdade,
  acessoTemporariamenteBloqueado,
  language,
  onSelecionarClassificacao,
  onConfirmouIdadeChange,
  onVoltar,
  onConfirmar,
}: ExplorarAdultContentFilterProps) {
  return (
    <>
      <p style={explorarModalSectionLabelStyle}>
        {traduzirTextoExplorar("Conteúdo 18+", language)}
      </p>

      {!mostrarConfirmacao ? (
        <>
          <button
            type="button"
            onClick={() => onSelecionarClassificacao("todos")}
            style={criarExplorarModalOptionStyle(
              filtroClassificacao !== "18+",
            )}
          >
            <span>
              {traduzirTextoExplorar("Ocultar conteúdo 18+", language)}
            </span>
            <span
              style={criarExplorarModalRadioStyle(
                filtroClassificacao !== "18+",
              )}
            >
              {filtroClassificacao !== "18+" ? "✓" : ""}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelecionarClassificacao("18+")}
            style={criarExplorarModalOptionStyle(
              filtroClassificacao === "18+",
            )}
          >
            <span>
              {traduzirTextoExplorar("Mostrar conteúdo 18+", language)}
            </span>
            <span
              style={criarExplorarModalRadioStyle(
                filtroClassificacao === "18+",
              )}
            >
              {filtroClassificacao === "18+" ? "✓" : ""}
            </span>
          </button>
        </>
      ) : (
        <div style={explorarAdultConfirmationStyle}>
          {acessoTemporariamenteBloqueado ? (
            <>
              <strong style={explorarAdultConfirmationTitleStyle}>
                {traduzirTextoExplorar(
                  "Conteúdo 18+ temporariamente indisponível",
                  language,
                )}
              </strong>
              <p style={explorarAdultConfirmationTextStyle}>
                {traduzirTextoExplorar(
                  "O acesso a obras 18+ está temporariamente indisponível enquanto o Historietas implementa uma verificação de idade adequada.",
                  language,
                )}
              </p>

              <div style={explorarAdultConfirmationActionsStyle}>
                <button
                  type="button"
                  onClick={onVoltar}
                  style={{
                    ...explorarAdultConfirmationBackStyle,
                    gridColumn: "1 / -1",
                  }}
                >
                  {traduzirTextoExplorar("Voltar", language)}
                </button>
              </div>
            </>
          ) : (
            <>
              <strong style={explorarAdultConfirmationTitleStyle}>
                {traduzirTextoExplorar("Confirmação de idade", language)}
              </strong>
              <p style={explorarAdultConfirmationTextStyle}>
                {traduzirTextoExplorar(
                  "O conteúdo 18+ fica oculto por padrão. Para exibi-lo, confirme que você tem 18 anos ou mais.",
                  language,
                )}
              </p>

              <label style={explorarAdultConfirmationCheckStyle}>
                <input
                  type="checkbox"
                  checked={confirmouIdade}
                  onChange={(event) =>
                    onConfirmouIdadeChange(event.target.checked)
                  }
                  style={explorarAdultConfirmationCheckboxStyle}
                />
                <span>
                  {traduzirTextoExplorar(
                    "Confirmo que tenho 18 anos ou mais.",
                    language,
                  )}
                </span>
              </label>

              <div style={explorarAdultConfirmationActionsStyle}>
                <button
                  type="button"
                  onClick={onVoltar}
                  style={explorarAdultConfirmationBackStyle}
                >
                  {traduzirTextoExplorar("Voltar", language)}
                </button>
                <button
                  type="button"
                  onClick={onConfirmar}
                  disabled={!confirmouIdade}
                  style={{
                    ...explorarAdultConfirmationContinueStyle,
                    ...(!confirmouIdade
                      ? explorarAdultConfirmationDisabledStyle
                      : {}),
                  }}
                >
                  {traduzirTextoExplorar("Ativar conteúdo 18+", language)}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
