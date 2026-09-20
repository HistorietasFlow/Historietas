import type { CSSProperties, ReactNode } from "react";

type CommunityPollBoxProps = {
  children: ReactNode;
};

export function CommunityPollBox({ children }: CommunityPollBoxProps) {
  return <div style={pollPostBoxStyle}>{children}</div>;
}

const pollPostBoxStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  marginTop: "2px",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
};
