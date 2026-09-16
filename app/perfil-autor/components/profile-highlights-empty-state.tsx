import { emptyTextStyle } from "../styles";

type ProfileHighlightsEmptyStateProps = {
  message: string;
};

export function ProfileHighlightsEmptyState({
  message,
}: ProfileHighlightsEmptyStateProps) {
  return (
    <p
      style={{
        ...emptyTextStyle,
        textAlign: "center",
        fontWeight: 800,
      }}
    >
      {message}
    </p>
  );
}
