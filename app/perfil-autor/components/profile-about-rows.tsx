import type { ReactNode } from "react";

import { profileAboutRowsStyle } from "../styles";

type ProfileAboutRowsProps = {
  children: ReactNode;
};

export function ProfileAboutRows({ children }: ProfileAboutRowsProps) {
  return <div style={profileAboutRowsStyle}>{children}</div>;
}
