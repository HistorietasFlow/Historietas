import type { ReactNode } from "react";

import { profileAboutCounterStyle } from "../styles";

type ProfileAboutCounterProps = {
  children: ReactNode;
};

export function ProfileAboutCounter({ children }: ProfileAboutCounterProps) {
  return <span style={profileAboutCounterStyle}>{children}</span>;
}
