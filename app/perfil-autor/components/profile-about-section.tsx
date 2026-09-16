import type { ReactNode } from "react";
import { profileAboutBoxStyle } from "../styles";

type ProfileAboutSectionProps = {
  children: ReactNode;
};

export function ProfileAboutSection({ children }: ProfileAboutSectionProps) {
  return <section style={profileAboutBoxStyle}>{children}</section>;
}
