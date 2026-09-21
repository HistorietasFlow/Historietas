import type { CSSProperties } from "react";

export function CommunityPostStatusSeparator() {
  return <span style={postStatusSeparatorStyle}>·</span>;
}

const postStatusSeparatorStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 900,
  lineHeight: 1,
};
