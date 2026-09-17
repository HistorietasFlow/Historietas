import type { ReactNode } from "react";
import { diaryToggleButtonIconStyle } from "../styles";

type ProfileRecentActivityToggleIconProps = {
  children: ReactNode;
};

export function ProfileRecentActivityToggleIcon({
  children,
}: ProfileRecentActivityToggleIconProps) {
  return <span style={diaryToggleButtonIconStyle}>{children}</span>;
}
