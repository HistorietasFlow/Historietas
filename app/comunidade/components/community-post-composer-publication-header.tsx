import type { CSSProperties, ReactNode } from "react";

type CommunityPostComposerPublicationHeaderProps = {
  children: ReactNode;
};

export function CommunityPostComposerPublicationHeader({
  children,
}: CommunityPostComposerPublicationHeaderProps) {
  return <div style={publicationHeaderStyle}>{children}</div>;
}

const publicationHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  minWidth: 0,
};
