import type { MouseEventHandler } from "react";

import { profileWorkDotsButtonStyle } from "../styles";

type ProfileWorkOptionsButtonProps = {
  ariaLabel: string;
  expanded: boolean;
  onClick: MouseEventHandler<HTMLButtonElement>;
};

export function ProfileWorkOptionsButton({
  ariaLabel,
  expanded,
  onClick,
}: ProfileWorkOptionsButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={profileWorkDotsButtonStyle}
      aria-label={ariaLabel}
      aria-expanded={expanded}
    >
      ⋮
    </button>
  );
}
