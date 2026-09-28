import {
  ordenacaoEmAltaEstaAtivaComunidade,
  ordenacaoMaisComentadasEstaAtivaComunidade,
  ordenacaoRecentesEstaAtivaComunidade,
} from "./community-feed-order-status";
import type { OrdenacaoComunidade } from "./community-sort-order";
import { CommunitySheetFilterOption } from "./community-sheet-filter-option";
import { CommunitySheetHandle } from "./community-sheet-handle";
import { CommunitySheetOverlay } from "./community-sheet-overlay";
import { CommunitySheetPrimaryAction } from "./community-sheet-primary-action";
import { CommunitySheetSectionLabel } from "./community-sheet-section-label";
import { CommunitySheetSurface } from "./community-sheet-surface";
import { CommunitySheetTitle } from "./community-sheet-title";

type CommunityFeedActionsSheetProps = {
  filtrosAtivos: boolean;
  mostrarApenasSalvos: boolean;
  ordenacaoAtiva: OrdenacaoComunidade;
  onFechar: () => void;
  onPublicar: () => void;
  onMostrarTodas: () => void;
  onMostrarSalvos: () => void;
  onSelecionarRecentes: () => void;
  onSelecionarEmAlta: () => void;
  onSelecionarMaisComentadas: () => void;
};

export function CommunityFeedActionsSheet({
  filtrosAtivos,
  mostrarApenasSalvos,
  ordenacaoAtiva,
  onFechar,
  onPublicar,
  onMostrarTodas,
  onMostrarSalvos,
  onSelecionarRecentes,
  onSelecionarEmAlta,
  onSelecionarMaisComentadas,
}: CommunityFeedActionsSheetProps) {
  return (
    <CommunitySheetOverlay
      ariaLabel="Filtros, ordenação e ações da comunidade"
      closeAriaLabel="Fechar filtros e ações da comunidade"
      onClose={onFechar}
    >
      <CommunitySheetSurface>
        <CommunitySheetHandle />

        <CommunitySheetTitle>Filtrar e ordenar</CommunitySheetTitle>

        <CommunitySheetSectionLabel>Ações</CommunitySheetSectionLabel>

        <CommunitySheetPrimaryAction onClick={onPublicar}>
          Publicar
        </CommunitySheetPrimaryAction>

        <CommunitySheetSectionLabel>Mostrar</CommunitySheetSectionLabel>

        <CommunitySheetFilterOption
          active={!filtrosAtivos}
          onClick={onMostrarTodas}
        >
          Todas
        </CommunitySheetFilterOption>

        <CommunitySheetFilterOption
          active={mostrarApenasSalvos}
          onClick={onMostrarSalvos}
        >
          Posts salvos
        </CommunitySheetFilterOption>

        <CommunitySheetSectionLabel>Ordenar</CommunitySheetSectionLabel>

        <CommunitySheetFilterOption
          active={ordenacaoRecentesEstaAtivaComunidade(
            ordenacaoAtiva,
            mostrarApenasSalvos
          )}
          onClick={onSelecionarRecentes}
        >
          Recentes
        </CommunitySheetFilterOption>

        <CommunitySheetFilterOption
          active={ordenacaoEmAltaEstaAtivaComunidade(
            ordenacaoAtiva,
            mostrarApenasSalvos
          )}
          onClick={onSelecionarEmAlta}
        >
          Em alta
        </CommunitySheetFilterOption>

        <CommunitySheetFilterOption
          active={ordenacaoMaisComentadasEstaAtivaComunidade(
            ordenacaoAtiva,
            mostrarApenasSalvos
          )}
          onClick={onSelecionarMaisComentadas}
        >
          Mais comentadas
        </CommunitySheetFilterOption>
      </CommunitySheetSurface>
    </CommunitySheetOverlay>
  );
}
