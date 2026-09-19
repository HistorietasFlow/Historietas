import type { CSSProperties, ReactNode } from "react";

type CommunityDesktopHeaderProps = {
  children: ReactNode;
};

export function CommunityDesktopHeader({
  children,
}: CommunityDesktopHeaderProps) {
  return <header style={desktopTopStyle}>{children}</header>;
}

const desktopTopStyle: CSSProperties = {
  width: "100%",
  minHeight: "58px",
  marginBottom: "18px",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "24px",
  minWidth: 0,
  boxSizing: "border-box",
};
