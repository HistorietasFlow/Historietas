import {
  SettingsRow,
  SectionTitle,
} from "./configuracoes-settings-primitives";
import { sectionStyle } from "../lib/configuracoes-settings-primitives-styles";
import { listCardTransparentStyle } from "../lib/configuracoes-security-styles";
import type {
  AbrirExclusaoContaConfiguracoes,
  DeveMostrarConfiguracoes,
  SairDaContaConfiguracoes,
  TraduzirTextoConfiguracoes,
} from "../lib/configuracoes-callback-types";

type ConfiguracoesAccountActionsSectionProps = {
  deveMostrar: DeveMostrarConfiguracoes;
  traduzirTexto: TraduzirTextoConfiguracoes;
  onAbrirExclusaoConta: AbrirExclusaoContaConfiguracoes;
  onSairDaConta: SairDaContaConfiguracoes;
};

export function ConfiguracoesAccountActionsSection({
  deveMostrar,
  traduzirTexto: t,
  onAbrirExclusaoConta,
  onSairDaConta,
}: ConfiguracoesAccountActionsSectionProps) {
  return (
    <>
      {deveMostrar("excluir", "apagar", "conta", "dados", "permanente") ? (
        <section style={sectionStyle}>
          <SectionTitle>
            {t("Zona de risco", "Danger zone", "Zona de riesgo")}
          </SectionTitle>
          <div style={listCardTransparentStyle}>
            <SettingsRow
              icon="trash"
              title={t(
                "Excluir minha conta",
                "Delete my account",
                "Eliminar mi cuenta",
              )}
              subtitle={t(
                "Apagar permanentemente a conta e os dados associados",
                "Permanently delete the account and associated data",
                "Eliminar permanentemente la cuenta y los datos asociados",
              )}
              onClick={onAbrirExclusaoConta}
              danger
            />
          </div>
        </section>
      ) : null}

      {deveMostrar("sair", "conta", "login") ? (
        <section style={sectionStyle}>
          <div style={listCardTransparentStyle}>
            <SettingsRow
              icon="logout"
              title={t("Sair da conta", "Sign out", "Cerrar sesión")}
              subtitle={t(
                "Encerrar sessão neste dispositivo",
                "End the session on this device",
                "Cerrar la sesión en este dispositivo",
              )}
              onClick={onSairDaConta}
              danger
            />
          </div>
        </section>
      ) : null}
    </>
  );
}
