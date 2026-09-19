import type { ReactNode } from "react";

import { profileAboutChipsStyle } from "../styles";

type ProfileAboutChipsProps = {
  children: ReactNode;
};

export function ProfileAboutChips({ children }: ProfileAboutChipsProps) {
  return <div style={profileAboutChipsStyle}>{children}</div>;
}
