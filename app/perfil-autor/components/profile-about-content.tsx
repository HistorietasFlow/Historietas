import { ProfileAboutActivity } from "./profile-about-activity";
import { ProfileAboutContentGrid } from "./profile-about-content-grid";
import { ProfileAboutProfileNumbers } from "./profile-about-profile-numbers";
import { ProfileAboutSpecialties } from "./profile-about-specialties";

type ProfileAboutContentProps = {
  generosEspecialidadesPerfil: string[];
  totalPublicadas: string;
  totalCapitulos: string;
  totalCurtidas: string;
  totalVisualizacoes: string;
  totalObras: number;
  totalRascunhos: number;
  totalComentarios: number;
  totalConcluidas: number;
  mostrarObrasSemCapitulos: boolean;
  totalObrasSemCapitulos: number;
};

export function ProfileAboutContent({
  generosEspecialidadesPerfil,
  totalPublicadas,
  totalCapitulos,
  totalCurtidas,
  totalVisualizacoes,
  totalObras,
  totalRascunhos,
  totalComentarios,
  totalConcluidas,
  mostrarObrasSemCapitulos,
  totalObrasSemCapitulos,
}: ProfileAboutContentProps) {
  return (
    <ProfileAboutContentGrid>
      <ProfileAboutSpecialties
        generosEspecialidadesPerfil={generosEspecialidadesPerfil}
      />

      <ProfileAboutProfileNumbers
        totalPublicadas={totalPublicadas}
        totalCapitulos={totalCapitulos}
        totalCurtidas={totalCurtidas}
        totalVisualizacoes={totalVisualizacoes}
      />

      <ProfileAboutActivity
        totalObras={totalObras}
        totalRascunhos={totalRascunhos}
        totalComentarios={totalComentarios}
        totalConcluidas={totalConcluidas}
        mostrarObrasSemCapitulos={mostrarObrasSemCapitulos}
        totalObrasSemCapitulos={totalObrasSemCapitulos}
      />
    </ProfileAboutContentGrid>
  );
}
