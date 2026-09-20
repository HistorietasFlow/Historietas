import type { CSSProperties, ReactNode } from "react";

type CommunitySearchResultsHeaderProps = {
  children: ReactNode;
};

export function CommunitySearchResultsHeader({
  children,
}: CommunitySearchResultsHeaderProps) {
  return <div style={communitySearchResultsHeaderStyle}>{children}</div>;
}

const communitySearchResultsHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  minWidth: 0,
  padding: "8px 0 4px",
};
