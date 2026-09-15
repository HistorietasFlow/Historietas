import Image from "next/image";
import {
  avatarButtonStyle,
  avatarDisplayStyle,
  avatarImageStyle,
  desktopAvatarButtonStyle,
  desktopAvatarDisplayStyle,
} from "../styles";

type ProfileAvatarProps = {
  autorNome: string;
  avatar: string;
  isDesktop: boolean;
  onEdit: () => void;
  podeEditar: boolean;
};

export function ProfileAvatar({
  autorNome,
  avatar,
  isDesktop,
  onEdit,
  podeEditar,
}: ProfileAvatarProps) {
  const avatarContent = avatar ? (
    <Image
      src={avatar}
      alt={`Imagem de ${autorNome}`}
      width={128}
      height={128}
      unoptimized
      style={avatarImageStyle}
    />
  ) : (
    <span>{autorNome.charAt(0)}</span>
  );

  if (podeEditar) {
    return (
      <button
        type="button"
        onClick={onEdit}
        style={isDesktop ? desktopAvatarButtonStyle : avatarButtonStyle}
        aria-label="Editar perfil"
      >
        {avatarContent}
      </button>
    );
  }

  return (
    <div style={isDesktop ? desktopAvatarDisplayStyle : avatarDisplayStyle}>
      {avatarContent}
    </div>
  );
}
