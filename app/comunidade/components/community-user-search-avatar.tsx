import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

type CommunityUserSearchAvatarProps = {
  href: string;
  ariaLabel: string;
  avatar: string;
  children: ReactNode;
};

export function CommunityUserSearchAvatar({
  href,
  ariaLabel,
  avatar,
  children,
}: CommunityUserSearchAvatarProps) {
  const avatarLimpo = avatar.trim();
  const style: CSSProperties = avatarLimpo
    ? {
        ...communityUserSearchAvatarStyle,
        backgroundImage: `url(${avatarLimpo})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "transparent",
        WebkitTextFillColor: "transparent",
      }
    : communityUserSearchAvatarStyle;

  return (
    <Link href={href} aria-label={ariaLabel} style={style}>
      {children}
    </Link>
  );
}

const communityUserSearchAvatarStyle: CSSProperties = {
  width: "44px",
  height: "44px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "0 0 auto",
  background: "var(--historietas-comunidade-bg-deep, #000000)",
  border: "1px solid var(--historietas-border-soft, rgba(255,255,255,0.14))",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "18px",
  lineHeight: 1,
  fontWeight: 950,
  textDecoration: "none",
  overflow: "hidden",
};
