import type { ReactNode } from "react";
import { LoadingSpinner } from "./loading-spinner";
import { ProfileDiaryEmptyState } from "./profile-diary-empty-state";
import { ProfileDiarySummaryGrid } from "./profile-diary-summary-grid";

type ProfileDiarySummaryContentProps = {
  isDesktop: boolean;
  getIsLoading: () => boolean;
  getIsEmpty: () => boolean;
  emptyMessage: ReactNode;
  renderItems: () => ReactNode;
};

export function ProfileDiarySummaryContent({
  isDesktop,
  getIsLoading,
  getIsEmpty,
  emptyMessage,
  renderItems,
}: ProfileDiarySummaryContentProps) {
  if (getIsLoading()) {
    return <LoadingSpinner label="Carregando diário" compacto />;
  }

  if (getIsEmpty()) {
    return (
      <ProfileDiaryEmptyState>{emptyMessage}</ProfileDiaryEmptyState>
    );
  }

  return (
    <ProfileDiarySummaryGrid isDesktop={isDesktop}>
      {renderItems()}
    </ProfileDiarySummaryGrid>
  );
}
