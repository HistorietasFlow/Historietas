import type { ReactNode } from "react";

import { authorCommunityPostWorkStyle } from "../styles";

type ProfileCommunityPostWorkProps = {
  children: ReactNode;
};

export function ProfileCommunityPostWork({
  children,
}: ProfileCommunityPostWorkProps) {
  return <span style={authorCommunityPostWorkStyle}>{children}</span>;
}
