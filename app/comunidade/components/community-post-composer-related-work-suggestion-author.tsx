import type { CSSProperties, ReactNode } from "react";

type CommunityPostComposerRelatedWorkSuggestionAuthorProps = {
  children: ReactNode;
};

export function CommunityPostComposerRelatedWorkSuggestionAuthor({
  children,
}: CommunityPostComposerRelatedWorkSuggestionAuthorProps) {
  return (
    <span
      data-historietas-user-content="true"
      style={relatedWorkSuggestionAuthorStyle}
    >
      {children}
    </span>
  );
}

const relatedWorkSuggestionAuthorStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "11px",
  lineHeight: 1.25,
  fontWeight: 750,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};
