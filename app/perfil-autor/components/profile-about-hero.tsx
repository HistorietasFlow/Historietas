import type { ChangeEventHandler, MouseEventHandler } from "react";

import { profileAboutHeroStyle } from "../styles";
import { ProfileAboutBioDisplay } from "./profile-about-bio-display";
import { ProfileAboutBioEditor } from "./profile-about-bio-editor";

type ProfileAboutHeroProps = {
  title: string;
  text: string;
  userContent?: "true";
  canEdit: boolean;
  onToggleEditor: MouseEventHandler<HTMLButtonElement>;
  editorVisible: boolean;
  editorValue: string;
  onEditorChange: ChangeEventHandler<HTMLTextAreaElement>;
  editorPlaceholder: string;
  editorMaxLength: number;
  editorRemainingCharacters: number;
};

export function ProfileAboutHero({
  title,
  text,
  userContent,
  canEdit,
  onToggleEditor,
  editorVisible,
  editorValue,
  onEditorChange,
  editorPlaceholder,
  editorMaxLength,
  editorRemainingCharacters,
}: ProfileAboutHeroProps) {
  return (
    <div style={profileAboutHeroStyle}>
      <ProfileAboutBioDisplay
        title={title}
        text={text}
        userContent={userContent}
        canEdit={canEdit}
        onToggleEditor={onToggleEditor}
      />

      {editorVisible && (
        <ProfileAboutBioEditor
          value={editorValue}
          onChange={onEditorChange}
          placeholder={editorPlaceholder}
          maxLength={editorMaxLength}
          remainingCharacters={editorRemainingCharacters}
        />
      )}
    </div>
  );
}
