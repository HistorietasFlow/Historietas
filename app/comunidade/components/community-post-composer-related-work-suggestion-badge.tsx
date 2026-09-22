import type { CSSProperties, ReactNode } from "react";

type CommunityPostComposerRelatedWorkSuggestionBadgeProps = {
  children: ReactNode;
};

export function CommunityPostComposerRelatedWorkSuggestionBadge({
  children,
}: CommunityPostComposerRelatedWorkSuggestionBadgeProps) {
  return <span style={relatedWorkSuggestionBadgeStyle}>{children}</span>;
}

const relatedWorkSuggestionBadgeStyle: CSSProperties = {
  flex: "0 0 auto",
  borderRadius: 0,
  border: "none",
  color: "#D4D4D8",
  background: "transparent",
  padding: 0,
  fontSize: "10px",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  whiteSpace: "nowrap",
};
