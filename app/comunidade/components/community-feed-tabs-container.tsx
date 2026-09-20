import type { CSSProperties, ReactNode } from "react";

type CommunityFeedTabsContainerProps = {
  children: ReactNode;
  isDesktop: boolean;
};

export function CommunityFeedTabsContainer({
  children,
  isDesktop,
}: CommunityFeedTabsContainerProps) {
  return (
    <nav
      role="tablist"
      aria-label="Organizar publicações da Comunidade"
      style={
        isDesktop ? desktopCommunityFeedTabsStyle : communityFeedTabsStyle
      }
    >
      {children}
    </nav>
  );
}

const communityFeedTabsStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  overflowX: "auto",
  overscrollBehaviorX: "contain",
  scrollbarWidth: "none",
  padding: "3px 0 9px",
  margin: "0 0 3px",
  boxSizing: "border-box",
  WebkitOverflowScrolling: "touch",
};

const desktopCommunityFeedTabsStyle: CSSProperties = {
  ...communityFeedTabsStyle,
  gap: "10px",
  padding: "2px 0 13px",
  marginBottom: "5px",
};
