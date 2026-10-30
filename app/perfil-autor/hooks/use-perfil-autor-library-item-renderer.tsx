import type { Dispatch, SetStateAction } from "react";

import { LibraryItemCard } from "../components/library-item-card";
import { alternarIdentificadorMenuPerfilAutor } from "../lib/profile-display-utils";
import { obterDadosCardBibliotecaPerfilAutor } from "../lib/profile-work-display-utils";
import type {
  ItemBibliotecaPerfil,
  TotaisInteracoesObrasPerfilAutor,
} from "../types";

export function usePerfilAutorLibraryItemRenderer({
  isDesktop,
  totaisInteracoesObras,
  bibliotecaMenuAbertoChave,
  setBibliotecaMenuAbertoChave,
}: {
  isDesktop: boolean;
  totaisInteracoesObras: TotaisInteracoesObrasPerfilAutor;
  bibliotecaMenuAbertoChave: string;
  setBibliotecaMenuAbertoChave: Dispatch<SetStateAction<string>>;
}) {
  const renderizarItemBiblioteca = (item: ItemBibliotecaPerfil) => {
    const {
      capituloHref,
      totalCurtidas: totalCurtidasBiblioteca,
      totalComentarios: totalComentariosBiblioteca,
      visualizacoesFormatadas: visualizacoesBiblioteca,
      menuAberto,
    } = obterDadosCardBibliotecaPerfilAutor(
      item,
      totaisInteracoesObras,
      bibliotecaMenuAbertoChave,
    );

    return (
      <LibraryItemCard
        key={item.chave}
        item={item}
        href={capituloHref}
        isDesktop={isDesktop}
        menuAberto={menuAberto}
        totalComentarios={totalComentariosBiblioteca}
        totalCurtidas={totalCurtidasBiblioteca}
        visualizacoes={visualizacoesBiblioteca}
        onToggleMenu={() =>
          setBibliotecaMenuAbertoChave((chaveAtual) =>
            alternarIdentificadorMenuPerfilAutor(
              chaveAtual,
              item.chave,
            ),
          )
        }
      />
    );
  };

  return { renderizarItemBiblioteca };
}
