import type { ReactNode } from "react";
import { ProfileDiaryHeader } from "./profile-diary-header";
import { ProfileDiarySection } from "./profile-diary-section";
import { ProfileDiarySummaryContent } from "./profile-diary-summary-content";
import { ProfileDiarySummarySection } from "./profile-diary-summary-section";

type ProfileDiaryPanelProps<T> = {
  isDesktop: boolean;
  title: ReactNode;
  href: string;
  linkAriaLabel: string;
  linkTitle: string;
  linkLabel: ReactNode;
  getIsLoading: () => boolean;
  getIsEmpty: () => boolean;
  emptyMessage: ReactNode;
  items: T[];
  renderItem: (item: T) => ReactNode;
};

export function ProfileDiaryPanel<T>({
  isDesktop,
  title,
  href,
  linkAriaLabel,
  linkTitle,
  linkLabel,
  getIsLoading,
  getIsEmpty,
  emptyMessage,
  items,
  renderItem,
}: ProfileDiaryPanelProps<T>) {
  return (
    <ProfileDiarySection isDesktop={isDesktop}>
      <ProfileDiaryHeader
        title={title}
        href={href}
        linkAriaLabel={linkAriaLabel}
        linkTitle={linkTitle}
        linkLabel={linkLabel}
      />

      <ProfileDiarySummarySection>
        <ProfileDiarySummaryContent
          isDesktop={isDesktop}
          getIsLoading={getIsLoading}
          getIsEmpty={getIsEmpty}
          emptyMessage={emptyMessage}
          renderItems={() => items.map(renderItem)}
        />
      </ProfileDiarySummarySection>
    </ProfileDiarySection>
  );
}
