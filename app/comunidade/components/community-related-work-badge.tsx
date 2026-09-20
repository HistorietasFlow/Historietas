import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

type CommunityRelatedWorkBadgeProps = {
  href: string;
  children: ReactNode;
};

export function CommunityRelatedWorkBadge({
  href,
  children,
}: CommunityRelatedWorkBadgeProps) {
  return (
    <Link
      href={href}
      data-historietas-user-content="true"
      style={relatedWorkBadgeStyle}
    >
      {children}
    </Link>
  );
}

const relatedWorkBadgeStyle: CSSProperties = {
  width: "fit-content",
  maxWidth: "100%",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "none",
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "11px",
  fontWeight: 900,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};
