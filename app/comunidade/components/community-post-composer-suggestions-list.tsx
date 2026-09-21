import type { CSSProperties, ReactNode } from "react";

type CommunityPostComposerSuggestionsListProps = {
  children: ReactNode;
};

export function CommunityPostComposerSuggestionsList({
  children,
}: CommunityPostComposerSuggestionsListProps) {
  return <div style={suggestionsListStyle}>{children}</div>;
}

const suggestionsListStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  minWidth: 0,
  overflowX: "auto",
  overflowY: "hidden",
  paddingBottom: "2px",
  scrollbarWidth: "none",
  WebkitOverflowScrolling: "touch",
};
