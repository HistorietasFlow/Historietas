import {
  SettingsRow,
  SettingsSection,
} from "./configuracoes-settings-primitives";
import type {
  PreferenciasPrivacidadeHistorietas,
  QuemPodeAvaliarDiario,
  QuemPodeComentarDiario,
  VisibilidadeAbaPerfil,
} from "../lib/configuracoes-privacy-preferences";
import { privacySelectStyle } from "../lib/configuracoes-security-styles";
import type { TraduzirTextoConfiguracoes } from "../lib/configuracoes-callback-types";

type ConfiguracoesDiaryPrivacySectionProps = {
  deveMostrar: (...termos: string[]) => boolean;
  traduzirTexto: TraduzirTextoConfiguracoes;
  privacidade: PreferenciasPrivacidadeHistorietas;
  onAplicarPrivacidadeAtualizada: (
    privacidadeAtualizada: PreferenciasPrivacidadeHistorietas,
  ) => void;
  onAtualizarPrivacidade: <K extends keyof PreferenciasPrivacidadeHistorietas>(
    campo: K,
    valor: PreferenciasPrivacidadeHistorietas[K],
  ) => void;
};

export function ConfiguracoesDiaryPrivacySection({
  deveMostrar,
  traduzirTexto: t,
  privacidade,
  onAplicarPrivacidadeAtualizada,
  onAtualizarPrivacidade,
}: ConfiguracoesDiaryPrivacySectionProps) {
  if (
    !deveMostrar(
      "diário",
      "avaliações",
      "avaliar",
      "comentários",
      "seguidores",
      "privacidade",
    )
  ) {
    return null;
  }

  return (
    <SettingsSection
      title={t(
        "Privacidade e interações do Diário",
        "Journal privacy and interactions",
        "Privacidad e interacciones del Diario",
      )}
    >
      {deveMostrar(
        "avaliações",
        "mostrar",
        "perfil",
        "diário",
        "visibilidade",
      ) ? (
        <SettingsRow
          icon="star"
          title={t(
            "Mostrar avaliações do Diário",
            "Show Journal ratings",
            "Mostrar valoraciones del Diario",
          )}
          right={
            <select
              value={privacidade.visibilidadeAvaliacaoDiario}
              onChange={(event) => {
                const visibilidade = event.target
                  .value as VisibilidadeAbaPerfil;

                onAplicarPrivacidadeAtualizada({
                  ...privacidade,
                  visibilidadeAvaliacaoDiario: visibilidade,
                  mostrarAvaliacaoDiario: visibilidade !== "somente_eu",
                });
              }}
              aria-label={t(
                "Quem pode ver as avaliações do meu Diário",
                "Who can see my Journal ratings",
                "Quién puede ver las valoraciones de mi Diario",
              )}
              style={privacySelectStyle}
            >
              <option value="publico">{t("Público", "Public", "Público")}</option>
              <option value="seguidores">{t("Seguidores", "Followers", "Seguidores")}</option>
              <option value="seguindo">
                {t(
                  "Pessoas que sigo",
                  "People I follow",
                  "Personas que sigo",
                )}
              </option>
              <option value="somente_eu">{t("Somente eu", "Only me", "Solo yo")}</option>
            </select>
          }
          hideChevron
        />
      ) : null}

      {deveMostrar(
        "avaliações",
        "permitir",
        "avaliar",
        "seguidores",
        "pessoas que sigo",
        "diário",
      ) ? (
        <SettingsRow
          icon="user"
          title={t(
            "Permitir novas avaliações",
            "Allow new ratings",
            "Permitir nuevas valoraciones",
          )}
          right={
            <select
              value={privacidade.quemPodeAvaliarDiario}
              onChange={(event) => {
                const quemPodeAvaliar = event.target
                  .value as QuemPodeAvaliarDiario;

                onAplicarPrivacidadeAtualizada({
                  ...privacidade,
                  permitirAvaliacaoDiario: quemPodeAvaliar !== "ninguem",
                  quemPodeAvaliarDiario: quemPodeAvaliar,
                });
              }}
              aria-label={t(
                "Quem pode avaliar meu Diário",
                "Who can rate my Journal",
                "Quién puede valorar mi Diario",
              )}
              style={privacySelectStyle}
            >
              <option value="todos">{t("Público", "Public", "Público")}</option>
              <option value="seguidores">{t("Seguidores", "Followers", "Seguidores")}</option>
              <option value="seguindo">
                {t(
                  "Pessoas que sigo",
                  "People I follow",
                  "Personas que sigo",
                )}
              </option>
              <option value="ninguem">{t("Ninguém", "No one", "Nadie")}</option>
            </select>
          }
          hideChevron
        />
      ) : null}

      {deveMostrar(
        "comentários",
        "público",
        "seguidores",
        "pessoas que sigo",
        "ninguém",
        "diário",
      ) ? (
        <SettingsRow
          icon="comment"
          title={t(
            "Quem pode comentar no meu Diário",
            "Who can comment on my Journal",
            "Quién puede comentar en mi Diario",
          )}
          right={
            <select
              value={privacidade.quemPodeComentarDiario}
              onChange={(event) =>
                onAtualizarPrivacidade(
                  "quemPodeComentarDiario",
                  event.target.value as QuemPodeComentarDiario,
                )
              }
              aria-label={t(
                "Quem pode comentar no meu Diário",
                "Who can comment on my Journal",
                "Quién puede comentar en mi Diario",
              )}
              style={privacySelectStyle}
            >
              <option value="todos">{t("Público", "Public", "Público")}</option>
              <option value="seguidores">{t("Seguidores", "Followers", "Seguidores")}</option>
              <option value="seguindo">
                {t(
                  "Pessoas que sigo",
                  "People I follow",
                  "Personas que sigo",
                )}
              </option>
              <option value="ninguem">{t("Ninguém", "No one", "Nadie")}</option>
            </select>
          }
          hideChevron
        />
      ) : null}
    </SettingsSection>
  );
}
