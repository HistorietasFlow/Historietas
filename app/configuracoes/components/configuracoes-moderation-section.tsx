import {
  SettingsRow,
  SettingsSection,
} from "./configuracoes-settings-primitives";

type TraduzirTexto = (
  portugues: string,
  ingles: string,
  espanhol: string,
) => string;

type ConfiguracoesModerationSectionProps = {
  adminLiberado: boolean;
  deveMostrar: (...termos: string[]) => boolean;
  traduzirTexto: TraduzirTexto;
};

export function ConfiguracoesModerationSection({
  adminLiberado,
  deveMostrar,
  traduzirTexto: t,
}: ConfiguracoesModerationSectionProps) {
  if (!adminLiberado || !deveMostrar("moderação", "admin", "comunidade")) {
    return null;
  }

  return (
    <SettingsSection title={t("Moderação", "Moderation", "Moderación")}>
      <SettingsRow
        icon="admin"
        title={t(
          "Área de moderação",
          "Moderation area",
          "Área de moderación",
        )}
        subtitle={t(
          "Revisar denúncias e conteúdos enviados",
          "Review reports and submitted content",
          "Revisar denuncias y contenidos enviados",
        )}
        href="/admin/comunidade"
      />
    </SettingsSection>
  );
}
