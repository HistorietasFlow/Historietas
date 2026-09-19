import type { ReactNode } from "react";

import { profileWorkCoverOverlayStyle } from "../styles";

type ProfileWorkCoverOverlayProps = {
  children: ReactNode;
};

export function ProfileWorkCoverOverlay({
  children,
}: ProfileWorkCoverOverlayProps) {
  return <div style={profileWorkCoverOverlayStyle}>{children}</div>;
}
