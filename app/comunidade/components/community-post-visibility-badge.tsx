import type { CSSProperties, ReactNode } from "react";

type CommunityPostVisibilityBadgeProps = {
  children: ReactNode;
};

export function CommunityPostVisibilityBadge({
  children,
}: CommunityPostVisibilityBadgeProps) {
  return <span style={postVisibilityBadgeStyle}>{children}</span>;
}

const postVisibilityBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 800,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};
