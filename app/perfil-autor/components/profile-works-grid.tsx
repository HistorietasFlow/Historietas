import type { ReactNode } from "react";
import {
  desktopProfileWorksGridStyle,
  profileWorksGridStyle,
} from "../styles";

type ProfileWorksGridProps = {
  children: ReactNode;
  isDesktop: boolean;
};

export function ProfileWorksGrid({
  children,
  isDesktop,
}: ProfileWorksGridProps) {
  return (
    <div
      style={
        isDesktop ? desktopProfileWorksGridStyle : profileWorksGridStyle
      }
    >
      {children}
    </div>
  );
}
