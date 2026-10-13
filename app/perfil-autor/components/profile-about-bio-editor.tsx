import type { ChangeEventHandler } from "react";

import { ProfileAboutCounter } from "./profile-about-counter";
import { ProfileAboutEditor } from "./profile-about-editor";
import { ProfileAboutTextarea } from "./profile-about-textarea";

type ProfileAboutBioEditorProps = {
  value: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
  placeholder: string;
  maxLength: number;
  remainingCharacters: number;
};

export function ProfileAboutBioEditor({
  value,
  onChange,
  placeholder,
  maxLength,
  remainingCharacters,
}: ProfileAboutBioEditorProps) {
  return (
    <ProfileAboutEditor>
      <ProfileAboutTextarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
      />

      <ProfileAboutCounter>
        {remainingCharacters} caracteres
      </ProfileAboutCounter>
    </ProfileAboutEditor>
  );
}
