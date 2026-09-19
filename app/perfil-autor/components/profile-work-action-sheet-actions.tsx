import type { ReactNode } from "react";

import { workActionSheetActionsStyle } from "../styles";

type ProfileWorkActionSheetActionsProps = {
  children: ReactNode;
};

export function ProfileWorkActionSheetActions({
  children,
}: ProfileWorkActionSheetActionsProps) {
  return <div style={workActionSheetActionsStyle}>{children}</div>;
}
