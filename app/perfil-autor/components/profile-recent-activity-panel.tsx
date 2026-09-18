import type { ReactNode } from "react";
import { ProfileRecentActivityContent } from "./profile-recent-activity-content";
import { ProfileRecentActivityHeader } from "./profile-recent-activity-header";
import { ProfileRecentActivitySection } from "./profile-recent-activity-section";

type ProfileRecentActivityPanelProps = {
  title: ReactNode;
  toggleLabel: ReactNode;
  toggleIcon: ReactNode;
  onToggle: () => void;
  ariaLabel: string;
  expanded: boolean;
  getIsLoading: () => boolean;
  getIsEmpty: () => boolean;
  renderItems: () => ReactNode;
};

export function ProfileRecentActivityPanel({
  title,
  toggleLabel,
  toggleIcon,
  onToggle,
  ariaLabel,
  expanded,
  getIsLoading,
  getIsEmpty,
  renderItems,
}: ProfileRecentActivityPanelProps) {
  return (
    <ProfileRecentActivitySection>
      <ProfileRecentActivityHeader
        title={title}
        toggleLabel={toggleLabel}
        toggleIcon={toggleIcon}
        onToggle={onToggle}
        ariaLabel={ariaLabel}
        expanded={expanded}
      />

      <ProfileRecentActivityContent
        isOpen={expanded}
        getIsLoading={getIsLoading}
        getIsEmpty={getIsEmpty}
        renderItems={renderItems}
      />
    </ProfileRecentActivitySection>
  );
}
