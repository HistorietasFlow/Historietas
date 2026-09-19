import type { ReactNode } from "react";

import {
  workActionSheetHeaderStyle,
  workActionSheetTextBlockStyle,
} from "../styles";

type ProfileWorkActionSheetHeaderProps = {
  children: ReactNode;
};

export function ProfileWorkActionSheetHeader({
  children,
}: ProfileWorkActionSheetHeaderProps) {
  return (
    <div style={workActionSheetHeaderStyle}>
      <div style={workActionSheetTextBlockStyle}>{children}</div>
    </div>
  );
}
