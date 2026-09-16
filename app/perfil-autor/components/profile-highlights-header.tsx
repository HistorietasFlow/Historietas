import type { ReactNode } from "react";
import {
  authorHighlightsHeaderActionsStyle,
  authorHighlightsHeaderStyle,
  authorHighlightsTitleGroupStyle,
  authorHighlightsTitleStyle,
} from "../styles";

type ProfileHighlightsHeaderProps = {
  headerActions: ReactNode;
  titleActions: ReactNode;
};

export function ProfileHighlightsHeader({
  headerActions,
  titleActions,
}: ProfileHighlightsHeaderProps) {
  return (
    <div style={authorHighlightsHeaderStyle}>
      <div style={authorHighlightsTitleGroupStyle}>
        <strong style={authorHighlightsTitleStyle}>TOP 5</strong>
        {titleActions}
      </div>

      <div style={authorHighlightsHeaderActionsStyle}>{headerActions}</div>
    </div>
  );
}
