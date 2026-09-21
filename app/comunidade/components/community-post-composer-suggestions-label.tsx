import type { CSSProperties, ReactNode } from "react";

type CommunityPostComposerSuggestionsLabelProps = {
  children: ReactNode;
};

export function CommunityPostComposerSuggestionsLabel({
  children,
}: CommunityPostComposerSuggestionsLabelProps) {
  return <span style={suggestionsLabelStyle}>{children}</span>;
}

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const suggestionsLabelStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10px",
  fontWeight: 900,
  letterSpacing: "0.02em",
  ...safeTextStyle,
};
