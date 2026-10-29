import Link from "next/link";
import {
  cancelButtonStyle,
  footerActionsStyle,
  saveButtonDisabledStyle,
  saveButtonStyle,
  selectedHeaderStyle,
  selectedTitleStyle,
} from "../lib/top5-selected-section-styles";

type Top5SelectedHeaderProps = {
  salvando: boolean;
  salvarDesabilitado: boolean;
  onSalvar: () => void;
};

export function Top5SelectedHeader({
  salvando,
  salvarDesabilitado,
  onSalvar,
}: Top5SelectedHeaderProps) {
  return (
    <div style={selectedHeaderStyle}>
      <span style={selectedTitleStyle}>Seu TOP 5</span>

      <div style={footerActionsStyle}>
        <Link
          href="/perfil-autor"
          style={cancelButtonStyle}
        >
          Cancelar
        </Link>

        <button
          type="button"
          onClick={onSalvar}
          disabled={salvarDesabilitado}
          style={
            salvarDesabilitado
              ? saveButtonDisabledStyle
              : saveButtonStyle
          }
        >
          {salvando ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}
