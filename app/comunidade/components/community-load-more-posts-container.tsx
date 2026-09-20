import type { CSSProperties, ReactNode } from "react";

type CommunityLoadMorePostsContainerProps = {
  children: ReactNode;
};

export function CommunityLoadMorePostsContainer({
  children,
}: CommunityLoadMorePostsContainerProps) {
  return <section style={loadMorePostsWrapStyle}>{children}</section>;
}

const loadMorePostsWrapStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  margin: "2px 0 4px",
  minWidth: 0,
};
