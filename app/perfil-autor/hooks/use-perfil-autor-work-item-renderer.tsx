import type { Dispatch, SetStateAction } from "react";

import { ProfileWorkGridItem } from "../components/profile-work-grid-item";
import { alternarIdentificadorMenuPerfilAutor } from "../lib/profile-display-utils";
import { obterDadosCardObraPerfilAutor } from "../lib/profile-work-display-utils";
import { criarCapaGridPerfilAutor } from "../styles";
import type { ObraLocal, TotaisInteracoesObrasPerfilAutor } from "../types";

export function usePerfilAutorWorkItemRenderer({
  isDesktop,
  obraMenuAbertoId,
  setObraMenuAbertoId,
  totaisInteracoesObras,
}: {
  isDesktop: boolean;
  obraMenuAbertoId: string;
  setObraMenuAbertoId: Dispatch<SetStateAction<string>>;
  totaisInteracoesObras: TotaisInteracoesObrasPerfilAutor;
}) {
  function renderizarObraPerfilAutor(obra: ObraLocal) {
    const {
      obraHref,
      totalCurtidas,
      totalComentarios,
      visualizacoesFormatadas: visualizacoesObra,
      menuObraAberto,
      ariaLabelOpcoes,
    } = obterDadosCardObraPerfilAutor(
      obra,
      totaisInteracoesObras,
      obraMenuAbertoId,
    );

    return (
      <ProfileWorkGridItem
        key={obra.id}
        href={obraHref}
        capaStyle={criarCapaGridPerfilAutor(obra.capa, isDesktop)}
        titulo={obra.titulo}
        visualizacoes={visualizacoesObra}
        totalCurtidas={totalCurtidas}
        totalComentarios={totalComentarios}
        ariaLabelOpcoes={ariaLabelOpcoes}
        menuAberto={menuObraAberto}
        onToggleMenu={() =>
          setObraMenuAbertoId((idAtual) =>
            alternarIdentificadorMenuPerfilAutor(idAtual, obra.id),
          )
        }
      />
    );
  }

  return { renderizarObraPerfilAutor };
}
