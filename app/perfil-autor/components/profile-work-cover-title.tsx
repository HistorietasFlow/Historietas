import type { ReactNode } from "react";

import { profileWorkCoverTitleStyle } from "../styles";

type ProfileWorkCoverTitleProps = {
  children: ReactNode;
};

export function ProfileWorkCoverTitle({
  children,
}: ProfileWorkCoverTitleProps) {
  return (
    <strong
      data-historietas-user-content="true"
      style={profileWorkCoverTitleStyle}
    >
      {children}
    </strong>
  );
}
