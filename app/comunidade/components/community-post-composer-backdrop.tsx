import type { CSSProperties, MouseEventHandler } from "react";

type CommunityPostComposerBackdropProps = {
  onClick: MouseEventHandler<HTMLButtonElement>;
};

export function CommunityPostComposerBackdrop({
  onClick,
}: CommunityPostComposerBackdropProps) {
  return (
    <button
      type="button"
      aria-label="Fechar publicação"
      onClick={onClick}
      style={postComposerBackdropStyle}
    />
  );
}

const postComposerBackdropStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  border: "none",
  background: "transparent",
  cursor: "pointer",
};
