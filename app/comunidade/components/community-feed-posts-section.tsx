import type { ReactNode } from "react";
import type { AbaFeedComunidade } from "./community-feed-tab";
import type { PostComunidade } from "./community-post-model";
import type { UsuarioComunidade } from "./community-user";
import {
  deveExibirCarregamentoAdicionalComunidade,
  obterTextoEstadoVazioFeedComunidade,
  temPostsVisiveisComunidade,
} from "./community-feed-presentation";
import { CommunityPostsList } from "./community-posts-list";
import { CommunityFeedEmptyMessage } from "./community-feed-empty-message";
import { CommunityLoadMorePostsContainer } from "./community-load-more-posts-container";
import { CommunityLoadMorePostsButton } from "./community-load-more-posts-button";
import { CommunityLoadingSpinner } from "./community-loading-spinner";

type CommunityFeedPostsSectionProps = {
  desktop: boolean;
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

export function CommunityFeedPostsSection({
  desktop,
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
}: CommunityFeedPostsSectionProps) {
  return (
    <>
      <CommunityPostsList isDesktop={desktop}>
        {!carregandoFeed && (
          temPostsVisiveisComunidade(postsVisiveis) ? (
            postsVisiveis.map((post) => renderizarPost(post))
          ) : (
            <CommunityFeedEmptyMessage desktop={desktop}>
              {obterTextoEstadoVazioFeedComunidade(
                abaFeedAtiva,
                usuario,
                mostrarApenasSalvos,
                filtrosAtivos
              )}
            </CommunityFeedEmptyMessage>
          )
        )}
      </CommunityPostsList>

      {deveExibirCarregamentoAdicionalComunidade(
        carregandoFeed,
        postsVisiveis,
        temMaisPostsComunidade
      ) && (
        <CommunityLoadMorePostsContainer>
          <CommunityLoadMorePostsButton
            onClick={() => onCarregarMais()}
            disabled={carregandoMaisPostsComunidade}
          >
            {carregandoMaisPostsComunidade ? (
              <CommunityLoadingSpinner
                compacto
                label="Carregando mais publicações"
              />
            ) : (
              "Carregar mais publicações"
            )}
          </CommunityLoadMorePostsButton>
        </CommunityLoadMorePostsContainer>
      )}
    </>
  );
}
