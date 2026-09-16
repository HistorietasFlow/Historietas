import type { ReactNode } from "react";
import { diaryEmptyStateStyle } from "../styles";

type ProfileDiaryEmptyStateProps = {
  children: ReactNode;
};

export function ProfileDiaryEmptyState({
  children,
}: ProfileDiaryEmptyStateProps) {
  return <div style={diaryEmptyStateStyle}>{children}</div>;
}
