import type { CSSProperties, ReactNode } from "react";

type CommunityDesktopSearchContainerProps = {
  children: ReactNode;
};

export function CommunityDesktopSearchContainer({
  children,
}: CommunityDesktopSearchContainerProps) {
  return <label style={desktopSearchShellStyle}>{children}</label>;
}

const desktopSearchShellStyle: CSSProperties = {
  position: "relative",
  width: "min(390px, 34vw)",
  minWidth: "230px",
  height: "42px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.045)",
  display: "flex",
  alignItems: "center",
  overflow: "hidden",
  boxSizing: "border-box",
};
