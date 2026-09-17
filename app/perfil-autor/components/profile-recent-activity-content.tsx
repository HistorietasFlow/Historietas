import type { ReactNode } from "react";
import { LoadingSpinner } from "./loading-spinner";
import { ProfileDiaryEmptyState } from "./profile-diary-empty-state";
import { ProfileRecentActivityList } from "./profile-recent-activity-list";

type ProfileRecentActivityContentProps = {
  isOpen: boolean;
  getIsLoading: () => boolean;
  getIsEmpty: () => boolean;
  renderItems: () => ReactNode;
};

export function ProfileRecentActivityContent({
  isOpen,
  getIsLoading,
  getIsEmpty,
  renderItems,
}: ProfileRecentActivityContentProps) {
  if (!isOpen) {
    return null;
  }

  if (getIsLoading()) {
    return <LoadingSpinner label="Carregando atividades" compacto />;
  }

  if (getIsEmpty()) {
    return (
      <ProfileDiaryEmptyState>
        Nenhuma atividade recente para mostrar.
      </ProfileDiaryEmptyState>
    );
  }

  return (
    <ProfileRecentActivityList>{renderItems()}</ProfileRecentActivityList>
  );
}
