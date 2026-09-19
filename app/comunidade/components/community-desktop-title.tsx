import type { CSSProperties, ReactNode } from "react";

type CommunityDesktopTitleProps = {
  children: ReactNode;
};

export function CommunityDesktopTitle({
  children,
}: CommunityDesktopTitleProps) {
  return <h1 style={desktopTopTitleStyle}>{children}</h1>;
}

const desktopTopTitleStyle: CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "32px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.055em",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};
