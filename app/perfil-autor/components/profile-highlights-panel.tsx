import type { ReactNode } from "react";
import { ProfileHighlightsContentState } from "./profile-highlights-content-state";
import { ProfileHighlightsHeader } from "./profile-highlights-header";
import { ProfileHighlightsSection } from "./profile-highlights-section";

type ProfileHighlightsPanelProps<T> = {
  headerActions: ReactNode;
  isDesktop: boolean;
  message: string;
  obras: readonly T[];
  renderObra: (obra: T) => ReactNode;
  temObras: boolean;
  titleActions: ReactNode;
};

export function ProfileHighlightsPanel<T>({
  headerActions,
  isDesktop,
  message,
  obras,
  renderObra,
  temObras,
  titleActions,
}: ProfileHighlightsPanelProps<T>) {
  return (
    <ProfileHighlightsSection isDesktop={isDesktop}>
      <ProfileHighlightsHeader
        titleActions={titleActions}
        headerActions={headerActions}
      />

      <ProfileHighlightsContentState
        isDesktop={isDesktop}
        message={message}
        obras={obras}
        renderObra={renderObra}
        temObras={temObras}
      />
    </ProfileHighlightsSection>
  );
}
