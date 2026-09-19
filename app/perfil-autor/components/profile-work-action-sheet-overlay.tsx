import type { MouseEventHandler, ReactNode } from "react";

import { workActionSheetOverlayStyle } from "../styles";

type ProfileWorkActionSheetOverlayProps = {
  children: ReactNode;
  onClick: MouseEventHandler<HTMLDivElement>;
};

export function ProfileWorkActionSheetOverlay({
  children,
  onClick,
}: ProfileWorkActionSheetOverlayProps) {
  return (
    <div
      style={workActionSheetOverlayStyle}
      role="presentation"
      onClick={onClick}
    >
      {children}
    </div>
  );
}
