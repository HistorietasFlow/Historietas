import { ConfiguracoesBlockedUsersPanel } from "./configuracoes-blocked-users-panel";
import { LoadingSpinner } from "./configuracoes-loading-spinner";
import {
  SettingsRow,
  SettingsSection,
  ValorLinha,
} from "./configuracoes-settings-primitives";
import { Toggle } from "./configuracoes-toggle";
import type { UsuarioBloqueadoConfiguracoes } from "../lib/configuracoes-account-models";
import type { TraduzirTextoConfiguracoes } from "../lib/configuracoes-callback-types";
import type { PreferenciasPrivacidadeHistorietas } from "../lib/configuracoes-privacy-preferences";

type ConfiguracoesProfilePrivacySectionProps = {
  deveMostrar: (...termos: string[]) => boolean;
  traduzirTexto: TraduzirTextoConfiguracoes;
  privacidade: PreferenciasPrivacidadeHistorietas;
  onAlternarPerfilPrivado: () => void;
  onAlternarAprovacaoNovosSeguidores: () => void;
  mostrarUsuariosBloqueados: boolean;
  usuariosBloqueados: UsuarioBloqueadoConfiguracoes[];
  carregandoUsuariosBloqueados: boolean;
  desbloqueandoUsuarioId: string;
  erroUsuariosBloqueados: string;
  onCarregarUsuariosBloqueados: () => Promise<void>;
  onAlternarUsuariosBloqueados: () => void;
  onDesbloquearUsuario: (
    usuario: UsuarioBloqueadoConfiguracoes,
  ) => Promise<void>;
};

export function ConfiguracoesProfilePrivacySection({
  deveMostrar,
  traduzirTexto: t,
  privacidade,
  onAlternarPerfilPrivado,
  onAlternarAprovacaoNovosSeguidores,
  mostrarUsuariosBloqueados,
  usuariosBloqueados,
  carregandoUsuariosBloqueados,
  desbloqueandoUsuarioId,
  erroUsuariosBloqueados,
  onCarregarUsuariosBloqueados,
  onAlternarUsuariosBloqueados,
  onDesbloquearUsuario,
}: ConfiguracoesProfilePrivacySectionProps) {
  if (
    !deveMostrar(
      "privacidade",
      "perfil",
      "privado",
      "seguidores",
      "aprovação",
      "solicitações",
      "bloqueio",
      "bloqueados",
      "desbloquear",
    )
  ) {
    return null;
  }

  return (
    <SettingsSection
      title={t(
        "Privacidade do perfil",
        "Profile privacy",
        "Privacidad del perfil",
      )}
    >
      {deveMostrar("perfil", "privado", "visibilidade") ? (
        <SettingsRow
          icon="lock"
          title={t("Perfil privado", "Private profile", "Perfil privado")}
          subtitle={t(
            "Controla quem pode seguir você.",
            "Controls who can follow you.",
            "Controla quién puede seguirte.",
          )}
          right={
            <Toggle
              checked={privacidade.perfilPrivado}
              onChange={onAlternarPerfilPrivado}
              ariaLabel={t(
                "Ativar ou desativar perfil privado",
                "Enable or disable private profile",
                "Activar o desactivar el perfil privado",
              )}
            />
          }
          hideChevron
        />
      ) : null}

      {deveMostrar(
        "aprovar",
        "aprovação",
        "seguidores",
        "solicitações",
      ) ? (
        <SettingsRow
          icon="user"
          title={t(
            "Aprovar novos seguidores",
            "Approve new followers",
            "Aprobar nuevos seguidores",
          )}
          subtitle={
            privacidade.perfilPrivado
              ? t(
                  "Novos seguidores precisam da sua aprovação",
                  "New followers need your approval",
                  "Los nuevos seguidores necesitan tu aprobación",
                )
              : t(
                  "Ative para receber solicitações antes de alguém seguir você",
                  "Turn this on to receive requests before someone follows you",
                  "Actívalo para recibir solicitudes antes de que alguien te siga",
                )
          }
          right={
            <Toggle
              checked={privacidade.aprovarNovosSeguidores}
              onChange={onAlternarAprovacaoNovosSeguidores}
              ariaLabel={t(
                "Ativar ou desativar aprovação de novos seguidores",
                "Enable or disable approval of new followers",
                "Activar o desactivar la aprobación de nuevos seguidores",
              )}
            />
          }
          hideChevron
        />
      ) : null}

      {deveMostrar(
        "bloqueio",
        "bloqueados",
        "desbloquear",
        "privacidade",
      ) ? (
        <>
          <SettingsRow
            icon="shield"
            title={t(
              "Usuários bloqueados",
              "Blocked users",
              "Usuarios bloqueados",
            )}
            subtitle={t(
              "Revise e desbloqueie perfis da sua lista",
              "Review and unblock profiles on your list",
              "Revisa y desbloquea perfiles de tu lista",
            )}
            right={
              carregandoUsuariosBloqueados ? (
                <LoadingSpinner
                  compacto
                  label={t(
                    "Carregando usuários bloqueados",
                    "Loading blocked users",
                    "Cargando usuarios bloqueados",
                  )}
                />
              ) : (
                <ValorLinha>{usuariosBloqueados.length}</ValorLinha>
              )
            }
            onClick={onAlternarUsuariosBloqueados}
          />

          {mostrarUsuariosBloqueados ? (
            <ConfiguracoesBlockedUsersPanel
              usuarios={usuariosBloqueados}
              carregando={carregandoUsuariosBloqueados}
              erro={erroUsuariosBloqueados}
              desbloqueandoUsuarioId={desbloqueandoUsuarioId}
              onRecarregar={onCarregarUsuariosBloqueados}
              onDesbloquear={onDesbloquearUsuario}
              traduzirTexto={t}
            />
          ) : null}
        </>
      ) : null}
    </SettingsSection>
  );
}
