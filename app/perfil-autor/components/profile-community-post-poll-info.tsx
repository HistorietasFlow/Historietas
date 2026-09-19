import type { ReactNode } from "react";

import { authorCommunityPostPollInfoStyle } from "../styles";

type ProfileCommunityPostPollInfoProps = {
  children: ReactNode;
};

export function ProfileCommunityPostPollInfo({
  children,
}: ProfileCommunityPostPollInfoProps) {
  return <span style={authorCommunityPostPollInfoStyle}>{children}</span>;
}
