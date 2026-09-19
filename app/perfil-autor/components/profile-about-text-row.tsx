import type { ReactNode } from "react";

import { profileAboutTextRowStyle } from "../styles";

type ProfileAboutTextRowProps = {
  children: ReactNode;
};

export function ProfileAboutTextRow({ children }: ProfileAboutTextRowProps) {
  return <div style={profileAboutTextRowStyle}>{children}</div>;
}
