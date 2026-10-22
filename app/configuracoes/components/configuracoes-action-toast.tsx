import { SvgIcon } from "./configuracoes-svg-icon";
import {
  actionToastCloseStyle,
  actionToastErrorStyle,
  actionToastIconStyle,
  actionToastMessageStyle,
  actionToastSuccessStyle,
  actionToastTextBoxStyle,
  actionToastTitleStyle,
  actionToastWarningStyle,
} from "../lib/configuracoes-action-toast-styles";
import type { ConfiguracoesActionToastProps } from "./configuracoes-action-toast-props";

export function ConfiguracoesActionToast({
  mensagem,
  onFechar,
  traduzirTexto,
}: ConfiguracoesActionToastProps) {
  return (
    <div
      role={mensagem.tipo === "erro" ? "alert" : "status"}
      aria-live={mensagem.tipo === "erro" ? "assertive" : "polite"}
      aria-atomic="true"
      style={
        mensagem.tipo === "sucesso"
          ? actionToastSuccessStyle
          : mensagem.tipo === "aviso"
            ? actionToastWarningStyle
            : actionToastErrorStyle
      }
    >
      <span style={actionToastIconStyle}>
        <SvgIcon
          name={
            mensagem.tipo === "sucesso"
              ? "check"
              : mensagem.tipo === "aviso"
                ? "shield"
                : "file"
          }
          size={23}
          strokeWidth={2.25}
        />
      </span>

      <span style={actionToastTextBoxStyle}>
        <strong style={actionToastTitleStyle}>
          {mensagem.tipo === "sucesso"
            ? traduzirTexto("Sucesso", "Success", "Éxito")
            : mensagem.tipo === "aviso"
              ? traduzirTexto("Atenção", "Attention", "Atención")
              : traduzirTexto(
                  "Não foi possível",
                  "Something went wrong",
                  "No fue posible",
                )}
        </strong>
        <span style={actionToastMessageStyle}>{mensagem.texto}</span>
      </span>

      <button
        type="button"
        onClick={onFechar}
        aria-label={traduzirTexto(
          "Fechar mensagem",
          "Close message",
          "Cerrar mensaje",
        )}
        style={actionToastCloseStyle}
      >
        ×
      </button>
    </div>
  );
}
