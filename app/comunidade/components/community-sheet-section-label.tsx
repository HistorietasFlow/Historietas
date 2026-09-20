import type { CSSProperties, ReactNode } from "react";

type CommunitySheetSectionLabelProps = {
  children: ReactNode;
};

export function CommunitySheetSectionLabel({
  children,
}: CommunitySheetSectionLabelProps) {
  return <span style={communitySheetSectionLabelStyle}>{children}</span>;
}

const communitySheetSectionLabelStyle: CSSProperties = {
  display: "block",
  padding: "11px 30px 5px",
  color: "rgba(244,244,245,0.56)",
  fontSize: "11px",
  lineHeight: 1,
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};
