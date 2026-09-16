import { emptyMiniBoxStyle } from "../styles";

type ProfileLibraryEmptyStateProps = {
  message: string;
};

export function ProfileLibraryEmptyState({
  message,
}: ProfileLibraryEmptyStateProps) {
  return <div style={emptyMiniBoxStyle}>{message}</div>;
}
