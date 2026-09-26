import Link from "next/link";
import type { CSSProperties } from "react";
import { obterAriaLabelPerfilComunidade } from "./community-profile-link";

type CommunityCommentAvatarProps = {
  href: string;
  authorName: string;
  avatar: string;
  isReply: boolean;
};

export function CommunityCommentAvatar({
  href,
  authorName,
  avatar,
  isReply,
}: CommunityCommentAvatarProps) {
  const avatarBaseStyle = isReply
    ? commentReplyAvatarLinkStyle
    : commentAvatarLinkStyle;

  return (
    <Link
      href={href}
      aria-label={obterAriaLabelPerfilComunidade(authorName)}
      style={createCommentAvatarStyle(avatarBaseStyle, avatar)}
    >
      {!avatar && (authorName.slice(0, 1).toUpperCase() || "U")}
    </Link>
  );
}

function createCommentAvatarStyle(
  baseStyle: CSSProperties,
  avatar: string
): CSSProperties {
  const cleanAvatar = avatar.trim();

  if (!cleanAvatar) {
    return baseStyle;
  }

  return {
    ...baseStyle,
    backgroundImage: `url(${cleanAvatar})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "transparent",
    WebkitTextFillColor: "transparent",
  };
}

const commentAvatarStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-comunidade-bg-deep, #000000)",
  border: "1px solid var(--historietas-comunidade-purple-58, rgba(255,255,255,0.10))",
  color: "#FFFFFF",
  fontSize: "12.5px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  boxShadow: "none",
  flex: "0 0 auto",
  overflow: "hidden",
  boxSizing: "border-box",
};

const commentAvatarLinkStyle: CSSProperties = {
  ...commentAvatarStyle,
  textDecoration: "none",
  cursor: "pointer",
};

const commentReplyAvatarLinkStyle: CSSProperties = {
  ...commentAvatarLinkStyle,
  width: "28px",
  height: "28px",
  borderRadius: "10px",
  fontSize: "10.5px",
};
