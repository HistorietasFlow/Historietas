import {
  SettingsRow,
  SettingsSection,
} from "./configuracoes-settings-primitives";
import type { ResumoLocal } from "../lib/configuracoes-account-models";
import type {
  BaixarBackupConfiguracoes,
  CopiarBackupConfiguracoes,
  DeveMostrarConfiguracoes,
  TraduzirTextoConfiguracoes,
} from "../lib/configuracoes-callback-types";

type ConfiguracoesDataSectionProps = {
  deveMostrar: DeveMostrarConfiguracoes;
  traduzirTexto: TraduzirTextoConfiguracoes;
  resumo: ResumoLocal;
  onCopiarBackup: CopiarBackupConfiguracoes;
  onBaixarBackup: BaixarBackupConfiguracoes;
};

export function ConfiguracoesDataSection({
  deveMostrar,
  traduzirTexto: t,
  resumo,
  onCopiarBackup,
  onBaixarBackup,
}: ConfiguracoesDataSectionProps) {
  if (!deveMostrar("dados", "backup", "copiar", "baixar", "download")) {
    return null;
  }

  return (
    <SettingsSection
      title={t(
        "Dados e arquivos",
        "Data and files",
        "Datos y archivos",
      )}
    >
      {deveMostrar("copiar", "dados") ? (
        <SettingsRow
          icon="copy"
          title={t("Copiar dados", "Copy data", "Copiar datos")}
          subtitle={t(
            "Copia um backup em texto para a área de transferência",
            "Copies a text backup to the clipboard",
            "Copia una copia de seguridad en texto al portapapeles",
          )}
          onClick={onCopiarBackup}
        />
      ) : null}

      {deveMostrar("baixar", "backup", "download") ? (
        <SettingsRow
          icon="download"
          title={t(
            "Baixar backup",
            "Download backup",
            "Descargar copia",
          )}
          subtitle={t(
            "Salva um arquivo JSON com seus dados locais",
            "Saves a JSON file with your local data",
            "Guarda un archivo JSON con tus datos locales",
          )}
          onClick={onBaixarBackup}
        />
      ) : null}

      {deveMostrar("resumo", "dados") ? (
        <SettingsRow
          icon="database"
          title={t(
            "Resumo da conta",
            "Account summary",
            "Resumen de la cuenta",
          )}
          subtitle={t(
            `${resumo.obras} obras, ${resumo.favoritas} na lista, ${
              resumo.seguindoObras + resumo.seguindoAutores
            } seguindo`,
            `${resumo.obras} works, ${resumo.favoritas} in the list, ${
              resumo.seguindoObras + resumo.seguindoAutores
            } following`,
            `${resumo.obras} obras, ${resumo.favoritas} en la lista, ${
              resumo.seguindoObras + resumo.seguindoAutores
            } siguiendo`,
          )}
          hideChevron
        />
      ) : null}
    </SettingsSection>
  );
}
