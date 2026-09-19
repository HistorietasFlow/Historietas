import type { ReactNode } from "react";

import { profileAboutContentGridStyle } from "../styles";

type ProfileAboutContentGridProps = {
  children: ReactNode;
};

export function ProfileAboutContentGrid({
  children,
}: ProfileAboutContentGridProps) {
  return <div style={profileAboutContentGridStyle}>{children}</div>;
}
