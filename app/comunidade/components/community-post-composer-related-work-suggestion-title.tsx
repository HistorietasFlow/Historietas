import type { CSSProperties, ReactNode } from "react";

type CommunityPostComposerRelatedWorkSuggestionTitleProps = {
  children: ReactNode;
};

export function CommunityPostComposerRelatedWorkSuggestionTitle({
  children,
}: CommunityPostComposerRelatedWorkSuggestionTitleProps) {
  return (
    <strong
      data-historietas-user-content="true"
      style={relatedWorkSuggestionTitleStyle}
    >
      {children}
    </strong>
  );
}

const relatedWorkSuggestionTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  lineHeight: 1.15,
  fontWeight: 950,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};
