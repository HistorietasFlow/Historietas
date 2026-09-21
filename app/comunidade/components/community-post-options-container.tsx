import type { CSSProperties, ReactNode } from "react";

type CommunityPostOptionsContainerProps = {
  children: ReactNode;
};

export function CommunityPostOptionsContainer({
  children,
}: CommunityPostOptionsContainerProps) {
  return <div style={postOptionsContainerStyle}>{children}</div>;
}

const postOptionsContainerStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  flex: "0 0 24px",
  width: "24px",
  minWidth: "24px",
  overflow: "visible",
  zIndex: 40,
};
