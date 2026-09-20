import type { CSSProperties, ReactNode } from "react";

type CommunityFeedFiltersContainerProps = {
  children: ReactNode;
  isDesktop: boolean;
};

export function CommunityFeedFiltersContainer({
  children,
  isDesktop,
}: CommunityFeedFiltersContainerProps) {
  return (
    <section
      style={
        isDesktop
          ? desktopExploreLikeFilterBoxStyle
          : exploreLikeFilterBoxStyle
      }
    >
      {children}
    </section>
  );
}

const exploreLikeFilterBoxStyle: CSSProperties = {
  marginTop: "0",
  display: "grid",
  gap: "5px",
  padding: "0",
  borderRadius: 0,
  background: "transparent",
  border: "none",
  boxShadow: "none",
  minWidth: 0,
  overflow: "visible",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
};

const desktopExploreLikeFilterBoxStyle: CSSProperties = {
  ...exploreLikeFilterBoxStyle,
  display: "none",
};
