import type { CSSProperties, ReactNode } from "react";

type CommunityPostComposerSuggestionsSectionProps = {
  children: ReactNode;
};

export function CommunityPostComposerSuggestionsSection({
  children,
}: CommunityPostComposerSuggestionsSectionProps) {
  return <div style={suggestionsSectionStyle}>{children}</div>;
}

const suggestionsSectionStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  minWidth: 0,
  marginTop: "2px",
  marginBottom: "2px",
};
