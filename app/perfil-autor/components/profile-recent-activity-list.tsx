import type { ReactNode } from "react";
import { diaryTimelineListStyle } from "../styles";

type ProfileRecentActivityListProps = {
  children: ReactNode;
};

export function ProfileRecentActivityList({
  children,
}: ProfileRecentActivityListProps) {
  return <div style={diaryTimelineListStyle}>{children}</div>;
}
