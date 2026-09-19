import type { ReactNode } from "react";
import { authorCommunityPostWrapperStyle } from "../styles";

type ProfileCommunityPostItemProps = {
  children: ReactNode;
};

export function ProfileCommunityPostItem({
  children,
}: ProfileCommunityPostItemProps) {
  return (
    <article style={authorCommunityPostWrapperStyle}>{children}</article>
  );
}
