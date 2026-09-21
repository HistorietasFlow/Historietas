import type { CSSProperties, ReactNode } from "react";

type CommunityCommentRepliesControlsContainerProps = {
  children: ReactNode;
};

export function CommunityCommentRepliesControlsContainer({
  children,
}: CommunityCommentRepliesControlsContainerProps) {
  return <div style={commentRepliesControlsStyle}>{children}</div>;
}

const commentRepliesControlsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  minWidth: 0,
};
