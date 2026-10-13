import Link from "next/link";

import { obterIndicadorSelecaoPerfilAutor } from "../lib/profile-display-utils";
import {
  criarProfileSelectionDotStyle,
  workActionSheetDangerItemStyle,
  workActionSheetItemActiveStyle,
  workActionSheetItemStyle,
} from "../styles";
import { ProfileWorkActionSheetActions } from "./profile-work-action-sheet-actions";
import { ProfileWorkActionSheetAuthor } from "./profile-work-action-sheet-author";
import { ProfileWorkActionSheetHandle } from "./profile-work-action-sheet-handle";
import { ProfileWorkActionSheetHeader } from "./profile-work-action-sheet-header";
import { ProfileWorkActionSheetMeta } from "./profile-work-action-sheet-meta";
import { ProfileWorkActionSheetMetrics } from "./profile-work-action-sheet-metrics";
import { ProfileWorkActionSheetOverlay } from "./profile-work-action-sheet-overlay";
import { ProfileWorkActionSheetPanel } from "./profile-work-action-sheet-panel";
import { ProfileWorkActionSheetTitle } from "./profile-work-action-sheet-title";

type ProfileWorkActionSheetProps = {
  ariaLabel: string;
  autor: string;
  capituloHref: string;
  favoritaSelecionada: boolean;
  concluidaSelecionada: boolean;
  exibirAcoesVisitante: boolean;
  exibirLeitura: boolean;
  meta: string;
  metricas: string;
  rotuloConcluida: string;
  rotuloFavorita: string;
  titulo: string;
  onClose: () => void;
  onRead: () => void;
  onReport: () => void;
  onShare: () => void;
  onToggleCompleted: () => void;
  onToggleFavorite: () => void;
};

export function ProfileWorkActionSheet({
  ariaLabel,
  autor,
  capituloHref,
  favoritaSelecionada,
  concluidaSelecionada,
  exibirAcoesVisitante,
  exibirLeitura,
  meta,
  metricas,
  rotuloConcluida,
  rotuloFavorita,
  titulo,
  onClose,
  onRead,
  onReport,
  onShare,
  onToggleCompleted,
  onToggleFavorite,
}: ProfileWorkActionSheetProps) {
  return (
    <ProfileWorkActionSheetOverlay onClick={onClose}>
      <ProfileWorkActionSheetPanel
        ariaLabel={ariaLabel}
        onClick={(event) => event.stopPropagation()}
      >
        <ProfileWorkActionSheetHandle />

        <ProfileWorkActionSheetHeader>
          <ProfileWorkActionSheetTitle>{titulo}</ProfileWorkActionSheetTitle>

          <ProfileWorkActionSheetAuthor>Por {autor}</ProfileWorkActionSheetAuthor>

          <ProfileWorkActionSheetMeta>{meta}</ProfileWorkActionSheetMeta>

          <ProfileWorkActionSheetMetrics>
            {metricas}
          </ProfileWorkActionSheetMetrics>
        </ProfileWorkActionSheetHeader>

        <ProfileWorkActionSheetActions>
          {exibirLeitura && (
            <Link
              href={capituloHref}
              onClick={onRead}
              style={workActionSheetItemStyle}
            >
              Ler
            </Link>
          )}

          {exibirAcoesVisitante && (
            <>
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

              <button
                type="button"
                onClick={onReport}
                style={workActionSheetDangerItemStyle}
              >
                Denunciar obra
              </button>
            </>
          )}

          <button type="button" onClick={onShare} style={workActionSheetItemStyle}>
            Compartilhar
          </button>
        </ProfileWorkActionSheetActions>
      </ProfileWorkActionSheetPanel>
    </ProfileWorkActionSheetOverlay>
  );
}
