import type { ReactNode } from "react";
import {
  authorHighlightsListStyle,
  desktopAuthorHighlightsListStyle,
} from "../styles";

type ProfileHighlightsListProps = {
  children: ReactNode;
  isDesktop: boolean;
};

export function ProfileHighlightsList({
  children,
  isDesktop,
}: ProfileHighlightsListProps) {
  return (
    <div
      style={
        isDesktop
          ? desktopAuthorHighlightsListStyle
          : authorHighlightsListStyle
      }
    >
      {children}
    </div>
  );
}
