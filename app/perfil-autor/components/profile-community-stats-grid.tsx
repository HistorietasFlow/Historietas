import type { ReactNode } from "react";
import {
  authorCommunityGridStyle,
  desktopAuthorCommunityGridStyle,
} from "../styles";

type ProfileCommunityStatsGridProps = {
  children: ReactNode;
  isDesktop: boolean;
};

export function ProfileCommunityStatsGrid({
  children,
  isDesktop,
}: ProfileCommunityStatsGridProps) {
  return (
    <div
      style={
        isDesktop
          ? desktopAuthorCommunityGridStyle
          : authorCommunityGridStyle
      }
    >
      {children}
    </div>
  );
}
