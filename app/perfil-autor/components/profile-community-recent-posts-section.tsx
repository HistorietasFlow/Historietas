import type { ReactNode } from "react";
import {
  authorCommunityPostsBlockStyle,
  authorCommunityPostsTitleStyle,
} from "../styles";

type ProfileCommunityRecentPostsSectionProps = {
  title: ReactNode;
  children: ReactNode;
};

export function ProfileCommunityRecentPostsSection({
  title,
  children,
}: ProfileCommunityRecentPostsSectionProps) {
  return (
    <div style={authorCommunityPostsBlockStyle}>
      <strong style={authorCommunityPostsTitleStyle}>{title}</strong>
      {children}
    </div>
  );
}
