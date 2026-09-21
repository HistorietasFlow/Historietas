import type { CSSProperties, ReactNode } from "react";

type CommunityCommentLikeCountProps = {
  children: ReactNode;
};

export function CommunityCommentLikeCount({
  children,
}: CommunityCommentLikeCountProps) {
  return <span style={commentLikeCountStyle}>{children}</span>;
}

const commentLikeCountStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 900,
  lineHeight: 1,
  minHeight: "10px",
  textAlign: "center",
};
