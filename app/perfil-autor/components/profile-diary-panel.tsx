import type { ReactNode } from "react";
import { ProfileDiaryHeader } from "./profile-diary-header";
import { ProfileDiarySection } from "./profile-diary-section";
import { ProfileDiarySummaryContent } from "./profile-diary-summary-content";
import { ProfileDiarySummarySection } from "./profile-diary-summary-section";

type ProfileDiaryPanelProps = {
  isDesktop: boolean;
  title: ReactNode;
  href: string;
  linkAriaLabel: string;
  linkTitle: string;
  linkLabel: ReactNode;
  getIsLoading: () => boolean;
  getIsEmpty: () => boolean;
  emptyMessage: ReactNode;
  renderItems: () => ReactNode;
};

export function ProfileDiaryPanel({
  isDesktop,
  title,
  href,
  linkAriaLabel,
  linkTitle,
  linkLabel,
  getIsLoading,
  getIsEmpty,
  emptyMessage,
  renderItems,
}: ProfileDiaryPanelProps) {
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
          renderItems={renderItems}
        />
      </ProfileDiarySummarySection>
    </ProfileDiarySection>
  );
}
