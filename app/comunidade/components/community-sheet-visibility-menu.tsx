import type { CSSProperties, ReactNode } from "react";

type CommunitySheetVisibilityMenuProps = {
  children: ReactNode;
};

export function CommunitySheetVisibilityMenu({
  children,
}: CommunitySheetVisibilityMenuProps) {
  return <div style={communitySheetVisibilityMenuStyle}>{children}</div>;
}

const communitySheetVisibilityMenuStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
  padding: "8px 12px 10px",
  borderTop: "1px solid rgba(255,255,255,0.08)",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};
