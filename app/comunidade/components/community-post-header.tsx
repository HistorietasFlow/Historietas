import type { CSSProperties, ReactNode } from "react";

type CommunityPostHeaderProps = {
  children: ReactNode;
};

export function CommunityPostHeader({
  children,
}: CommunityPostHeaderProps) {
  return <div style={postHeaderStyle}>{children}</div>;
}

const postHeaderStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "38px minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "10px",
  minWidth: 0,
  overflow: "visible",
};
