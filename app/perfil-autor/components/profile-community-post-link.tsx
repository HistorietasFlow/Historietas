import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { authorCommunityPostStyle } from "../styles";

type ProfileCommunityPostLinkProps = {
  href: string;
  ariaLabel: string;
  paddingBottom: CSSProperties["paddingBottom"];
  children: ReactNode;
};

export function ProfileCommunityPostLink({
  href,
  ariaLabel,
  paddingBottom,
  children,
}: ProfileCommunityPostLinkProps) {
  return (
    <Link
      href={href}
      style={{ ...authorCommunityPostStyle, paddingBottom }}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  );
}
