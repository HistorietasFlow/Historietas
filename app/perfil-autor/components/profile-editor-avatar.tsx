import Image from "next/image";
import type { CSSProperties } from "react";
import {
  avatarErrorStyle,
  avatarImageStyle,
  profileEditorAvatarBlockStyle,
  profileEditorAvatarPreviewStyle,
} from "../styles";

type ProfileEditorAvatarProps = {
  actionLabel: string;
  actionsStyle: CSSProperties;
  avatar: string;
  disabled: boolean;
  error: string;
  fallbackInitial: string;
  hasAvatar: boolean;
  onChooseImage: () => void;
  onRemoveImage: () => void;
  removeButtonStyle: CSSProperties;
  smallButtonStyle: CSSProperties;
};

export function ProfileEditorAvatar({
  actionLabel,
  actionsStyle,
  avatar,
  disabled,
  error,
  fallbackInitial,
  hasAvatar,
  onChooseImage,
  onRemoveImage,
  removeButtonStyle,
  smallButtonStyle,
}: ProfileEditorAvatarProps) {
  return (
    <div style={profileEditorAvatarBlockStyle}>
      <div style={profileEditorAvatarPreviewStyle}>
        {hasAvatar ? (
          <Image
            src={avatar}
            alt="Prévia da imagem do perfil"
            width={128}
            height={128}
            unoptimized
            style={avatarImageStyle}
          />
        ) : (
          <span>{fallbackInitial}</span>
        )}
      </div>

      <div style={actionsStyle}>
        <button
          type="button"
          onClick={onChooseImage}
          disabled={disabled}
          style={smallButtonStyle}
        >
          {actionLabel}
        </button>

        {hasAvatar && (
          <button
            type="button"
            onClick={onRemoveImage}
            disabled={disabled}
            style={removeButtonStyle}
          >
            Remover
          </button>
        )}
      </div>

      {error && <span style={avatarErrorStyle}>{error}</span>}
    </div>
  );
}
