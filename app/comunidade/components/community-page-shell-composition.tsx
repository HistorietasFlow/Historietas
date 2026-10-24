import type { CSSProperties, ReactNode } from "react";
import { CommunityContentContainer } from "./community-content-container";
import { CommunityFeedColumn } from "./community-feed-column";
import { CommunityLanguageBridge } from "./community-language-bridge";
import { CommunityMainLayout } from "./community-main-layout";
import { CommunityPageContainer } from "./community-page-container";
import { CommunityThemeStyles } from "./community-theme-styles";
import { CommunityTopWaterFade } from "./community-top-water-fade";

type CommunityPageShellCompositionProps = {
  pageThemeStyle: CSSProperties;
  isDesktop: boolean;
  desktopHeader: ReactNode;
  feedErrorNotice: ReactNode;
  feedControls: ReactNode;
  feedCenter: ReactNode;
  composerPortal: ReactNode;
  interactionOverlays: ReactNode;
};

export function CommunityPageShellComposition({
  pageThemeStyle,
  isDesktop,
  desktopHeader,
  feedErrorNotice,
  feedControls,
  feedCenter,
  composerPortal,
  interactionOverlays,
}: CommunityPageShellCompositionProps) {
  return (
    <CommunityPageContainer style={pageThemeStyle}>
      <CommunityLanguageBridge />
      <CommunityThemeStyles />
      <CommunityTopWaterFade isDesktop={isDesktop} />

      <CommunityContentContainer isDesktop={isDesktop}>
        {desktopHeader}

        <CommunityMainLayout isDesktop={isDesktop}>
          <CommunityFeedColumn isDesktop={isDesktop}>
            {feedErrorNotice}
            {feedControls}
            {feedCenter}
          </CommunityFeedColumn>
        </CommunityMainLayout>
      </CommunityContentContainer>

      {composerPortal}
      {interactionOverlays}
    </CommunityPageContainer>
  );
}
