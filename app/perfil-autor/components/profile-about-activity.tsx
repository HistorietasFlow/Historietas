import { ProfileAboutPanel } from "./profile-about-panel";
import { ProfileAboutPanelTitle } from "./profile-about-panel-title";
import { ProfileAboutRow } from "./profile-about-row";
import { ProfileAboutRows } from "./profile-about-rows";

type ProfileAboutActivityProps = {
  totalObras: number;
  totalRascunhos: number;
  totalComentarios: number;
  totalConcluidas: number;
  mostrarObrasSemCapitulos: boolean;
  totalObrasSemCapitulos: number;
};

export function ProfileAboutActivity({
  totalObras,
  totalRascunhos,
  totalComentarios,
  totalConcluidas,
  mostrarObrasSemCapitulos,
  totalObrasSemCapitulos,
}: ProfileAboutActivityProps) {
  return (
    <ProfileAboutPanel>
      <ProfileAboutPanelTitle>Atividade</ProfileAboutPanelTitle>

      <ProfileAboutRows>
        <ProfileAboutRow>
          obras no perfil
          <strong>{totalObras}</strong>
        </ProfileAboutRow>
        <ProfileAboutRow>
          rascunhos em desenvolvimento
          <strong>{totalRascunhos}</strong>
        </ProfileAboutRow>
        <ProfileAboutRow>
          comentários recebidos
          <strong>{totalComentarios}</strong>
        </ProfileAboutRow>
        <ProfileAboutRow>
          concluídas por leitores
          <strong>{totalConcluidas}</strong>
        </ProfileAboutRow>
        {mostrarObrasSemCapitulos && (
          <ProfileAboutRow>
            sem capítulos ainda
            <strong>{totalObrasSemCapitulos}</strong>
          </ProfileAboutRow>
        )}
      </ProfileAboutRows>
    </ProfileAboutPanel>
  );
}
