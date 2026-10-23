import type { ReactNode } from "react";
import type { HistorietasLanguage } from "../../../lib/i18n";
import { CommunityFeedPostsSection } from "./community-feed-posts-section";
import type { AbaFeedComunidade } from "./community-feed-tab";
import type { PostComunidade } from "./community-post-model";
import { CommunitySearchResultsCount } from "./community-search-results-count";
import { CommunitySearchResultsHeader } from "./community-search-results-header";
import { CommunitySearchResultsTitle } from "./community-search-results-title";
import { deveExibirResultadosBuscaComunidade } from "./community-search-controls-visibility";
import { traduzirContagemResultadosComunidade } from "./community-results-count-translator";
import type { UsuarioBuscaComunidade, UsuarioComunidade } from "./community-user";
import { CommunityUserSearchResults } from "./community-user-search-results";

type CommunityFeedCentralCompositionProps = {
  desktop: boolean;
  termoBusca: string;
  termoBuscaNormalizado: string;
  carregandoUsuariosBuscaComunidade: boolean;
  usuariosBuscaComunidade: UsuarioBuscaComunidade[];
  idioma: HistorietasLanguage;
  usuarioAtualId: string | undefined;
  usuariosSeguidosIds: string[];
  usuarioSeguindoId: string | null;
  onAlternarSeguir: (
    usuarioBusca: UsuarioBuscaComunidade
  ) => void | Promise<void>;
  carregandoFeed: boolean;
  postsVisiveis: PostComunidade[];
  abaFeedAtiva: AbaFeedComunidade;
  usuario: UsuarioComunidade | null;
  mostrarApenasSalvos: boolean;
  filtrosAtivos: boolean;
  temMaisPostsComunidade: boolean;
  carregandoMaisPostsComunidade: boolean;
  renderizarPost: (post: PostComunidade) => ReactNode;
  onCarregarMais: () => void | Promise<void>;
};

export function CommunityFeedCentralComposition({
  desktop,
  termoBusca,
  termoBuscaNormalizado,
  carregandoUsuariosBuscaComunidade,
  usuariosBuscaComunidade,
  idioma,
  usuarioAtualId,
  usuariosSeguidosIds,
  usuarioSeguindoId,
  onAlternarSeguir,
  carregandoFeed,
  postsVisiveis,
  abaFeedAtiva,
  usuario,
  mostrarApenasSalvos,
  filtrosAtivos,
  temMaisPostsComunidade,
  carregandoMaisPostsComunidade,
  renderizarPost,
  onCarregarMais,
}: CommunityFeedCentralCompositionProps) {
  const exibirResultadosBusca = deveExibirResultadosBuscaComunidade(
    termoBuscaNormalizado
  );

  return (
    <>
      {exibirResultadosBusca ? (
        <CommunityUserSearchResults
          termoBusca={termoBusca}
          carregandoUsuariosBuscaComunidade={carregandoUsuariosBuscaComunidade}
          usuariosBuscaComunidade={usuariosBuscaComunidade}
          idioma={idioma}
          usuarioAtualId={usuarioAtualId}
          usuariosSeguidosIds={usuariosSeguidosIds}
          usuarioSeguindoId={usuarioSeguindoId}
          onAlternarSeguir={onAlternarSeguir}
        />
      ) : null}

      {exibirResultadosBusca ? (
        <CommunitySearchResultsHeader>
          <CommunitySearchResultsTitle>Publicações</CommunitySearchResultsTitle>
          <CommunitySearchResultsCount>
            {traduzirContagemResultadosComunidade(
              postsVisiveis.length,
              "publicacoes",
              idioma
            )}
          </CommunitySearchResultsCount>
        </CommunitySearchResultsHeader>
      ) : null}

      <CommunityFeedPostsSection
        desktop={desktop}
        carregandoFeed={carregandoFeed}
        postsVisiveis={postsVisiveis}
        abaFeedAtiva={abaFeedAtiva}
        usuario={usuario}
        mostrarApenasSalvos={mostrarApenasSalvos}
        filtrosAtivos={filtrosAtivos}
        temMaisPostsComunidade={temMaisPostsComunidade}
        carregandoMaisPostsComunidade={carregandoMaisPostsComunidade}
        renderizarPost={renderizarPost}
        onCarregarMais={onCarregarMais}
      />
    </>
  );
}
