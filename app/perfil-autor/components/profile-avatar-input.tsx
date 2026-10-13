import type { ChangeEventHandler, RefObject } from "react";
import { hiddenInputStyle } from "../styles";

type ProfileAvatarInputProps = {
  avatarInputRef: RefObject<HTMLInputElement | null>;
  onSelectAvatar: ChangeEventHandler<HTMLInputElement>;
};

export function ProfileAvatarInput({
  avatarInputRef,
  onSelectAvatar,
}: ProfileAvatarInputProps) {
  return (
    <input
      ref={avatarInputRef}
      type="file"
      accept="image/*"
      onChange={onSelectAvatar}
      style={hiddenInputStyle}
    />
  );
}
