import type { CSSProperties, ReactNode } from "react";

type CommunityPostComposerHeaderProps = {
  children: ReactNode;
};

export function CommunityPostComposerHeader({
  children,
}: CommunityPostComposerHeaderProps) {
  return (
    <header style={postComposerHeaderStyle}>
      <strong style={postComposerTitleStyle}>{children}</strong>
    </header>
  );
}

const postComposerHeaderStyle: CSSProperties = {
  display: "block",
  minWidth: 0,
};

const postComposerTitleStyle: CSSProperties = {
  display: "block",
  margin: "0 0 12px",
  padding: 0,
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1.1,
  fontWeight: 950,
  textAlign: "center",
  letterSpacing: "-0.04em",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};
