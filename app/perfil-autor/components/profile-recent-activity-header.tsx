import type { ReactNode } from "react";
import { diaryCollapsibleHeaderStyle } from "../styles";
import { ProfileRecentActivityTitle } from "./profile-recent-activity-title";
import { ProfileRecentActivityToggleButton } from "./profile-recent-activity-toggle-button";
import { ProfileRecentActivityToggleIcon } from "./profile-recent-activity-toggle-icon";

type ProfileRecentActivityHeaderProps = {
  title: ReactNode;
  toggleLabel: ReactNode;
  toggleIcon: ReactNode;
  onToggle: () => void;
  ariaLabel: string;
  expanded: boolean;
};

export function ProfileRecentActivityHeader({
  title,
  toggleLabel,
  toggleIcon,
  onToggle,
  ariaLabel,
  expanded,
}: ProfileRecentActivityHeaderProps) {
  return (
    <div style={diaryCollapsibleHeaderStyle}>
      <ProfileRecentActivityTitle>{title}</ProfileRecentActivityTitle>

      <ProfileRecentActivityToggleButton
        onClick={onToggle}
        ariaLabel={ariaLabel}
        expanded={expanded}
      >
        <span>{toggleLabel}</span>
        <ProfileRecentActivityToggleIcon>
          {toggleIcon}
        </ProfileRecentActivityToggleIcon>
      </ProfileRecentActivityToggleButton>
    </div>
  );
}
