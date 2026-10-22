import LanguageSelect from "../../../components/LanguageSelect";
import type { PreferenciasConta } from "../lib/configuracoes-account-models";
import {
  SettingsRow,
  SettingsSection,
} from "./configuracoes-settings-primitives";
import { Toggle } from "./configuracoes-toggle";
import type {
  AlternarReceberAvisosConfiguracoes,
  DeveMostrarConfiguracoes,
  TraduzirTextoConfiguracoes,
} from "../lib/configuracoes-callback-types";

type ConfiguracoesPreferencesSectionProps = {
  deveMostrar: DeveMostrarConfiguracoes;
  traduzirTexto: TraduzirTextoConfiguracoes;
  preferencias: PreferenciasConta;
  onAlternarReceberAvisos: AlternarReceberAvisosConfiguracoes;
};

export function ConfiguracoesPreferencesSection({
  deveMostrar,
  traduzirTexto: t,
  preferencias,
  onAlternarReceberAvisos,
}: ConfiguracoesPreferencesSectionProps) {
  if (
    !deveMostrar(
      "preferências",
      "tema",
      "aparência",
      "avisos",
      "idioma",
      "língua",
    )
  ) {
    return null;
  }

  return (
    <SettingsSection title={t("Preferências", "Preferences", "Preferencias")}>
      {deveMostrar("idioma", "língua") ? (
        <SettingsRow
          icon="layers"
          title={t("Idioma do site", "Site language", "Idioma del sitio")}
          right={
            <LanguageSelect
              showLabel={false}
              style={{
                width: "clamp(120px, 34vw, 128px)",
                maxWidth: "100%",
                transform: "translateX(22px)",
              }}
              selectStyle={{
                width: "100%",
                minHeight: 38,
                padding: "7px 8px",
                borderRadius: 10,
                fontSize: 13,
              }}
            />
          }
          hideChevron
        />
      ) : null}

      {deveMostrar("receber", "avisos") ? (
        <SettingsRow
          icon="bell"
          title={t("Receber avisos", "Receive alerts", "Recibir avisos")}
          right={
            <Toggle
              checked={preferencias.receberAvisos}
              onChange={onAlternarReceberAvisos}
              ariaLabel={t(
                "Ativar ou desativar avisos",
                "Enable or disable alerts",
                "Activar o desactivar avisos",
              )}
            />
          }
          hideChevron
        />
      ) : null}
    </SettingsSection>
  );
}
