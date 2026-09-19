import type { MouseEventHandler } from "react";

import { profileAboutEditButtonStyle } from "../styles";

type ProfileAboutEditButtonProps = {
  onClick: MouseEventHandler<HTMLButtonElement>;
};

export function ProfileAboutEditButton({
  onClick,
}: ProfileAboutEditButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={profileAboutEditButtonStyle}
      aria-label="Editar sinopse do Sobre"
    >
      ✎
    </button>
  );
}
