import type { ReactNode } from "react";

import { LoadingSpinner } from "./loading-spinner";
import { ProfileSectionEmptyState } from "./profile-section-empty-state";
import { ProfileWorksGrid } from "./profile-works-grid";

type ProfileLibraryContentStateProps<T> = {
  loading: boolean;
  empty: boolean;
  emptyMessage: string;
  isDesktop: boolean;
  items: T[];
  renderItem: (item: T) => ReactNode;
};

export function ProfileLibraryContentState<T>({
  loading,
  empty,
  emptyMessage,
  isDesktop,
  items,
  renderItem,
}: ProfileLibraryContentStateProps<T>) {
  if (loading) {
    return <LoadingSpinner label="Carregando biblioteca" compacto />;
  }

  if (empty) {
    return <ProfileSectionEmptyState message={emptyMessage} />;
  }

  return (
    <ProfileWorksGrid isDesktop={isDesktop}>
      {items.map(renderItem)}
    </ProfileWorksGrid>
  );
}
