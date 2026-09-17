import type { ReactNode } from "react";
import { diaryCollapsibleHeaderStyle } from "../styles";

type ProfileRecentActivityHeaderProps = {
  children: ReactNode;
};

export function ProfileRecentActivityHeader({
  children,
}: ProfileRecentActivityHeaderProps) {
  return <div style={diaryCollapsibleHeaderStyle}>{children}</div>;
}
