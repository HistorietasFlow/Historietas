import type { ComponentProps, ReactNode } from "react";
import { CommunityFeedPostsSection } from "./community-feed-posts-section";
import { CommunitySearchResultsCount } from "./community-search-results-count";
import { CommunitySearchResultsHeader } from "./community-search-results-header";
import { CommunitySearchResultsTitle } from "./community-search-results-title";
import { CommunityUserSearchResults } from "./community-user-search-results";

type CommunityFeedCenterCompositionProps = {
  exibirResultadosBusca: boolean;
  contagemPublicacoes: ReactNode;
  userSearchProps: ComponentProps<typeof CommunityUserSearchResults>;
  feedProps: ComponentProps<typeof CommunityFeedPostsSection>;
};

export function CommunityFeedCenterComposition({
  exibirResultadosBusca,
  contagemPublicacoes,
  userSearchProps,
  feedProps,
}: CommunityFeedCenterCompositionProps) {
  return (
    <>
      {exibirResultadosBusca ? (
        <CommunityUserSearchResults {...userSearchProps} />
      ) : null}

      {exibirResultadosBusca ? (
        <CommunitySearchResultsHeader>
          <CommunitySearchResultsTitle>
            Publicações
          </CommunitySearchResultsTitle>
          <CommunitySearchResultsCount>
            {contagemPublicacoes}
          </CommunitySearchResultsCount>
        </CommunitySearchResultsHeader>
      ) : null}

      <CommunityFeedPostsSection {...feedProps} />
    </>
  );
}
