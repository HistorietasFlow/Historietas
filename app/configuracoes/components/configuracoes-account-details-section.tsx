import {
  SettingsInput,
  SettingsRow,
  SettingsSection,
  ValorLinha,
} from "./configuracoes-settings-primitives";
import { LoadingSpinner } from "./configuracoes-loading-spinner";
import { normalizarUsernameConfiguracoes } from "../lib/configuracoes-account-utils";
import type { PreferenciasConta } from "../lib/configuracoes-account-models";
import type {
  AbrirSegurancaConfiguracoes,
  AtualizarPreferenciaConfiguracoes,
  DeveMostrarConfiguracoes,
  LimparErroUsernameConfiguracoes,
  SalvarConfiguracoes,
  TraduzirTextoConfiguracoes,
} from "../lib/configuracoes-callback-types";

type ConfiguracoesAccountDetailsSectionProps = {
  deveMostrar: DeveMostrarConfiguracoes;
  traduzirTexto: TraduzirTextoConfiguracoes;
  preferencias: PreferenciasConta;
  erroUsername: string;
  salvando: boolean;
  onAtualizarPreferencia: AtualizarPreferenciaConfiguracoes;
  onLimparErroUsername: LimparErroUsernameConfiguracoes;
  onSalvar: SalvarConfiguracoes;
  onAbrirSeguranca: AbrirSegurancaConfiguracoes;
};

export function ConfiguracoesAccountDetailsSection({
  deveMostrar,
  traduzirTexto: t,
  preferencias,
  erroUsername,
  salvando,
  onAtualizarPreferencia,
  onLimparErroUsername,
  onSalvar,
  onAbrirSeguranca,
}: ConfiguracoesAccountDetailsSectionProps) {
  if (
    !deveMostrar(
      "conta",
      "nome",
      "username",
      "usuário",
      "email",
      "senha",
      "privacidade",
      "salvar",
    )
  ) {
    return null;
  }

  return (
    <SettingsSection title={t("Sua conta", "Your account", "Tu cuenta")}>
      {deveMostrar("nome", "exibição", "autor") ? (
        <SettingsInput
          icon="user"
          label={t("Nome de exibição", "Display name", "Nombre visible")}
          value={preferencias.nomeExibicao}
          onChange={(valor) =>
            onAtualizarPreferencia("nomeExibicao", valor)
          }
          placeholder={t(
            "Ex: Nome do autor",
            "Example: Author name",
            "Ejemplo: Nombre del autor",
          )}
          maxLength={80}
          autoComplete="name"
        />
      ) : null}

      {deveMostrar("username", "usuário", "perfil", "arroba") ? (
        <SettingsInput
          icon="user"
          label="@username"
          value={preferencias.username}
          onChange={(valor) => {
            onLimparErroUsername();
            onAtualizarPreferencia(
              "username",
              normalizarUsernameConfiguracoes(valor),
            );
          }}
          placeholder={t("ex: username", "example: username", "ejemplo: username")}
          maxLength={30}
          autoComplete="username"
          helperText={erroUsername || undefined}
          error={Boolean(erroUsername)}
        />
      ) : null}

      {deveMostrar("email", "contato") ? (
        <SettingsInput
          icon="mail"
          label={t("E-mail de contato", "Contact email", "Correo de contacto")}
          value={preferencias.emailContato}
          onChange={(valor) => onAtualizarPreferencia("emailContato", valor)}
          placeholder={t(
            "Ex: seuemail@email.com",
            "Example: youremail@email.com",
            "Ejemplo: tucorreo@email.com",
          )}
          type="email"
          maxLength={254}
          autoComplete="email"
        />
      ) : null}

      {deveMostrar("salvar", "alterações", "configurações") ? (
        <SettingsRow
          icon="check"
          title={
            salvando
              ? t("Salvando...", "Saving...", "Guardando...")
              : t("Salvar alterações", "Save changes", "Guardar cambios")
          }
          subtitle={t(
            "Grava suas preferências nesta conta",
            "Saves your preferences to this account",
            "Guarda tus preferencias en esta cuenta",
          )}
          right={
            salvando ? (
              <LoadingSpinner
                compacto
                label={t(
                  "Salvando alterações",
                  "Saving changes",
                  "Guardando cambios",
                )}
              />
            ) : undefined
          }
          onClick={onSalvar}
          hideChevron={salvando}
        />
      ) : null}

      {deveMostrar("senha", "segurança") ? (
        <SettingsRow
          icon="lock"
          title={t(
            "Senha e segurança",
            "Password and security",
            "Contraseña y seguridad",
          )}
          subtitle={t(
            "Altere com segurança sua senha de acesso",
            "Securely change your access password",
            "Cambia de forma segura tu contraseña de acceso",
          )}
          right={<ValorLinha>{t("Alterar", "Change", "Cambiar")}</ValorLinha>}
          onClick={onAbrirSeguranca}
        />
      ) : null}
    </SettingsSection>
  );
}
