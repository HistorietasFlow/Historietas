import { LoadingSpinner } from "./configuracoes-loading-spinner";
import { SvgIcon } from "./configuracoes-svg-icon";
import {
  securityActionsStyle,
  securityCloseButtonDisabledStyle,
  securityCloseButtonStyle,
  securityDoneButtonStyle,
  securityErrorStyle,
  securityFeedbackTextStyle,
  securityFieldLabelStyle,
  securityFieldStyle,
  securityFormStyle,
  securityHintStyle,
  securityModalHeaderStyle,
  securityModalHeadingStyle,
  securityModalIconStyle,
  securityModalStyle,
  securityModalSubtitleStyle,
  securityModalTitleStyle,
  securityOverlayStyle,
  securityPasswordInputStyle,
  securityPrimaryButtonDisabledStyle,
  securityPrimaryButtonStyle,
  securitySecondaryButtonDisabledStyle,
  securitySecondaryButtonStyle,
  securitySuccessStyle,
} from "../lib/configuracoes-security-styles";
import type {
  AtualizarTextoConfiguracoes,
  EnviarFormularioConfiguracoes,
  FecharOverlayConfiguracoes,
  TraduzirTextoConfiguracoes,
} from "../lib/configuracoes-callback-types";

type ConfiguracoesSecurityPasswordModalProps = {
  onFechar: FecharOverlayConfiguracoes;
  onSubmit: EnviarFormularioConfiguracoes;
  senhaAtual: string;
  onSenhaAtualChange: AtualizarTextoConfiguracoes;
  novaSenha: string;
  onNovaSenhaChange: AtualizarTextoConfiguracoes;
  confirmarNovaSenha: string;
  onConfirmarNovaSenhaChange: AtualizarTextoConfiguracoes;
  salvandoSenha: boolean;
  erroSenha: string;
  senhaAlterada: boolean;
  traduzirTexto: TraduzirTextoConfiguracoes;
};

export function ConfiguracoesSecurityPasswordModal({
  onFechar,
  onSubmit,
  senhaAtual,
  onSenhaAtualChange,
  novaSenha,
  onNovaSenhaChange,
  confirmarNovaSenha,
  onConfirmarNovaSenhaChange,
  salvandoSenha,
  erroSenha,
  senhaAlterada,
  traduzirTexto,
}: ConfiguracoesSecurityPasswordModalProps) {
  return (
    <div
      role="presentation"
      style={securityOverlayStyle}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onFechar();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-seguranca-configuracoes"
        style={securityModalStyle}
      >
        <header style={securityModalHeaderStyle}>
          <span style={securityModalIconStyle}>
            <SvgIcon name="lock" size={24} strokeWidth={2.2} />
          </span>

          <div style={securityModalHeadingStyle}>
            <h2
              id="titulo-seguranca-configuracoes"
              style={securityModalTitleStyle}
            >
              {traduzirTexto(
                "Alterar senha",
                "Change password",
                "Cambiar contraseña",
              )}
            </h2>
            <p style={securityModalSubtitleStyle}>
              {traduzirTexto(
                "Confirme sua senha atual e escolha uma nova senha.",
                "Confirm your current password and choose a new one.",
                "Confirma tu contraseña actual y elige una nueva.",
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onFechar}
            disabled={salvandoSenha}
            aria-label={traduzirTexto("Fechar", "Close", "Cerrar")}
            style={
              salvandoSenha
                ? securityCloseButtonDisabledStyle
                : securityCloseButtonStyle
            }
          >
            ×
          </button>
        </header>

        {senhaAlterada ? (
          <div role="status" aria-live="polite" style={securitySuccessStyle}>
            <SvgIcon name="check" size={25} strokeWidth={2.4} />
            <div style={securityFeedbackTextStyle}>
              <strong>
                {traduzirTexto(
                  "Senha alterada com sucesso",
                  "Password changed successfully",
                  "Contraseña cambiada correctamente",
                )}
              </strong>
              <span>
                {traduzirTexto(
                  "A nova senha já está ativa na sua conta.",
                  "The new password is now active on your account.",
                  "La nueva contraseña ya está activa en tu cuenta.",
                )}
              </span>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} style={securityFormStyle}>
            <label style={securityFieldStyle}>
              <span style={securityFieldLabelStyle}>
                {traduzirTexto(
                  "Senha atual",
                  "Current password",
                  "Contraseña actual",
                )}
              </span>
              <input
                className="configuracoes-input"
                type="password"
                value={senhaAtual}
                onChange={(event) => onSenhaAtualChange(event.target.value)}
                autoComplete="current-password"
                disabled={salvandoSenha}
                style={securityPasswordInputStyle}
              />
            </label>

            <label style={securityFieldStyle}>
              <span style={securityFieldLabelStyle}>
                {traduzirTexto("Nova senha", "New password", "Nueva contraseña")}
              </span>
              <input
                className="configuracoes-input"
                type="password"
                value={novaSenha}
                onChange={(event) => onNovaSenhaChange(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                disabled={salvandoSenha}
                style={securityPasswordInputStyle}
              />
            </label>

            <label style={securityFieldStyle}>
              <span style={securityFieldLabelStyle}>
                {traduzirTexto(
                  "Confirmar nova senha",
                  "Confirm new password",
                  "Confirmar nueva contraseña",
                )}
              </span>
              <input
                className="configuracoes-input"
                type="password"
                value={confirmarNovaSenha}
                onChange={(event) =>
                  onConfirmarNovaSenhaChange(event.target.value)
                }
                autoComplete="new-password"
                minLength={8}
                disabled={salvandoSenha}
                style={securityPasswordInputStyle}
              />
            </label>

            <p style={securityHintStyle}>
              {traduzirTexto(
                "Use no mínimo 8 caracteres, incluindo uma letra e um número.",
                "Use at least 8 characters, including a letter and a number.",
                "Usa al menos 8 caracteres, incluyendo una letra y un número.",
              )}
            </p>

            {erroSenha ? (
              <div role="alert" aria-live="assertive" style={securityErrorStyle}>
                {erroSenha}
              </div>
            ) : null}

            <div style={securityActionsStyle}>
              <button
                type="button"
                onClick={onFechar}
                disabled={salvandoSenha}
                style={
                  salvandoSenha
                    ? securitySecondaryButtonDisabledStyle
                    : securitySecondaryButtonStyle
                }
              >
                {traduzirTexto("Cancelar", "Cancel", "Cancelar")}
              </button>

              <button
                type="submit"
                disabled={salvandoSenha}
                style={
                  salvandoSenha
                    ? securityPrimaryButtonDisabledStyle
                    : securityPrimaryButtonStyle
                }
              >
                {salvandoSenha ? (
                  <>
                    <LoadingSpinner
                      compacto
                      label={traduzirTexto(
                        "Alterando senha",
                        "Changing password",
                        "Cambiando contraseña",
                      )}
                    />
                    <span>
                      {traduzirTexto(
                        "Alterando...",
                        "Changing...",
                        "Cambiando...",
                      )}
                    </span>
                  </>
                ) : (
                  traduzirTexto(
                    "Alterar senha",
                    "Change password",
                    "Cambiar contraseña",
                  )
                )}
              </button>
            </div>
          </form>
        )}

        {senhaAlterada ? (
          <button type="button" onClick={onFechar} style={securityDoneButtonStyle}>
            {traduzirTexto("Concluído", "Done", "Listo")}
          </button>
        ) : null}
      </section>
    </div>
  );
}
