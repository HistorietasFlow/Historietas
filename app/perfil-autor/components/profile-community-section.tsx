import type { ReactNode } from "react";
import {
  authorCommunityBoxStyle,
  desktopAuthorCommunityBoxStyle,
} from "../styles";

type ProfileCommunitySectionProps = {
  children: ReactNode;
  isDesktop: boolean;
};

export function ProfileCommunitySection({
  children,
  isDesktop,
}: ProfileCommunitySectionProps) {
  return (
    <section
      style={
        isDesktop
          ? desktopAuthorCommunityBoxStyle
          : authorCommunityBoxStyle
      }
    >
      {children}
    </section>
  );
}
