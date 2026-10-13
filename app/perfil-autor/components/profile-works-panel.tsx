import type { ReactNode } from "react";

import { ProfileWorksContentState } from "./profile-works-content-state";
import { ProfileWorksSection } from "./profile-works-section";

type ProfileWorksPanelProps<T> = {
  empty: boolean;
  emptyMessage: string;
  isDesktop: boolean;
  obras: T[];
  renderObra: (obra: T) => ReactNode;
};

export function ProfileWorksPanel<T>({
  empty,
  emptyMessage,
  isDesktop,
  obras,
  renderObra,
}: ProfileWorksPanelProps<T>) {
  return (
    <ProfileWorksSection>
      <ProfileWorksContentState
        empty={empty}
        emptyMessage={emptyMessage}
        isDesktop={isDesktop}
        obras={obras}
        renderObra={renderObra}
      />
    </ProfileWorksSection>
  );
}
