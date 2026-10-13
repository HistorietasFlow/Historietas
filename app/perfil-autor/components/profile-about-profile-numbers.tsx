import { ProfileAboutMetricCard } from "./profile-about-metric-card";
import { ProfileAboutMetricLabel } from "./profile-about-metric-label";
import { ProfileAboutMetricNumber } from "./profile-about-metric-number";
import { ProfileAboutMetricsGrid } from "./profile-about-metrics-grid";
import { ProfileAboutPanel } from "./profile-about-panel";
import { ProfileAboutPanelTitle } from "./profile-about-panel-title";

type ProfileAboutProfileNumbersProps = {
  totalPublicadas: string;
  totalCapitulos: string;
  totalCurtidas: string;
  totalVisualizacoes: string;
};

export function ProfileAboutProfileNumbers({
  totalPublicadas,
  totalCapitulos,
  totalCurtidas,
  totalVisualizacoes,
}: ProfileAboutProfileNumbersProps) {
  return (
    <ProfileAboutPanel>
      <ProfileAboutPanelTitle>Números do perfil</ProfileAboutPanelTitle>

      <ProfileAboutMetricsGrid>
        <ProfileAboutMetricCard>
          <ProfileAboutMetricNumber>{totalPublicadas}</ProfileAboutMetricNumber>
          <ProfileAboutMetricLabel>publicadas</ProfileAboutMetricLabel>
        </ProfileAboutMetricCard>

        <ProfileAboutMetricCard>
          <ProfileAboutMetricNumber>{totalCapitulos}</ProfileAboutMetricNumber>
          <ProfileAboutMetricLabel>capítulos</ProfileAboutMetricLabel>
        </ProfileAboutMetricCard>

        <ProfileAboutMetricCard>
          <ProfileAboutMetricNumber>{totalCurtidas}</ProfileAboutMetricNumber>
          <ProfileAboutMetricLabel>curtidas</ProfileAboutMetricLabel>
        </ProfileAboutMetricCard>

        <ProfileAboutMetricCard>
          <ProfileAboutMetricNumber>{totalVisualizacoes}</ProfileAboutMetricNumber>
          <ProfileAboutMetricLabel>visualizações</ProfileAboutMetricLabel>
        </ProfileAboutMetricCard>
      </ProfileAboutMetricsGrid>
    </ProfileAboutPanel>
  );
}
