import type { CSSProperties, ReactNode } from "react";

type CommunityFilterControlsRowProps = {
  children: ReactNode;
};

export function CommunityFilterControlsRow({
  children,
}: CommunityFilterControlsRowProps) {
  return <div style={filterControlsRowStyle}>{children}</div>;
}

const filterControlsRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "nowrap",
  marginBottom: "4px",
  width: "100%",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
};
