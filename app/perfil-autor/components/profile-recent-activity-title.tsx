import type { ReactNode } from "react";
import { diarySectionTitleStyle } from "../styles";

type ProfileRecentActivityTitleProps = {
  children: ReactNode;
};

export function ProfileRecentActivityTitle({
  children,
}: ProfileRecentActivityTitleProps) {
  return <strong style={diarySectionTitleStyle}>{children}</strong>;
}
