import type { ItemBibliotecaPerfil, ObraLocal } from "../types";
import { ProfileLibraryActionSheet } from "./profile-library-action-sheet";
import { ProfileWorkActionSheet } from "./profile-work-action-sheet";

type DadosSheetObraPerfil = {
  ariaLabelSheetObra: string;
  capituloHref: string;
  obraConcluida: boolean;
  obraFavorita: boolean;
  metaObraSheet: string;
  metricasObraSheet: string;
  temUltimoCapitulo: boolean;
};

type RotulosSheetObraPerfil = {
  rotuloConcluida: string;
  rotuloFavorita: string;
};

type DadosSheetBibliotecaPerfil = {
  ariaLabelSheetBiblioteca: string;
  capituloHref: string;
  obraConcluida: boolean;
  obraFavorita: boolean;
  obraNoQueroLer: boolean;
};

type RotulosSheetBibliotecaPerfil = {
  rotuloConcluida: string;
  rotuloFavorita: string;
  rotuloQueroLer: string;
};

type ProfileActionSheetsProps = {
  bibliotecaMenuAberto: ItemBibliotecaPerfil | null;
  dadosSheetBibliotecaPerfil: DadosSheetBibliotecaPerfil | null;
  dadosSheetObraPerfil: DadosSheetObraPerfil | null;
  exibirAcoesVisitante: boolean;
  metaSheetBibliotecaPerfil: string;
  obraMenuAberta: ObraLocal | null;
  rotuloRemoverSheetBibliotecaPerfil: string;
  rotulosSheetBibliotecaPerfil: RotulosSheetBibliotecaPerfil | null;
  rotulosSheetObraPerfil: RotulosSheetObraPerfil | null;
  onCloseBiblioteca: () => void;
  onCloseObra: () => void;
  onReadBiblioteca: () => void;
  onReadObra: () => void;
  onRemoveBiblioteca: () => void;
  onReportObra: () => void;
  onShareBiblioteca: () => void;
  onShareObra: () => void;
  onToggleBibliotecaCompleted: () => void;
  onToggleBibliotecaFavorite: () => void;
  onToggleBibliotecaWantToRead: () => void;
  onToggleObraCompleted: () => void;
  onToggleObraFavorite: () => void;
};

export function ProfileActionSheets({
  bibliotecaMenuAberto,
  dadosSheetBibliotecaPerfil,
  dadosSheetObraPerfil,
  exibirAcoesVisitante,
  metaSheetBibliotecaPerfil,
  obraMenuAberta,
  rotuloRemoverSheetBibliotecaPerfil,
  rotulosSheetBibliotecaPerfil,
  rotulosSheetObraPerfil,
  onCloseBiblioteca,
  onCloseObra,
  onReadBiblioteca,
  onReadObra,
  onRemoveBiblioteca,
  onReportObra,
  onShareBiblioteca,
  onShareObra,
  onToggleBibliotecaCompleted,
  onToggleBibliotecaFavorite,
  onToggleBibliotecaWantToRead,
  onToggleObraCompleted,
  onToggleObraFavorite,
}: ProfileActionSheetsProps) {
  return (
    <>
      {obraMenuAberta && dadosSheetObraPerfil && rotulosSheetObraPerfil && (
        <ProfileWorkActionSheet
          ariaLabel={dadosSheetObraPerfil.ariaLabelSheetObra}
          autor={obraMenuAberta.autor}
          capituloHref={dadosSheetObraPerfil.capituloHref}
          concluidaSelecionada={dadosSheetObraPerfil.obraConcluida}
          exibirAcoesVisitante={exibirAcoesVisitante}
          exibirLeitura={dadosSheetObraPerfil.temUltimoCapitulo}
          favoritaSelecionada={dadosSheetObraPerfil.obraFavorita}
          meta={dadosSheetObraPerfil.metaObraSheet}
          metricas={dadosSheetObraPerfil.metricasObraSheet}
          rotuloConcluida={rotulosSheetObraPerfil.rotuloConcluida}
          rotuloFavorita={rotulosSheetObraPerfil.rotuloFavorita}
          titulo={obraMenuAberta.titulo}
          onClose={onCloseObra}
          onRead={onReadObra}
          onReport={onReportObra}
          onShare={onShareObra}
          onToggleCompleted={onToggleObraCompleted}
          onToggleFavorite={onToggleObraFavorite}
        />
      )}

      {bibliotecaMenuAberto &&
        dadosSheetBibliotecaPerfil &&
        rotulosSheetBibliotecaPerfil && (
          <ProfileLibraryActionSheet
            ariaLabel={dadosSheetBibliotecaPerfil.ariaLabelSheetBiblioteca}
            capituloHref={dadosSheetBibliotecaPerfil.capituloHref}
            concluidaSelecionada={dadosSheetBibliotecaPerfil.obraConcluida}
            favoritaSelecionada={dadosSheetBibliotecaPerfil.obraFavorita}
            meta={metaSheetBibliotecaPerfil}
            queroLerSelecionado={dadosSheetBibliotecaPerfil.obraNoQueroLer}
            rotuloConcluida={rotulosSheetBibliotecaPerfil.rotuloConcluida}
            rotuloFavorita={rotulosSheetBibliotecaPerfil.rotuloFavorita}
            rotuloQueroLer={rotulosSheetBibliotecaPerfil.rotuloQueroLer}
            rotuloRemover={rotuloRemoverSheetBibliotecaPerfil}
            titulo={bibliotecaMenuAberto.obra.titulo}
            onClose={onCloseBiblioteca}
            onRead={onReadBiblioteca}
            onRemove={onRemoveBiblioteca}
            onShare={onShareBiblioteca}
            onToggleCompleted={onToggleBibliotecaCompleted}
            onToggleFavorite={onToggleBibliotecaFavorite}
            onToggleWantToRead={onToggleBibliotecaWantToRead}
          />
        )}
    </>
  );
}
