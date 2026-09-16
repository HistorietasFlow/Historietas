import { emptyMiniBoxStyle } from "../styles";

type ProfileSectionEmptyStateProps = {
  message: string;
};

export function ProfileSectionEmptyState({
  message,
}: ProfileSectionEmptyStateProps) {
  return <div style={emptyMiniBoxStyle}>{message}</div>;
}
