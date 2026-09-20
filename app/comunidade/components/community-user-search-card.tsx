import type { CSSProperties, ReactNode } from "react";

type CommunityUserSearchCardProps = {
  children: ReactNode;
};

export function CommunityUserSearchCard({
  children,
}: CommunityUserSearchCardProps) {
  return <article style={communityUserSearchCardStyle}>{children}</article>;
}

const communityUserSearchCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "44px minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "10px",
  minWidth: 0,
  padding: "8px 0",
};
