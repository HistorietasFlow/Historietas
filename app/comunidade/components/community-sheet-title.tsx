import type { CSSProperties, ReactNode } from "react";

type CommunitySheetTitleProps = {
  children: ReactNode;
};

export function CommunitySheetTitle({ children }: CommunitySheetTitleProps) {
  return <strong style={communitySheetTitleStyle}>{children}</strong>;
}

const communitySheetTitleStyle: CSSProperties = {
  display: "block",
  margin: "0 0 12px",
  padding: 0,
  color: "#FFFFFF",
  fontSize: "21px",
  lineHeight: 1.1,
  fontWeight: 950,
  textAlign: "center",
  letterSpacing: "-0.04em",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};
