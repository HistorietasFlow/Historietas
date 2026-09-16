import type { ReactNode } from "react";
import { diaryTimelineStyle } from "../styles";

type ProfileRecentActivitySectionProps = {
  children: ReactNode;
};

export function ProfileRecentActivitySection({
  children,
}: ProfileRecentActivitySectionProps) {
  return <section style={diaryTimelineStyle}>{children}</section>;
}
