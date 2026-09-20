import type { CSSProperties, ReactNode } from "react";

type CommunityUserSearchInfoProps = {
  children: ReactNode;
};

export function CommunityUserSearchInfo({
  children,
}: CommunityUserSearchInfoProps) {
  return <div style={communityUserSearchInfoStyle}>{children}</div>;
}

const communityUserSearchInfoStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  minWidth: 0,
};
