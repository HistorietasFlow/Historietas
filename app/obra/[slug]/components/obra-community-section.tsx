"use client";

import CommunityItem from "../ObraCommunityItem";
import {
  communityBoxStyle,
  communityGridStyle,
  communityHeaderStyle,
  communityTitleStyle,
  desktopCommunityBoxStyle,
} from "../lib/obra-style-utils";

type ObraCommunitySectionProps = {
  isDesktop: boolean;
  carregado: boolean;
  teorias: string;
  reviews: string;
  posts: string;
  hrefTeorias: string;
  hrefReviews: string;
  hrefPosts: string;
};

export default function ObraCommunitySection({
  isDesktop,
  carregado,
  teorias,
  reviews,
  posts,
  hrefTeorias,
  hrefReviews,
  hrefPosts,
}: ObraCommunitySectionProps) {
  return (
    <section
      style={isDesktop ? desktopCommunityBoxStyle : communityBoxStyle}
    >
      <div style={communityHeaderStyle}>
        <h2 style={communityTitleStyle}>COMUNIDADE</h2>
      </div>

      <div style={communityGridStyle}>
        <CommunityItem
          numero={carregado ? teorias : "—"}
          rotulo="teorias"
          href={hrefTeorias}
        />
        <CommunityItem
          numero={carregado ? reviews : "—"}
          rotulo="reviews"
          href={hrefReviews}
        />
        <CommunityItem
          numero={carregado ? posts : "—"}
          rotulo="posts"
          href={hrefPosts}
        />
      </div>
    </section>
  );
}
