import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

type CommunityPostAuthorLinkProps = {
  href: string;
  children: ReactNode;
};

export function CommunityPostAuthorLink({
  href,
  children,
}: CommunityPostAuthorLinkProps) {
  return (
    <Link href={href} style={postAuthorLinkStyle}>
      {children}
    </Link>
  );
}

const postAuthorStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "14px",
  fontWeight: 950,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const postAuthorLinkStyle: CSSProperties = {
  ...postAuthorStyle,
  textDecoration: "none",
  cursor: "pointer",
};
