import type { ReactNode } from "react";
import {
  authorHighlightsStyle,
  desktopAuthorHighlightsStyle,
} from "../styles";

type ProfileHighlightsSectionProps = {
  children: ReactNode;
  isDesktop: boolean;
};

export function ProfileHighlightsSection({
  children,
  isDesktop,
}: ProfileHighlightsSectionProps) {
  return (
    <section
      style={isDesktop ? desktopAuthorHighlightsStyle : authorHighlightsStyle}
      aria-label="TOP 5"
    >
      {children}
    </section>
  );
}
