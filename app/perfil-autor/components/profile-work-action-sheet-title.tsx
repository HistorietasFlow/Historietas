import type { ReactNode } from "react";

import { workActionSheetTitleStyle } from "../styles";

type ProfileWorkActionSheetTitleProps = {
  children: ReactNode;
};

export function ProfileWorkActionSheetTitle({
  children,
}: ProfileWorkActionSheetTitleProps) {
  return (
    <strong
      data-historietas-user-content="true"
      style={workActionSheetTitleStyle}
    >
      {children}
    </strong>
  );
}
