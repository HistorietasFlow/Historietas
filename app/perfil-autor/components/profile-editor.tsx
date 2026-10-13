import type { CSSProperties } from "react";
import { ProfileEditorActions } from "./profile-editor-actions";
import { ProfileEditorAvatar } from "./profile-editor-avatar";
import { ProfileEditorFields } from "./profile-editor-fields";
import { ProfileEditorHeader } from "./profile-editor-header";
import { menuOverlayStyle, profileEditorSheetContentStyle } from "../styles";

type ProfileEditorProps = {
  actionLabel: string;
  avatar: string;
  avatarActionsStyle: CSSProperties;
  avatarError: string;
  avatarRemoveButtonStyle: CSSProperties;
  avatarSmallButtonStyle: CSSProperties;
  bio: string;
  bioPlaceholder: string;
  disabled: boolean;
  fallbackInitial: string;
  hasAvatar: boolean;
  maxBioLength: number;
  name: string;
  onBioChange: (value: string) => void;
  onCancel: () => void;
  onChooseImage: () => void;
  onClose: () => void;
  onNameChange: (value: string) => void;
  onRemoveImage: () => void;
  onSave: () => void;
  onUsernameChange: (value: string) => void;
  remainingBioCharacters: number;
  saveLabel: string;
  sheetStyle: CSSProperties;
  username: string;
};

export function ProfileEditor({
  actionLabel,
  avatar,
  avatarActionsStyle,
  avatarError,
  avatarRemoveButtonStyle,
  avatarSmallButtonStyle,
  bio,
  bioPlaceholder,
  disabled,
  fallbackInitial,
  hasAvatar,
  maxBioLength,
  name,
  onBioChange,
  onCancel,
  onChooseImage,
  onClose,
  onNameChange,
  onRemoveImage,
  onSave,
  onUsernameChange,
  remainingBioCharacters,
  saveLabel,
  sheetStyle,
  username,
}: ProfileEditorProps) {
  return (
    <div style={menuOverlayStyle} role="presentation" onClick={onClose}>
      <section
        style={sheetStyle}
        role="dialog"
        aria-modal="true"
        aria-label="Editar perfil"
        onClick={(event) => event.stopPropagation()}
      >
        <ProfileEditorHeader disabled={disabled} onClose={onClose} />

        <div style={profileEditorSheetContentStyle}>
          <ProfileEditorAvatar
            actionLabel={actionLabel}
            actionsStyle={avatarActionsStyle}
            avatar={avatar}
            disabled={disabled}
            error={avatarError}
            fallbackInitial={fallbackInitial}
            hasAvatar={hasAvatar}
            onChooseImage={onChooseImage}
            onRemoveImage={onRemoveImage}
            removeButtonStyle={avatarRemoveButtonStyle}
            smallButtonStyle={avatarSmallButtonStyle}
          />

          <ProfileEditorFields
            bio={bio}
            bioPlaceholder={bioPlaceholder}
            disabled={disabled}
            maxBioLength={maxBioLength}
            name={name}
            onBioChange={onBioChange}
            onNameChange={onNameChange}
            onSave={onSave}
            onUsernameChange={onUsernameChange}
            remainingBioCharacters={remainingBioCharacters}
            username={username}
          />

          <ProfileEditorActions
            disabled={disabled}
            onCancel={onCancel}
            onSave={onSave}
            saveLabel={saveLabel}
          />
        </div>
      </section>
    </div>
  );
}
