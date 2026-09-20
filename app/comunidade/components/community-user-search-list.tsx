import type { CSSProperties, ReactNode } from "react";

type CommunityUserSearchListProps = {
  children: ReactNode;
};

export function CommunityUserSearchList({
  children,
}: CommunityUserSearchListProps) {
  return <div style={communityUserSearchListStyle}>{children}</div>;
}

const communityUserSearchListStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  minWidth: 0,
};
