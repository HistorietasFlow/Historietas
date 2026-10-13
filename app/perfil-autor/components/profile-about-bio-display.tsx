import type { MouseEventHandler } from "react";

import { ProfileAboutEditButton } from "./profile-about-edit-button";
import { ProfileAboutText } from "./profile-about-text";
import { ProfileAboutTextRow } from "./profile-about-text-row";
import { ProfileAboutTitle } from "./profile-about-title";

type ProfileAboutBioDisplayProps = {
  title: string;
  text: string;
  userContent?: "true";
  canEdit: boolean;
  onToggleEditor: MouseEventHandler<HTMLButtonElement>;
};

export function ProfileAboutBioDisplay({
  title,
  text,
  userContent,
  canEdit,
  onToggleEditor,
}: ProfileAboutBioDisplayProps) {
  return (
    <>
      <ProfileAboutTitle>{title}</ProfileAboutTitle>

      <ProfileAboutTextRow>
        <ProfileAboutText userContent={userContent}>{text}</ProfileAboutText>

        {canEdit && <ProfileAboutEditButton onClick={onToggleEditor} />}
      </ProfileAboutTextRow>
    </>
  );
}
