import { SvgIcon } from "./configuracoes-svg-icon";
import {
  backButtonStyle,
  headerStyle,
  pageTitleStyle,
} from "../lib/configuracoes-shell-styles";
import type { ConfiguracoesPageHeaderProps } from "./configuracoes-page-header-props";

export function ConfiguracoesPageHeader({
  onVoltar,
  traduzirTexto,
}: ConfiguracoesPageHeaderProps) {
  return (
    <header style={headerStyle}>
      <button
        type="button"
        onClick={onVoltar}
        style={backButtonStyle}
        aria-label={traduzirTexto("Voltar", "Back", "Volver")}
      >
        <SvgIcon name="arrowLeft" size={25} strokeWidth={2.4} />
      </button>

      <h1 style={pageTitleStyle}>
        {traduzirTexto(
          "Configurações e atividade",
          "Settings and activity",
          "Configuración y actividad",
        )}
      </h1>
    </header>
  );
}
