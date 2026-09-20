import type { CSSProperties, ReactNode } from "react";

type CommunityPostActionsProps = {
  children: ReactNode;
  desktop: boolean;
};

export function CommunityPostActions({
  children,
  desktop,
}: CommunityPostActionsProps) {
  return (
    <div style={desktop ? postActionsDesktopStyle : postActionsStyle}>
      {children}
    </div>
  );
}

const postActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "stretch",
  gap: "8px",
  flexWrap: "wrap",
  minWidth: 0,
};

const postActionsDesktopStyle: CSSProperties = {
  ...postActionsStyle,
  alignItems: "center",
};
