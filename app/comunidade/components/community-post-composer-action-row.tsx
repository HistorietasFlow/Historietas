import type { CSSProperties, ReactNode } from "react";

type CommunityPostComposerActionRowProps = {
  children: ReactNode;
};

export function CommunityPostComposerActionRow({
  children,
}: CommunityPostComposerActionRowProps) {
  return <div style={actionRowStyle}>{children}</div>;
}

const actionRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "8px",
  minWidth: 0,
};
