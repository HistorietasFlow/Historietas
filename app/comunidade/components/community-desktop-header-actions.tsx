import type { CSSProperties, ReactNode } from "react";

type CommunityDesktopHeaderActionsProps = {
  children: ReactNode;
};

export function CommunityDesktopHeaderActions({
  children,
}: CommunityDesktopHeaderActionsProps) {
  return <div style={desktopTopActionsStyle}>{children}</div>;
}

const desktopTopActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "10px",
  minWidth: 0,
};
