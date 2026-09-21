import type { CSSProperties, ReactNode } from "react";

type CommunityCommentLikeContainerProps = {
  children: ReactNode;
};

export function CommunityCommentLikeContainer({
  children,
}: CommunityCommentLikeContainerProps) {
  return <div style={commentLikeContainerStyle}>{children}</div>;
}

const commentLikeContainerStyle: CSSProperties = {
  minWidth: "28px",
  display: "grid",
  justifyItems: "center",
  alignContent: "start",
  gap: "2px",
};
