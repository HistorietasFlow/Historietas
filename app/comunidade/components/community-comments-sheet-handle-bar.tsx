import type { CSSProperties } from "react";

export function CommunityCommentsSheetHandleBar() {
  return <div style={commentsSheetHandleBarStyle} />;
}

const commentsSheetHandleBarStyle: CSSProperties = {
  width: "44px",
  height: "5px",
  borderRadius: "999px",
  background: "var(--historietas-border-soft, rgba(255,255,255,0.34))",
};
