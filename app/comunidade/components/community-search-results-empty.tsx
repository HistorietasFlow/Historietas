import type { CSSProperties, ReactNode } from "react";

type CommunitySearchResultsEmptyProps = {
  children: ReactNode;
};

export function CommunitySearchResultsEmpty({
  children,
}: CommunitySearchResultsEmptyProps) {
  return <p style={communitySearchResultsEmptyStyle}>{children}</p>;
}

const communitySearchResultsEmptyStyle: CSSProperties = {
  margin: 0,
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "11px",
  lineHeight: 1.4,
  fontWeight: 780,
  textAlign: "center",
};
