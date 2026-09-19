import type { ReactNode } from "react";

import { profileAboutChipStyle } from "../styles";

type ProfileAboutChipProps = {
  children: ReactNode;
};

export function ProfileAboutChip({ children }: ProfileAboutChipProps) {
  return <span style={profileAboutChipStyle}>{children}</span>;
}
