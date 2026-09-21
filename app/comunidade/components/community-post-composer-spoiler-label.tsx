import type { CSSProperties, ReactNode } from "react";

type CommunityPostComposerSpoilerLabelProps = {
  children: ReactNode;
};

export function CommunityPostComposerSpoilerLabel({
  children,
}: CommunityPostComposerSpoilerLabelProps) {
  return <span style={spoilerLabelStyle}>{children}</span>;
}

const safeTextStyle: CSSProperties = {
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const spoilerLabelStyle: CSSProperties = {
  minWidth: 0,
  flex: "1 1 auto",
  textAlign: "center",
  ...safeTextStyle,
};
