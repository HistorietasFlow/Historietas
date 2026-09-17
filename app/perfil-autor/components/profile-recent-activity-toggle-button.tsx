import type { ReactNode } from "react";
import { diaryToggleButtonStyle } from "../styles";

type ProfileRecentActivityToggleButtonProps = {
  children: ReactNode;
  onClick: () => void;
  ariaLabel: string;
  expanded: boolean;
};

export function ProfileRecentActivityToggleButton({
  children,
  onClick,
  ariaLabel,
  expanded,
}: ProfileRecentActivityToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={diaryToggleButtonStyle}
      aria-label={ariaLabel}
      aria-expanded={expanded}
    >
      {children}
    </button>
  );
}
