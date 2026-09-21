import type { CSSProperties, ReactNode } from "react";

type CommunityCommentsEmptyMessageProps = {
  children: ReactNode;
};

export function CommunityCommentsEmptyMessage({
  children,
}: CommunityCommentsEmptyMessageProps) {
  return <p style={commentsEmptyMessageStyle}>{children}</p>;
}

const commentsEmptyMessageStyle: CSSProperties = {
  margin: "10px 0 0",
  color: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 800,
  textAlign: "center",
};
