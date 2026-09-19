import type { ReactNode } from "react";

import { profileAboutRowStyle } from "../styles";

type ProfileAboutRowProps = {
  children: ReactNode;
};

export function ProfileAboutRow({ children }: ProfileAboutRowProps) {
  return <span style={profileAboutRowStyle}>{children}</span>;
}
