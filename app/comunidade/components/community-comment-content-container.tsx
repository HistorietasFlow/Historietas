import type { CSSProperties, ReactNode } from "react";

type CommunityCommentContentContainerProps = {
  children: ReactNode;
};

export function CommunityCommentContentContainer({
  children,
}: CommunityCommentContentContainerProps) {
  return <div style={commentContentStyle}>{children}</div>;
}

const commentContentStyle: CSSProperties = {
  position: "relative",
  display: "grid",
  gap: "3px",
  minWidth: 0,
};
