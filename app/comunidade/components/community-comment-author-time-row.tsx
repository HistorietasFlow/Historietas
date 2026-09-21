import type { CSSProperties, ReactNode } from "react";

type CommunityCommentAuthorTimeRowProps = {
  children: ReactNode;
};

export function CommunityCommentAuthorTimeRow({
  children,
}: CommunityCommentAuthorTimeRowProps) {
  return <div style={commentAuthorTimeRowStyle}>{children}</div>;
}

const commentAuthorTimeRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: "6px",
  minWidth: 0,
};
