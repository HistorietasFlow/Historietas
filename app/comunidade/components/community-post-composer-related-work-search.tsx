import type { CSSProperties, ReactNode } from "react";

type CommunityPostComposerRelatedWorkSearchProps = {
  children: ReactNode;
};

export function CommunityPostComposerRelatedWorkSearch({
  children,
}: CommunityPostComposerRelatedWorkSearchProps) {
  return <div style={relatedWorkSearchStyle}>{children}</div>;
}

const relatedWorkSearchStyle: CSSProperties = {
  position: "relative",
  minWidth: 0,
  zIndex: 4,
};
