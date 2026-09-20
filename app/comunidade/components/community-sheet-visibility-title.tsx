import type { CSSProperties, ReactNode } from "react";

type CommunitySheetVisibilityTitleProps = {
  children: ReactNode;
};

export function CommunitySheetVisibilityTitle({
  children,
}: CommunitySheetVisibilityTitleProps) {
  return <span style={communitySheetVisibilityTitleStyle}>{children}</span>;
}

const communitySheetVisibilityTitleStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  fontWeight: 900,
  padding: "4px 8px 6px",
};
