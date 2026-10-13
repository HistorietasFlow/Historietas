import type { ReactNode } from "react";
import { ProfileHighlightsEmptyState } from "./profile-highlights-empty-state";
import { ProfileHighlightsList } from "./profile-highlights-list";

type ProfileHighlightsContentStateProps<T> = {
  isDesktop: boolean;
  message: string;
  obras: readonly T[];
  renderObra: (obra: T) => ReactNode;
  temObras: boolean;
};

export function ProfileHighlightsContentState<T>({
  isDesktop,
  message,
  obras,
  renderObra,
  temObras,
}: ProfileHighlightsContentStateProps<T>) {
  if (!temObras) {
    return <ProfileHighlightsEmptyState message={message} />;
  }

  return (
    <ProfileHighlightsList isDesktop={isDesktop}>
      {obras.map(renderObra)}
    </ProfileHighlightsList>
  );
}
