import type { CSSProperties, ReactNode } from "react";

type CommunityPostStatusLineProps = {
  children: ReactNode;
};

export function CommunityPostStatusLine({
  children,
}: CommunityPostStatusLineProps) {
  return <span style={postSubMetaStyle}>{children}</span>;
}

const postSubMetaStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 800,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};
