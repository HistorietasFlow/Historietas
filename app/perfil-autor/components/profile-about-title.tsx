import type { ReactNode } from "react";

import { profileAboutTitleStyle } from "../styles";

type ProfileAboutTitleProps = {
  children: ReactNode;
};

export function ProfileAboutTitle({ children }: ProfileAboutTitleProps) {
  return <h2 style={profileAboutTitleStyle}>{children}</h2>;
}
