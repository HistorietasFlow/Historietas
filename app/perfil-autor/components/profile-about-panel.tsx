import type { ReactNode } from "react";

import { profileAboutPanelStyle } from "../styles";

type ProfileAboutPanelProps = {
  children: ReactNode;
};

export function ProfileAboutPanel({ children }: ProfileAboutPanelProps) {
  return <section style={profileAboutPanelStyle}>{children}</section>;
}
