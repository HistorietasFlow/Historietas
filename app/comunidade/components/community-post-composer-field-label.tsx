import type { CSSProperties, ReactNode } from "react";

type CommunityPostComposerFieldLabelProps = {
  children: ReactNode;
};

export function CommunityPostComposerFieldLabel({
  children,
}: CommunityPostComposerFieldLabelProps) {
  return <span style={fieldLabelStyle}>{children}</span>;
}

const fieldLabelStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 950,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};
