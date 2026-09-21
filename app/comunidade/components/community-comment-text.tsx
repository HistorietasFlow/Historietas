import type { CSSProperties, ReactNode } from "react";

type CommunityCommentTextProps = {
  children: ReactNode;
};

export function CommunityCommentText({
  children,
}: CommunityCommentTextProps) {
  return (
    <p data-historietas-user-content="true" style={commentTextStyle}>
      {children}
    </p>
  );
}

const commentTextStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "12.5px",
  lineHeight: 1.38,
  fontWeight: 750,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};
