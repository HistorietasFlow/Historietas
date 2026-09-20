import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

type CommunityPostAuthorAvatarProps = {
  href: string;
  ariaLabel: string;
  avatar: string;
  children: ReactNode;
};

export function CommunityPostAuthorAvatar({
  href,
  ariaLabel,
  avatar,
  children,
}: CommunityPostAuthorAvatarProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      style={createAuthorAvatarStyle(avatar)}
    >
      {children}
    </Link>
  );
}

function createAuthorAvatarStyle(avatar: string): CSSProperties {
  const avatarLimpo = avatar.trim();

  if (!avatarLimpo) {
    return authorAvatarLinkStyle;
  }

  return {
    ...authorAvatarLinkStyle,
    backgroundImage: `url(${avatarLimpo})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "transparent",
    WebkitTextFillColor: "transparent",
  };
}

const authorAvatarStyle: CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--historietas-comunidade-bg-deep, #000000)",
  border: "1px solid var(--historietas-comunidade-purple-58, rgba(255,255,255,0.10))",
  color: "#FFFFFF",
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  boxShadow: "none",
};

const authorAvatarLinkStyle: CSSProperties = {
  ...authorAvatarStyle,
  textDecoration: "none",
  cursor: "pointer",
};
