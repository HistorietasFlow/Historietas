import { CommunityAdvancedFiltersButton, textoBotaoFiltrosAvancadosComunidade } from "./community-advanced-filters-button";
import { CommunityAdvancedFiltersIcon } from "./community-advanced-filters-icon";
import { CommunityFeedFiltersContainer } from "./community-feed-filters-container";
import type { AbaFeedComunidade } from "./community-feed-tab";
import { ABAS_FEED_COMUNIDADE } from "./community-feed-tabs";
import { CommunityFeedTabButton } from "./community-feed-tab-button";
import { CommunityFeedTabsContainer } from "./community-feed-tabs-container";
import { CommunityFilterControlsRow } from "./community-filter-controls-row";
import { CommunitySearchContainer } from "./community-search-container";
import { deveExibirControlesBuscaComunidade } from "./community-search-controls-visibility";
import { CommunitySearchIcon } from "./community-search-icon";
import { CommunitySearchInput } from "./community-search-input";
import { CommunitySearchToggleButton } from "./community-search-toggle-button";

type CommunityFeedControlsProps = {
  desktop: boolean;
  termoBusca: string;
  buscaComunidadeAberta: boolean;
  menuAcoesRapidasComunidadeAberto: boolean;
  abaFeedAtiva: AbaFeedComunidade;
  onAlterarTermoBusca: (termoBusca: string) => void;
  onAlternarMenuAcoes: () => void;
  onAbrirBusca: () => void;
  onFecharBusca: () => void;
  onSelecionarAba: (aba: AbaFeedComunidade) => void;
};

export function CommunityFeedControls({
  desktop,
  termoBusca,
  buscaComunidadeAberta,
  menuAcoesRapidasComunidadeAberto,
  abaFeedAtiva,
  onAlterarTermoBusca,
  onAlternarMenuAcoes,
  onAbrirBusca,
  onFecharBusca,
  onSelecionarAba,
}: CommunityFeedControlsProps) {
  return (
    <>
      <CommunityFeedFiltersContainer isDesktop={desktop}>
        <CommunityFilterControlsRow>
          <CommunityAdvancedFiltersButton
            type="button"
            aria-label="Abrir filtros, ordenação e ações da comunidade"
            aria-expanded={menuAcoesRapidasComunidadeAberto}
            onClick={onAlternarMenuAcoes}
          >
            <span>{textoBotaoFiltrosAvancadosComunidade}</span>
            <CommunityAdvancedFiltersIcon>+</CommunityAdvancedFiltersIcon>
          </CommunityAdvancedFiltersButton>

          {deveExibirControlesBuscaComunidade(
            buscaComunidadeAberta,
            termoBusca
          ) ? (
            <>
              <CommunitySearchContainer>
                <CommunitySearchInput
                  aria-label="Buscar publicações ou usuários"
                  value={termoBusca}
                  onChange={(event) =>
                    onAlterarTermoBusca(event.target.value)
                  }
                  placeholder="Buscar publicações ou usuários"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={90}
                  autoFocus
                />
              </CommunitySearchContainer>

              <CommunitySearchToggleButton
                type="button"
                onClick={onFecharBusca}
                aria-label="Fechar busca"
                aria-expanded="true"
              >
                <CommunitySearchIcon />
              </CommunitySearchToggleButton>
            </>
          ) : (
            <CommunitySearchToggleButton
              type="button"
              onClick={onAbrirBusca}
              aria-label="Abrir busca"
              aria-expanded="false"
            >
              <CommunitySearchIcon />
            </CommunitySearchToggleButton>
          )}
        </CommunityFilterControlsRow>
      </CommunityFeedFiltersContainer>

      <CommunityFeedTabsContainer isDesktop={desktop}>
        {ABAS_FEED_COMUNIDADE.map((aba) => {
          const ativa = abaFeedAtiva === aba;

          return (
            <CommunityFeedTabButton
              key={aba}
              active={ativa}
              onClick={() => onSelecionarAba(aba)}
            >
              {aba}
            </CommunityFeedTabButton>
          );
        })}
      </CommunityFeedTabsContainer>
    </>
  );
}
