import Image from "next/image";
import type { UsuarioBloqueadoConfiguracoes } from "../lib/configuracoes-account-models";
import {
  blockedUserAvatarFallbackStyle,
  blockedUserAvatarStyle,
  blockedUserButtonDisabledStyle,
  blockedUserButtonStyle,
  blockedUserNameStyle,
  blockedUserRowStyle,
  blockedUserTextStyle,
  blockedUserUsernameStyle,
  blockedUsersEmptyStyle,
  blockedUsersErrorStyle,
  blockedUsersPanelStyle,
  blockedUsersRetryButtonStyle,
} from "../lib/configuracoes-blocked-users-styles";
import type {
  CarregarUsuariosBloqueadosConfiguracoes,
  DesbloquearUsuarioConfiguracoes,
  TraduzirTextoConfiguracoes,
} from "../lib/configuracoes-callback-types";

type ConfiguracoesBlockedUsersPanelProps = {
  usuarios: UsuarioBloqueadoConfiguracoes[];
  carregando: boolean;
  erro: string;
  desbloqueandoUsuarioId: string;
  onRecarregar: CarregarUsuariosBloqueadosConfiguracoes;
  onDesbloquear: DesbloquearUsuarioConfiguracoes;
  traduzirTexto: TraduzirTextoConfiguracoes;
};

export function ConfiguracoesBlockedUsersPanel({
  usuarios,
  carregando,
  erro,
  desbloqueandoUsuarioId,
  onRecarregar,
  onDesbloquear,
  traduzirTexto,
}: ConfiguracoesBlockedUsersPanelProps) {
  return (
    <div style={blockedUsersPanelStyle}>
      {erro ? (
        <div style={blockedUsersErrorStyle}>
          <span>{erro}</span>
          <button
            type="button"
            onClick={() => void onRecarregar()}
            disabled={carregando}
            style={blockedUsersRetryButtonStyle}
          >
            {traduzirTexto(
              "Tentar novamente",
              "Try again",
              "Intentar de nuevo",
            )}
          </button>
        </div>
      ) : null}

      {!carregando && !erro && usuarios.length === 0 ? (
        <p style={blockedUsersEmptyStyle}>
          {traduzirTexto(
            "Você não bloqueou nenhum usuário.",
            "You have not blocked any users.",
            "No has bloqueado a ningún usuario.",
          )}
        </p>
      ) : null}

      {usuarios.map((usuarioBloqueado) => {
        const desbloqueando =
          desbloqueandoUsuarioId === usuarioBloqueado.userId;
        const inicial =
          usuarioBloqueado.nome.trim().charAt(0).toUpperCase() || "U";

        return (
          <div key={usuarioBloqueado.userId} style={blockedUserRowStyle}>
            {usuarioBloqueado.avatar ? (
              <Image
                src={usuarioBloqueado.avatar}
                alt=""
                width={38}
                height={38}
                unoptimized
                style={blockedUserAvatarStyle}
              />
            ) : (
              <span aria-hidden="true" style={blockedUserAvatarFallbackStyle}>
                {inicial}
              </span>
            )}

            <span style={blockedUserTextStyle}>
              <strong style={blockedUserNameStyle}>
                {usuarioBloqueado.nome}
              </strong>
              <span style={blockedUserUsernameStyle}>
                {usuarioBloqueado.username
                  ? `@${usuarioBloqueado.username}`
                  : traduzirTexto(
                      "Sem @username",
                      "No @username",
                      "Sin @username",
                    )}
              </span>
            </span>

            <button
              type="button"
              onClick={() => void onDesbloquear(usuarioBloqueado)}
              disabled={Boolean(desbloqueandoUsuarioId)}
              style={
                desbloqueando
                  ? blockedUserButtonDisabledStyle
                  : blockedUserButtonStyle
              }
            >
              {desbloqueando
                ? traduzirTexto(
                    "Desbloqueando...",
                    "Unblocking...",
                    "Desbloqueando...",
                  )
                : traduzirTexto(
                    "Desbloquear",
                    "Unblock",
                    "Desbloquear",
                  )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
