import type { CSSProperties, ReactNode } from "react";

type CommunityCommentTimeProps = {
  children: ReactNode;
};

export function CommunityCommentTime({
  children,
}: CommunityCommentTimeProps) {
  return <span style={commentTimeStyle}>{children}</span>;
}

const commentTimeStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10.5px",
  fontWeight: 750,
  whiteSpace: "nowrap",
};
