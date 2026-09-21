import type { CSSProperties, ReactNode } from "react";

type CommunityCommentsListContainerProps = {
  children: ReactNode;
};

export function CommunityCommentsListContainer({
  children,
}: CommunityCommentsListContainerProps) {
  return <section style={commentsListContainerStyle}>{children}</section>;
}

const commentsListContainerStyle: CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: "12px",
  minHeight: 0,
  overflowY: "auto",
  padding: "6px 2px 9px",
  WebkitOverflowScrolling: "touch",
};
