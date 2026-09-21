import type { CSSProperties, ReactNode } from "react";

type CommunitySearchContainerProps = {
  children: ReactNode;
};

export function CommunitySearchContainer({
  children,
}: CommunitySearchContainerProps) {
  return <label style={searchContainerStyle}>{children}</label>;
}

const searchContainerStyle: CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  maxWidth: "calc(100% - 104px)",
  height: "36px",
  marginLeft: "auto",
  marginRight: "-6px",
  borderRadius: "999px",
  border: "none",
  background: "#000000",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  overflow: "hidden",
  padding: "0 0 0 13px",
  boxSizing: "border-box",
  boxShadow: "none",
  transformOrigin: "right center",
};
