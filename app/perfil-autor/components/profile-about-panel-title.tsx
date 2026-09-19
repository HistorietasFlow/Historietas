import type { ReactNode } from "react";

import { profileAboutPanelTitleStyle } from "../styles";

type ProfileAboutPanelTitleProps = {
  children: ReactNode;
};

export function ProfileAboutPanelTitle({
  children,
}: ProfileAboutPanelTitleProps) {
  return <strong style={profileAboutPanelTitleStyle}>{children}</strong>;
}
