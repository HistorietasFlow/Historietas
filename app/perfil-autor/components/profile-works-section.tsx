import type { ReactNode } from "react";
import { profileWorksSectionStyle } from "../styles";

type ProfileWorksSectionProps = {
  children: ReactNode;
};

export function ProfileWorksSection({ children }: ProfileWorksSectionProps) {
  return <section style={profileWorksSectionStyle}>{children}</section>;
}
