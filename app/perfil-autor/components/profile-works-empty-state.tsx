import { emptyMiniBoxStyle } from "../styles";

type ProfileWorksEmptyStateProps = {
  message: string;
};

export function ProfileWorksEmptyState({
  message,
}: ProfileWorksEmptyStateProps) {
  return <div style={emptyMiniBoxStyle}>{message}</div>;
}
