import type { CSSProperties, ReactNode } from "react";

type CommunityCommentsToolsContainerProps = {
  children: ReactNode;
};

export function CommunityCommentsToolsContainer({
  children,
}: CommunityCommentsToolsContainerProps) {
  return <section style={commentsToolsStyle}>{children}</section>;
}

const commentsToolsStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  padding: "5px 0 0",
};
