import type { HistorietasLanguage } from "../../../lib/i18n";
import { traduzirTextoPerfilAutor } from "../translations";
import type {
  AbaBibliotecaPerfil,
  ItemBibliotecaPerfil,
  ObraLocal,
  TotaisInteracoesObrasPerfilAutor,
} from "../types";
import {
  obterDadosSheetBibliotecaPerfilAutor,
  obterDadosSheetObraPerfilAutor,
  obterRotulosAcoesColecoesObraPerfilAutor,
} from "./profile-work-display-utils";
import {
  obterMetaMenuBibliotecaPerfil,
  obterRotuloAcaoRemoverBibliotecaPerfil,
  obterRotulosAcoesColecoesBibliotecaPerfil,
} from "./profile-library-display-utils";

export function obterEstadoVisualActionSheetsPerfilAutor({
  obraMenuAberta,
  totaisInteracoesObras,
  obrasFavoritas,
  obrasConcluidas,
  obrasSeguidasBiblioteca,
  language,
  bibliotecaMenuAberto,
  abaBibliotecaPerfil,
}: {
  obraMenuAberta: ObraLocal | null;
  totaisInteracoesObras: TotaisInteracoesObrasPerfilAutor;
  obrasFavoritas: string[];
  obrasConcluidas: string[];
  obrasSeguidasBiblioteca: string[];
  language: HistorietasLanguage;
  bibliotecaMenuAberto: ItemBibliotecaPerfil | null;
  abaBibliotecaPerfil: AbaBibliotecaPerfil;
}) {
  const dadosSheetObraPerfil = obraMenuAberta
    ? obterDadosSheetObraPerfilAutor({
        obra: obraMenuAberta,
        totaisInteracoesObras,
        obrasFavoritas,
        obrasConcluidas,
        obrasSeguidasBiblioteca,
        traduzirTexto: (item) => traduzirTextoPerfilAutor(item, language),
      })
    : null;
  const rotulosSheetObraPerfil = dadosSheetObraPerfil
    ? obterRotulosAcoesColecoesObraPerfilAutor({
        obraFavorita: dadosSheetObraPerfil.obraFavorita,
        obraConcluida: dadosSheetObraPerfil.obraConcluida,
      })
    : null;
  const dadosSheetBibliotecaPerfil = bibliotecaMenuAberto
    ? obterDadosSheetBibliotecaPerfilAutor({
        item: bibliotecaMenuAberto,
        obrasFavoritas,
        obrasConcluidas,
        obrasSeguidasBiblioteca,
      })
    : null;
  const metaSheetBibliotecaPerfil = bibliotecaMenuAberto
    ? obterMetaMenuBibliotecaPerfil(bibliotecaMenuAberto)
    : "";
  const rotulosSheetBibliotecaPerfil = dadosSheetBibliotecaPerfil
    ? obterRotulosAcoesColecoesBibliotecaPerfil({
        obraNoQueroLer: dadosSheetBibliotecaPerfil.obraNoQueroLer,
        obraFavorita: dadosSheetBibliotecaPerfil.obraFavorita,
        obraConcluida: dadosSheetBibliotecaPerfil.obraConcluida,
      })
    : null;
  const rotuloRemoverSheetBibliotecaPerfil = bibliotecaMenuAberto
    ? obterRotuloAcaoRemoverBibliotecaPerfil(abaBibliotecaPerfil)
    : "";

  return {
    dadosSheetObraPerfil,
    rotulosSheetObraPerfil,
    dadosSheetBibliotecaPerfil,
    metaSheetBibliotecaPerfil,
    rotulosSheetBibliotecaPerfil,
    rotuloRemoverSheetBibliotecaPerfil,
  };
}
