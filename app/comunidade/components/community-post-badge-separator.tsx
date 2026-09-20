import type { CSSProperties } from "react";

export function CommunityPostBadgeSeparator() {
  return <span style={postBadgeSeparatorStyle}>·</span>;
}

const postBadgeSeparatorStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 900,
  lineHeight: 1,
};
