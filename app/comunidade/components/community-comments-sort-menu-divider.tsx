import type { CSSProperties } from "react";

export function CommunityCommentsSortMenuDivider() {
  return <div style={commentsSortMenuDividerStyle} aria-hidden="true" />;
}

const commentsSortMenuDividerStyle: CSSProperties = {
  width: "100%",
  height: "1px",
  background: "rgba(255,255,255,0.12)",
};
