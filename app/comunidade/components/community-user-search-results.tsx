import type { HistorietasLanguage } from "../../../lib/i18n";
import type { UsuarioBuscaComunidade } from "./community-user";
import { deveExibirInstrucaoBuscaUsuariosComunidade } from "./community-user-search-guidance-check";
import { temResultadosBuscaUsuariosComunidade } from "./community-user-search-results-check";
import { obterTextoContagemUsuariosBuscaComunidade } from "./community-results-count-translator";
import { CommunityUserSearchSection } from "./community-user-search-section";
import { CommunitySearchResultsHeader } from "./community-search-results-header";
import { CommunitySearchResultsTitle } from "./community-search-results-title";
import { CommunitySearchResultsCount } from "./community-search-results-count";
import { CommunitySearchResultsEmpty } from "./community-search-results-empty";
import { CommunityUserSearchLoading } from "./community-user-search-loading";
import { CommunityLoadingSpinner } from "./community-loading-spinner";
import { CommunityUserSearchList } from "./community-user-search-list";
import { CommunityUserSearchResult } from "./community-user-search-result";

type CommunityUserSearchResultsProps = {
  termoBusca: string;
  carregandoUsuariosBuscaComunidade: boolean;
  usuariosBuscaComunidade: UsuarioBuscaComunidade[];
  idioma: HistorietasLanguage;
  usuarioAtualId: string | undefined;
  usuariosSeguidosIds: string[];
  usuarioSeguindoId: string | null;
  onAlternarSeguir: (
    usuarioBusca: UsuarioBuscaComunidade
  ) => void | Promise<void>;
};

export function CommunityUserSearchResults({
  termoBusca,
  carregandoUsuariosBuscaComunidade,
  usuariosBuscaComunidade,
  idioma,
  usuarioAtualId,
  usuariosSeguidosIds,
  usuarioSeguindoId,
  onAlternarSeguir,
}: CommunityUserSearchResultsProps) {
  return (
    <CommunityUserSearchSection ariaLabel="Usuários encontrados">
      <CommunitySearchResultsHeader>
        <CommunitySearchResultsTitle>Usuários</CommunitySearchResultsTitle>
        <CommunitySearchResultsCount>
          {obterTextoContagemUsuariosBuscaComunidade(
            carregandoUsuariosBuscaComunidade,
            usuariosBuscaComunidade.length,
            idioma
          )}
        </CommunitySearchResultsCount>
      </CommunitySearchResultsHeader>

      {deveExibirInstrucaoBuscaUsuariosComunidade(termoBusca) ? (
        <CommunitySearchResultsEmpty>
          Digite pelo menos 2 caracteres para encontrar usuários.
        </CommunitySearchResultsEmpty>
      ) : carregandoUsuariosBuscaComunidade ? (
        <CommunityUserSearchLoading>
          <CommunityLoadingSpinner compacto label="Buscando usuários" />
        </CommunityUserSearchLoading>
      ) : temResultadosBuscaUsuariosComunidade(usuariosBuscaComunidade) ? (
        <CommunityUserSearchList>
          {usuariosBuscaComunidade.map((usuarioBusca) => (
            <CommunityUserSearchResult
              key={usuarioBusca.id}
              usuarioBusca={usuarioBusca}
              usuarioAtualId={usuarioAtualId}
              usuariosSeguidosIds={usuariosSeguidosIds}
              usuarioSeguindoId={usuarioSeguindoId}
              onAlternarSeguir={onAlternarSeguir}
            />
          ))}
        </CommunityUserSearchList>
      ) : (
        <CommunitySearchResultsEmpty>
          Nenhum usuário encontrado.
        </CommunitySearchResultsEmpty>
      )}
    </CommunityUserSearchSection>
  );
}
