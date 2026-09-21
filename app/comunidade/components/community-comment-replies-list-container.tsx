import type { CSSProperties, ReactNode } from "react";

type CommunityCommentRepliesListContainerProps = {
  children: ReactNode;
};

export function CommunityCommentRepliesListContainer({
  children,
}: CommunityCommentRepliesListContainerProps) {
  return <div style={commentRepliesListStyle}>{children}</div>;
}

const commentRepliesListStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
  marginLeft: "34px",
  paddingLeft: "10px",
  borderLeft: "1px solid rgba(255,255,255,0.08)",
  minWidth: 0,
};
