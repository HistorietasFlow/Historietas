import type { CSSProperties, ReactNode } from "react";

type CommunitySearchResultsCountProps = {
  children: ReactNode;
};

export function CommunitySearchResultsCount({
  children,
}: CommunitySearchResultsCountProps) {
  return <span style={communitySearchResultsCountStyle}>{children}</span>;
}

const communitySearchResultsCountStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10.5px",
  lineHeight: 1.2,
  fontWeight: 850,
  whiteSpace: "nowrap",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};
