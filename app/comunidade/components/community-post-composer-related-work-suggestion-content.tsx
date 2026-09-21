import type { CSSProperties, ReactNode } from "react";

type CommunityPostComposerRelatedWorkSuggestionContentProps = {
  children: ReactNode;
};

export function CommunityPostComposerRelatedWorkSuggestionContent({
  children,
}: CommunityPostComposerRelatedWorkSuggestionContentProps) {
  return <span style={relatedWorkSuggestionContentStyle}>{children}</span>;
}

const relatedWorkSuggestionContentStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  minWidth: 0,
};
