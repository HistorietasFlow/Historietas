import type { CSSProperties, ReactNode } from "react";

type CommunityPostsListProps = {
  isDesktop: boolean;
  children: ReactNode;
};

export function CommunityPostsList({
  isDesktop,
  children,
}: CommunityPostsListProps) {
  return (
    <section style={isDesktop ? desktopPostsListStyle : postsListStyle}>
      {children}
    </section>
  );
}

const postsListStyle: CSSProperties = {
  display: "grid",
  gap: 0,
  minWidth: 0,
};

const desktopPostsListStyle: CSSProperties = {
  ...postsListStyle,
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  columnGap: "16px",
  rowGap: "16px",
  alignItems: "start",
};
