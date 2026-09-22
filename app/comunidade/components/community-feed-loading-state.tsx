import type { CSSProperties, ReactNode } from "react";
import { CommunityLoadingContainer } from "./community-loading-container";
import { CommunityLoadingSpinner } from "./community-loading-spinner";
import { CommunityThemeStyles } from "./community-theme-styles";

type CommunityFeedLoadingStateProps = {
  children: ReactNode;
  style: CSSProperties;
};

export function CommunityFeedLoadingState({
  children,
  style,
}: CommunityFeedLoadingStateProps) {
  return (
    <CommunityLoadingContainer style={style}>
      {children}
      <CommunityThemeStyles />
      <CommunityLoadingSpinner label="Carregando Comunidade" />
    </CommunityLoadingContainer>
  );
}
