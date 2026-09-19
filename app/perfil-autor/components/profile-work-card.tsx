import type { ReactNode } from "react";

import { profileWorkCardStyle } from "../styles";

type ProfileWorkCardProps = {
  children: ReactNode;
};

export function ProfileWorkCard({ children }: ProfileWorkCardProps) {
  return <article style={profileWorkCardStyle}>{children}</article>;
}
