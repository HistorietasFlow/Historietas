import type { CSSProperties, ReactNode } from "react";

type CommunityUserSearchSelfBadgeProps = {
  children: ReactNode;
};

export function CommunityUserSearchSelfBadge({
  children,
}: CommunityUserSearchSelfBadgeProps) {
  return <span style={communityUserSearchSelfBadgeStyle}>{children}</span>;
}

const communityUserSearchSelfBadgeStyle: CSSProperties = {
  minWidth: "58px",
  minHeight: "30px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.12))",
  color: "var(--historietas-text-secondary, #A1A1AA)",
  padding: "0 10px",
  fontSize: "10px",
  fontWeight: 900,
  whiteSpace: "nowrap",
};
