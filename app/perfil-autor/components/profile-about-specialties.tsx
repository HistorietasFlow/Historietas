import { ProfileAboutChip } from "./profile-about-chip";
import { ProfileAboutChips } from "./profile-about-chips";
import { ProfileAboutPanel } from "./profile-about-panel";
import { ProfileAboutPanelTitle } from "./profile-about-panel-title";

type ProfileAboutSpecialtiesProps = {
  generosEspecialidadesPerfil: string[];
};

export function ProfileAboutSpecialties({
  generosEspecialidadesPerfil,
}: ProfileAboutSpecialtiesProps) {
  return (
    <ProfileAboutPanel>
      <ProfileAboutPanelTitle>Especialidades</ProfileAboutPanelTitle>

      <ProfileAboutChips>
        {generosEspecialidadesPerfil.map((genero) => (
          <ProfileAboutChip key={`sobre-genero-${genero}`}>
            {genero}
          </ProfileAboutChip>
        ))}
      </ProfileAboutChips>
    </ProfileAboutPanel>
  );
}
