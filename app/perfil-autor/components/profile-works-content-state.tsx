import type { ReactNode } from "react";

import { ProfileSectionEmptyState } from "./profile-section-empty-state";
import { ProfileWorksGrid } from "./profile-works-grid";

type ProfileWorksContentStateProps<T> = {
  empty: boolean;
  emptyMessage: string;
  isDesktop: boolean;
  obras: T[];
  renderObra: (obra: T) => ReactNode;
};

export function ProfileWorksContentState<T>({
  empty,
  emptyMessage,
  isDesktop,
  obras,
  renderObra,
}: ProfileWorksContentStateProps<T>) {
  if (empty) {
    return <ProfileSectionEmptyState message={emptyMessage} />;
  }

  return (
    <ProfileWorksGrid isDesktop={isDesktop}>
      {obras.map(renderObra)}
    </ProfileWorksGrid>
  );
}
