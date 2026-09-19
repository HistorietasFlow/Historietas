import type { ReactNode } from "react";
import {
  authorCommunityPostsListStyle,
  desktopAuthorCommunityPostsListStyle,
} from "../styles";

type ProfileCommunityRecentPostsListProps = {
  children: ReactNode;
  isDesktop: boolean;
};

export function ProfileCommunityRecentPostsList({
  children,
  isDesktop,
}: ProfileCommunityRecentPostsListProps) {
  return (
    <div
      style={
        isDesktop
          ? desktopAuthorCommunityPostsListStyle
          : authorCommunityPostsListStyle
      }
    >
      {children}
    </div>
  );
}
