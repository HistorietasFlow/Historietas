import type { CSSProperties, ReactNode } from "react";

type CommunityPostComposerCharacterCountProps = {
  children: ReactNode;
};

export function CommunityPostComposerCharacterCount({
  children,
}: CommunityPostComposerCharacterCountProps) {
  return <span style={characterCountStyle}>{children}</span>;
}

const characterCountStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 850,
};
