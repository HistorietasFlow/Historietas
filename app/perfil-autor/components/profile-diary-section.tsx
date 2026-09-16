import type { ReactNode } from "react";
import { desktopDiaryBoxStyle, diaryBoxStyle } from "../styles";

type ProfileDiarySectionProps = {
  children: ReactNode;
  isDesktop: boolean;
};

export function ProfileDiarySection({
  children,
  isDesktop,
}: ProfileDiarySectionProps) {
  return (
    <section style={isDesktop ? desktopDiaryBoxStyle : diaryBoxStyle}>
      {children}
    </section>
  );
}
