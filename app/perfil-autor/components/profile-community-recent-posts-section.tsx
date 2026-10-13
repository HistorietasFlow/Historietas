import type { ReactNode } from "react";
import type { PublicacaoComunidadePerfil } from "../types";
import {
  authorCommunityPostsBlockStyle,
  authorCommunityPostsTitleStyle,
} from "../styles";
import { ProfileCommunityRecentPostsList } from "./profile-community-recent-posts-list";

type ProfileCommunityRecentPostsSectionProps = {
  title: ReactNode;
  isDesktop: boolean;
  publicacoes: PublicacaoComunidadePerfil[];
  renderPost: (publicacao: PublicacaoComunidadePerfil) => ReactNode;
};

export function ProfileCommunityRecentPostsSection({
  title,
  isDesktop,
  publicacoes,
  renderPost,
}: ProfileCommunityRecentPostsSectionProps) {
  return (
    <div style={authorCommunityPostsBlockStyle}>
      <strong style={authorCommunityPostsTitleStyle}>{title}</strong>
      <ProfileCommunityRecentPostsList isDesktop={isDesktop}>
        {publicacoes.map(renderPost)}
      </ProfileCommunityRecentPostsList>
    </div>
  );
}
