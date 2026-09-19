import type { ReactNode } from "react";

import { profileWorkMenuAnchorStyle } from "../styles";

type ProfileWorkMenuAnchorProps = {
  children: ReactNode;
};

export function ProfileWorkMenuAnchor({
  children,
}: ProfileWorkMenuAnchorProps) {
  return <div style={profileWorkMenuAnchorStyle}>{children}</div>;
}
