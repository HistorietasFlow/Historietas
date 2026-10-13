import type { DiarioPerfilItem } from "../types";

import { ProfileAboutMemberSince } from "./profile-about-member-since";
import { ProfileAboutRecentActivity } from "./profile-about-recent-activity";

type ProfileAboutFooterProps = {
  memberSince: string;
  showRecentActivity: boolean;
  expanded: boolean;
  loading: boolean;
  items: DiarioPerfilItem[];
  onToggle: () => void;
};

export function ProfileAboutFooter({
  memberSince,
  showRecentActivity,
  expanded,
  loading,
  items,
  onToggle,
}: ProfileAboutFooterProps) {
  return (
    <>
      <ProfileAboutMemberSince>
        Na Historietas desde {memberSince}
      </ProfileAboutMemberSince>

      {showRecentActivity && (
        <ProfileAboutRecentActivity
          expanded={expanded}
          loading={loading}
          items={items}
          onToggle={onToggle}
        />
      )}
    </>
  );
}
