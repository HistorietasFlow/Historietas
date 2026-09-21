import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

type CommunityCommentAuthorLinkProps = {
  children: ReactNode;
  href: string;
};

export function CommunityCommentAuthorLink({
  children,
  href,
}: CommunityCommentAuthorLinkProps) {
  return (
    <Link href={href} style={commentAuthorLinkStyle}>
      {children}
    </Link>
  );
}

const commentAuthorLinkStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "12px",
  fontWeight: 950,
  textDecoration: "none",
  cursor: "pointer",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};
