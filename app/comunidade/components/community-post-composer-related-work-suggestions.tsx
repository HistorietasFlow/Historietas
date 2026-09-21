import type { CSSProperties, ReactNode } from "react";

type CommunityPostComposerRelatedWorkSuggestionsProps = {
  children: ReactNode;
};

export function CommunityPostComposerRelatedWorkSuggestions({
  children,
}: CommunityPostComposerRelatedWorkSuggestionsProps) {
  return <div style={relatedWorkSuggestionsStyle}>{children}</div>;
}

const relatedWorkSuggestionsStyle: CSSProperties = {
  position: "relative",
  top: "auto",
  left: "auto",
  right: "auto",
  zIndex: 1,
  display: "grid",
  gap: 0,
  marginTop: "8px",
  padding: "0 8px",
  borderRadius: 0,
  border: "none",
  background: "transparent",
  boxShadow: "none",
  maxHeight: "260px",
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
  boxSizing: "border-box",
};
