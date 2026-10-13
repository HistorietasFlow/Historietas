import Link from "next/link";

import { obterIndicadorSelecaoPerfilAutor } from "../lib/profile-display-utils";
import {
  criarProfileSelectionDotStyle,
  workActionSheetItemActiveStyle,
  workActionSheetItemStyle,
} from "../styles";
import { ProfileWorkActionSheetActions } from "./profile-work-action-sheet-actions";
import { ProfileWorkActionSheetHandle } from "./profile-work-action-sheet-handle";
import { ProfileWorkActionSheetHeader } from "./profile-work-action-sheet-header";
import { ProfileWorkActionSheetMeta } from "./profile-work-action-sheet-meta";
import { ProfileWorkActionSheetOverlay } from "./profile-work-action-sheet-overlay";
import { ProfileWorkActionSheetPanel } from "./profile-work-action-sheet-panel";
import { ProfileWorkActionSheetTitle } from "./profile-work-action-sheet-title";

type ProfileLibraryActionSheetProps = {
  ariaLabel: string;
  capituloHref: string;
  concluidaSelecionada: boolean;
  favoritaSelecionada: boolean;
  meta: string;
  queroLerSelecionado: boolean;
  rotuloConcluida: string;
  rotuloFavorita: string;
  rotuloQueroLer: string;
  rotuloRemover: string;
  titulo: string;
  onClose: () => void;
  onRead: () => void;
  onRemove: () => void;
  onShare: () => void;
  onToggleCompleted: () => void;
  onToggleFavorite: () => void;
  onToggleWantToRead: () => void;
};

export function ProfileLibraryActionSheet({
  ariaLabel,
  capituloHref,
  concluidaSelecionada,
  favoritaSelecionada,
  meta,
  queroLerSelecionado,
  rotuloConcluida,
  rotuloFavorita,
  rotuloQueroLer,
  rotuloRemover,
  titulo,
  onClose,
  onRead,
  onRemove,
  onShare,
  onToggleCompleted,
  onToggleFavorite,
  onToggleWantToRead,
}: ProfileLibraryActionSheetProps) {
  return (
    <ProfileWorkActionSheetOverlay onClick={onClose}>
      <ProfileWorkActionSheetPanel
        ariaLabel={ariaLabel}
        onClick={(event) => event.stopPropagation()}
      >
        <ProfileWorkActionSheetHandle />

        <ProfileWorkActionSheetHeader>
          <ProfileWorkActionSheetTitle>{titulo}</ProfileWorkActionSheetTitle>
          <ProfileWorkActionSheetMeta>{meta}</ProfileWorkActionSheetMeta>
        </ProfileWorkActionSheetHeader>

        <ProfileWorkActionSheetActions>
          <Link
            href={capituloHref}
            onClick={onRead}
            style={workActionSheetItemStyle}
          >
            Ler capítulo
          </Link>

          <button
            type="button"
            onClick={onToggleWantToRead}
            style={
              queroLerSelecionado
                ? workActionSheetItemActiveStyle
                : workActionSheetItemStyle
            }
          >
            <span>{rotuloQueroLer}</span>
            <span style={criarProfileSelectionDotStyle(queroLerSelecionado)}>
              {obterIndicadorSelecaoPerfilAutor(queroLerSelecionado)}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleFavorite}
            style={
              favoritaSelecionada
                ? workActionSheetItemActiveStyle
                : workActionSheetItemStyle
            }
          >
            <span>{rotuloFavorita}</span>
            <span style={criarProfileSelectionDotStyle(favoritaSelecionada)}>
              {obterIndicadorSelecaoPerfilAutor(favoritaSelecionada)}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleCompleted}
            style={
              concluidaSelecionada
                ? workActionSheetItemActiveStyle
                : workActionSheetItemStyle
            }
          >
            <span>{rotuloConcluida}</span>
            <span style={criarProfileSelectionDotStyle(concluidaSelecionada)}>
              {obterIndicadorSelecaoPerfilAutor(concluidaSelecionada)}
            </span>
          </button>

          <button type="button" onClick={onRemove} style={workActionSheetItemStyle}>
            {rotuloRemover}
          </button>

          <button type="button" onClick={onShare} style={workActionSheetItemStyle}>
            Compartilhar
          </button>
        </ProfileWorkActionSheetActions>
      </ProfileWorkActionSheetPanel>
    </ProfileWorkActionSheetOverlay>
  );
}
