import type { ReactNode } from "react";
import {
  desktopDiarySummaryGridStyle,
  diarySummaryGridStyle,
} from "../styles";

type ProfileDiarySummaryGridProps = {
  children: ReactNode;
  isDesktop: boolean;
};

export function ProfileDiarySummaryGrid({
  children,
  isDesktop,
}: ProfileDiarySummaryGridProps) {
  return (
    <div
      style={
        isDesktop ? desktopDiarySummaryGridStyle : diarySummaryGridStyle
      }
    >
      {children}
    </div>
  );
}
