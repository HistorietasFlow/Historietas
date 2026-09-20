import type { CSSProperties, ReactNode } from "react";

type CommunityUserSearchUsernameProps = {
  children: ReactNode;
};

export function CommunityUserSearchUsername({
  children,
}: CommunityUserSearchUsernameProps) {
  return <span style={communityUserSearchUsernameStyle}>{children}</span>;
}

const communityUserSearchUsernameStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #A1A1AA)",
  fontSize: "10.5px",
  lineHeight: 1.25,
  fontWeight: 780,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
