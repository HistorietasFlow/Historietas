import type { ReactNode } from "react";

import { profileAboutHeroStyle } from "../styles";

type ProfileAboutHeroProps = {
  children: ReactNode;
};

export function ProfileAboutHero({ children }: ProfileAboutHeroProps) {
  return <div style={profileAboutHeroStyle}>{children}</div>;
}
