import type { CSSProperties, ReactNode } from "react";

type CommunityPollOptionsProps = {
  children: ReactNode;
};

export function CommunityPollOptions({
  children,
}: CommunityPollOptionsProps) {
  return <div style={pollPostOptionsStyle}>{children}</div>;
}

const pollPostOptionsStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  minWidth: 0,
};
