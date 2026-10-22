import {
  SettingsRow,
  SettingsSection,
  ValorLinha,
} from "./configuracoes-settings-primitives";
import type {
  DeveMostrarConfiguracoes,
  TraduzirTextoConfiguracoes,
} from "../lib/configuracoes-callback-types";

type ConfiguracoesSupportSectionProps = {
  deveMostrar: DeveMostrarConfiguracoes;
  traduzirTexto: TraduzirTextoConfiguracoes;
};

export function ConfiguracoesSupportSection({
  deveMostrar,
  traduzirTexto: t,
}: ConfiguracoesSupportSectionProps) {
  if (!deveMostrar("suporte", "ajuda", "termos", "políticas", "sobre")) {
    return null;
  }

  return (
    <SettingsSection
      title={t(
        "Suporte e sobre",
        "Support and about",
        "Soporte y acerca de",
      )}
    >
      {deveMostrar("ajuda", "suporte") ? (
        <SettingsRow
          icon="help"
          title={t(
            "Central de ajuda",
            "Help center",
            "Centro de ayuda",
          )}
          subtitle={t(
            "Dúvidas, problemas e orientação",
            "Questions, problems and guidance",
            "Dudas, problemas y orientación",
          )}
          href="/ajuda"
        />
      ) : null}

      {deveMostrar("termos", "políticas", "privacidade") ? (
        <SettingsRow
          icon="file"
          title={t(
            "Termos e políticas",
            "Terms and policies",
            "Términos y políticas",
          )}
          subtitle={t(
            "Privacidade, uso da plataforma e regras",
            "Privacy, platform use and rules",
            "Privacidad, uso de la plataforma y reglas",
          )}
          href="/termos"
        />
      ) : null}

      {deveMostrar("sobre", "versão") ? (
        <SettingsRow
          icon="settings"
          title={t(
            "Sobre o Historietas",
            "About Historietas",
            "Acerca de Historietas",
          )}
          subtitle={t(
            "Versão local de desenvolvimento",
            "Local development version",
            "Versión local de desarrollo",
          )}
          right={<ValorLinha>Beta</ValorLinha>}
          hideChevron
        />
      ) : null}
    </SettingsSection>
  );
}
