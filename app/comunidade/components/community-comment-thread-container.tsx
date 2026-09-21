import type { CSSProperties, ReactNode } from "react";

type CommunityCommentThreadContainerProps = {
  children: ReactNode;
};

export function CommunityCommentThreadContainer({
  children,
}: CommunityCommentThreadContainerProps) {
  return <section style={commentThreadContainerStyle}>{children}</section>;
}

const commentThreadContainerStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};
