import type { AbaPerfilAutor } from "../types";
import { PrivateProfileNotice } from "./private-profile-notice";
import { ProfileSectionTabs } from "./profile-section-tabs";

type ProfileNavigationPanelProps = {
  abaAtiva: AbaPerfilAutor;
  bibliotecaVisivel: boolean;
  comunidadeVisivel: boolean;
  conteudoPrivadoBloqueado: boolean;
  diarioVisivel: boolean;
  obrasVisivel: boolean;
  perfilBloqueadoEntreUsuarios: boolean;
  sobreVisivel: boolean;
  temAbasPerfilVisiveis: boolean;
  totalAbasVisiveis: number;
  onSelect: (aba: AbaPerfilAutor) => void;
};

export function ProfileNavigationPanel({
  abaAtiva,
  bibliotecaVisivel,
  comunidadeVisivel,
  conteudoPrivadoBloqueado,
  diarioVisivel,
  obrasVisivel,
  perfilBloqueadoEntreUsuarios,
  sobreVisivel,
  temAbasPerfilVisiveis,
  totalAbasVisiveis,
  onSelect,
}: ProfileNavigationPanelProps) {
  return (
    <>
      {temAbasPerfilVisiveis && (
        <ProfileSectionTabs
          abaAtiva={abaAtiva}
          bibliotecaVisivel={bibliotecaVisivel}
          comunidadeVisivel={comunidadeVisivel}
          diarioVisivel={diarioVisivel}
          obrasVisivel={obrasVisivel}
          sobreVisivel={sobreVisivel}
          totalAbasVisiveis={totalAbasVisiveis}
          onSelect={onSelect}
        />
      )}

      {conteudoPrivadoBloqueado && (
        <PrivateProfileNotice
          perfilBloqueadoEntreUsuarios={perfilBloqueadoEntreUsuarios}
        />
      )}
    </>
  );
}
