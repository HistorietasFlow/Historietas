import type { ReactNode } from "react";

import { profileAboutTextStyle } from "../styles";

type ProfileAboutTextProps = {
  children: ReactNode;
  userContent?: "true";
};

export function ProfileAboutText({
  children,
  userContent,
}: ProfileAboutTextProps) {
  return (
    <p
      data-historietas-user-content={userContent}
      style={profileAboutTextStyle}
    >
      {children}
    </p>
  );
}
