import type { CSSProperties } from "react";

type CommunityCommentsSheetBackdropProps = {
  onClick: () => void;
};

export function CommunityCommentsSheetBackdrop({
  onClick,
}: CommunityCommentsSheetBackdropProps) {
  return (
    <button
      type="button"
      aria-label="Fechar comentários"
      onClick={onClick}
      style={commentsSheetBackdropStyle}
    />
  );
}

const commentsSheetBackdropStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 0,
  border: "none",
  background: "rgba(3, 2, 8, 0.42)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  pointerEvents: "auto",
  cursor: "pointer",
  padding: 0,
};
