import type { CSSProperties, ReactNode } from "react";

type CommunityCommentsInputAvatarProps = {
  avatar: string;
  children: ReactNode;
};

export function CommunityCommentsInputAvatar({
  avatar,
  children,
}: CommunityCommentsInputAvatarProps) {
  const avatarLimpo = avatar.trim();
  const avatarStyle: CSSProperties = avatarLimpo
    ? {
        ...inputAvatarStyle,
        backgroundImage: `url(${avatarLimpo})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "transparent",
        WebkitTextFillColor: "transparent",
      }
    : inputAvatarStyle;

  return <div style={avatarStyle}>{children}</div>;
}

const inputAvatarStyle: CSSProperties = {
  width: "30px",
  height: "30px",
  borderRadius: "11px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-comunidade-bg-deep, #000000)",
  border: "1px solid var(--historietas-comunidade-purple-58, rgba(255,255,255,0.10))",
  color: "#FFFFFF",
  fontSize: "11.5px",
  fontWeight: 950,
  overflow: "hidden",
};
