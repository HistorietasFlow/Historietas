import type { CSSProperties, ReactNode } from "react";

type CommunityPostBadgesRowProps = {
  children: ReactNode;
};

export function CommunityPostBadgesRow({
  children,
}: CommunityPostBadgesRowProps) {
  return <div style={postBadgesRowStyle}>{children}</div>;
}

const postBadgesRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  flexWrap: "wrap",
  minWidth: 0,
};
