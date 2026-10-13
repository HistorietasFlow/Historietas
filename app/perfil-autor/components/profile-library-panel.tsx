import type { ReactNode } from "react";

import type { AbaBibliotecaPerfil } from "../types";
import { LibraryTabs } from "./library-tabs";
import { ProfileLibraryContentState } from "./profile-library-content-state";
import { ProfileLibrarySection } from "./profile-library-section";

type ProfileLibraryPanelProps<T> = {
  abaAtiva: AbaBibliotecaPerfil;
  empty: boolean;
  emptyMessage: string;
  isDesktop: boolean;
  items: T[];
  loading: boolean;
  onSelect: (aba: AbaBibliotecaPerfil) => void;
  renderItem: (item: T) => ReactNode;
};

export function ProfileLibraryPanel<T>({
  abaAtiva,
  empty,
  emptyMessage,
  isDesktop,
  items,
  loading,
  onSelect,
  renderItem,
}: ProfileLibraryPanelProps<T>) {
  return (
    <ProfileLibrarySection isDesktop={isDesktop}>
      <LibraryTabs
        abaAtiva={abaAtiva}
        isDesktop={isDesktop}
        onSelect={onSelect}
      />

      <ProfileLibraryContentState
        loading={loading}
        empty={empty}
        emptyMessage={emptyMessage}
        isDesktop={isDesktop}
        items={items}
        renderItem={renderItem}
      />
    </ProfileLibrarySection>
  );
}
