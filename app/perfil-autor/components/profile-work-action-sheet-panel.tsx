import type { MouseEventHandler, ReactNode } from "react";

import { workActionSheetStyle } from "../styles";

type ProfileWorkActionSheetPanelProps = {
  ariaLabel: string;
  children: ReactNode;
  onClick: MouseEventHandler<HTMLElement>;
};

export function ProfileWorkActionSheetPanel({
  ariaLabel,
  children,
  onClick,
}: ProfileWorkActionSheetPanelProps) {
  return (
    <section
      style={workActionSheetStyle}
      role="dialog"
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {children}
    </section>
  );
}
