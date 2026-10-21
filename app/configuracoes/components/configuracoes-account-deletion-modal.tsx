import Link from "next/link";
import type { FormEventHandler } from "react";
import { LoadingSpinner } from "./configuracoes-loading-spinner";
import { SvgIcon } from "./configuracoes-svg-icon";
import {
  deleteDangerButtonDisabledStyle,
  deleteDangerButtonStyle,
  deleteModalIconStyle,
  deletePublicLinkStyle,
  deleteWarningListStyle,
  deleteWarningStyle,
  securityActionsStyle,
  securityCloseButtonDisabledStyle,
  securityCloseButtonStyle,
  securityErrorStyle,
  securityFieldLabelStyle,
  securityFieldStyle,
  securityFormStyle,
  securityHintStyle,
  securityModalHeaderStyle,
  securityModalHeadingStyle,
  securityModalStyle,
  securityModalSubtitleStyle,
  securityModalTitleStyle,
  securityOverlayStyle,
  securityPasswordInputStyle,
  securitySecondaryButtonDisabledStyle,
  securitySecondaryButtonStyle,
} from "../lib/configuracoes-security-styles";
import type { TraduzirTextoConfiguracoes } from "../lib/configuracoes-callback-types";

type ConfiguracoesAccountDeletionModalProps = {
  onFechar: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  senhaExclusaoConta: string;
  onSenhaExclusaoContaChange: (valor: string) => void;
  confirmacaoExclusaoConta: string;
  onConfirmacaoExclusaoContaChange: (valor: string) => void;
  excluindoConta: boolean;
  erroExclusaoConta: string;
  traduzirTexto: TraduzirTextoConfiguracoes;
};

export function ConfiguracoesAccountDeletionModal({
  onFechar,
  onSubmit,
  senhaExclusaoConta,
  onSenhaExclusaoContaChange,
  confirmacaoExclusaoConta,
  onConfirmacaoExclusaoContaChange,
  excluindoConta,
  erroExclusaoConta,
  traduzirTexto,
}: ConfiguracoesAccountDeletionModalProps) {
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
        aria-labelledby="titulo-exclusao-conta"
        style={securityModalStyle}
      >
        <header style={securityModalHeaderStyle}>
          <span style={deleteModalIconStyle}>
            <SvgIcon name="trash" size={24} strokeWidth={2.2} />
          </span>

          <div style={securityModalHeadingStyle}>
            <h2 id="titulo-exclusao-conta" style={securityModalTitleStyle}>
              {traduzirTexto(
                "Excluir minha conta",
                "Delete my account",
                "Eliminar mi cuenta",
              )}
            </h2>
            <p style={securityModalSubtitleStyle}>
              {traduzirTexto(
                "Esta ação é permanente e não pode ser desfeita.",
                "This action is permanent and cannot be undone.",
                "Esta acción es permanente y no se puede deshacer.",
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onFechar}
            disabled={excluindoConta}
            aria-label={traduzirTexto("Fechar", "Close", "Cerrar")}
            style={
              excluindoConta
                ? securityCloseButtonDisabledStyle
                : securityCloseButtonStyle
            }
          >
            ×
          </button>
        </header>

        <div style={deleteWarningStyle}>
          <strong>
            {traduzirTexto(
              "Serão excluídos:",
              "The following will be deleted:",
              "Se eliminarán:",
            )}
          </strong>
          <ul style={deleteWarningListStyle}>
            <li>
              {traduzirTexto(
                "conta, perfil e acesso;",
                "account, profile, and access;",
                "cuenta, perfil y acceso;",
              )}
            </li>
            <li>
              {traduzirTexto(
                "obras, capítulos, capas e arquivos;",
                "works, chapters, covers, and files;",
                "obras, capítulos, portadas y archivos;",
              )}
            </li>
            <li>
              {traduzirTexto(
                "comentários, curtidas, avaliações, seguidores e progresso.",
                "comments, likes, ratings, followers, and progress.",
                "comentarios, me gusta, valoraciones, seguidores y progreso.",
              )}
            </li>
          </ul>
          <Link href="/excluir-conta" style={deletePublicLinkStyle}>
            {traduzirTexto(
              "Ver página pública de exclusão",
              "View public deletion page",
              "Ver página pública de eliminación",
            )}
          </Link>
        </div>

        <form onSubmit={onSubmit} style={securityFormStyle}>
          <label style={securityFieldStyle}>
            <span style={securityFieldLabelStyle}>
              {traduzirTexto("Senha atual", "Current password", "Contraseña actual")}
            </span>
            <input
              className="configuracoes-input"
              type="password"
              value={senhaExclusaoConta}
              onChange={(event) => onSenhaExclusaoContaChange(event.target.value)}
              autoComplete="current-password"
              disabled={excluindoConta}
              style={securityPasswordInputStyle}
            />
          </label>

          <label style={securityFieldStyle}>
            <span style={securityFieldLabelStyle}>
              {traduzirTexto(
                "Digite EXCLUIR para confirmar",
                "Type DELETE to confirm",
                "Escribe ELIMINAR para confirmar",
              )}
            </span>
            <input
              className="configuracoes-input"
              type="text"
              value={confirmacaoExclusaoConta}
              onChange={(event) =>
                onConfirmacaoExclusaoContaChange(event.target.value)
              }
              autoComplete="off"
              spellCheck={false}
              disabled={excluindoConta}
              style={securityPasswordInputStyle}
            />
          </label>

          <p style={securityHintStyle}>
            {traduzirTexto(
              "Antes de continuar, você pode baixar um backup no Resumo da conta.",
              "Before continuing, you can download a backup from Account summary.",
              "Antes de continuar, puedes descargar una copia en Resumen de la cuenta.",
            )}
          </p>

          {erroExclusaoConta ? (
            <div role="alert" aria-live="assertive" style={securityErrorStyle}>
              {erroExclusaoConta}
            </div>
          ) : null}

          <div style={securityActionsStyle}>
            <button
              type="button"
              onClick={onFechar}
              disabled={excluindoConta}
              style={
                excluindoConta
                  ? securitySecondaryButtonDisabledStyle
                  : securitySecondaryButtonStyle
              }
            >
              {traduzirTexto("Cancelar", "Cancel", "Cancelar")}
            </button>

            <button
              type="submit"
              disabled={excluindoConta}
              style={
                excluindoConta
                  ? deleteDangerButtonDisabledStyle
                  : deleteDangerButtonStyle
              }
            >
              {excluindoConta ? (
                <>
                  <LoadingSpinner
                    compacto
                    label={traduzirTexto(
                      "Excluindo conta",
                      "Deleting account",
                      "Eliminando cuenta",
                    )}
                  />
                  <span>
                    {traduzirTexto(
                      "Excluindo...",
                      "Deleting...",
                      "Eliminando...",
                    )}
                  </span>
                </>
              ) : (
                traduzirTexto(
                  "Excluir definitivamente",
                  "Delete permanently",
                  "Eliminar definitivamente",
                )
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
