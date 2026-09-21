import type { CSSProperties, ReactNode } from "react";

type CommunityCommentItemContainerProps = {
  children: ReactNode;
  isReply: boolean;
};

export function CommunityCommentItemContainer({
  children,
  isReply,
}: CommunityCommentItemContainerProps) {
  return (
    <article style={isReply ? commentReplyItemStyle : commentItemStyle}>
      {children}
    </article>
  );
}

const commentItemStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "34px minmax(0, 1fr) 28px",
  gap: "10px",
  alignItems: "start",
  minWidth: 0,
};

const commentReplyItemStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "28px minmax(0, 1fr) 28px",
  gap: "8px",
  alignItems: "start",
  minWidth: 0,
};
