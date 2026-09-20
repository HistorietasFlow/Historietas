import type { CSSProperties, ReactNode } from "react";

type CommunitySearchResultsTitleProps = {
  children: ReactNode;
};

export function CommunitySearchResultsTitle({
  children,
}: CommunitySearchResultsTitleProps) {
  return <strong style={communitySearchResultsTitleStyle}>{children}</strong>;
}

const communitySearchResultsTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "13px",
  lineHeight: 1.2,
  fontWeight: 950,
  letterSpacing: "-0.02em",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};
