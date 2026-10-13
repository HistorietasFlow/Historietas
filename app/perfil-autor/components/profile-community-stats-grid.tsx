import {
  authorCommunityGridStyle,
  desktopAuthorCommunityGridStyle,
} from "../styles";
import { ProfileCommunityStatCard } from "./profile-community-stat-card";

type ProfileCommunityStatsGridProps = {
  isDesktop: boolean;
  publicacoes: {
    href: string;
    ariaLabel: string;
    value: string;
  };
  teorias: {
    href: string;
    ariaLabel: string;
    value: string;
  };
  reviews: {
    href: string;
    ariaLabel: string;
    value: string;
  };
};

export function ProfileCommunityStatsGrid({
  isDesktop,
  publicacoes,
  teorias,
  reviews,
}: ProfileCommunityStatsGridProps) {
  return (
    <div
      style={
        isDesktop
          ? desktopAuthorCommunityGridStyle
          : authorCommunityGridStyle
      }
    >
      <ProfileCommunityStatCard
        href={publicacoes.href}
        ariaLabel={publicacoes.ariaLabel}
        value={publicacoes.value}
        title="PUBLICAÇÕES"
        description="posts do perfil"
      />

      <ProfileCommunityStatCard
        href={teorias.href}
        ariaLabel={teorias.ariaLabel}
        value={teorias.value}
        title="TEORIAS"
        description="discussões"
      />

      <ProfileCommunityStatCard
        href={reviews.href}
        ariaLabel={reviews.ariaLabel}
        value={reviews.value}
        title="REVIEWS"
        description="opiniões"
      />
    </div>
  );
}
