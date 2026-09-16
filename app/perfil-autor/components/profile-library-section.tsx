import type { ReactNode } from "react";
import {
  desktopProfileLibrarySectionStyle,
  profileLibrarySectionStyle,
} from "../styles";

type ProfileLibrarySectionProps = {
  children: ReactNode;
  isDesktop: boolean;
};

export function ProfileLibrarySection({
  children,
  isDesktop,
}: ProfileLibrarySectionProps) {
  return (
    <section
      style={
        isDesktop
          ? desktopProfileLibrarySectionStyle
          : profileLibrarySectionStyle
      }
    >
      {children}
    </section>
  );
}
