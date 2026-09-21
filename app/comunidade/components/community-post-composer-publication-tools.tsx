import type { CSSProperties, ReactNode } from "react";

type CommunityPostComposerPublicationToolsProps = {
  children: ReactNode;
};

export function CommunityPostComposerPublicationTools({
  children,
}: CommunityPostComposerPublicationToolsProps) {
  return <div style={publicationToolsStyle}>{children}</div>;
}

const publicationToolsStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "8px",
  flexWrap: "wrap",
  minWidth: 0,
};
