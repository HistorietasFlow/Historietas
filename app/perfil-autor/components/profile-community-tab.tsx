import type { ReactNode } from "react";
import type { PublicacaoComunidadePerfil } from "../types";
import { ProfileCommunityPanel } from "./profile-community-panel";
import { ProfileCommunityRecentPostsSection } from "./profile-community-recent-posts-section";
import { ProfileCommunityStatsGrid } from "./profile-community-stats-grid";

type EstatisticaComunidade = { href: string; ariaLabel: string; value: string };

type ProfileCommunityTabProps = {
  empty: boolean;
  emptyDescription: string;
  emptyTitle: string;
  error: string;
  isDesktop: boolean;
  loading: boolean;
  publicacoes: EstatisticaComunidade;
  publicacoesRecentes: PublicacaoComunidadePerfil[];
  renderPost: (publicacao: PublicacaoComunidadePerfil) => ReactNode;
  reviews: EstatisticaComunidade;
  teorias: EstatisticaComunidade;
  title: ReactNode;
};

export function ProfileCommunityTab({
  empty,
  emptyDescription,
  emptyTitle,
  error,
  isDesktop,
  loading,
  publicacoes,
  publicacoesRecentes,
  renderPost,
  reviews,
  teorias,
  title,
}: ProfileCommunityTabProps) {
  return (
    <ProfileCommunityPanel
      isDesktop={isDesktop}
      title={title}
      loading={loading}
      error={error}
      empty={empty}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      persistentContent={
        <ProfileCommunityStatsGrid
          isDesktop={isDesktop}
          publicacoes={publicacoes}
          teorias={teorias}
          reviews={reviews}
        />
      }
    >
      <ProfileCommunityRecentPostsSection
        title="Publicações recentes"
        isDesktop={isDesktop}
        publicacoes={publicacoesRecentes}
        renderPost={renderPost}
      />
    </ProfileCommunityPanel>
  );
}
