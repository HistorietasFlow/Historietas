import type { ReactNode } from "react";

import { authorCommunityPostBodyStyle } from "../styles";

type ProfileCommunityPostBodyProps = {
  children: ReactNode;
};

export function ProfileCommunityPostBody({
  children,
}: ProfileCommunityPostBodyProps) {
  return <span style={authorCommunityPostBodyStyle}>{children}</span>;
}
