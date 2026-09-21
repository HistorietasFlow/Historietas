import type { CSSProperties, ReactNode } from "react";

type CommunityCommentActionsRowProps = {
  children: ReactNode;
};

export function CommunityCommentActionsRow({
  children,
}: CommunityCommentActionsRowProps) {
  return <div style={commentActionsRowStyle}>{children}</div>;
}

const commentActionsRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};
