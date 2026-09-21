import type { CSSProperties, ReactNode } from "react";

type CommunityCommentsQuickReactionsContainerProps = {
  children: ReactNode;
};

export function CommunityCommentsQuickReactionsContainer({
  children,
}: CommunityCommentsQuickReactionsContainerProps) {
  return <div style={quickReactionsStyle}>{children}</div>;
}

const quickReactionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "6px",
  width: "100%",
  overflowX: "auto",
  padding: "0 1px",
  scrollbarWidth: "none",
  WebkitOverflowScrolling: "touch",
};
