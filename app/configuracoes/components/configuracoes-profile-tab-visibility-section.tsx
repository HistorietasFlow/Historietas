import {
  SettingsRow,
  SettingsSection,
} from "./configuracoes-settings-primitives";
import type {
  PreferenciasPrivacidadeHistorietas,
  VisibilidadeAbaPerfil,
} from "../lib/configuracoes-privacy-preferences";
import { privacySelectStyle } from "../lib/configuracoes-security-styles";
import type { TraduzirTextoConfiguracoes } from "../lib/configuracoes-callback-types";

type ConfiguracoesProfileTabVisibilitySectionProps = {
  deveMostrar: (...termos: string[]) => boolean;
  traduzirTexto: TraduzirTextoConfiguracoes;
  privacidade: PreferenciasPrivacidadeHistorietas;
  onAtualizarPrivacidade: <K extends keyof PreferenciasPrivacidadeHistorietas>(
    campo: K,
    valor: PreferenciasPrivacidadeHistorietas[K],
  ) => void;
};

export function ConfiguracoesProfileTabVisibilitySection({
  deveMostrar,
  traduzirTexto: t,
  privacidade,
  onAtualizarPrivacidade,
}: ConfiguracoesProfileTabVisibilitySectionProps) {
  if (
    !deveMostrar(
      "privacidade",
      "visibilidade",
      "obras",
      "sobre",
      "diário",
      "comunidade",
      "biblioteca",
      "atividades",
      "público",
      "seguidores",
      "pessoas que sigo",
      "somente eu",
    )
  ) {
    return null;
  }

  return (
    <SettingsSection
      title={t(
        "Visibilidade das abas",
        "Tab visibility",
        "Visibilidad de las pestañas",
      )}
    >
      {deveMostrar("obras", "publicadas", "visibilidade") ? (
        <SettingsRow
          icon="book"
          title={t("Obras", "Works", "Obras")}
          right={
            <select
              value={privacidade.visibilidadeObras}
              onChange={(event) =>
                onAtualizarPrivacidade(
                  "visibilidadeObras",
                  event.target.value as VisibilidadeAbaPerfil,
                )
              }
              aria-label={t(
                "Visibilidade da aba Obras",
                "Works tab visibility",
                "Visibilidad de la pestaña Obras",
              )}
              style={privacySelectStyle}
            >
              <option value="publico">{t("Público", "Public", "Público")}</option>
              <option value="seguidores">{t("Seguidores", "Followers", "Seguidores")}</option>
              <option value="seguindo">{t("Pessoas que sigo", "People I follow", "Personas que sigo")}</option>
              <option value="somente_eu">{t("Somente eu", "Only me", "Solo yo")}</option>
            </select>
          }
          hideChevron
        />
      ) : null}

      {deveMostrar("sobre", "perfil", "visibilidade") ? (
        <SettingsRow
          icon="file"
          title={t("Sobre", "About", "Acerca de")}
          right={
            <select
              value={privacidade.visibilidadeSobre}
              onChange={(event) =>
                onAtualizarPrivacidade(
                  "visibilidadeSobre",
                  event.target.value as VisibilidadeAbaPerfil,
                )
              }
              aria-label={t(
                "Visibilidade da aba Sobre",
                "About tab visibility",
                "Visibilidad de la pestaña Acerca de",
              )}
              style={privacySelectStyle}
            >
              <option value="publico">{t("Público", "Public", "Público")}</option>
              <option value="seguidores">{t("Seguidores", "Followers", "Seguidores")}</option>
              <option value="seguindo">{t("Pessoas que sigo", "People I follow", "Personas que sigo")}</option>
              <option value="somente_eu">{t("Somente eu", "Only me", "Solo yo")}</option>
            </select>
          }
          hideChevron
        />
      ) : null}

      {deveMostrar("diário", "visibilidade") ? (
        <SettingsRow
          icon="pen"
          title={t("Diário", "Journal", "Diario")}
          right={
            <select
              value={privacidade.visibilidadeDiario}
              onChange={(event) =>
                onAtualizarPrivacidade(
                  "visibilidadeDiario",
                  event.target.value as VisibilidadeAbaPerfil,
                )
              }
              aria-label={t(
                "Visibilidade da aba Diário",
                "Journal tab visibility",
                "Visibilidad de la pestaña Diario",
              )}
              style={privacySelectStyle}
            >
              <option value="publico">{t("Público", "Public", "Público")}</option>
              <option value="seguidores">{t("Seguidores", "Followers", "Seguidores")}</option>
              <option value="seguindo">{t("Pessoas que sigo", "People I follow", "Personas que sigo")}</option>
              <option value="somente_eu">{t("Somente eu", "Only me", "Solo yo")}</option>
            </select>
          }
          hideChevron
        />
      ) : null}

      {deveMostrar("comunidade", "publicações", "visibilidade") ? (
        <SettingsRow
          icon="comment"
          title={t("Comunidade", "Community", "Comunidad")}
          right={
            <select
              value={privacidade.visibilidadeComunidade}
              onChange={(event) =>
                onAtualizarPrivacidade(
                  "visibilidadeComunidade",
                  event.target.value as VisibilidadeAbaPerfil,
                )
              }
              aria-label={t(
                "Visibilidade da aba Comunidade",
                "Community tab visibility",
                "Visibilidad de la pestaña Comunidad",
              )}
              style={privacySelectStyle}
            >
              <option value="publico">{t("Público", "Public", "Público")}</option>
              <option value="seguidores">{t("Seguidores", "Followers", "Seguidores")}</option>
              <option value="seguindo">{t("Pessoas que sigo", "People I follow", "Personas que sigo")}</option>
              <option value="somente_eu">{t("Somente eu", "Only me", "Solo yo")}</option>
            </select>
          }
          hideChevron
        />
      ) : null}

      {deveMostrar("biblioteca", "listas", "visibilidade") ? (
        <SettingsRow
          icon="bookmark"
          title={t("Biblioteca", "Library", "Biblioteca")}
          right={
            <select
              value={privacidade.visibilidadeBiblioteca}
              onChange={(event) =>
                onAtualizarPrivacidade(
                  "visibilidadeBiblioteca",
                  event.target.value as VisibilidadeAbaPerfil,
                )
              }
              aria-label={t(
                "Visibilidade da aba Biblioteca",
                "Library tab visibility",
                "Visibilidad de la pestaña Biblioteca",
              )}
              style={privacySelectStyle}
            >
              <option value="publico">{t("Público", "Public", "Público")}</option>
              <option value="seguidores">{t("Seguidores", "Followers", "Seguidores")}</option>
              <option value="seguindo">{t("Pessoas que sigo", "People I follow", "Personas que sigo")}</option>
              <option value="somente_eu">{t("Somente eu", "Only me", "Solo yo")}</option>
            </select>
          }
          hideChevron
        />
      ) : null}

      {deveMostrar("atividades", "leitura", "visibilidade") ? (
        <SettingsRow
          icon="clock"
          title={t("Atividades", "Activity", "Actividad")}
          right={
            <select
              value={privacidade.visibilidadeAtividades}
              onChange={(event) =>
                onAtualizarPrivacidade(
                  "visibilidadeAtividades",
                  event.target.value as VisibilidadeAbaPerfil,
                )
              }
              aria-label={t(
                "Visibilidade das atividades",
                "Activity visibility",
                "Visibilidad de la actividad",
              )}
              style={privacySelectStyle}
            >
              <option value="publico">{t("Público", "Public", "Público")}</option>
              <option value="seguidores">{t("Seguidores", "Followers", "Seguidores")}</option>
              <option value="seguindo">{t("Pessoas que sigo", "People I follow", "Personas que sigo")}</option>
              <option value="somente_eu">{t("Somente eu", "Only me", "Solo yo")}</option>
            </select>
          }
          hideChevron
        />
      ) : null}
    </SettingsSection>
  );
}
