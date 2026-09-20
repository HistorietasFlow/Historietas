import type { CSSProperties, ReactNode } from "react";

type CommunityUserSearchLoadingProps = {
  children: ReactNode;
};

export function CommunityUserSearchLoading({
  children,
}: CommunityUserSearchLoadingProps) {
  return <div style={communityUserSearchLoadingStyle}>{children}</div>;
}

const communityUserSearchLoadingStyle: CSSProperties = {
  width: "100%",
  minHeight: "54px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
