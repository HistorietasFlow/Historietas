import type { ReactNode } from "react";

import { LoadingSpinner } from "./loading-spinner";
import { ProfileCommunityNotice } from "./profile-community-notice";

type ProfileCommunityContentStateProps = {
  loading: boolean;
  error: string;
  empty: boolean;
  emptyTitle: string;
  emptyDescription: string;
  persistentContent: ReactNode;
  children: ReactNode;
};

export function ProfileCommunityContentState({
  loading,
  error,
  empty,
  emptyTitle,
  emptyDescription,
  persistentContent,
  children,
}: ProfileCommunityContentStateProps) {
  if (loading) {
    return <LoadingSpinner label="Carregando publicações da Comunidade" compacto />;
  }

  return (
    <>
      {persistentContent}
      {error ? (
        <ProfileCommunityNotice
          icon="!"
          title="Comunidade indisponível"
          description={error}
        />
      ) : empty ? (
        <ProfileCommunityNotice
          icon="💬"
          title={emptyTitle}
          description={emptyDescription}
        />
      ) : (
        children
      )}
    </>
  );
}
