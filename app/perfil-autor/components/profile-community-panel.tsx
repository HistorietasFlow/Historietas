import type { ReactNode } from "react";

import { ProfileCommunityContentState } from "./profile-community-content-state";
import { ProfileCommunityHeader } from "./profile-community-header";
import { ProfileCommunitySection } from "./profile-community-section";

type ProfileCommunityPanelProps = {
  isDesktop: boolean;
  title: ReactNode;
  loading: boolean;
  error: string;
  empty: boolean;
  emptyTitle: string;
  emptyDescription: string;
  persistentContent: ReactNode;
  children: ReactNode;
};

export function ProfileCommunityPanel({
  isDesktop,
  title,
  loading,
  error,
  empty,
  emptyTitle,
  emptyDescription,
  persistentContent,
  children,
}: ProfileCommunityPanelProps) {
  return (
    <ProfileCommunitySection isDesktop={isDesktop}>
      <ProfileCommunityHeader title={title} />

      <ProfileCommunityContentState
        loading={loading}
        error={error}
        empty={empty}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        persistentContent={persistentContent}
      >
        {children}
      </ProfileCommunityContentState>
    </ProfileCommunitySection>
  );
}
