import type { ChangeEventHandler } from "react";
import { CommunityDesktopFilterButton } from "./community-desktop-filter-button";
import { CommunityDesktopHeader } from "./community-desktop-header";
import { CommunityDesktopHeaderActions } from "./community-desktop-header-actions";
import { CommunityDesktopSearchContainer } from "./community-desktop-search-container";
import { CommunityDesktopSearchIcon } from "./community-desktop-search-icon";
import { CommunityDesktopSearchInput } from "./community-desktop-search-input";
import { CommunityDesktopTitle } from "./community-desktop-title";
import { CommunityFeedActionsSheet } from "./community-feed-actions-sheet";
import { CommunityFeedControls } from "./community-feed-controls";
import type { AbaFeedComunidade } from "./community-feed-tab";
import type { OrdenacaoComunidade } from "./community-sort-order";

type CommunityDesktopHeaderAreaProps = {
  area: "desktop-header";
  termoBusca: string;
  menuAcoesRapidasComunidadeAberto: boolean;
  onAlterarTermoBusca: ChangeEventHandler<HTMLInputElement>;
  onAlternarMenuAcoes: () => void;
};

type CommunityFeedControlsAreaProps = {
  area: "feed-controls";
  desktop: boolean;
  termoBusca: string;
  buscaComunidadeAberta: boolean;
  menuAcoesRapidasComunidadeAberto: boolean;
  abaFeedAtiva: AbaFeedComunidade;
  filtrosAtivos: boolean;
  mostrarApenasSalvos: boolean;
  ordenacaoAtiva: OrdenacaoComunidade;
  onAlterarTermoBusca: (termoBusca: string) => void;
  onAlternarMenuAcoes: () => void;
  onAbrirBusca: () => void;
  onFecharBusca: () => void;
  onSelecionarAba: (aba: AbaFeedComunidade) => void;
  onFecharAcoes: () => void;
  onPublicar: () => void;
  onMostrarTodas: () => void;
  onMostrarSalvos: () => void;
  onSelecionarRecentes: () => void;
  onSelecionarEmAlta: () => void;
  onSelecionarMaisComentadas: () => void;
};

type CommunityFeedTopCompositionProps =
  | CommunityDesktopHeaderAreaProps
  | CommunityFeedControlsAreaProps;

export function CommunityFeedTopComposition(
  props: CommunityFeedTopCompositionProps
) {
  if (props.area === "desktop-header") {
    return (
      <CommunityDesktopHeader>
        <CommunityDesktopTitle>Comunidade</CommunityDesktopTitle>

        <CommunityDesktopHeaderActions>
          <CommunityDesktopSearchContainer>
            <CommunityDesktopSearchIcon />

            <CommunityDesktopSearchInput
              value={props.termoBusca}
              onChange={props.onAlterarTermoBusca}
            />
          </CommunityDesktopSearchContainer>

          <CommunityDesktopFilterButton
            onClick={props.onAlternarMenuAcoes}
            expanded={props.menuAcoesRapidasComunidadeAberto}
          />
        </CommunityDesktopHeaderActions>
      </CommunityDesktopHeader>
    );
  }

  return (
    <>
      <CommunityFeedControls
        desktop={props.desktop}
        termoBusca={props.termoBusca}
        buscaComunidadeAberta={props.buscaComunidadeAberta}
        menuAcoesRapidasComunidadeAberto={props.menuAcoesRapidasComunidadeAberto}
        abaFeedAtiva={props.abaFeedAtiva}
        onAlterarTermoBusca={props.onAlterarTermoBusca}
        onAlternarMenuAcoes={props.onAlternarMenuAcoes}
        onAbrirBusca={props.onAbrirBusca}
        onFecharBusca={props.onFecharBusca}
        onSelecionarAba={props.onSelecionarAba}
      />

      {props.menuAcoesRapidasComunidadeAberto && (
        <CommunityFeedActionsSheet
          filtrosAtivos={props.filtrosAtivos}
          mostrarApenasSalvos={props.mostrarApenasSalvos}
          ordenacaoAtiva={props.ordenacaoAtiva}
          onFechar={props.onFecharAcoes}
          onPublicar={props.onPublicar}
          onMostrarTodas={props.onMostrarTodas}
          onMostrarSalvos={props.onMostrarSalvos}
          onSelecionarRecentes={props.onSelecionarRecentes}
          onSelecionarEmAlta={props.onSelecionarEmAlta}
          onSelecionarMaisComentadas={props.onSelecionarMaisComentadas}
        />
      )}
    </>
  );
}
